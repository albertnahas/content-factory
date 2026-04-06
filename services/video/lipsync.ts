/**
 * Lip-Sync Video Service
 *
 * Generates lip-synced videos from a source video + audio using PixVerse via Replicate.
 * Produces natural lip movements without chromakey artifacts.
 * Cost: ~$0.08325/sec of output video.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { LIPSYNC_COST_PER_SECOND } from '../cost-tracker.js';
import { downloadAsset } from '../asset-cache.js';

const PIXVERSE_LIPSYNC_MODEL = 'pixverse/lipsync';

export interface LipsyncRequest {
  /** Source video URL (character to animate) */
  videoUrl: string;
  /** Audio URL to sync lip movements to */
  audioUrl: string;
  /** How to handle audio/video length mismatch (default: "cut_off") */
  syncMode?: 'loop' | 'cut_off';
  /** Generation temperature — controls variation (default: 0.6) */
  temperature?: number;
  /** Estimated duration in seconds for cost calculation */
  estimatedDurationSeconds?: number;
}

export interface GeneratedLipsyncVideo {
  type: 'lipsync-video';
  /** Remote URL of the processed video */
  url: string;
  /** Local path if downloaded */
  localPath?: string;
  /** Estimated cost in USD */
  cost: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Sync mode used */
  syncMode: string;
}

/**
 * Generate a lip-synced video from a source video and audio.
 */
export async function generateLipsyncVideo(
  request: LipsyncRequest
): Promise<GeneratedLipsyncVideo> {
  const {
    videoUrl,
    audioUrl,
    syncMode = 'cut_off',
    temperature = 0.6,
    estimatedDurationSeconds = 10,
  } = request;

  const replicate = getReplicateClient();

  const output = await replicate.run(PIXVERSE_LIPSYNC_MODEL, {
    input: {
      video: videoUrl,
      audio: audioUrl,
      sync_mode: syncMode,
      temperature,
    },
  });

  const url = extractReplicateUrl(output);
  const cost = estimatedDurationSeconds * LIPSYNC_COST_PER_SECOND;

  return {
    type: 'lipsync-video',
    url,
    cost,
    generatedAt: new Date(),
    syncMode,
  };
}

/**
 * Generate a lip-synced video and download it to a local path.
 */
export async function generateLipsyncVideoAndDownload(
  request: LipsyncRequest,
  outputPath: string
): Promise<GeneratedLipsyncVideo> {
  const result = await generateLipsyncVideo(request);
  await downloadAsset(result.url, outputPath);
  return { ...result, localPath: outputPath };
}

/** Cost per second of lipsync output (PixVerse) */
export { LIPSYNC_COST_PER_SECOND };
