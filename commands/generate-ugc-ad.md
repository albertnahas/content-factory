---
description: Generate a UGC-style video ad with an AI avatar, premium lip-synced voiceover, and B-roll composition
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts_premium`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| Avatar reference image | GPT Image 1.5 High | ~$0.19 |
| Silent avatar video | Kling V2.6 | ~$0.50 |
| Premium voiceover | ElevenLabs | ~$0.08 |
| Lip-sync | PixVerse via Replicate | ~$0.50 |
| 2 B-roll images | Ideogram V3 Turbo | ~$0.02 |
| 2 B-roll videos | Seedance 1.5 Pro | ~$0.10 |
| Background music | Lyria 2 | ~$0.02 |
| Whisper transcription | OpenAI Whisper | ~$0.005 |
| **Total** | | **~$1.50** |

---

## Step 1 — Write UGC Ad Script (3-Shot Structure)

UGC ad scripts follow a direct, testimonial-style structure. Write in first person, conversational tone:

```
SHOT 1 — HOOK (0-5s):
  Avatar speaks directly to camera. Creates immediate tension or curiosity.
  Formula: "I never knew [surprising thing] until [product] changed that."
  OR: "If you're doing [common thing], you're [missing out / doing it wrong]."
  Do NOT use brand slogans. Sound like a real person.

SHOT 2 — DEMO (5-14s):
  Avatar explains or shows the product benefit. Specific, personal.
  Cut to B-roll during "show" moments. B-roll shows the product/feature in action.
  One concrete transformation: "I used to X, now I Y."
  End on an authentic emotional beat (surprise, relief, excitement).

SHOT 3 — CTA (14-19s):
  Avatar gives a peer recommendation.
  Formula: "Honestly, just try [brand.name] — [brand.cta_default]."
  Feel: friend giving advice, not a spokesperson reading a script.
