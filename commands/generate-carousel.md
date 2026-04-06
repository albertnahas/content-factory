---
description: Generate a 5-7 slide carousel for Instagram or TikTok with two modes: AI character or standard stock+text
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.font`, `brand.cta_default`, `content.categories`, and `output` paths.

## Cost Estimate

| Mode | Assets | Approx. Cost |
|------|--------|--------------|
| AI Character | 5-7 GPT Image 1.5 Medium images | ~$0.25-0.35 |
| Standard (stock + overlay) | Playwright screenshots | ~$0.00 |

---

## Step 1 — Determine Mode and Topic

Ask the user:
```
Mode: AI Character or Standard?
Topic or theme for the carousel: ___
Number of slides: (5-7, default: 6)
Platform: Instagram / TikTok (affects aspect ratio and swipe UX)
```

**Mode selection guidance:**
- Use **AI Character** when the brand has a mascot, character, or wants illustrated visual storytelling
- Use **Standard** when showcasing tips, facts, or information with clean text-on-image design

For both modes, confirm the slide topic list before generating.

---

## Step 2 — Plan Slide Structure

### Universal Slide Template

```
Slide 1 — COVER:
  Hook title (3-7 words)
  Teaser: "Swipe to see all {n} →"
  Strong visual that makes scrollers stop

Slides 2 to N-1 — CONTENT SLIDES:
  One insight, tip, or item per slide
  Short headline (5-8 words)
  Supporting detail (1-2 sentences, max 25 words)
  Visual matches the specific point

Slide N — CLOSING (CTA):
  Summary or strongest point
  Brand name visible
  "Save this" / "Follow for more" / "{brand.cta_default}"
  Link or handle
```

Define each slide's:
- Headline
- Supporting text (for Standard mode) or character prompt (for AI Character mode)
- Key visual concept

---

## Mode A — AI Character Carousel

### Step A1 — Define Character Style

The character should be consistent across all slides. Define once and reuse:

```
Character style: {illustration_style} (e.g., flat design, Pixar 3D, anime, watercolor)
Character type: {what_they_are} (e.g., friendly robot, illustrated human, mascot animal)
Consistent visual elements: {colors, clothing, accessories that repeat}
Background style: {consistent_background} (e.g., clean gradient, themed environment)
```

For brand alignment, use `brand.colors.primary` as the character's primary color or accent.

### Step A2 — Generate Character Variant Per Slide

For each slide, generate a character image that:
- Shows the character in a pose/expression matching that slide's content
- Has thematic visual angle (e.g., slide about "tip 3" = character pointing at a checklist)
- Maintains the same character design (consistent appearance)

Prompt formula:
```
{character_style} character, {slide_specific_action_or_pose},
{slide_specific_context_or_props},
{consistent_background}, {brand.colors.primary} color scheme,
clean {illustration_style} style, slide {n} of carousel,
{slide_headline} visible intent (but NO actual text in image),
high quality, centered composition, {aspect_ratio}.
```

Use GPT Image 1.5 Medium via Replicate.
Aspect ratio: `4:5` (Instagram feed), `9:16` (TikTok or Stories)

Save to: `{output.base_dir}/carousel-{slug}/slides/slide-{n}-base.jpg`

### Step A3 — Add Text Overlays via Playwright

For each base image, open a Playwright browser and render an HTML overlay with:
- Slide headline (positioned at top or bottom, high contrast)
- Supporting text (smaller, below headline)
- Slide number indicator (bottom right, small)
- Brand name (last slide only, prominent)

Save screenshot to: `{output.base_dir}/carousel-{slug}/slides/slide-{n}-final.jpg`

---

## Mode B — Standard Carousel (Stock + HTML Overlay)

### Step B1 — Define Visual Template

Create an HTML/CSS template that will be rendered per slide. The template uses brand colors:

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    width: 1080px;
    height: 1350px; /* 4:5 ratio */
    background: {brand.colors.background};
    font-family: '{brand.font}', sans-serif;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 60px;
    box-sizing: border-box;
  }
  .slide-number {
    position: absolute;
    top: 30px;
    right: 40px;
    font-size: 18px;
    color: {brand.colors.text};
    opacity: 0.5;
  }
  .brand-accent {
    width: 60px;
    height: 4px;
    background: {brand.colors.primary};
    margin-bottom: 24px;
  }
  h1 {
    font-size: 64px;
    font-weight: 900;
    color: {brand.colors.text};
    text-align: center;
    line-height: 1.1;
    margin: 0 0 24px;
  }
  p {
    font-size: 28px;
    color: {brand.colors.text};
    opacity: 0.75;
    text-align: center;
    line-height: 1.4;
    max-width: 800px;
    margin: 0;
  }
  .brand-name {
    position: absolute;
    bottom: 30px;
    font-size: 20px;
    color: {brand.colors.primary};
    font-weight: 700;
  }
</style>
</head>
<body>
  <div class="slide-number">{n}/{total}</div>
  <div class="brand-accent"></div>
  <h1>{headline}</h1>
  <p>{supporting_text}</p>
  <div class="brand-name">{brand.name}</div>
</body>
</html>
```

