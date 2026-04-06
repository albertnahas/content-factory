---
description: Generate a 30s UGC-style avatar video with AI character, dialogue, and lip-sync
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts_premium`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| Character reference image | GPT Image 1.5 High | ~$0.19 |
| 3 scene frames | GPT Image 1.5 Medium | ~$0.15 |
| 3 Seedance lip-sync videos (5s each) | Seedance 1.5 Pro | ~$0.36 |
| Premium voiceover | ElevenLabs | ~$0.06 |
| Whisper transcription | OpenAI Whisper | ~$0.005 |
| **Total** | | **~$1.02** |

---

## Step 1 — Define Avatar Persona

Ask the user (or derive from brand context) the following:

```
Avatar persona:
- Name: (e.g., "Alex", "Sam") — relatable, not a celebrity
- Age range: 25-35 (default)
- Style: casual / professional / creative
- Gender: the user's choice or brand default
- Setting context: home office / kitchen counter / coffee shop / neutral studio
```

The avatar must feel like a real user of the product, not a spokesperson. Authenticity is the goal.

Write a 3-shot dialogue script:
- Shot 1 (8s): Hook — avatar addresses viewer directly, states the problem or insight
- Shot 2 (15s): Value — avatar demonstrates or explains the product benefit naturally
- Shot 3 (7s): CTA — avatar gives a personal recommendation, references `brand.name`

Target 100-130 words total. Conversational, first-person, natural pauses.

---

## Step 2 — Generate Character Reference Image

Choose model based on quality requirement:

### Avatar Model Comparison

| Model | Quality | Cost | Best For |
|-------|---------|------|----------|
| GPT Image 1.5 High | Excellent likeness | ~$0.19/image | Primary reference, hero shots |
| FLUX Kontext (budget) | Good consistency | ~$0.05/image | High-volume, iteration |

Default to GPT Image 1.5 High for the reference image.

Prompt formula for reference image:
```
Portrait photo of {gender} person, age {age_range}, {style_description},
neutral studio background, soft frontal lighting, direct eye contact with camera,
photorealistic, high detail, no text, no logos.
```

Use the image generator service at `services/image/generator.ts` with:
- Model override: `openai/gpt-image-1` (high quality)
- Aspect ratio: `1:1` (square for reference)
- Output: `{output.base_dir}/ugc-{slug}/avatar-reference.jpg`

---

## Step 3 — Generate Scene Frames

For each of the 3 shots, generate a scene image that includes the character in context.

**Scene context system — environment presets:**

| Environment | Visual Description |
|-------------|-------------------|
| `home_office` | Warm desk setup, bookshelf background, natural window light |
| `kitchen_counter` | Clean kitchen surface, marble countertop, soft daylight |
| `coffee_shop` | Blurred café background, warm ambient light |
| `neutral_studio` | Plain light grey background, soft studio light |

**Action presets by shot:**

| Shot | Action | Composition |
|------|--------|-------------|
| Hook | Leaning toward camera, engaged expression | Medium close-up, eye-level |
| Value | Gesturing with hands, explaining | Medium shot, slight angle |
| CTA | Smiling, nodding, relaxed confidence | Medium close-up, direct camera |

Prompt formula for scene frames:
```
{reference_character_description} in {environment_description},
{action_description}, {composition_description},
photorealistic, natural candid feel, 9:16 vertical frame,
no text, no logos.
```

Generate with GPT Image 1.5 Medium. Reference the character description from Step 2 to maintain consistency. Save to `{output.base_dir}/ugc-{slug}/frames/shot-{n}.jpg`.

---

## Step 4 — Generate Premium Voiceover

Use ElevenLabs with settings from `content.tts_premium`:
- Voice ID: `content.tts_premium.voice_id`
- Model: `content.tts_premium.model` (default: `eleven_turbo_v2_5`)
- Stability: 0.4 (allow natural variation)
- Style: 0.7 (conversational expressiveness)
- Speed: 1.0 (natural pace for UGC feel)

Generate one continuous audio file for the full script.
Output: `{output.base_dir}/ugc-{slug}/voiceover.mp3`

Split into 3 segments matching shot boundaries using silence detection:
```bash
ffmpeg -i voiceover.mp3 -af silencedetect=noise=-30dB:d=0.3 -f null - 2>&1
```

Save segments to: `{output.base_dir}/ugc-{slug}/audio/shot-{n}.mp3`

---

## Step 5 — Transcribe Captions

Run Whisper on the full voiceover:
- Model: `whisper-1`
- Response format: `verbose_json` with `word` timestamps
- Output: `{output.base_dir}/ugc-{slug}/captions.json`

---

## Step 6 — Generate Seedance Videos with Native Lip-Sync

Use Seedance 1.5 Pro for each shot. To trigger lip movements, include the character's dialogue in the prompt — Seedance's native audio-visual model will animate accordingly.

For each shot:
```json
{
  "image": "<scene_frame_base64_or_url>",
  "prompt": "Person talking naturally. They say: '{shot_dialogue}'. Natural head movement, eye blinks, lip sync.",
  "audio": "<shot_audio_url>",
  "duration": <shot_duration>,
  "resolution": "720p",
  "aspect_ratio": "9:16"
}
```

The `audio` field drives the lip-sync animation. The `prompt` description reinforces the dialogue for natural mouth movement.

Save each video to: `{output.base_dir}/ugc-{slug}/videos/shot-{n}.mp4`

---

## Step 7 — Compose Final Video

Concatenate the 3 shot videos:
```bash
# Create concat list
echo "file 'shot-1.mp4'" > concat.txt
echo "file 'shot-2.mp4'" >> concat.txt
echo "file 'shot-3.mp4'" >> concat.txt

ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -c:a aac -pix_fmt yuv420p ugc-raw.mp4
```

Mix audio — voiceover is primary, add subtle background music at 8%:
```bash
ffmpeg -i ugc-raw.mp4 -i voiceover.mp3 \
  -filter_complex "[1:a]volume=1.0[v];[v]" \
  -map 0:v -map "[v]" -c:v copy -c:a aac \
  output/ugc-{slug}.mp4
```

Note: No background music for UGC style — it breaks the authentic feel. The voiceover is the only audio.

---

## Composition with Remotion (Optional)

If the project has Remotion configured, write render-props.json:
```json
{
  "slug": "<slug>",
  "brand": { "name": "<brand.name>", "colors": {} },
  "shots": [
    { "index": 0, "videoPath": "ugc-<slug>/videos/shot-1.mp4", "durationFrames": 240 },
    { "index": 1, "videoPath": "ugc-<slug>/videos/shot-2.mp4", "durationFrames": 450 },
    { "index": 2, "videoPath": "ugc-<slug>/videos/shot-3.mp4", "durationFrames": 210 }
  ],
  "voiceoverPath": "ugc-<slug>/voiceover.mp3",
  "captionsPath": "ugc-<slug>/captions.json",
  "fps": 30
}
```

---

## Quality Checklist

Before declaring the UGC video complete, verify:

- [ ] Avatar looks like a real person, not AI-generated (natural skin, lighting)
- [ ] Character is visually consistent across all 3 shots
- [ ] Lip movements match the spoken words in each shot
- [ ] Audio is clear, natural pace, no robotic artifacts
- [ ] Hook directly addresses a relatable problem or desire
- [ ] CTA mentions `brand.name` naturally without sounding scripted
- [ ] Total duration is 25-35 seconds
- [ ] No text overlays that distract from the authentic feel
- [ ] Output is valid MP4 at 720p minimum
