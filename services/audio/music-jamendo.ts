/**
 * Jamendo Music Service
 *
 * Search and download free CC-licensed royalty-free music from Jamendo.
 * Reads JAMENDO_CLIENT_ID from environment.
 *
 * @example
 * ```typescript
 * import { searchJamendoMusic, downloadJamendoTrack } from './music-jamendo.js';
 *
 * const tracks = await searchJamendoMusic({ tags: ['trap', 'beat'], speed: 'high' });
 * await downloadJamendoTrack(tracks[0], '/path/to/music.mp3');
 * ```
 */

import { writeFile } from 'fs/promises';
import { ensureDir } from '../asset-cache.js';
import { dirname } from 'path';

const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0';

export interface JamendoTrack {
  id: string;
  name: string;
  artist: string;
  audiodownload: string;
  duration: number;
  license: string;
}

export interface JamendoSearchOptions {
  /** Tags to search by (e.g. ["trap", "beat"]) */
  tags?: string[];
  /** Tempo/energy level */
  speed?: 'low' | 'medium' | 'high';
  /** Filter vocal or instrumental tracks */
  vocalInstrumental?: 'vocal' | 'instrumental';
  /** Duration range in seconds [min, max] */
  durationBetween?: [number, number];
  /** Maximum number of results (default: 5) */
  limit?: number;
}

function getClientId(): string {
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) {
    throw new Error('JAMENDO_CLIENT_ID environment variable is not set.');
  }
  return clientId;
}

/**
 * Search for CC-licensed music tracks on Jamendo.
 */
export async function searchJamendoMusic(
  options: JamendoSearchOptions = {}
): Promise<JamendoTrack[]> {
  const { tags, speed, vocalInstrumental, durationBetween, limit = 5 } = options;
  const clientId = getClientId();

  const params = new URLSearchParams({
    client_id: clientId,
    format: 'json',
    limit: String(limit),
    order: 'popularity_total',
    audioformat: 'mp32',
  });

  if (tags && tags.length > 0) params.set('fuzzytags', tags.join('+'));
  if (speed) params.set('speed', speed);
  if (vocalInstrumental) params.set('vocalinstrumental', vocalInstrumental);
  if (durationBetween) params.set('durationbetween', `${durationBetween[0]}_${durationBetween[1]}`);

  const response = await fetch(`${JAMENDO_API_BASE}/tracks/?${params}`);

  if (!response.ok) {
    throw new Error(`Jamendo API error (${response.status}): ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: Array<{
      id: string;
      name: string;
      artist_name: string;
      audiodownload: string;
      duration: number;
      license_ccurl: string;
    }>;
  };

  return data.results.map((track) => ({
    id: track.id,
    name: track.name,
    artist: track.artist_name,
    audiodownload: track.audiodownload,
    duration: track.duration,
    license: track.license_ccurl,
  }));
}

/**
 * Download a Jamendo track to a local file.
 * Returns the output path.
 */
export async function downloadJamendoTrack(
  track: JamendoTrack,
  outputPath: string
): Promise<string> {
  const response = await fetch(track.audiodownload);

  if (!response.ok) {
    throw new Error(`Failed to download Jamendo track: ${response.statusText}`);
  }

  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));

  return outputPath;
}
