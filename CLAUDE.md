# Content Factory — Claude Code Plugin

AI-powered content generation toolkit for marketing videos, ads, images, and social media content.

## Quick Start

1. Copy `config/content-factory.example.yaml` to your project root as `content-factory.yaml`
2. Set required environment variables (or point `secrets_file` to your env file):
   - `REPLICATE_API_TOKEN` — Required for all generation (image, video, music, TTS)
   - `OPENAI_API_KEY` — Required for transcription (Whisper)
   - `ELEVEN_LABS_API_KEY` — Optional, for premium TTS in ads
   - `NANO_BANANA_PRO_API_KEY` — Optional, for Gemini image generation
3. Run any `/generate-*` command

## Available Commands

| Command | Output | Approx. Cost |
|---------|--------|--------------|
| `/generate-reel` | 20s voiceover reel (images + video + VO + music) | ~$0.34 |
| `/generate-ugc` | 30s UGC avatar video with lip-sync | ~$1.02 |
| `/generate-ad` | Full video ad for any platform | ~$0.34 |
| `/generate-ugc-ad` | UGC-style ad with AI lip-synced avatar | ~$1.50 |
| `/generate-talking-character` | 30s animated character reel | ~$0.50 |
| `/generate-product-decoded` | 30s product disassembly reveal | ~$0.24 |
| `/generate-infographic` | Static infographic poster | ~$0.20 |
| `/generate-carousel` | 5-7 slide carousel | ~$0.10-1.20 |
| `/generate-screenshot-ad` | Static ad from app screenshots | ~$0.30 |
| `/generate-ideas` | Populate the Ideas Bank | Free |
| `/post-to-social` | Publish to social via Buffer | Free |

## Architecture

```
config/          → Brand identity, preferences, cost guardrails
services/        → API wrappers (Replicate, ElevenLabs, Jamendo, Freesound)
pipelines/       → Multi-step orchestrators (compose services into workflows)
commands/        → User-facing slash commands (gather brief → invoke pipeline)
skills/          → Domain knowledge (script writing, production tips)
agents/          → Autonomous orchestrators (creative director, content planner)
ideas-bank/      → Content ideation system with categories and tracking
remotion/        → Optional video composition sub-package
```

## Services Layer

All services are independently importable:

```typescript
import { generateImage } from '@content-factory/core/services/image/generator';
import { generateVideo } from '@content-factory/core/services/video/generator';
import { generateTTS } from '@content-factory/core/services/audio/tts-minimax';
import { generateMusic } from '@content-factory/core/services/audio/music-lyria';
import { CostTracker } from '@content-factory/core/services/cost-tracker';
```

## Configuration

All commands read from `content-factory.yaml` in the project root. See `config/content-factory.example.yaml` for the full schema.

## Cost Tracking

Every generation pipeline tracks costs per-step. The cost-guard hook warns before expensive operations exceed the configured threshold.

## Ideas Bank

Generic content ideation system. Define your categories in config, populate with `/generate-ideas`, consume with any `/generate-*` command.

```bash
# From project using the plugin
npx content-factory ideas list --summary
npx content-factory ideas list --category tips-and-tricks
npx content-factory ideas mark my-idea-slug --format reel
```
