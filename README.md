# Content Factory

AI-powered content generation toolkit for Claude Code. Generate marketing videos, ads, images, carousels, and social media content at scale — for any brand, any product.

## What is this?

Content Factory is a Claude Code plugin that turns your terminal into a full-service content production studio. It provides 11 slash commands, 4 knowledge skills, 2 autonomous agents, and a complete media services layer powered by state-of-the-art AI models.

## Quick Start

### 1. Install the plugin

```bash
# Clone to your plugins directory
git clone https://github.com/albertnahas/content-factory.git ~/.claude/plugins/repos/content-factory
```

### 2. Configure your brand

Copy the example config to your project root:

```bash
cp ~/.claude/plugins/repos/content-factory/config/content-factory.example.yaml ./content-factory.yaml
```

Edit `content-factory.yaml` with your brand details:

```yaml
brand:
  name: "Your Brand"
  tagline: "Your tagline"
  colors:
    primary: "#3B82F6"
  cta_default: "Learn more"
```

### 3. Set API keys

```bash
export REPLICATE_API_TOKEN="your-token"    # Required — powers image, video, music, TTS
export OPENAI_API_KEY="your-key"           # Required — powers transcription (Whisper)
export ELEVEN_LABS_API_KEY="your-key"      # Optional — premium TTS for ads
```

### 4. Generate content

```
/generate-reel        # Create a 20s voiceover reel
/generate-ad          # Create a full video ad
/generate-infographic # Create a static infographic poster
```

## Commands

| Command | What it generates | Cost |
|---------|-------------------|------|
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
content-factory/
├── services/          # API wrappers (18 files)
│   ├── image/         # Ideogram, GPT Image, FLUX, Bria BG removal
│   ├── video/         # Seedance, p-video, PixVerse lipsync, BG removal
│   ├── audio/         # MiniMax TTS, ElevenLabs, Whisper, Lyria music, Jamendo, Freesound
│   ├── presets/       # Camera movement + music mood presets
│   ├── cost-tracker   # Per-step cost tracking with estimates
│   └── asset-cache    # Duplicate prevention, download management
│
├── pipelines/         # Multi-step orchestrators (10 files)
│   ├── voiceover-reel, ugc-avatar, talking-character
│   ├── product-decoded, video-ad, ugc-ad, screenshot-ad
│   ├── infographic-poster, carousel
│   └── types          # Shared pipeline interfaces
│
├── commands/          # 11 slash commands
├── skills/            # 4 knowledge skills
├── agents/            # 2 autonomous agents
├── ideas-bank/        # Content ideation system
├── remotion/          # Video composition sub-package (5 compositions, 5 components)
└── config/            # YAML-driven configuration
```

## Services Layer

All services are independently importable for programmatic use:

```typescript
import { generateImage } from 'content-factory/services/image/generator';
import { generateVideo } from 'content-factory/services/video/generator';
import { generateTTS } from 'content-factory/services/audio/tts-minimax';
import { generateMusic } from 'content-factory/services/audio/music-lyria';
import { CostTracker } from 'content-factory/services/cost-tracker';
```

### Supported AI Models

| Category | Models | Cost Range |
|----------|--------|------------|
| Image | Ideogram V3 Turbo, GPT Image 1.5 (low/med/high), FLUX Kontext, FLUX Fill | $0.013 - $0.15/img |
| Video | Seedance 1.5 Pro, p-video, PixVerse Lipsync | $0.013 - $0.083/sec |
| TTS | MiniMax Speech 2.8 HD, ElevenLabs | $0.000005/char - $0.30/1k chars |
| Music | Lyria 2 (AI), Jamendo (free CC) | $0.0001/sec - free |
| SFX | Freesound (free CC) | Free |
| Transcription | OpenAI Whisper | ~$0.006/min |
| BG Removal | Bria AI (image), RVM/Bria (video) | $0.001/img - $0.14/sec |

## Ideas Bank

Generic content ideation system. Define your categories in config, populate with `/generate-ideas`, consume with any generation command.

```yaml
# In content-factory.yaml
content:
  categories:
    - slug: "tips-and-tricks"
      label: "Tips & Tricks"
    - slug: "myth-busters"
      label: "Myth Busters"
```

## Remotion Compositions

Optional video rendering sub-package with 5 compositions:

- **VoiceoverReel** — Segment-based reel with voiceover and captions
- **AnimatedInfographic** — Data visualization with stat counters, lists, progress bars
- **UGCReel** — Multi-scene UGC video with avatar and B-roll
- **ProductDecoded** — Product disassembly/assembly with data overlay
- **ProductComparison** — Side-by-side comparison with animated counters

## Skills & Agents

**Skills** (knowledge injected when relevant):
- `gen-ai-media` — Model selection guidance
- `ad-script-writing` — Curiosity-loop framework for ad scripts
- `video-production` — Production tips and best practices
- `content-strategy` — Posting cadence, category psychology

**Agents** (autonomous multi-step orchestrators):
- `creative-director` — Takes a brief, produces complete content
- `content-planner` — Manages Ideas Bank, plans content calendars

## Requirements

- [Claude Code](https://claude.ai/code) CLI
- Node.js >= 20
- ffmpeg (for video post-production)
- API keys: Replicate (required), OpenAI (required), ElevenLabs (optional)

## License

MIT
