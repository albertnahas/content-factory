/**
 * Music Generation Service using Google Lyria 2
 *
 * Generates AI background music via Replicate.
 * Cost: $0.0001/sec of output audio (up to 30s per generation).
 *
 * @example
 * ```typescript
 * import { generateMusicAndDownload } from './music-lyria.js';
 *
 * const music = await generateMusicAndDownload(
 *   { prompt: 'Upbeat electronic pop, energetic, positive vibes' },
 *   '/path/to/music.wav'
 * );
 * ```
 */

import { writeFile } from 'fs/promises';
import { getReplicateClient } from '../replicate-client.js';

/** Lyria 2 costs $0.0001 per second of output audio */
export const LYRIA_COST_PER_SECOND = 0.0001;

/** Maximum duration supported by Lyria 2 */
export const MAX_MUSIC_DURATION = 30;

// ==================== Types ====================

export interface MusicGenerationRequest {
  /** Text description for audio generation */
  prompt: string;
  /** Target duration in seconds (max 30) */
  duration?: number;
  /** Elements to exclude from the generated audio */
  negativePrompt?: string;
  /** Random seed for reproducible generations */
  seed?: number;
}

export interface GeneratedMusic {
  /** Remote URL of the generated audio */
  url: string;
  /** Actual duration in seconds */
  duration: number;
  /** Estimated cost in USD */
  cost: number;
}

// ==================== Core Functions ====================

/**
 * Generate background music using Lyria 2.
 * Duration is automatically determined by the model (up to 30s).
 */
export async function generateMusic(request: MusicGenerationRequest): Promise<GeneratedMusic> {
  const { prompt, negativePrompt, seed } = request;

  const input: Record<string, unknown> = { prompt };
  if (negativePrompt) input.negative_prompt = negativePrompt;
  if (seed !== undefined) input.seed = seed;

  const replicate = getReplicateClient();
  const output = await replicate.run('google/lyria-2', { input });

  const url = String(output);
  const estimatedDuration = 20;
  const cost = estimatedDuration * LYRIA_COST_PER_SECOND;

  return { url, duration: estimatedDuration, cost };
}

/**
 * Generate music and download to a local file.
 */
export async function generateMusicAndDownload(
  request: MusicGenerationRequest,
  outputPath: string
): Promise<GeneratedMusic & { localPath: string }> {
  const result = await generateMusic(request);

  const response = await fetch(result.url);
  if (!response.ok) {
    throw new Error(`Failed to download music: ${response.statusText}`);
  }

  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

  return { ...result, localPath: outputPath };
}

/**
 * Calculate estimated cost for music generation.
 */
export function calculateMusicCost(durationSeconds: number): number {
  return Math.min(durationSeconds, MAX_MUSIC_DURATION) * LYRIA_COST_PER_SECOND;
}
