---
name: content-repurposing
description: Content repurposing strategy and extraction rules — how to derive maximum formats from a single generated asset. Triggers on "repurpose", "reuse content", "turn this into", "make a carousel from this video", or when /repurpose command is invoked.
---

# Content Repurposing — One Asset, Many Formats

## Repurposing Matrix

Every generated asset contains reusable components. The matrix below maps source formats to viable derivatives:

| Source Format | Extractable Assets | Derivative Formats |
|--------------|-------------------|-------------------|
| **Reel** | transcript, 4 images, voiceover, music, captions | carousel, infographic, blog excerpt, social captions, email snippet, quote card |
| **Ad** | transcript, 5 images, voiceover, music, script beats | carousel, infographic, social captions, email snippet, quote card, landing page copy |
| **UGC / UGC Ad** | transcript, avatar image, voiceover, B-roll images | testimonial carousel, quote card, social captions, email testimonial |
| **Talking Character** | transcript, 4 character images, voiceover | carousel (character slides), social captions, meme-style quote cards |
| **Product Decoded** | transcript, assembled/disassembled images, voiceover | infographic, carousel (component breakdown), social captions, spec sheet |
| **Carousel** | slide images, caption text | reel script (reverse-engineer), social captions per platform, email content |
| **Infographic** | poster image, item cutouts | carousel slides, social posts, ad creative |

## Asset Extraction Rules

### From Video Output Directories

Detect source type from directory naming:
- `reel-*` → Reel pipeline output
- `ad-*` → Ad pipeline output
- `ugc-*` → UGC pipeline output
- `ugc-ad-*` → UGC Ad pipeline output
- `character-*` → Talking Character output
- `decoded-*` → Product Decoded output
- `carousel-*` → Carousel output
- `infographic-*` → Infographic output

### Transcript Extraction Priority

1. **captions.json** — Already exists in most video pipelines. Contains word-level timestamps.
2. **render-props.json** — Contains script text per segment/shot.
3. **Whisper transcription** — If neither exists, transcribe from `voiceover.mp3` or the final `.mp4`.

### Image Extraction

1. **From output directory** — Use existing `images/segment-*.jpg` or `images/shot-*.jpg`
2. **From video keyframes** — Extract with ffmpeg: `ffmpeg -i video.mp4 -vf "select=eq(pict_type\,I)" -vsync vfr frame-%03d.jpg`
3. **From character images** — Use `character-shot-*.jpg` directly

## Derivative Generation Rules

### Video → Carousel

1. Extract transcript from `captions.json` or `render-props.json`
2. Split transcript into 5-7 key points (one per slide)
3. Use existing segment images as slide backgrounds
4. Generate via `/generate-carousel` in standard mode with the extracted content
5. Write captions per platform

**Slide mapping:**
- Slide 1 (Cover): Hook line from transcript (first sentence)
- Slides 2-6: One key insight per slide, sourced from script beats
- Slide 7 (CTA): Brand CTA from config

### Video → Infographic

1. Extract key data points from transcript (numbers, comparisons, lists)
2. Use product/item images from output directory
3. Generate via `/generate-infographic` with extracted data
4. Best when source has comparison or list structure

### Video → Social Captions (per platform)

Generate platform-adapted captions from the same transcript:

| Platform | Style | Length | Hashtags |
|----------|-------|--------|----------|
| Instagram | Story-driven, line breaks, emoji-light | 150-300 words | 15-20 mixed tiers |
| TikTok | Casual, hook-first, trending references | 50-150 words | 3-5 trending |
| LinkedIn | Professional, insight-led, paragraph format | 200-400 words | 3-5 industry |
| Twitter/X | Punchy, thread-ready, single key insight | 280 chars or thread | 1-2 max |
| YouTube Shorts | SEO-optimized, keyword-rich description | 100-200 words | None (use tags) |

### Video → Email Snippet

Extract for newsletter or drip campaign use:
- **Subject line**: Derived from hook (first sentence of script)
- **Preview text**: Second sentence or support beat
- **Body excerpt**: 2-3 sentences covering the core insight
- **CTA**: Link to full video or landing page
- **Inline image**: First segment image as hero

### Video → Quote Card

For static social posts (Instagram Feed, LinkedIn, Twitter):
1. Extract the single most shareable line from transcript
2. Overlay on a branded background (brand colors + font from config)
3. Generate via image service with text overlay prompt
4. Output: 1080x1080 (square) for maximum cross-platform compatibility

### Video → Blog Excerpt

For SEO content or newsletter:
1. Expand transcript into 300-500 word article section
2. Add context, sources (from Ideas Bank facts if available)
3. Include the original hook as the H2 heading
4. Embed video link or thumbnail
5. Add internal links to related content

## Cost Efficiency

Repurposing costs are minimal compared to original generation:

| Derivative | Estimated Cost | Method |
|-----------|---------------|--------|
| Carousel (standard mode) | ~$0.00 | HTML rendering via Playwright |
| Carousel (AI character) | ~$0.30 | New image generation |
| Social captions (all platforms) | $0.00 | LLM text generation only |
| Email snippet | $0.00 | LLM text extraction |
| Quote card | ~$0.02-0.05 | Single image generation |
| Blog excerpt | $0.00 | LLM text expansion |
| Infographic | ~$0.10-0.20 | Image composition |

**Total repurpose cost: ~$0.02-0.55** vs original generation cost of $0.24-1.50.

## Quality Rules

- **Never dilute the hook** — the original hook line should remain intact or be strengthened, never weakened
- **Platform-native feel** — each derivative must feel native to its platform, not like a lazy copy-paste
- **Brand consistency** — all derivatives use the same brand colors, font, CTA from config
- **Fact preservation** — if the source contained verified facts, carry the same claims and sources
- **No hallucinated content** — derivatives can only contain information from the source + brand config, never invented facts
