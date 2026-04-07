---
name: repurpose
description: Repurpose a generated video or content piece into multiple formats — carousel, infographic, social captions, email snippet, quote card, and blog excerpt. Takes one source and maximizes output.
user_facing: true
---

# /repurpose — One Source, Maximum Output

## Input

The user provides ONE of:
- **A video file path**: e.g., `output/reel-sleep-myths.mp4`
- **An output directory**: e.g., `output/reel-sleep-myths/`
- **A content description**: e.g., "repurpose the last reel I generated"

## Phase 0: Detect Source & Extract Assets

### 0.1 Identify source type

From the path or directory name, detect the source pipeline:

| Directory Pattern | Source Type | Expected Assets |
|------------------|------------|-----------------|
| `reel-*` | Reel | images/, videos/, voiceover.mp3, captions.json, render-props.json |
| `ad-*` | Ad | images/, videos/, voiceover.mp3, captions.json, render-props.json |
| `ugc-*` | UGC | avatar-reference.jpg, scene-*.jpg, voiceover.mp3 |
| `ugc-ad-*` | UGC Ad | avatar-reference.jpg, broll/, voiceover.mp3 |
| `character-*` | Talking Character | character-shot-*.jpg, voiceover.mp3 |
| `decoded-*` | Product Decoded | assembled.jpg, disassembled.jpg, voiceover.mp3, captions.json |
| `carousel-*` | Carousel | slides/, caption.txt, manifest.json |
| `infographic-*` | Infographic | items/, poster-final.jpg, manifest.json |

If only a `.mp4` file is provided (no output directory), create a working directory and extract:
```bash
mkdir -p output/repurpose-{slug}/
# Extract keyframes
ffmpeg -i input.mp4 -vf "select=eq(pict_type\,I)" -vsync vfr output/repurpose-{slug}/frame-%03d.jpg
```

### 0.2 Extract transcript

Priority order:
1. Read `captions.json` from the output directory → use `text` field for full transcript, `words` for timestamps
2. Read `render-props.json` → concatenate `script` fields from each segment/shot
3. If neither exists, transcribe from audio:
   ```typescript
   import { transcribe } from '@content-factory/core/services/audio/transcription';
   const result = await transcribe('output/{slug}/voiceover.mp3');
   // Or extract audio from video first:
   // ffmpeg -i input.mp4 -vn -acodec pcm_s16le audio.wav
   ```

### 0.3 Extract images

Priority order:
1. Use existing images from `images/` subdirectory
2. Use character images (`character-shot-*.jpg`, `avatar-reference.jpg`)
3. Use product images (`assembled.jpg`, `disassembled.jpg`, item cutouts)
4. Extract keyframes from video if nothing else available

### 0.4 Load context

```typescript
// Read brand config
const config = yaml.parse(fs.readFileSync('content-factory.yaml', 'utf8'));

// Check if this content came from an Ideas Bank idea
// Look for matching slug in ideas-bank.json
const ideas = JSON.parse(fs.readFileSync('ideas-bank.json', 'utf8'));
const sourceIdea = ideas.find(i => slug.includes(i.slug));
// If found, use its facts, hooks, and category for enrichment
```

### 0.5 Present extraction summary

Show the user what was extracted:
```
Source: reel-sleep-myths (Reel)
Transcript: 142 words, 3 beats (Hook → Value → CTA)
Images: 4 segment images (1080x1920)
Voiceover: 22.4s
Music: yes
Idea match: "sleep-myths-debunked" (category: myth-busters, priority: banger)

Available repurpose targets:
  ✓ Carousel (5-7 slides from script beats)
  ✓ Social captions (Instagram, TikTok, LinkedIn, Twitter/X)
  ✓ Quote card (best line as static image)
  ✓ Email snippet (subject + body + CTA)
  ✓ Blog excerpt (300-500 word expansion)
  ✓ Infographic (if data points available)
```

Ask user which formats to generate, or confirm "all" to produce everything viable.

---

## Phase 1: Generate Carousel

Use the extracted transcript and images to create a carousel.

### 1.1 Split transcript into slides

Break the script into 5-7 key points:
- **Slide 1 (Cover)**: The hook line — first sentence of the transcript
- **Slides 2-N**: One insight per slide, derived from script beats
- **Final slide (CTA)**: Brand name + CTA from config

### 1.2 Generate slides

**Mode A — Standard (text overlay on brand-colored backgrounds, $0.00):**
Use Playwright HTML rendering per the `/generate-carousel` command.

**Mode B — With source images as backgrounds (~$0.00):**
Use the extracted segment images as slide backgrounds, overlay text.

### 1.3 Write platform captions

Generate carousel-specific captions with:
- Hook line as first line
- "Swipe to see all {N} →" on cover
- Hashtags per the 3-tier strategy (niche + mid-tier + broad)

### 1.4 Save output

```
output/repurpose-{slug}/carousel/
├── slides/
│   ├── slide-1.jpg ... slide-{N}.jpg
├── caption-instagram.txt
├── caption-linkedin.txt
└── carousel-manifest.json
```

---

## Phase 2: Generate Social Captions

Write platform-native captions from the transcript. Each must feel written *for* that platform.

### 2.1 Instagram Caption
- Open with the hook (first line, standalone)
- Line breaks between ideas for scannability
- 150-300 words body
- End with CTA + 15-20 hashtags (3-tier: niche, mid, broad)
- No emoji overload — max 3-5 relevant ones

### 2.2 TikTok Caption
- Ultra-short: 50-100 words max
- Hook-first, casual tone
- 3-5 trending hashtags
- Reference trends if applicable