### Step B2 — Render Each Slide via Playwright

For each slide, write the HTML with that slide's content, then take a Playwright screenshot:

```javascript
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1080, height: 1350 });
await page.setContent(slideHtml);
await page.screenshot({ path: `slide-${n}-final.jpg`, type: 'jpeg', quality: 95 });
await browser.close();
```

Save to: `{output.base_dir}/carousel-{slug}/slides/slide-{n}-final.jpg`

---

## Step 3 — Write Caption

The carousel caption follows this formula:

```
[HOOK LINE] — matches Slide 1 headline exactly
[EMPTY LINE]
[Tease lines 2-4] — one line per content slide insight
[EMPTY LINE]
[CTA LINE] — matches closing slide CTA
[EMPTY LINE]
[HASHTAGS — 5-8 relevant, mix of niche + broad]
[BRAND HANDLE]
```

Example structure:
```
The {topic} mistake you're probably making

Most people overlook {insight 1}
{insight 2} is actually the opposite of what you think
The fix? {insight 3}
{insight 4} changes everything

{brand.cta_default} — save this post 🔖

#{niche_hashtag_1} #{niche_hashtag_2} #{broad_hashtag_1} #{broad_hashtag_2} #{brand_hashtag}
@{brand_handle}
```

### Hashtag Strategy

Mix three tiers for maximum reach:
- **Niche** (50k-500k posts): highly specific to the topic → higher conversion
- **Mid-tier** (500k-5M posts): relevant category → moderate competition
- **Broad** (5M+ posts): general interest → high volume, lower organic reach

Always include one branded hashtag: `#{brand.name.toLowerCase()}` or similar.

---

## Step 4 — Assemble Final Carousel Package

Collect all final slide images in order:
```
{output.base_dir}/carousel-{slug}/
  slides/
    slide-1-final.jpg   (cover)
    slide-2-final.jpg
    ...
    slide-{n}-final.jpg (CTA)
  caption.txt
  carousel-{slug}-manifest.json
```

Write manifest:
```json
{
  "slug": "<slug>",
  "topic": "<topic>",
  "mode": "<ai-character|standard>",
  "platform": "<platform>",
  "slideCount": 6,
  "slides": [
    { "index": 1, "type": "cover", "headline": "<headline>", "path": "slides/slide-1-final.jpg" },
    ...
  ],
  "captionPath": "caption.txt",
  "aspectRatio": "4:5",
  "createdAt": "<iso_timestamp>"
}
```

---

## Quality Checklist

- [ ] Cover slide headline creates curiosity or promises clear value
- [ ] Each content slide communicates exactly ONE idea
- [ ] Text is legible at thumbnail size (test by viewing at 30% size)
- [ ] Brand colors are consistent across all slides
- [ ] `brand.name` is visible on the closing slide
- [ ] Slide transitions feel logical (each slide leads naturally to the next)
- [ ] Caption hook matches Slide 1 headline exactly
- [ ] Hashtags mix niche, mid-tier, and broad tiers
- [ ] CTA is specific and low-friction ("Save this" beats "Follow us")
- [ ] All slide images are the same dimensions (1080x1350 or consistent)
- [ ] Files named sequentially with no gaps
