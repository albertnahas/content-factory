---
description: Generate 3 static ad creative variants from product screenshots, outpainted to Instagram 4:5 format
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.logo_path`, `brand.cta_default`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 3 ad compositions | GPT Image 1.5 Medium | ~$0.15 |
| 3 outpaints to 4:5 | FLUX Fill Pro | ~$0.18 |
| **Total** | | **~$0.30** |

---

## Step 1 — Gather Screenshots

Ask the user to provide 2-3 key screenshots that represent the product's core value. If not provided, check `brand.screenshots_dir` in config, or ask the user to drop them in a known path.

Screenshot guidelines for best results:
- Use screens that show the product's most compelling moments (not empty states or loading screens)
- Light mode screens tend to work better for ad compositions
- Crop out any system UI (status bar, navigation bar) before processing
- Recommended: minimum 390px wide for phone screenshots, 1200px for desktop

If screenshots have system UI, crop with ffmpeg:
```bash
# Remove 44px top status bar and 34px bottom home indicator (iPhone example)
ffmpeg -i screenshot.png -vf "crop=in_w:in_h-78:0:44" cropped.png
```

Verify you have 2-3 clean screenshots before proceeding.

---

## Step 2 — Determine Product Context

Extract from brand config or ask the user:
```
Product name: brand.name
Primary tagline: brand.tagline (or a shorter punchier version for ads)
Platform this ad will run on: Instagram Feed / Facebook / Pinterest
Target audience: ___
Primary benefit message: ___
```

Identify the brand's visual language from config:
- `brand.colors.primary` — main accent color for frames, backgrounds, text
- `brand.colors.background` — page/card background color
- `brand.colors.text` — primary text color

---

## Step 3 — Generate 3 Ad Variants

Generate 3 distinct compositions using GPT Image 1.5 Medium. Each variant has a different visual style while using the same screenshots and brand identity.

Use `services/image/generator.ts` with `model: 'openai/gpt-image-1'` (medium quality).

Pass the screenshots as reference images in the request.

### Variant 1 — Clean Light

Composition prompt:
```
Create a professional mobile app advertisement.
Product name: "{brand.name}" — tagline: "{brand.tagline}"

