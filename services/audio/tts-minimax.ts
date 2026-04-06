/**
 * MiniMax TTS Service
 *
 * Text-to-speech generation using MiniMax Speech 2.8 HD via Replicate.
 * Cost-effective choice for marketing content and voiceovers.
 *
 * @example
 * ```typescript
 * import { generateTTS } from './tts-minimax.js';
 *
 * const audioUrl = await generateTTS({
 *   text: 'Your script here',
 *   voice_id: 'Friendly_Person',
 *   speed: 1.3,
 * });
 * ```
 */

import Replicate from 'replicate';
import { getReplicateClient } from '../replicate-client.js';

const MINIMAX_TTS_MODEL = 'minimax/speech-2.8-hd';

/** Approximate cost per character for MiniMax TTS */
export const MINIMAX_COST_PER_CHAR = 0.000005;

export interface TTSInput {
  /** Text to convert to speech */
  text: string;
  /** Voice identifier (e.g. "Friendly_Person") */
  voice_id: string;
  /** Emotion override (default: "auto") */
  emotion?: string;
  /** Playback speed multiplier (default: 1.0) */
  speed?: number;
  /** Pitch adjustment (default: 0) */
  pitch?: number;
  /** Audio sample rate in Hz (default: 32000) */
  sample_rate?: number;
}

/**
 * Generate speech audio using MiniMax Speech 2.8 HD.
 * Returns the URL of the generated audio file.
 *
 * Optionally accepts a pre-configured Replicate instance (useful for testing).
 */
export async function generateTTS(input: TTSInput, replicate?: Replicate): Promise<string> {
  const client = replicate ?? getReplicateClient();

  const output = await client.run(MINIMAX_TTS_MODEL, {
    input: {
      text: input.text,
      voice_id: input.voice_id,
      emotion: input.emotion ?? 'auto',
      speed: input.speed ?? 1.0,
      pitch: input.pitch ?? 0,
      sample_rate: input.sample_rate ?? 32000,
      channel: 'stereo',
    },
  });

  return String(output);
}

/**
 * Estimate cost for a TTS generation based on text length.
 */
export function estimateTTSCost(text: string): number {
  return text.length * MINIMAX_COST_PER_CHAR;
}
