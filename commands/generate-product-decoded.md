---
description: Generate a 30s product disassembly reveal video — components fly apart, float, then reassemble
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 2 product images (assembled + disassembled) | GPT Image 1.5 Medium | ~$0.10 |
| Disassembly video (10s) | Seedance 1.5 Pro | ~$0.05 |
| Hold/float video (10s) | Seedance 1.5 Pro | ~$0.05 |
| TTS voiceover | MiniMax speech-2.8-hd | ~$0.003 |
| Whisper transcription | OpenAI Whisper | ~$0.005 |
| Background music | Lyria 2 | ~$0.02 |
| **Total** | | **~$0.24** |

The 10s AI videos become 20s of content via ffmpeg reversal (disassembly → assembly, hold → hold-reversed). Final video is 30s from ~$0.24 in generation costs.

---

## Step 1 — Define the Product and Its Components

Ask the user:
```
Product or subject: ___
Key components to highlight: (list 3-6 components or aspects)
Primary benefit or claim to emphasize: ___
Data point or stat for the overlay section: (e.g., "X% more efficient", "3x faster")
```

The "components" are what the product is made of or what makes it work:
- Physical product → actual parts (materials, layers, mechanisms)
- Software product → feature modules, integrations, data flows
- Service → steps, people, resources involved
- Abstract concept → contributing factors, principles

The reveal works best when the components are surprising or impressive individually — each one adds perceived value before the reassembly.

---

## Step 2 — Define Studio Style

The visual style should be consistent across all assets.

**Default studio style:**
```
Dark matte surface background, dramatic top-down studio lighting,
high-contrast product photography, cinematic depth of field,
dark premium aesthetic, component labels NOT included in image
```

Store this as a constant to reuse across all image prompts.

Adjust based on brand:
- Light brand (`brand.colors.background` is light) → white/light grey matte surface
- Tech brand → dark carbon fiber texture, blue accent rim light
- Natural/organic brand → warm wood surface, soft diffused light

Use `brand.colors.primary` as the accent rim light color in prompts.

---

## Step 3 — Generate Assembled and Disassembled Product Images

**Image 1 — Assembled (start + end frame):**
The product in its complete, composed form. This is used as:
- The `lastFrameImage` for the disassembly video (product intact at start)
- The `image` for the assembly video (product reassembles to this state)

Prompt:
```
{product_description}, assembled and complete, {studio_style},
centered composition, 2:3 aspect ratio, photorealistic.
No text. No labels. No logos.
```

**Image 2 — Disassembled (float frame):**
All components spread out, floating or arranged around the empty center where the assembled product would be. This is used as:
- The `lastFrameImage` for the float/hold video

Prompt:
```
{product_description} fully disassembled, all {n} components spread out
and floating in space, {studio_style}, organized arrangement around center,
each component clearly visible, 2:3 aspect ratio, photorealistic.
No text. No labels. No logos.
```

Use GPT Image 1.5 Medium via Replicate (`openai/gpt-image-1`).
Save to:
- `{output.base_dir}/decoded-{slug}/assembled.jpg`
- `{output.base_dir}/decoded-{slug}/disassembled.jpg`

---

## Step 4 — Generate Disassembly Video (10s)

Use Seedance 1.5 Pro with start+end frame interpolation.

The video starts with the assembled product and ends with the disassembled spread.

```json
{
  "image": "<assembled_image_url>",
  "lastFrameImage": "<disassembled_image_url>",
  "prompt": "Product smoothly disassembles into its components. Parts gently fly outward from the center. Slow and elegant motion. Studio environment. Camera is static.",
  "duration": 10,
  "resolution": "720p",
  "aspect_ratio": "2:3",
  "camera_control": "static"
}
```

Save to: `{output.base_dir}/decoded-{slug}/disassembly.mp4`

---

## Step 5 — Generate Hold/Float Video (10s)

This video shows the components floating gently in place — minimal movement, meditative stillness.

```json
{
  "image": "<disassembled_image_url>",
  "prompt": "Components float gently in place. Extremely subtle hover motion. No drifting, no rotation, no movement away from positions. Studio lighting. Calm and peaceful.",
  "duration": 10,
  "resolution": "720p",
  "aspect_ratio": "2:3",
  "camera_control": "static"
}
```

**Critical**: The hold video prompt must emphasize MINIMAL movement. Components should stay near their positions — no drifting, no spinning. The subtlety is intentional for the macros overlay section.

Save to: `{output.base_dir}/decoded-{slug}/hold.mp4`

---

## Step 6 — Reverse Videos with ffmpeg

Reverse both videos to create the "assembly" versions:

```bash
# Reverse disassembly → becomes the assembly video
ffmpeg -i disassembly.mp4 -vf reverse -af areverse assembly.mp4

# Reverse hold → becomes hold-reversed (for visual symmetry)
ffmpeg -i hold.mp4 -vf reverse -af areverse hold-reversed.mp4
```

Verify the reversed videos play correctly:
- `assembly.mp4`: should show components converging and snapping together
- `hold-reversed.mp4`: should look nearly identical to `hold.mp4` (minimal movement reversed)

Save to: `{output.base_dir}/decoded-{slug}/`

---

## Step 7 — Extract Freeze Frame for Data Overlay