Layout:
- Clean white (#FFFFFF) background
- App screenshots displayed in a realistic phone mockup, centered
- "{brand.name}" logotype at top in {brand.colors.text}
- Tagline "{brand.tagline}" below logo, medium weight, {brand.colors.text}
- "{brand.cta_default}" CTA button at bottom, filled {brand.colors.primary}, white text
- Thin {brand.colors.primary} border or frame element as accent

Style: Minimal, Apple-inspired, lots of white space, premium typography
Aspect ratio: 4:5 (1080x1350px equivalent)
No clutter. No drop shadows. No gradients.
```

Save to: `{output.base_dir}/screenshot-ad-{slug}/variant-1-raw.jpg`

### Variant 2 — Dark Premium

Composition prompt:
```
Create a professional mobile app advertisement.
Product name: "{brand.name}" — tagline: "{brand.tagline}"

Layout:
- Dark background (#0A0A0A or near-black)
- App screenshots displayed in a sleek dark phone mockup, centered
- "{brand.name}" logotype at top in white
- Tagline "{brand.tagline}" in {brand.colors.primary} accent color
- "{brand.cta_default}" CTA at bottom, outlined style in white or {brand.colors.primary}
- Subtle {brand.colors.primary} glow or gradient around the phone mockup

Style: Premium, high-contrast, cinematic — think Linear, Vercel, or Raycast
Aspect ratio: 4:5
Screenshots: use provided app screens as the device content
```

Save to: `{output.base_dir}/screenshot-ad-{slug}/variant-2-raw.jpg`

### Variant 3 — Vibrant Modern

Composition prompt:
```
Create a bold, eye-catching mobile app advertisement.
Product name: "{brand.name}" — tagline: "{brand.tagline}"

Layout:
- {brand.colors.primary} as dominant background color
- App screenshots displayed prominently, slightly tilted or overlapping for dynamic feel
- "{brand.name}" in large, bold white typography, top or center
- Tagline in white, slightly smaller
- CTA: white pill button with {brand.colors.text} text: "{brand.cta_default}"
- Geometric shapes or abstract background elements in slightly lighter {brand.colors.primary}

Style: Bold, energetic, direct-response advertising aesthetic
Aspect ratio: 4:5
High contrast. Confident. Stops the scroll.
```

Save to: `{output.base_dir}/screenshot-ad-{slug}/variant-3-raw.jpg`

---

## Step 4 — Outpaint Each to Instagram 4:5 (1080x1350)

If any generated composition doesn't perfectly fill the 4:5 frame, use FLUX Fill Pro to outpaint the edges.

Use the outpainter service at `services/image/outpainter.ts`.

For each variant:
```typescript
const outpainted = await outpaintImage({
  imagePath: variantRawPath,
  targetWidth: 1080,
  targetHeight: 1350,
  prompt: `${brand.name} app advertisement, ${variantStyle} background, professional ad creative`,
});
```

The outpainting should extend the background seamlessly. The product screenshots and text should not be affected.

Save to: `{output.base_dir}/screenshot-ad-{slug}/variant-{n}-final.jpg`

---

## Step 5 — Review and Select Best Variant

Present all 3 variants to the user for review. Evaluation criteria:

**Variant scoring rubric:**

| Criterion | Weight | Check |
|-----------|--------|-------|
| Screenshot legibility | High | Can you read the UI in the phone mockup? |
| Brand recognition | High | Is `brand.name` immediately visible? |
| Scroll-stopping visual | High | Does it stand out against a white/dark social feed? |
| CTA clarity | Medium | Is the action clear and prominent? |
| Overall polish | Medium | Does it look professionally made? |

Recommend the variant that scores highest across all criteria. Note any issues with the other variants (screenshot too small, text overflow, color clash, etc.) for the user to reference.

---

## Output Structure

```
{output.base_dir}/screenshot-ad-{slug}/
  source-screenshots/
    screenshot-1.jpg
    screenshot-2.jpg
    screenshot-3.jpg (if provided)
  variant-1-raw.jpg
  variant-2-raw.jpg
  variant-3-raw.jpg
  variant-1-final.jpg    (outpainted to 4:5)
  variant-2-final.jpg
  variant-3-final.jpg
  brief.json
```

Write brief.json:
```json
{
  "slug": "<slug>",
  "brand": { "name": "<brand.name>", "tagline": "<brand.tagline>" },
  "platform": "instagram-feed",
  "aspectRatio": "4:5",
  "dimensions": { "width": 1080, "height": 1350 },
  "variants": ["clean-light", "dark-premium", "vibrant-modern"],
  "screenshotsUsed": ["screenshot-1.jpg", "screenshot-2.jpg"],
  "createdAt": "<iso_timestamp>"
}
```

---

## Platform Adaptation Notes

If the user needs additional platform sizes after selecting the best variant, outpaint from the chosen variant:

| Platform | Ratio | Dimensions | Notes |
|----------|-------|------------|-------|
| Instagram Stories | 9:16 | 1080x1920 | Extend top and bottom |
| Instagram Feed square | 1:1 | 1080x1080 | Crop or extend |
| Facebook Feed | 4:5 | 1080x1350 | Same as Instagram |
| Pinterest | 2:3 | 1000x1500 | Extend bottom |

Use FLUX Fill Pro for each adaptation, using the final chosen variant as the source.

---

## Quality Checklist

- [ ] Screenshots are clean, cropped, no system UI visible
- [ ] All 3 variants were generated (not skipped)
- [ ] `brand.name` is prominently visible in all variants
- [ ] Phone mockup is realistic (not a cartoon or flat outline)
- [ ] CTA button is clearly legible in all variants
- [ ] All 3 finals are exactly 1080x1350 px
- [ ] Outpainted edges are seamless (no visible stitch lines)
- [ ] Best variant recommendation provided with reasoning
- [ ] Output files named clearly and consistently
