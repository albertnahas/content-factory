/**
 * Audio Transcription Service
 *
 * Transcribes audio files using OpenAI Whisper with word-level timestamps.
 * Reads OPENAI_API_KEY from environment.
 *
 * @example
 * ```typescript
 * import { transcribeAudio } from './transcription.js';
 *
 * const result = await transcribeAudio('/path/to/audio.mp3');
 * console.log(result.words); // [{ word, start, end }]
 * ```
 */

import { createReadStream } from 'fs';
import OpenAI from 'openai';

export interface TranscriptionWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptionResult {
  /** Full transcribed text */
  text: string;
  /** Word-level timestamps */
  words: TranscriptionWord[];
  /** Audio duration in seconds */
  duration: number;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set.');
  }
  return new OpenAI({ apiKey });
}

/**
 * Transcribe an audio file using OpenAI Whisper with word-level timestamps.
 */
export async function transcribeAudio(audioPath: string): Promise<TranscriptionResult> {
  const client = getOpenAIClient();

  const response = await client.audio.transcriptions.create({
    file: createReadStream(audioPath),
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['word'],
  });

  const words: TranscriptionWord[] = (response.words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));

  const duration = words.length > 0 ? words[words.length - 1].end : 0;

  return {
    text: response.text,
    words,
    duration,
  };
}