Extract a single frame from the hold video to use as the static background for the data overlay section:

```bash
ffmpeg -i hold.mp4 -vframes 1 -ss 5 freeze-frame.jpg
```

The freeze frame at 5s (midpoint) will have the most stable, aesthetically pleasing composition.

Save to: `{output.base_dir}/decoded-{slug}/freeze-frame.jpg`

---

## Step 8 — Write Voiceover Script

Structure the script to match the 6 video sections:

```
Section 1 — DISASSEMBLY (5s):
  Hook. Tease what's being revealed. "Let's take {product} apart..."

Section 2 — FLOAT (5s):
  Name each component/aspect with a quick benefit.
  "{Component 1}... {Component 2}... {Component 3}..."
  Punchy, rhythmic, like a list being revealed.

Section 3 — FLOAT-REVERSED (5s):
  Continue components if needed, or transition to the data beat.
  "All of this comes together to..."

Section 4 — DATA OVERLAY (5s):
  State the key claim or stat. This plays over the freeze frame.
  "{Primary benefit}: {stat or claim}. And {brand.name} delivers exactly that."

Section 5 — ASSEMBLY (5s):
  Emotional resonance as the product comes back together.
  "Every part working in perfect harmony."

Section 6 — OUTRO (5s):
  CTA. Reference brand.name. Use brand.cta_default.
  "{brand.cta_default} — {brand.name}."
```

Total: ~100-130 words for a 28-30s read at 1.1x speed.

---

## Step 9 — Generate Voiceover

Use MiniMax `speech-2.8-hd`:
- Voice: `content.tts.voice_pool[0]`
- Speed: 1.1x (slightly faster than natural for the reveal energy)
- Output: stereo MP3

Output: `{output.base_dir}/decoded-{slug}/voiceover.mp3`

---

## Step 10 — Transcribe Captions

Run Whisper on the voiceover:
- Model: `whisper-1`
- Format: `verbose_json` with `word` timestamps
- Output: `{output.base_dir}/decoded-{slug}/captions.json`

---

## Step 11 — Generate Background Music

Use Lyria 2. The music should complement the elegance of the disassembly reveal:

Recommended mood: `minimal_luxury` or `cinematic_build`
- Start quiet (disassembly section)
- Build during float sections
- Peak at data overlay
- Resolve during assembly
- End cleanly on outro

Generate at 32s with 0.5s fade-in and 2s fade-out.
Output: `{output.base_dir}/decoded-{slug}/music.mp3`

---

## Step 12 — Copy Assets and Write render-props.json

Copy all assets to `{output.remotion_public}/decoded-{slug}/`.

Write `render-props.json`:
```json
{
  "slug": "<slug>",
  "brand": {
    "name": "<brand.name>",
    "tagline": "<brand.tagline>",
    "colors": { "primary": "<primary>", "background": "<bg>", "text": "<text>" }
  },
  "sections": [
    { "id": "disassembly", "videoPath": "decoded-<slug>/disassembly.mp4", "durationFrames": 150 },
    { "id": "float", "videoPath": "decoded-<slug>/hold.mp4", "durationFrames": 150 },
    { "id": "float-reversed", "videoPath": "decoded-<slug>/hold-reversed.mp4", "durationFrames": 150 },
    { "id": "data-overlay", "imagePath": "decoded-<slug>/freeze-frame.jpg", "durationFrames": 150,
      "dataLabel": "<primary_benefit>", "dataStat": "<stat_or_claim>" },
    { "id": "assembly", "videoPath": "decoded-<slug>/assembly.mp4", "durationFrames": 150 },
    { "id": "outro", "imagePath": "decoded-<slug>/assembled.jpg", "durationFrames": 150 }
  ],
  "voiceoverPath": "decoded-<slug>/voiceover.mp3",
  "musicPath": "decoded-<slug>/music.mp3",
  "captionsPath": "decoded-<slug>/captions.json",
  "fps": 30,
  "totalDurationFrames": 900
}
```

---

## Step 13 — Render with Remotion

```bash
npx remotion render ProductDecoded output/decoded-{slug}.mp4 \
  --props=public/decoded-{slug}/render-props.json \
  --codec=h264 --pixel-format=yuv420p
```

If Remotion is not available, compose with ffmpeg:
```bash
# Concat all 6 sections
ffmpeg -f concat -safe 0 -i concat-list.txt -c:v libx264 -c:a aac raw.mp4

# Mix voice + music
ffmpeg -i raw.mp4 -i voiceover.mp3 -i music.mp3 \
  -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.15[m];[v][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac output/decoded-{slug}.mp4
```

---

## Quality Checklist

- [ ] Disassembly video starts assembled and ends spread out (verify direction)
- [ ] Assembly video (reversed) cleanly converges the components
- [ ] Hold video has minimal movement — components stay in place
- [ ] Freeze frame is well-composed for the data overlay section
- [ ] Voiceover rhythm matches the 5s per section pacing
- [ ] Music builds appropriately and resolves cleanly
- [ ] Data overlay section clearly communicates the key claim/stat
- [ ] CTA includes `brand.name` and `brand.cta_default`
- [ ] Total duration is 29-32 seconds
- [ ] Output is valid MP4 at 720p, 2:3 aspect ratio
