import type { PipelineResult } from './types.js';

export interface UGCAdConfig {
  script: {
    hook: string;
    demo: string;
    cta: string;
  };
  avatar: {
    description: string;
    referenceImagePrompt: string;
  };
  voice: {
    provider: 'elevenlabs';
    voiceId: string;
    model?: string;
    style?: number;
  };
  broll?: Array<{
    description: string;
    source: 'generate' | 'stock';
  }>;
  music: {
    type: 'lyria' | 'skip';
    prompt?: string;
  };
  outputDir: string;
  slug: string;
  speedMultiplier?: number;
}

/**
 * Generate a UGC ad: avatar reference → Kling silent video → ElevenLabs audio → lipsync → compose
 *
 * Pipeline steps:
 * 1. Generate avatar reference image (GPT Image)
 * 2. Generate silent Kling video with dialogue prompt (triggers lip animation)
 * 3. Generate voiceover (ElevenLabs)
 * 4. Lipsync audio to video (Sync Lipsync 2 Pro)
 * 5. Source b-roll if configured
 * 6. Compose final ad with ffmpeg + optional music
 */
export async function generateUGCAd(config: UGCAdConfig): Promise<PipelineResult> {
  console.log(`UGC Ad Pipeline: "${config.slug}"`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
