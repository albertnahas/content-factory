---
description: Generate a 15-30s short-form voiceover reel with images, video segments, captions, and background music
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts`, `content.categories`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 4 images | Ideogram V3 Turbo | ~$0.04 |
| 4 video segments (5s each) | Seedance 1.5 Pro | ~$0.20 |
| TTS voiceover | MiniMax speech-2.8-hd | ~$0.003 |
| Background music | Lyria 2 | ~$0.02 |
| Whisper transcription | OpenAI Whisper | ~$0.005 |
| **Total** | | **~$0.34** |

---

## Step 1 — Select Topic

If the user provided a topic, use it directly. Otherwise:

1. Run `npx content-factory ideas list --format reel --limit 10` from the project root.
2. Prefer ideas with `priority: banger` that have not been used.
3. Present the top 3 candidates and ask the user to confirm, or select the highest-priority unused idea automatically if running non-interactively.
4. After generation is complete, mark the idea as used: `npx content-factory ideas mark <slug> --format reel`.

---

## Step 2 — Write the Script

Write a voiceover script following this 3-beat structure:

```
HOOK (3-5s): Bold, pattern-interrupting opening statement. Must create curiosity or state a surprising fact. Do NOT reveal the answer.
VALUE (12-20s): 2-4 punchy insights, tips, or reveals about the topic. Each beat is one sentence. Use conversational, energetic tone.
CTA (3-5s): Direct call to action using brand.cta_default or a variation. Reference brand.name naturally.
```

Script rules:
- Target 120-150 words total for a ~25s read at 1.3x speed
- No filler words ("um", "so", "basically")
- Each sentence maps to one visual segment
- Write the CTA to feel earned, not tacked on

Divide the script into exactly 4 segments matching the visual segments:
- Segment 1: Hook
- Segments 2-3: Value beats
- Segment 4: CTA

---

## Step 3 — Generate Voiceover

Use the TTS service. Provider is determined by `content.tts.provider` in config.

For MiniMax (`speech-2.8-hd`):
- Use voice from `content.tts.voice_pool[0]` (default: `Friendly_Person`)
- Speed: `content.tts.speed` (default: 1.3)
- Output format: stereo MP3
- Output path: `{output.base_dir}/reel-{slug}/voiceover.mp3`

**NEVER randomize the voice.** Always use the voice defined in config for brand consistency.

---

## Step 4 — Transcribe Captions

Call OpenAI Whisper on the generated voiceover file:
- Model: `whisper-1`
- Response format: `verbose_json` with `word` timestamps
- Output: `{output.base_dir}/reel-{slug}/captions.json`

Extract word-level timestamps for caption rendering. Each caption group should be 3-4 words, timed to the word boundaries.

---

## Step 5 — Plan Visual Segments

For each of the 4 script segments, write an image prompt:

**Image prompt formula:**
```
{visual_subject} {action_or_state}, {lighting}, {mood}, {style}. No text. No logos.
```

Style guidance from config:
- Use `brand.colors.primary` as the accent in lighting descriptions (e.g., "warm amber accent light")
- Match visual mood to the script beat (energetic for hook, informative for value, aspirational for CTA)
- Aspect ratio: `content.default_aspect_ratio` (default `9:16`)
- Style type: `Render 3D` for product/object subjects, `Realistic` for lifestyle, `General` for abstract

For the CTA segment, the image should feel aspirational and on-brand.

---

## Step 6 — Generate Images

Use the image generator service at `services/image/generator.ts`.

For each segment:
```typescript
const image = await generateImage({
  prompt: segmentPrompt,
  aspectRatio: config.content.default_aspect_ratio,
  styleType: 'Realistic',
  magicPrompt: true,
});
```

Save each image to: `{output.base_dir}/reel-{slug}/images/segment-{n}.jpg`

---

## Step 7 — Generate Video Segments

Use Seedance 1.5 Pro via Replicate for each image → video conversion.

**Camera presets by segment type:**

| Segment | Camera Preset | Motion |
|---------|--------------|--------|
| Hook | `push_in` | Slow zoom toward subject |
| Value beat 1 | `orbit_right` | Gentle orbit around subject |
| Value beat 2 | `pull_out` | Slow pull back reveal |
| CTA | `static` | Minimal movement, confident hold |

Each video: 5 seconds, 720p, 9:16 aspect ratio.

Replicate model: `bytedance/seedance-1-5-pro`

Input parameters:
```json
{
  "image": "<base64_or_url>",
  "duration": 5,
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "camera_control": "<preset>",
  "seed": 42
}
```

Save each video to: `{output.base_dir}/reel-{slug}/videos/segment-{n}.mp4`

---

## Step 8 — Generate Background Music

Use Lyria 2 via the music generation service.

Mood selection based on content category:
- `tips-and-tricks`, `how-to` → `upbeat_corporate`
- `myth-busters`, `shocking-facts` → `dramatic_tension`
- `product-spotlights`, `inspiration` → `aspirational_pop`
- `behind-the-scenes`, `authentic` → `chill_lo_fi`

**Music presets:**

| Preset | Lyria tags | BPM range |
|--------|-----------|-----------|
| `upbeat_corporate` | upbeat, motivational, electronic | 115-130 |
| `dramatic_tension` | dramatic, suspenseful, cinematic | 90-110 |
| `aspirational_pop` | inspiring, pop, bright | 100-120 |
| `chill_lo_fi` | chill, lo-fi, relaxed | 75-95 |

Generate at target duration + 2s for fade headroom. Apply 0.5s fade-in and 1.5s fade-out with ffmpeg.

Save to: `{output.base_dir}/reel-{slug}/music.mp3`

---

## Step 9 — Copy Assets to Remotion and Write render-props.json

Copy all assets to `{output.remotion_public}/reel-{slug}/`:
```
images/segment-1.jpg ... segment-4.jpg
videos/segment-1.mp4 ... segment-4.mp4
voiceover.mp3
music.mp3
captions.json
```

Write `{output.remotion_public}/reel-{slug}/render-props.json`:
```json
{
  "slug": "<slug>",
  "brand": {
    "name": "<brand.name>",
    "tagline": "<brand.tagline>",
    "colors": { "primary": "<brand.colors.primary>", "background": "<brand.colors.background>", "text": "<brand.colors.text>" }
  },
  "segments": [
    {
      "index": 0,
      "type": "hook",
      "script": "<segment_1_text>",
      "imagePath": "reel-<slug>/images/segment-1.jpg",
      "videoPath": "reel-<slug>/videos/segment-1.mp4",
      "durationFrames": 150
    }
    // ... segments 1-3
  ],
  "voiceoverPath": "reel-<slug>/voiceover.mp3",
  "musicPath": "reel-<slug>/music.mp3",
  "captionsPath": "reel-<slug>/captions.json",
  "fps": 30,
  "totalDurationFrames": 750
}
```

---

## Step 10 — Render with Remotion

From the `remotion/` directory:
```bash
npx remotion render Reel output/reel-<slug>.mp4 \
  --props=public/reel-<slug>/render-props.json \
  --codec=h264 \
  --pixel-format=yuv420p
```

If Remotion is not configured, compose with ffmpeg instead:
```bash
# Concat video segments
ffmpeg -f concat -safe 0 -i concat-list.txt -c copy segments-concat.mp4

# Mix voiceover + music (voice at 100%, music at 12%)
ffmpeg -i segments-concat.mp4 -i voiceover.mp3 -i music.mp3 \
  -filter_complex "[1:a]volume=1.0[v];[2:a]volume=0.12[m];[v][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac \
  output/reel-<slug>.mp4
```

Final output: `output/reel-<slug>.mp4`

---

## Quality Checklist

Before declaring the reel complete, verify:

- [ ] Hook is under 5 seconds and does NOT reveal the answer
- [ ] Voiceover is clear and at consistent volume throughout
- [ ] Captions are time-accurate and readable (high-contrast colors)
- [ ] Music does not overpower voice (listen to the mixed audio)
- [ ] All 4 video segments play smoothly with no artifacts
- [ ] CTA includes `brand.name` and a clear action
- [ ] Total duration is 15-30 seconds
- [ ] Output file is valid MP4 at 720p minimum resolution
- [ ] Idea marked as used in the Ideas Bank
