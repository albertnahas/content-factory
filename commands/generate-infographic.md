---
description: Generate a static infographic poster comparing or showcasing product variants, options, or tips
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.font`, `brand.logo_path`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 4 product images (low quality) | GPT Image 1.5 Low | ~$0.04 |
| Background removal | Bria AI via Replicate | ~$0.04 |
| Composition poster | GPT Image 1.5 Medium | ~$0.05 |
| Outpainting to target ratio | FLUX Fill Pro | ~$0.06 |
| **Total** | | **~$0.20** |

Scale cost linearly: 2 items → ~$0.12, 6 items → ~$0.26.

---

## Step 1 — Plan Poster Layout

Ask the user what they want to showcase, then select the best layout:

### Layout Types

**Comparison (2-column)**
Use when: comparing 2 variants, before/after, option A vs option B
Structure: Left column = Item A, Right column = Item B
Title: "X vs Y: Which is Better?"

**Grid (2x2 or 3x2)**
Use when: showing 4-6 variants, methods, or tips
Structure: Equal-sized cells with item image + label + key stat
Title: "{Product}: {N} Ways / Variants / Options"

**Hero + Detail**
Use when: deep-diving one product with supporting context
Structure: Large hero image top, grid of supporting details below
Title: "{Product}: Everything You Need to Know"

Confirm layout type, number of items, and the key data point for each item (label + one metric or descriptor).

Example data schema for 4-item grid:
```json
[
  { "label": "Option A", "descriptor": "Key benefit or stat" },
  { "label": "Option B", "descriptor": "Key benefit or stat" },
  { "label": "Option C", "descriptor": "Key benefit or stat" },
  { "label": "Option D", "descriptor": "Key benefit or stat" }
]
```

---

## Step 2 — Generate Individual Product Images

For each item, generate a clean product image optimized for background removal:

Image requirements:
- Solid white or very light background (critical for clean cutout)
- Subject centered, isolated
- Good lighting from above or slightly front
- No shadows that extend outside the subject

Prompt formula:
```
{item_description}, isolated on pure white background,
professional product photography, top-down or 45° angle,
soft even lighting, no shadows, centered composition, square frame.
No text. No labels. No logos.
```

Use GPT Image 1.5 Low quality (cost-optimized — these get composited, not shown at full resolution).
Aspect ratio: `1:1` (square, for easy layout composition)

Use `services/image/generator.ts`.
Save to: `{output.base_dir}/infographic-{slug}/items/item-{n}-raw.jpg`

---

## Step 3 — Remove Backgrounds

Use the background remover service at `services/image/background-remover.ts`.

Model: Bria AI background removal via Replicate (`briaai/RMBG-2.0`)

```typescript
const removed = await removeBackground({
  imagePath: itemRawPath,
  outputPath: `items/item-${n}-cutout.png`,
});
```

The output is a PNG with transparent background. Verify each cutout:
- Subject is fully intact (no missing parts)
- Background is fully removed (no halos or remnants)
- Edges look clean (not jagged or soft-blurred)

If a cutout has issues, re-run the background remover or adjust the source image prompt to produce a cleaner white background.

Save to: `{output.base_dir}/infographic-{slug}/items/item-{n}-cutout.png`

---

## Step 4 — Compose Final Poster

Use GPT Image 1.5 Medium to compose the final poster. Provide the cutout images as reference and describe the layout explicitly.

**Approach**: Use the image editing/inpainting capability with a detailed composition prompt.

Poster composition prompt formula:
```
Create a professional infographic poster with this exact layout:
{layout_description}

Brand colors: primary {brand.colors.primary}, background {brand.colors.background}, text {brand.colors.text}
Font style: bold sans-serif, clean and modern
Title at top: "{poster_title}" in large bold text
{for each item}: Image of {item_label} in {cell_position}, label "{item_label}" below, "{item_descriptor}" in smaller text
Brand name "{brand.name}" at bottom right in small text
Overall aesthetic: clean, editorial, premium. High contrast text. No clutter.
White or light background. {brand.colors.primary} accent elements (borders, highlights, icons).
```

Pass all cutout images as reference inputs to maintain accurate product appearance.

Use GPT Image 1.5 Medium for quality composition.
Aspect ratio: target `4:5` (1080x1350) for Instagram feed, or `9:16` for Stories/Reels.

Save to: `{output.base_dir}/infographic-{slug}/poster-raw.jpg`

---

## Step 5 — Outpaint to Target Aspect Ratio

If the composed poster doesn't perfectly match the target aspect ratio, use FLUX Fill Pro to outpaint the edges.

Use the outpainter service at `services/image/outpainter.ts`.

Model: `black-forest-labs/flux-fill-pro` via Replicate

```typescript
const outpainted = await outpaintImage({
  imagePath: posterRawPath,
  targetAspectRatio: '4:5',  // or '9:16'
  targetWidth: 1080,
  targetHeight: 1350,        // or 1920 for 9:16
  prompt: `${brand.name} branded infographic poster, ${brand.colors.background} background, clean editorial design`,
});
```

The outpainting fills any empty canvas space with brand-appropriate background and design elements — it should be seamless and not look extended.

Save final to: `{output.base_dir}/infographic-{slug}/poster-final.jpg`

---

## Layout Reference

### 2-Column Comparison

```
┌─────────────────────────────────────────┐
│           [TITLE — full width]           │
├──────────────────┬──────────────────────┤
│   [Item A Image] │   [Item B Image]     │
│   [Item A Label] │   [Item B Label]     │
│   [Descriptor A] │   [Descriptor B]     │
├──────────────────┴──────────────────────┤
│         [Brand Name — bottom right]      │
└─────────────────────────────────────────┘
```

### 2x2 Grid

```
┌────────────────────────────────────────────┐
│           [TITLE — full width]              │
├───────────────────┬────────────────────────┤
│  [Item 1 Image]   │  [Item 2 Image]        │
│  [Item 1 Label]   │  [Item 2 Label]        │
│  [Descriptor 1]   │  [Descriptor 2]        │
├───────────────────┼────────────────────────┤
│  [Item 3 Image]   │  [Item 4 Image]        │
│  [Item 3 Label]   │  [Item 4 Label]        │
│  [Descriptor 3]   │  [Descriptor 4]        │
├───────────────────┴────────────────────────┤
│              [Brand Name]                   │
└────────────────────────────────────────────┘
```

### Hero + Detail

```
┌──────────────────────────────────────┐
│            [TITLE]                    │
│                                       │
│     [LARGE HERO IMAGE — 60% height]  │
│        [Hero Label + Key Stat]        │
├──────────┬──────────┬────────────────┤
│ [Detail 1]│[Detail 2]│[Detail 3]     │
└──────────┴──────────┴────────────────┘
```

---

## Quality Checklist

- [ ] All product cutouts are clean with no background remnants or halos
- [ ] Poster title is prominent and readable at a glance
- [ ] `brand.colors.primary` is used as the accent color
- [ ] `brand.name` appears in the footer (small, unobtrusive)
- [ ] Layout is balanced — no cells look empty or overfull
- [ ] Text is high-contrast and legible (minimum 4.5:1 contrast ratio)
- [ ] Key data points (descriptors) are clearly associated with each item
- [ ] Final aspect ratio matches the target platform (4:5 or 9:16)
- [ ] Image resolution is at least 1080px wide
- [ ] File: `output/infographic-{slug}-final.jpg`
