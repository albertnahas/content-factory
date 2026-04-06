---
name: gen-ai-media
description: AI model selection guidance for media generation — which image, video, TTS, and music model to use for each use case. Triggers on "which model", "best model for", "image generation model", "video model", "TTS provider", or cost optimization questions.
---

# AI Media Model Selection Guide

## Image Generation Models

| Model | Via | Cost | Best For | Quality |
|-------|-----|------|----------|---------|
| Ideogram V3 Turbo | Replicate | $0.02/img | General-purpose, stylized images | High, stylized |
| GPT Image 1.5 Low | Replicate | $0.013/img | Product cutouts, simple items | Good, photorealistic |
| GPT Image 1.5 Medium | Replicate | $0.05/img | Compositions, character designs | Very good |
| GPT Image 1.5 High | Replicate | $0.14/img | Hero images, avatar frames | Best, full fidelity |
| FLUX.1 Kontext Pro | Replicate | $0.04/img | Budget avatar frames with reference | Good, fast |
| FLUX.1 Fill Pro | Replicate | $0.05/img | Outpainting / background extension | Seamless extension |
| Nano Banana (Gemini 2.5 Flash) | Google AI | $0.15/img | Alternative composition | Good |
| Bria BG Removal | Replicate | $0.001/img | Background removal | Clean edges |

### Decision Tree
- **Need stylized/artistic?** → Ideogram V3 Turbo ($0.02)
- **Need photorealistic product?** → GPT Image 1.5 (Low for cutouts, Medium for compositions)
- **Need character with expressions?** → GPT Image 1.5 High ($0.14) or FLUX Kontext ($0.04 budget)
- **Need to extend background?** → FLUX.1 Fill Pro ($0.05)
- **Need transparent cutout?** → Generate + Bria BG Removal ($0.001)

## Video Generation Models

| Model | Via | Cost | Best For |
|-------|-----|------|----------|
| Seedance 1.5 Pro 480p | Replicate | $0.013/sec (no audio), $0.025/sec (with audio) | Cost-efficient reels |
| Seedance 1.5 Pro 720p | Replicate | $0.026/sec (no audio), $0.052/sec (with audio) | Higher quality |
| Seedance 1 Lite 480p | Replicate | $0.018/sec | Legacy, avoid |
| prunaai/p-video | Replicate | ~$0.07/shot | Audio-driven animation (talking characters) |
| PixVerse Lipsync | Replicate | $0.08325/sec | Post-production lip-sync |

### Decision Tree
- **Image-to-video (standard)?** → Seedance Pro 480p without audio ($0.013/sec)
- **Need native lip movements?** → Seedance Pro with audio ($0.025/sec)
- **Need audio-driven character animation?** → p-video (~$0.07/shot)
- **Need to add lip-sync to existing video?** → PixVerse Lipsync ($0.083/sec)

## TTS Models

| Provider | Model | Cost | Best For |
|----------|-------|------|----------|
| MiniMax | Speech 2.8 HD | ~$0.000005/char | Budget voiceovers, marketing content |
| ElevenLabs | Turbo v2.5 / Multilingual v2 | ~$0.30/1000 chars | Premium ads, character voices |

### Decision Tree
- **Marketing reels/content?** → MiniMax (99% cheaper)
- **Paid ads requiring premium quality?** → ElevenLabs
- **Character voices with high expressiveness?** → ElevenLabs (low stability, high style)

## Music Models

| Service | Cost | Best For |
|---------|------|----------|
| Lyria 2 (Google) | $0.0001/sec | AI-generated custom music |
| Jamendo | Free (CC) | Pre-made royalty-free tracks |

## Background Removal (Video)

| Model | Cost | Output |
|-------|------|--------|
| Robust Video Matting | $0.046/run (flat) | Alpha mask → ffmpeg merge |
| Bria Video | $0.14/sec | Native transparent WebM |

- **Default to RVM** (30x cheaper). Use Bria only for hero content.
