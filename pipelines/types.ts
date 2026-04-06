export interface PipelineResult {
  outputDir: string;
  assets: string[];
  cost: number;
  costBreakdown: Record<string, number>;
  duration?: number;
}

export interface VoiceConfig {
  provider: 'minimax' | 'elevenlabs';
  voiceId: string;
  speed?: number;
  emotion?: string;
  stability?: number;
  style?: number;
}

export interface MusicConfig {
  type: 'lyria' | 'jamendo' | 'skip';
  prompt?: string;
  preset?: string;
  tags?: string[];
  volume?: number;
}

export interface SegmentConfig {
  imagePrompt: string;
  cameraPreset?: string;
  cameraPrompt?: string;
  duration?: number;
  script?: string;
}
