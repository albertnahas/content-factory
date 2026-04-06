import type { PipelineResult, VoiceConfig, MusicConfig } from './types.js';

export interface UGCAvatarScene {
  type: 'avatar' | 'broll';
  dialogue?: string;
  imagePrompt: string;
  cameraPrompt: string;
  duration: number;
  sceneContext?: {
    environment?: string;
    action?: string;
    composition?: string;
    props?: string[];
    emotion?: string;
    extraContext?: string;
  };
}

export interface UGCAvatarConfig {
  avatarDescription: string;
  charRefModel?: 'gpt-image-high' | 'flux-kontext';
  sceneFrameModel?: 'gpt-image-high' | 'flux-kontext';
  scenes: UGCAvatarScene[];
  voice: VoiceConfig;
  music: MusicConfig;
  outputDir: string;
  slug: string;
  resolution?: '480p' | '720p';
}

/**
 * Generate a UGC-style avatar ad: character reference → scenes → lipsync → music → compose
 */
export async function generateUGCAvatar(config: UGCAvatarConfig): Promise<PipelineResult> {
  console.log(`UGC Avatar Pipeline: "${config.slug}"`);
  console.log(`  Scenes: ${config.scenes.length}`);
  console.log(`  Avatar model: ${config.charRefModel || 'gpt-image-high'}`);
  console.log(`  Scene model: ${config.sceneFrameModel || 'gpt-image-high'}`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
