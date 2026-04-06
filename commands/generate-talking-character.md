---
description: Generate a 30s animated 3D/Pixar-style character reel with a 4-shot emotional arc, audio-driven animation, captions, and music
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `brand.colors`, `brand.cta_default`, `content.tts_premium`, and `output` paths.

## Cost Estimate

| Asset | Model | Unit Cost |
|-------|-------|-----------|
| 4 character images | GPT Image 1.5 Medium | ~$0.20 |
| ElevenLabs voiceover | eleven_turbo_v2_5 | ~$0.08 |
| Whisper transcription | OpenAI Whisper | ~$0.006 |
| 4 animated shots | prunaai/p-video | ~$0.20 |
| Background music | Jamendo (free, CC) | $0.00 |
| SFX | Freesound (free) | $0.00 |
| **Total** | | **~$0.50** |

---

## Step 1 — Define the Character

The character is a product, object, or concept personified as a 3D Pixar-style animated figure. It has personality, emotions, and talks directly to the viewer.

Ask the user:
```
What is the character? (e.g., a product category, a food item, an abstract concept)
What is the central message or claim?
What emotion should the audience feel? (amused, warned, inspired, called out)
```

Examples of strong character concepts:
- A product "bragging" about its hidden advantage
- An ingredient "warning" viewers about a common mistake
- A tool "confronting" users about their inefficiency
- A feature "celebrating" users who discovered it

The character's 3D style: "Pixar-style 3D character, expressive face, big eyes, smooth plastic texture, studio lighting, white background."

---

## Step 2 — Write the 4-Shot Script with Emotional Arc

Each shot has a distinct emotion. The character's personality escalates across the arc:

### Emotional Arc Presets

**Arc: Angry → Proud → Shocked → Smug**
Best for: confrontational call-outs, myth-busters, "you're doing it wrong" hooks

**Arc: Excited → Confident → Warning → Triumphant**
Best for: product reveals, feature announcements, positive benefits

**Arc: Curious → Revealing → Urgent → Inviting**
Best for: educational content, tips, how-to formats

**Arc: Playful → Bragging → Serious → Playful**
Best for: lighter content, brand personality, entertainment-first

Default arc (most engaging on social): **Angry → Proud → Shocked → Smug**

### Shot Scripts

For each shot, write:
- 1-3 sentences of energetic, punchy dialogue
- The specific emotion label
- A visual expression note

```
SHOT 1 — HOOK (emotion: ANGRY/RED):
  Character confronts the viewer directly. States the problem or misconception.
  Example: "You think [common belief]? WRONG. You've been lied to."
  Expression: furrowed brows, leaning forward, pointing at camera

SHOT 2 — FLEX (emotion: PROUD/GOLD):
  Character celebrates a truth, advantage, or fact about the product/topic.
  Example: "[Product/topic] has [surprising benefit]. Always has. Always will."
  Expression: chest out, arms crossed, confident smirk

SHOT 3 — WARNING (emotion: SHOCKED/RED):
  Character reveals a consequence or surprising data point. Creates stakes.
  Example: "And yet, [stat or consequence]. Do you see the problem?"
  Expression: wide eyes, jaw dropped, gasping

SHOT 4 — CTA (emotion: SMUG/GREEN):
  Character delivers the verdict and calls the viewer to act.
  Formula: "Fix it. [brand.cta_default]. [brand.name]."
  Expression: knowing smile, relaxed, one eyebrow raised
```

Pacing rule: Total script = 60-80 words. Read at high energy = ~20-25s.

---

## Step 3 — Generate 4 Character Images

Use GPT Image 1.5 Medium via Replicate. Each shot needs a distinct expression matching its emotion.

**Expression presets:**

| Emotion | Expression Tags |
|---------|----------------|
| ANGRY/confrontational | furrowed brows, pointing finger, leaning forward, intense stare |
| PROUD/confident | chest out, arms crossed, slight smirk, chin up |
| SHOCKED/warning | wide eyes, open mouth, hands raised, surprised expression |
| SMUG/satisfied | slight smile, relaxed pose, knowing expression, tilted head |

