/**
 * ElevenLabs TTS Service
 *
 * Premium text-to-speech via the ElevenLabs API.
 * Recommended for ads and high-quality voiceovers where expressiveness matters.
 *
 * Reads ELEVEN_LABS_API_KEY from environment.
 *
 * @example
 * ```typescript
 * import { generateElevenLabsTTS } from './tts-elevenlabs.js';
 *
 * const audio = await generateElevenLabsTTS({
 *   text: 'Your ad script',
 *   voice_id: 'SOYHLrjzK2X1ezoPC6cr',
 *   stability: 0.25,
 *   style: 1.0,
 * });
 * ```
 */

import { writeFile } from 'fs/promises';
import { ensureDir } from '../asset-cache.js';
import { dirname } from 'path';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

export interface ElevenLabsTTSInput {
  /** Text to convert to speech */
  text: string;
  /** ElevenLabs voice ID */
  voice_id: string;
  /** Model ID (default: "eleven_turbo_v2_5") */
  model_id?: string;
  /** Voice stability 0-1 — lower = more expressive (default: 0.5) */
  stability?: number;
  /** Similarity boost 0-1 (default: 0.75) */
  similarity_boost?: number;
  /** Style intensity 0-1 — higher = more stylistic (default: 0) */
  style?: number;
  /** Output audio format (default: "mp3_44100_128") */
  output_format?: string;
}

/**
 * Generate speech audio using ElevenLabs TTS.
 * Returns the audio as a Buffer.
 */
export async function generateElevenLabsTTS(input: ElevenLabsTTSInput): Promise<Buffer> {
  const apiKey = process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVEN_LABS_API_KEY environment variable is not set.');
  }

  const {
    text,
    voice_id,
    model_id = 'eleven_turbo_v2_5',
    stability = 0.5,
    similarity_boost = 0.75,
    style = 0,
    output_format = 'mp3_44100_128',
  } = input;

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voice_id}?output_format=${output_format}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id,
        voice_settings: {
          stability,
          similarity_boost,
          style,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate ElevenLabs TTS and save the audio to a local file.
 * Returns the output path.
 */
export async function generateElevenLabsTTSAndSave(
  input: ElevenLabsTTSInput,
  outputPath: string
): Promise<string> {
  const buffer = await generateElevenLabsTTS(input);
  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, buffer);
  return outputPath;
}
