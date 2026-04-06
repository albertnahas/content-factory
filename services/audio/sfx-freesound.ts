/**
 * Freesound SFX Service
 *
 * Search and download free sound effects from Freesound.org.
 * Preview downloads are free and don't require OAuth.
 * Reads FREESOUND_API_KEY from environment.
 *
 * @example
 * ```typescript
 * import { searchFreesound, downloadFreesoundPreview } from './sfx-freesound.js';
 *
 * const results = await searchFreesound('whoosh', 3);
 * await downloadFreesoundPreview(results[0], '/path/to/sfx.mp3');
 * ```
 */

import { writeFile } from 'fs/promises';
import { ensureDir } from '../asset-cache.js';
import { dirname } from 'path';

const FREESOUND_API_BASE = 'https://freesound.org/apiv2';

export interface FreesoundResult {
  id: number;
  name: string;
  tags: string[];
  duration: number;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
}

function getApiKey(): string {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    throw new Error('FREESOUND_API_KEY environment variable is not set.');
  }
  return apiKey;
}

/**
 * Search for sound effects on Freesound.
 */
export async function searchFreesound(
  query: string,
  limit: number = 5
): Promise<FreesoundResult[]> {
  const apiKey = getApiKey();

  const params = new URLSearchParams({
    query,
    token: apiKey,
    fields: 'id,name,tags,duration,previews',
    page_size: String(limit),
  });

  const response = await fetch(`${FREESOUND_API_BASE}/search/text/?${params}`);

  if (!response.ok) {
    throw new Error(`Freesound API error (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as { results: FreesoundResult[] };
  return data.results;
}

/**
 * Download the high-quality MP3 preview of a Freesound result to a local file.
 * Preview downloads are free and don't require OAuth authentication.
 * Returns the output path.
 */
export async function downloadFreesoundPreview(
  result: FreesoundResult,
  outputPath: string
): Promise<string> {
  const previewUrl = result.previews['preview-hq-mp3'] || result.previews['preview-lq-mp3'];

  if (!previewUrl) {
    throw new Error(`No preview URL available for Freesound result: ${result.id}`);
  }

  const response = await fetch(previewUrl);

  if (!response.ok) {
    throw new Error(`Failed to download Freesound preview: ${response.statusText}`);
  }

  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

  return outputPath;
}
