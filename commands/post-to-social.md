---
description: Publish content to social media channels via Buffer using Playwright browser automation
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `social.channels`, `social.buffer_email`, and any configured channel handles.

## Cost Estimate

Buffer API / browser automation: **free**.

---

## Step 1 — Validate Input Media

Before opening the browser, verify all required inputs are present:

```
Media file: (video or image path — must exist and be readable)
Caption: (the full post caption including hashtags)
Platform(s): (Instagram / TikTok / Facebook / Twitter — or "all configured")
Schedule: (publish_now / schedule:{ISO_datetime})
```

Media validation:
- File must exist at the given path
- For video: verify it's a valid MP4 with audio (if required)
- For images: verify dimensions match the target platform spec
- File size limits: Instagram video ≤4GB, TikTok video ≤500MB, image ≤30MB

If any validation fails, stop and report the issue before opening the browser.

---

## Step 2 — Navigate to Buffer Composer

Use Playwright to open Buffer. Read credentials from `secrets_file` or environment:
- `BUFFER_EMAIL`
- `BUFFER_PASSWORD`

```javascript
const { chromium } = require('playwright');

const browser = await chromium.launch({ headless: false }); // headless: false to see what's happening
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://publish.buffer.com');
```

Check if already logged in (look for the main dashboard). If not:
1. Click "Log in" or navigate to `https://login.buffer.com`
2. Fill email: `page.fill('[name="email"]', email)`
3. Fill password: `page.fill('[name="password"]', password)`
4. Click submit and wait for redirect to dashboard

Wait for dashboard to fully load:
```javascript
await page.waitForSelector('[data-testid="composer-button"], [aria-label="New Post"], button:has-text("Create")', { timeout: 15000 });
```

---

## Step 3 — Open the Composer

Click the "Create" or "New Post" button to open the post composer:

```javascript
// Buffer's composer button may have different selectors depending on version
const createButton = page.locator('button:has-text("Create"), button:has-text("New Post"), [data-testid="create-button"]').first();
await createButton.click();
await page.waitForSelector('[data-testid="composer"], .composer-root, [role="dialog"]', { timeout: 10000 });
```

---

## Step 4 — Select Channels

Buffer shows connected social channels as toggle buttons. Select the configured channels:

```javascript
// Read configured channels from content-factory.yaml: social.channels
const targetChannels = config.social.channels; // e.g., ["instagram", "tiktok"]

for (const channel of targetChannels) {
  // Each channel has a toggle/checkbox in the composer header
  const channelToggle = page.locator(`[data-channel="${channel}"], [aria-label*="${channel}"], [title*="${channel}"]`).first();
  
  if (!(await channelToggle.isChecked())) {
    await channelToggle.click();
  }
}
```

**Important**: If the project config specifies both Instagram and TikTok, select BOTH. Never deselect a configured channel without explicit user instruction. Photo carousels work on TikTok (Photo Mode) as well as Instagram.

Verify the channel selection is reflected in the composer before uploading media.

---

## Step 5 — Upload Media

Click the media upload area and upload the file:

```javascript
// Find the file input (may be hidden)
const fileInput = page.locator('input[type="file"]').first();
await fileInput.setInputFiles(mediaFilePath);

// Wait for upload to complete — Buffer shows a progress indicator
await page.waitForSelector('[data-testid="media-upload-complete"], .upload-complete, img[src*="media"]', {
  timeout: 120000 // videos can take time to upload and process
});
```

For video uploads, Buffer processes the video after upload. Wait for the processing spinner to disappear before proceeding.

For carousel posts (multiple images):
```javascript
// Upload images sequentially — Buffer supports multiple file inputs for carousels
const images = [imagePath1, imagePath2, ...imagePaths];
for (const imagePath of images) {
  await fileInput.setInputFiles(imagePath);
  await page.waitForTimeout(1000); // brief pause between carousel uploads
}
```

---

## Step 6 — Add Caption

Click into the caption/text area and type the caption:

```javascript
const captionArea = page.locator('[data-testid="composer-text-area"], [contenteditable="true"], textarea[placeholder*="caption"], textarea[placeholder*="Write"]').first();
await captionArea.click();
await captionArea.fill(caption);
```

Verify the caption appears correctly:
- Check character count (Instagram: 2200, TikTok: 2200, Twitter/X: 280)
- Verify hashtags are intact
- Confirm brand handle is included if specified

If the caption exceeds platform limits, truncate and add "..." before the hashtags.

---

## Step 7 — Schedule or Publish

**Publish immediately:**
```javascript
const publishButton = page.locator('button:has-text("Share Now"), button:has-text("Post Now"), [data-testid="publish-button"]').first();
await publishButton.click();
```

**Schedule for a specific time:**
```javascript
// Click the schedule dropdown
const scheduleDropdown = page.locator('button:has-text("Schedule"), [data-testid="schedule-button"]').first();
await scheduleDropdown.click();

// Select "Custom Time" option
await page.click('text=Custom Time, text=Pick a date');

// Fill in the date/time picker
await page.fill('[type="datetime-local"], [aria-label*="date"]', isoDatetime);

// Confirm scheduling
await page.click('button:has-text("Schedule Post"), button:has-text("Add to Queue")');
```

---

## Step 8 — Confirm Submission

After clicking publish or schedule, wait for the success confirmation:

```javascript
// Buffer shows a success toast or redirects to the post view
await page.waitForSelector(
  '[data-testid="success-toast"], .success-notification, text=Post shared, text=Post scheduled',
  { timeout: 30000 }
);
```

Take a screenshot of the confirmation for logging:
```javascript
await page.screenshot({ path: `${outputDir}/buffer-confirmation-${Date.now()}.png` });
```

Extract the post URL or confirmation details if visible on screen.

---

## Step 9 — Handle Errors and Edge Cases

**Two-step submit flow**: Buffer sometimes shows a second confirmation modal ("Ready to share?") — click "Share" if it appears:
```javascript
const secondConfirm = page.locator('button:has-text("Share"), button:has-text("Confirm")');
if (await secondConfirm.isVisible()) {
  await secondConfirm.click();
}
```

**Reconnect prompt**: If Buffer shows "reconnect channel" warnings, stop and report to the user — do not proceed with disconnected channels.

**Rate limit errors**: If Buffer shows an error about post frequency, note the retry window and report to the user.

**Captcha or 2FA**: If a security challenge appears, pause automation and ask the user to complete it manually in the browser window (use `headless: false` so the window is visible).

---

## Post Completion Report

After successful submission, report:

```
Post Published Successfully
============================
Platform(s): {channels}
Media: {filename} ({filesize})
Caption preview: {first_100_chars}...
Hashtags: {n} tags
Status: {Published Now | Scheduled for {datetime}}
Confirmation: {screenshot_path}
```

If the post was scheduled, remind the user when it will go live.

Clean up any temporary files created during the automation (screenshots taken for debugging, not the confirmation screenshot).

---

## Quality Checklist

- [ ] Media file validated before browser automation starts
- [ ] Correct channels selected per `social.channels` config
- [ ] Caption pasted completely (check first and last lines)
- [ ] Character count within platform limits
- [ ] Upload processing complete before submitting
- [ ] Success confirmation captured (screenshot or URL)
- [ ] Temp files cleaned up after completion
- [ ] For carousels: all slides uploaded in correct order
- [ ] For TikTok: channel was NOT skipped if it's in config
