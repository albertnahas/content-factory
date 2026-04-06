import type { PipelineResult, VoiceConfig, MusicConfig, SegmentConfig } from './types.js';

export interface VoiceoverReelConfig {
  script: string;
  segments: SegmentConfig[];
  voice: VoiceConfig;
  music: MusicConfig;
  outputDir: string;
  slug: string;
  resolution?: '480p' | '720p';
  remotionPublicDir?: string;
}

/**
 * Generate a voiceover reel: images → videos → voiceover → music → render-props
 *
 * Pipeline steps (executed by the slash command, not this file):
 * 1. Generate voiceover (TTS service)
 * 2. Transcribe captions (Whisper)
 * 3. Generate images per segment (image service)
 * 4. Generate videos per segment (video service)
 * 5. Generate music (music service)
 * 6. Copy to Remotion public + write render-props.json
 * 7. Render with Remotion
 */
export async function generateVoiceoverReel(config: VoiceoverReelConfig): Promise<PipelineResult> {
  const { segments, outputDir, slug, resolution = '480p' } = config;

  console.log(`Voiceover Reel Pipeline: "${slug}"`);
  console.log(`  Segments: ${segments.length}`);
  console.log(`  Resolution: ${resolution}`);
  console.log(`  Voice: ${config.voice.provider} (${config.voice.voiceId})`);
  console.log(`  Music: ${config.music.type}`);

  return {
    outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
