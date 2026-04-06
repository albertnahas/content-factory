import type { PipelineResult } from './types.js';

export interface TalkingCharacterShot {
  expression: string;
  background: string;
  emotionColor: string;
  scriptSegment: string;
}

export interface TalkingCharacterConfig {
  characterDescription: string;
  characterStyle: string;
  shots: TalkingCharacterShot[];
  voice: {
    provider: 'elevenlabs';
    voiceId: string;
    model?: string;
    stability?: number;
    style?: number;
  };
  music: {
    type: 'jamendo';
    tags: string[];
  };
  sfx: {
    whooshId?: string;
    volume?: number;
  };
  outputDir: string;
  slug: string;
  targetDuration?: number;
}

/**
 * Generate a talking character reel: character images → audio-driven animation → sfx → music → compose
 *
 * Pipeline steps:
 * 1. Generate per-shot character images (GPT Image)
 * 2. Generate full voiceover (ElevenLabs)
 * 3. Animate shots with audio (p-video)
 * 4. Download Jamendo music track
 * 5. Compose with ffmpeg: concat → speed → captions → music → sfx
 */
export async function generateTalkingCharacter(
  config: TalkingCharacterConfig
): Promise<PipelineResult> {
  console.log(`Talking Character Pipeline: "${config.slug}"`);
  console.log(`  Shots: ${config.shots.length}`);
  console.log(`  Voice: ElevenLabs (${config.voice.voiceId})`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