### 2.3 LinkedIn Post
- Professional insight format
- Lead with a counterintuitive statement or data point
- 200-400 words, paragraph style
- End with a question to drive comments
- 3-5 industry hashtags

### 2.4 Twitter/X Post
- Single-tweet version (280 chars): the one most shareable insight
- Thread version (3-5 tweets): hook → insight chain → CTA
- 1-2 hashtags max

### 2.5 YouTube Shorts Description
- SEO-optimized: keyword-rich
- 100-200 words
- No hashtags (use tags instead — list 10 suggested tags)

### 2.6 Save output

```
output/repurpose-{slug}/captions/
├── instagram.txt
├── tiktok.txt
├── linkedin.txt
├── twitter-single.txt
├── twitter-thread.txt
└── youtube-shorts.txt
```

---

## Phase 3: Generate Quote Card

Create a static shareable image with the single best line from the transcript.

### 3.1 Select the quote

Pick the most shareable line using these criteria:
- Surprising, counterintuitive, or emotionally resonant
- Self-contained (makes sense without context)
- Under 20 words
- If the source idea has `suggestedHooks`, prefer those

### 3.2 Generate image

Use image generation with a branded template prompt:

```
Prompt: A minimalist quote card on a {brand.colors.background} background.
Large bold text in {brand.font} reads: "{quote}".
Small attribution text at bottom: "— {brand.name}".
Accent line or dot in {brand.colors.primary}. Clean, modern, no clutter.
Aspect ratio: 1:1 (1080x1080).
```

Use GPT Image 1.5 Low (~$0.013) for cost efficiency.

### 3.3 Save output

```
output/repurpose-{slug}/quote-card/
└── quote-card.jpg
```

---

## Phase 4: Generate Email Snippet

Extract newsletter-ready content from the source.

### 4.1 Compose email components

| Component | Source | Format |
|-----------|--------|--------|
| **Subject line** | Hook (first sentence of transcript) | Under 50 chars, curiosity-driven |
| **Preview text** | Support beat (second sentence) | Under 90 chars |
| **Hero image** | First segment image from source | Inline or linked |
| **Body** | 2-3 key insights from transcript | 100-150 words, scannable |
| **CTA** | Brand CTA from config | Button-style with link placeholder |

### 4.2 Write two subject line variants

- **Variant A**: Curiosity gap (from hook)
- **Variant B**: Benefit-led (from CTA beat)

### 4.3 Save output

```
output/repurpose-{slug}/email/
├── subject-lines.txt
├── preview-text.txt
├── body.html          # Simple HTML email snippet
└── body.txt           # Plain text fallback
```

---

## Phase 5: Generate Blog Excerpt

Expand the transcript into a short article section for SEO or newsletter use.

### 5.1 Expand transcript

- **H2 heading**: The hook line (rewritten as a headline)
- **Intro paragraph**: Set up the problem or curiosity gap (50-80 words)
- **Body**: Expand each script beat into a paragraph with added context (200-300 words)
- **Data points**: If source idea has verified `facts`, inline them with sources
- **Closing**: CTA paragraph with link placeholder

### 5.2 SEO optimization

- Include 2-3 target keywords naturally
- Add a meta description (150-160 chars)
- Suggest 3 internal link opportunities
- Include alt text for any embedded images

### 5.3 Save output

```
output/repurpose-{slug}/blog/
├── excerpt.md          # Markdown article
├── meta.json           # { title, description, keywords, slug }
└── hero-image.jpg      # Copy of best source image
```

---

## Phase 6: Generate Infographic (conditional)

Only generate if the source contains structured data (comparisons, lists, numbers).

### 6.1 Assess viability

Check if transcript or source idea contains:
- Numerical comparisons (A vs B)
- Lists of items (3+ items with attributes)
- Statistics or percentages
- Before/after states

If none found, skip this phase and note it in the summary.

### 6.2 Generate

If viable, invoke `/generate-infographic` with:
- Data points extracted from transcript
- Images from source directory
- Layout type auto-selected (Comparison if A vs B, Grid if list, Hero if single focus)

### 6.3 Save output

```
output/repurpose-{slug}/infographic/
└── poster-final.jpg
```

---

## Phase 7: Summary Report

Present the complete repurposing output:

```
Repurpose Complete: reel-sleep-myths → 6 derivatives

  Format              Files                          Est. Cost
  ─────────────────────────────────────────────────────────────
  Carousel            7 slides + 2 captions          $0.00
  Social Captions     6 platform variants             $0.00
  Quote Card          1 image (1080x1080)             $0.013
  Email Snippet       subject + body (HTML + text)    $0.00
  Blog Excerpt        1 article (487 words) + meta    $0.00
  Infographic         1 poster (4:5)                  $0.10
  ─────────────────────────────────────────────────────────────
  Total                                               $0.113

  Output: output/repurpose-{slug}/

  Next steps:
  • Post carousel → /post-to-social output/repurpose-{slug}/carousel/
  • Schedule social captions across platforms
  • Add blog excerpt to your CMS
  • Include email snippet in next newsletter
```

## Quality Checklist

Before finalizing, verify:
- [ ] All derivatives use brand colors, font, and CTA from config
- [ ] No facts were invented — only content from transcript + source idea
- [ ] Each platform caption feels native (not copy-pasted across platforms)
- [ ] Quote card text is legible and under 20 words
- [ ] Email subject lines are under 50 characters
- [ ] Blog excerpt includes sources for any data claims
- [ ] Infographic was skipped with reason if data wasn't suitable
