---
name: video-production
description: Video production best practices and learnings for AI-generated content. Triggers on "video quality", "production tips", "Seedance tips", "Kling tips", "lip-sync", "ffmpeg composition", or video generation troubleshooting.
---

# Video Production Best Practices

## AI Video Generation

### Seedance (Image-to-Video)
- Use **Pro 480p without audio** for cost efficiency (best price/quality ratio)
- Camera presets are in `services/presets/camera.ts` — use them instead of writing custom prompts
- For loops: use `lastFrameImage` parameter (Pro only) with the same image as start
- Duration sweet spot: 5 seconds (longer = more cost, diminishing returns)

### Kling V2.6 (UGC Ads)
- Silent mode (`generate_audio: false`) DOES produce lip movements when prompt includes dialogue
- Always include "She says: ..." or "He says: ..." in the prompt
- Keep prompts natural and simple — over-describing produces fake results
- Always review silent video before spending on lip-sync

### p-video (Audio-Driven Animation)
- Best for character animation (talking food, objects, mascots)
- Resize input images to exactly 720x1280 for 9:16
- Takes 2-5 minutes per shot

### PixVerse Lipsync
- Best results of any lip-sync model
- Preserves resolution, FPS, and audio quality
- Do NOT use Sync Lipsync 2 Pro or LatentSync

## Post-Production with ffmpeg

### Speed Adjustment
- When creating 1.2x speed versions, voiceover MUST also be sped up (`atempo=1.2`)
- Background music stays at normal speed
- Captions timestamps must be divided by speed factor

### Audio Mixing Levels
- Voiceover: 100% (primary)
- Background music: 12-15% (subtle bed)
- SFX (whoosh, impacts): 40-50% (noticeable but not overpowering)
- Always use `normalize=0` in final mix to prevent clipping

### ASS Captions
- Generate from Whisper word-level timestamps
- Scale timestamps by speedup factor when video is sped up
- Bold white text with black outline for readability

## Expression Guidelines
- Expression = Enthusiasm, NOT Aggressiveness
- AI avatars must appear friendly, warm, enthusiastic
- "Excited friend sharing a discovery" > "angry person lecturing"
- Avoid angry, frustrated, or confrontational expressions

## Video Reversal Technique
- Generate 10s of AI video → get 20s of content via reversal
- Use ffmpeg: `ffmpeg -i input.mp4 -vf reverse -af areverse reversed.mp4`
- Great for disassembly/assembly, transformation, or before/after content
