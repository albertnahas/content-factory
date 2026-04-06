---
description: Generate a full video ad for any platform using a 10-phase production pipeline
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts`, `content.tts_premium`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 4-6 images | Ideogram V3 Turbo | ~$0.04-0.06 |
| 4-6 video segments | Seedance 1.5 Pro | ~$0.20-0.30 |
| Voiceover (MiniMax) | speech-2.8-hd | ~$0.003 |
| Background music | Lyria 2 | ~$0.02 |
| Whisper transcription | OpenAI Whisper | ~$0.005 |
| **Total** | | **~$0.34** |

Use ElevenLabs for premium voiceover (+~$0.06). Use GPT Image 1.5 for cinematic shots (+~$0.10).

---

## Platform Specifications

| Platform | Aspect Ratio | Duration | Resolution | Notes |
|----------|-------------|----------|------------|-------|
| Instagram Reels | 9:16 | 15-30s | 1080x1920 | Captions strongly recommended |
| TikTok | 9:16 | 15-60s | 1080x1920 | Hook in first 2s is critical |
| YouTube Shorts | 9:16 | ≤60s | 1080x1920 | Sound-on audience |
| Facebook Reels | 9:16 | 15-30s | 1080x1920 | Sound-off friendly |
| Instagram Feed | 4:5 | 15-60s | 1080x1350 | More real estate in feed |
| YouTube Pre-roll | 16:9 | 15-30s | 1920x1080 | Skip button at 5s |

---

## Phase 0 — Gather Ad Brief

Ask the user for the following. If not provided, derive from brand context:

```
Product/feature being advertised: ___
Target audience: ___
Primary message or claim: ___
Platform: (Instagram Reels / TikTok / YouTube Shorts / Facebook / YouTube Pre-roll)
Ad duration: (15s / 30s / 60s)
Voiceover quality: (standard/MiniMax or premium/ElevenLabs)
Tone: (energetic / authoritative / friendly / premium / humorous)
```

Confirm the brief before proceeding. A clear brief produces a focused ad.

---

## Phase 1 — Write the Script

Use the **5-beat curiosity-loop framework**:

```
BEAT 1 — HOOK (0-3s):
  Interrupt the scroll with a bold visual + audio hook.
  State a tension, surprising fact, or provocative question.
  Must NOT reveal the answer. Viewers should feel: "wait, what?"

BEAT 2 — PROBLEM (3-8s):
  Agitate the pain point or desire. Make the viewer feel it.
  Use second-person: "You know that feeling when..."

BEAT 3 — SOLUTION REVEAL (8-18s):
  Introduce the product/feature as the resolution.
  Show the transformation: before → after.
  Be specific. Use one concrete benefit, not a list.

BEAT 4 — PROOF (18-25s):
  Social proof, a stat, a result, or a demonstration.
  One sentence. Make it credible and memorable.

BEAT 5 — CTA (25-30s):
  Clear, single action. Use brand.cta_default.
  Urgency or ease: "Takes 30 seconds" / "Free to try".