```

Target: 80-100 words total for a ~18-19s read at natural pace.

Write the full dialogue for each shot, marked clearly:
```
[SHOT 1]: "..."
[SHOT 2]: "..."  
[SHOT 3]: "..."
```

---

## Step 2 — Generate Avatar Reference Image

Create a character reference using GPT Image 1.5 High:

```typescript
const reference = await generateImage({
  prompt: `
    Portrait photo of {gender} person, age {age_range}, 
    {style}: {clothing_description},
    plain light background, soft natural lighting, 
    direct eye contact, genuine smile, 
    photorealistic, high detail, no text, no logos
  `,
  aspectRatio: '1:1',
  model: 'openai/gpt-image-1', // high quality
});
```

Avatar persona rules:
- Relatable, everyday person — not a model or celebrity archetype
- Clothing matches the brand's target audience lifestyle
- Expression is warm and approachable, not performative
- No props or products in the reference (those go in scene frames)

Save to: `{output.base_dir}/ugc-ad-{slug}/avatar-reference.jpg`

---

## Step 3 — Generate Silent Avatar Video with Kling V2.6

Use Kling V2.6 in silent mode (`generate_audio: false`). Despite no audio, including dialogue in the prompt DOES produce lip movements — this is intentional and costs 50% less than audio mode.

**Critical rule**: Include "They say: ..." in the Kling prompt to trigger lip animation.

Kling model: `kwaivgi/kling-v2-6` via Replicate

```json
{
  "image": "<avatar_reference_url>",
  "prompt": "Person speaking directly to camera, natural and confident. They say: '{full_script}'. Slight head nods, natural eye blinks, authentic UGC style. No background music. Clean recording environment.",
  "duration": 19,
  "aspect_ratio": "9:16",
  "generate_audio": false,
  "negative_prompt": "stiff, robotic, exaggerated expressions, green screen artifacts"
}
```

Save to: `{output.base_dir}/ugc-ad-{slug}/avatar-silent.mp4`

**CRITICAL**: Review the Kling output before proceeding to lip-sync. Confirm:
- Face is clearly visible and stable throughout
- Lips are moving (check during dialogue segments)
- No major artifacts or distortions
- The video is usable as a lip-sync base

If the output is poor quality, regenerate with a different seed before investing in lip-sync.

---

## Step 4 — Generate Premium Voiceover

Use ElevenLabs with `content.tts_premium` config:

Settings:
- Voice ID: `content.tts_premium.voice_id`
- Model: `eleven_turbo_v2_5`
- Stability: 0.35 (more expressive variation)
- Style: 0.8 (strong personal style)
- Speed: 1.0 (natural UGC pace — do not speed up)

Generate the full 3-shot script as one continuous audio file.
Output: `{output.base_dir}/ugc-ad-{slug}/voiceover.mp3`

Verify timing: voiceover duration should match Kling video duration (±0.5s). If the voiceover runs longer, re-record at slightly faster pace. If shorter, add 0.5s silence at the end.

---

## Step 5 — Apply Lip-Sync

Use PixVerse via Replicate to remap the Kling video's mouth movements to the ElevenLabs audio.

Model: `pixverse/pixverse-v4-5-lipsync` (or latest PixVerse lipsync model)

```json
{
  "video": "<avatar_silent_video_url>",
  "audio": "<voiceover_url>",
  "enhance_face": true,
  "smooth": true
}
```

Save result to: `{output.base_dir}/ugc-ad-{slug}/avatar-lipsynced.mp4`

Review the lip-synced output:
- Lip movements should match the spoken words
- Face should look natural, not rubbery
- Sync delay should be under 1 frame (33ms)

---

## Step 6 — Generate B-Roll Assets

B-roll plays during Shot 2 (the demo/explanation section) to visually reinforce the spoken claim.

Generate 2 B-roll images that show the product/feature in context:

Image 1: The "before" state (the problem, unoptimized situation)
Image 2: The "after" state (the product in use, the positive outcome)

Use the image generator at `services/image/generator.ts`:
```typescript
const broll = await generateImage({
  prompt: `{product/feature} {in use / result}, clean and aspirational,
           {brand.colors.primary} accent, realistic lighting, 
           no text, no logos, 9:16 aspect`,
  aspectRatio: '9:16',
  styleType: 'Realistic',
});
```

Animate each B-roll with Seedance 1.5 Pro:
- Before: `pull_out` camera (revealing the problem)
- After: `push_in` camera (moving closer to the solution)
- Duration: 4-5s each

Save to: `{output.base_dir}/ugc-ad-{slug}/broll/broll-{n}.mp4`

---

## Step 7 — Compose Final Ad

**Edit structure:**
```
0:00 - 0:05  → avatar-lipsynced.mp4 (Shot 1: Hook)
0:05 - 0:09  → broll-1.mp4 (B-roll: before state)
0:09 - 0:14  → broll-2.mp4 (B-roll: after state / product in use)
0:14 - 0:19  → avatar-lipsynced.mp4 (Shot 3: CTA, trimmed from 0:14)
```

Cut the avatar video into Shot 1 (0-5s) and Shot 3 (14-19s):
```bash
ffmpeg -i avatar-lipsynced.mp4 -ss 0 -t 5 -c copy avatar-shot1.mp4
ffmpeg -i avatar-lipsynced.mp4 -ss 14 -t 5 -c copy avatar-shot3.mp4
```

Generate background music (Lyria 2):
- Mood: `authentic_upbeat` — light, friendly, not distracting
- Duration: 21s with fade
- Volume: 8% (very subtle — this is a talking-head format)

Compose final video:
```bash
# Build concat list
echo "file 'avatar-shot1.mp4'" > concat.txt
echo "file 'broll-1.mp4'" >> concat.txt
echo "file 'broll-2.mp4'" >> concat.txt
echo "file 'avatar-shot3.mp4'" >> concat.txt

# Concatenate
ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -c:a aac raw-edit.mp4

# Mix voiceover + subtle music
ffmpeg -i raw-edit.mp4 -i voiceover.mp3 -i music.mp3 \
  -filter_complex \
  "[1:a]volume=1.0[v];[2:a]volume=0.08[m];[v][m]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac \
  output/ugc-ad-{slug}.mp4
```

Optional: Apply 1.2x speed to the final video if the pace feels slow:
```bash
ffmpeg -i composed.mp4 -filter:v "setpts=0.833*PTS" -filter:a "atempo=1.2" sped-up.mp4
```
Only apply speed-up if the original duration exceeds 20s.

---

## Quality Checklist

- [ ] Kling video reviewed BEFORE lip-sync processing (do not skip)
- [ ] Lip-sync is tight — mouth movements match audio within 1 frame
- [ ] Avatar looks like a credible real person, not AI-generated
- [ ] Voiceover sounds natural and conversational, not read
- [ ] B-roll clearly shows the product/feature benefit
- [ ] Hook is compelling in the first 2 seconds
- [ ] CTA mentions `brand.name` naturally
- [ ] Music is subtle (8%) and does not compete with voice
- [ ] Total duration is 18-22 seconds
- [ ] Output is valid MP4 at 720p minimum
- [ ] File: `output/ugc-ad-{slug}.mp4`