**Color accent presets (tint the background/glow for emotion):**

| Emotion | Color | Hex |
|---------|-------|-----|
| ANGRY | Red glow | #FF3B30 |
| PROUD | Gold glow | #FFD700 |
| SHOCKED | Red/orange | #FF6B35 |
| SMUG | Green glow | #34C759 |

Image prompt formula:
```
Pixar-style 3D animated {character_type} character, {expression_tags},
{color_accent} background glow, studio lighting, centered composition,
white studio background, 2:3 aspect ratio, ultra detailed, cinematic quality.
No text. No logos.
```

Use `services/image/generator.ts` with `model: 'openai/gpt-image-1'` (medium quality).
Save to: `{output.base_dir}/talking-{slug}/images/shot-{n}.png`

---

## Step 4 — Generate Voiceover

Use ElevenLabs with high expressiveness settings:

- Voice ID: `content.tts_premium.voice_id` (pick male/female based on character personality)
- Model: `eleven_turbo_v2_5`
- Stability: 0.25 (maximum expressiveness — this is a character, not a narrator)
- Style: 1.0 (full character style)
- Speed: 1.0

**Voice selection guidance:**
- Angry/authoritative character → deeper, lower voice
- Playful/excited character → brighter, higher energy voice
- Match voice gender to character design

Generate the full 4-shot script as one continuous audio file.
Output: `{output.base_dir}/talking-{slug}/voiceover-full.mp3`

---

## Step 5 — Split Audio into 4 Segments

Use silence detection to find natural breaks between shots:
```bash
ffmpeg -i voiceover-full.mp3 -af silencedetect=noise=-30dB:d=0.2 -f null - 2>&1 | grep silence
```

Split at detected silence points:
```bash
ffmpeg -i voiceover-full.mp3 -ss 0.0 -t {t1} -c copy shot-1.mp3
ffmpeg -i voiceover-full.mp3 -ss {t1} -t {t2} -c copy shot-2.mp3
ffmpeg -i voiceover-full.mp3 -ss {t2} -t {t3} -c copy shot-3.mp3
ffmpeg -i voiceover-full.mp3 -ss {t3} -c copy shot-4.mp3
```

Verify each segment plays correctly and covers the intended dialogue.
Save to: `{output.base_dir}/talking-{slug}/audio/shot-{n}.mp3`

---

## Step 6 — Transcribe with Whisper

Run Whisper on the full voiceover for word-level timestamps:
```
Model: whisper-1
Format: verbose_json
Timestamp granularity: word
```

Output: `{output.base_dir}/talking-{slug}/captions.json`

The word timestamps are used to generate ASS captions synced precisely to the animation.

---

## Step 7 — Resize Images to 720x1280

The p-video model requires 720p 9:16 input. Resize all 4 character images:
```bash
ffmpeg -i shot-{n}.png -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" shot-{n}-720p.png
```

Save to: `{output.base_dir}/talking-{slug}/images-720p/shot-{n}.png`

---

## Step 8 — Generate 4 Audio-Driven Animated Shots

Use prunaai/p-video to animate each character image driven by the corresponding audio segment.

Replicate model: `prunaai/p-video`

```json
{
  "image": "<shot_n_720p_image_url>",
  "audio": "<shot_n_audio_url>",
  "resolution": "720p",
  "aspect_ratio": "9:16",
  "save_audio": true
}
```

The `save_audio: true` flag embeds the audio in the output — this is important for the final composition step.

Each animated shot will be driven by the character's voice:
- Lips sync to speech
- Head bobs with audio energy
- Eyes blink naturally

Save each to: `{output.base_dir}/talking-{slug}/videos/shot-{n}.mp4`

Review each shot for lip-sync quality before proceeding.

---

## Step 9 — Concatenate and Speed Adjust

Concatenate the 4 animated shots:
```bash
# Write concat list
for i in 1 2 3 4; do echo "file 'shot-$i.mp4'"; done > concat.txt

# Concatenate (copy streams — audio is already embedded)
ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -c:a aac -pix_fmt yuv420p concatenated.mp4
```