```

Script rules:
- Write for sound-off viewing: every key point works as a caption
- Every sentence maps to one visual shot
- Avoid superlatives ("best", "amazing") — be specific instead
- Read aloud and time it. Target duration is the platform spec.

---

## Phase 2 — Plan Visual Assets

For each beat, define a shot:

| Shot | Beat | Visual Concept | Camera | Duration |
|------|------|----------------|--------|----------|
| 1 | Hook | [striking visual representing the tension] | push_in | 3s |
| 2 | Problem | [relatable scene of the pain point] | handheld_drift | 5s |
| 3 | Solution | [product/feature in use, satisfying moment] | orbit_right | 7s |
| 4 | Proof | [result visualization or testimonial frame] | static | 5s |
| 5 | CTA | [aspirational outcome, brand identity] | pull_out | 5s |

For each shot, write:
1. **Image prompt** — the static scene before motion
2. **Camera preset** — the Seedance camera motion
3. **Caption text** — the voiceover line for this shot

---

## Phase 3 — Generate Images

Use the image generator service at `services/image/generator.ts`.

For each shot:
```typescript
const image = await generateImage({
  prompt: shotPrompt,
  aspectRatio: platformAspectRatio,
  styleType: tone === 'premium' ? 'Render 3D' : 'Realistic',
  magicPrompt: true,
});
```

Save each image to: `{output.base_dir}/ad-{slug}/images/shot-{n}.jpg`

Image prompt guidelines:
- Use `brand.colors.primary` in lighting: e.g., "soft blue accent rim light"
- Hook shot: high contrast, dramatic. Breaks the visual feed pattern.
- Solution shot: clean, aspirational, uncluttered background
- CTA shot: warm, inviting, confident — brand colors prominent

---

## Phase 4 — Generate Videos

Use Seedance 1.5 Pro via Replicate for each image → animated shot.

**Camera presets reference:**

| Preset | Motion | Best For |
|--------|--------|----------|
| `push_in` | Slow zoom toward subject | Hook, reveals |
| `pull_out` | Slow zoom out | CTA, establishing shots |
| `orbit_right` | Gentle 30° orbit | Product showcase |
| `orbit_left` | Gentle -30° orbit | Secondary product angle |
| `pan_right` | Horizontal pan | Scene transitions |
| `tilt_up` | Upward tilt | Aspirational, growth |
| `handheld_drift` | Subtle handheld shake | Authentic, UGC feel |
| `static` | No camera movement | Proof, text-heavy shots |

Replicate model: `bytedance/seedance-1-5-pro`

```json
{
  "image": "<url_or_base64>",
  "duration": <shot_duration>,
  "resolution": "720p",
  "aspect_ratio": "<platform_ratio>",
  "camera_control": "<preset>"
}
```

Save each to: `{output.base_dir}/ad-{slug}/videos/shot-{n}.mp4`

---

## Phase 5 — Generate Voiceover

**Standard (MiniMax):**
- Model: `speech-2.8-hd`
- Voice: `content.tts.voice_pool[0]`
- Speed: match to ad duration. 1.1x for 30s, 1.0x for 60s.

**Premium (ElevenLabs):**
- Voice ID: `content.tts_premium.voice_id`
- Model: `eleven_turbo_v2_5`
- Stability: 0.5, Style: 0.8
- Choose male or female voice based on ad tone and target audience

Generate full script as one file. Output: `{output.base_dir}/ad-{slug}/voiceover.mp3`

---

## Phase 6 — Generate Background Music

Use Lyria 2 via the music generation service.

Match music mood to ad tone:
- Energetic → `upbeat_electronic` (BPM 120-135)
- Authoritative → `cinematic_build` (BPM 80-100)
- Friendly → `warm_acoustic` (BPM 95-115)
- Premium → `minimal_luxury` (BPM 70-90)
- Humorous → `quirky_playful` (BPM 110-125)

Generate at ad duration + 2s. Apply 0.3s fade-in, 1s fade-out.
Output: `{output.base_dir}/ad-{slug}/music.mp3`

---

## Phase 7 — Generate Subtitles

Run Whisper on the voiceover:
- Model: `whisper-1`
- Format: `verbose_json` with `word` timestamps
- Output: `{output.base_dir}/ad-{slug}/captions.json`

Caption style for ads:
- Group 3-5 words per caption card
- High-contrast: white text, black drop-shadow or dark pill background
- Font: bold sans-serif — prioritize legibility over style
- Position: lower third (avoid covering key visual elements)

---

## Phase 8 — Compose with Remotion

Copy assets to `{output.remotion_public}/ad-{slug}/`.

Write `render-props.json`:
```json
{
  "slug": "<slug>",
  "platform": "<platform>",
  "brand": {
    "name": "<brand.name>",
    "tagline": "<brand.tagline>",
    "colors": { "primary": "<primary>", "background": "<bg>", "text": "<text>" }
  },
  "shots": [
    {
      "index": 0,
      "beat": "hook",
      "caption": "<hook_text>",
      "imagePath": "ad-<slug>/images/shot-1.jpg",
      "videoPath": "ad-<slug>/videos/shot-1.mp4",
      "durationFrames": 90
    }
    // ... all shots
  ],
  "voiceoverPath": "ad-<slug>/voiceover.mp3",
  "musicPath": "ad-<slug>/music.mp3",
  "captionsPath": "ad-<slug>/captions.json",
  "fps": 30
}
```

Render:
```bash
npx remotion render Ad output/ad-<slug>.mp4 \
  --props=public/ad-<slug>/render-props.json \
  --codec=h264 --pixel-format=yuv420p
```

If Remotion is not configured, compose with ffmpeg (concat + audio mix at voice 100% + music 15%).

---

## Phase 9 — Review and Finalize

Watch the output in full before declaring done. Check:

- Hook grabs attention in the first 2 seconds
- The brand/product is identifiable within 5 seconds
- Voiceover and visuals are in sync
- Music does not overpower voice
- CTA is visible and audible at the end
- No Replicate watermarks or artifacts in final output
- Resolution and aspect ratio match the target platform spec

---

## Quality Checklist

- [ ] Ad brief confirmed before scripting
- [ ] Hook creates curiosity without revealing the answer
- [ ] Each beat maps to a distinct visual shot
- [ ] Lip sync / voiceover matches shot timing
- [ ] Captions cover key messages for sound-off viewing
- [ ] Music mood matches ad tone
- [ ] Total duration matches platform spec (±1s)
- [ ] Output is valid MP4 at 720p minimum
- [ ] File named descriptively: `ad-<slug>-<platform>.mp4`