Review total duration. If longer than 30s, apply 1.15x speed-up:
```bash
ffmpeg -i concatenated.mp4 \
  -filter:v "setpts=0.870*PTS" \
  -filter:a "atempo=1.15" \
  -c:v libx264 -c:a aac sped-up.mp4
```

Note the speedup factor — it is needed to scale caption timestamps in Step 10.

---

## Step 10 — Generate ASS Captions

Convert Whisper word timestamps to ASS subtitle format. If a speedup was applied, divide all timestamps by the speedup factor.

ASS style block:
```
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginV
Style: Default,Arial Black,48,&H00FFFFFF,&H00000000,-1,0,1,2,2,2,60
```

Caption grouping: 3-4 words per caption card. Position at lower third (alignment=2, MarginV=60).

Write to: `{output.base_dir}/talking-{slug}/captions.ass`

---

## Step 11 — Download Music and SFX

**Background music (Jamendo — free, CC-licensed):**

Search for an energetic/punchy instrumental track:
```bash
curl "https://api.jamendo.com/v3.0/tracks/?client_id={JAMENDO_CLIENT_ID}&fuzzytags=trap+beat&speed=high&vocalinstrumental=instrumental&durationbetween=30_90&format=json&limit=5&order=popularity_total&audioformat=mp32"
```

Download and trim to reel length with ffmpeg fade:
```bash
ffmpeg -i track.mp3 -t {total_duration} -af "afade=t=in:st=0:d=0.5,afade=t=out:st={total_duration-1.5}:d=1.5" music.mp3
```

Get JAMENDO_CLIENT_ID from `secrets_file` or environment.

**Transition SFX (Freesound — free):**

Search for a short whoosh or swoosh sound for shot boundaries:
```bash
curl -s -G "https://freesound.org/apiv2/search/text/" \
  --data-urlencode "query=whoosh swipe transition" \
  --data-urlencode "token=${FREESOUND_API_KEY}" \
  --data-urlencode "duration_max=1" \
  --data-urlencode "fields=id,name,previews"
```

Download the preview (no auth required):
```bash
curl -L -o whoosh.mp3 "https://cdn.freesound.org/previews/..."
```

Get FREESOUND_API_KEY from `secrets_file` or environment.

---

## Step 12 — Final Composition

Compose the final video with voice + captions + music + SFX:

```bash
# Place SFX at each shot boundary
# Shot boundaries (approximate): t1, t2, t3 seconds

ffmpeg -i sped-up.mp4 -i music.mp3 \
  -i whoosh.mp3 -i whoosh.mp3 -i whoosh.mp3 \
  -filter_complex "
    [0:a]volume=1.0[voice];
    [1:a]volume=0.12[music];
    [2:a]adelay={t1*1000}|{t1*1000},volume=0.5[sfx1];
    [3:a]adelay={t2*1000}|{t2*1000},volume=0.5[sfx2];
    [4:a]adelay={t3*1000}|{t3*1000},volume=0.5[sfx3];
    [voice][music][sfx1][sfx2][sfx3]amix=inputs=5:duration=first:normalize=0[a]
  " \
  -map 0:v -map "[a]" \
  -vf "subtitles=captions.ass" \
  -c:v libx264 -c:a aac -pix_fmt yuv420p \
  output/talking-{slug}.mp4
```

Music volume: 12%. SFX volume: 50%. Voice: 100%. `normalize=0` prevents the mixer from reducing voice volume.

---

## Quality Checklist

- [ ] Character is visually distinct and expressive across all 4 shots
- [ ] Emotional arc escalates clearly: each shot feels different
- [ ] Lip movements match spoken words in all shots
- [ ] Hook (Shot 1) is aggressive/compelling — grabs attention in 2s
- [ ] CTA (Shot 4) includes `brand.name` and a clear action
- [ ] Captions are accurate and timed to the speedup factor
- [ ] Music is at 12% — clearly audible but does not overpower voice
- [ ] SFX lands at shot boundaries (not frames before/after)
- [ ] Total duration is 25-32 seconds
- [ ] Output is valid MP4, 720p, 9:16
