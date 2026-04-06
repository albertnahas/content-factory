/**
 * Video Background Removal Service
 *
 * Supports two backends:
 *   - 'robust-video-matting' (default): Budget, ~$0.046 flat per run — good for overlays
 *   - 'bria': High quality, $0.14/s — best for hero content
 *
 * Both output transparent WebM (VP9) for compositing.
 * Robust Video Matting outputs an alpha mask that is composited with ffmpeg alphamerge.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import {
  BRIA_VIDEO_BG_REMOVAL_COST_PER_SEC,
  ROBUST_VIDEO_MATTING_COST_PER_RUN,
  formatCost,
} from '../cost-tracker.js';
import { downloadAsset } from '../asset-cache.js';

const execFileAsync = promisify(execFile);

// ==================== Types ====================

export type VideoBgRemovalModel = 'bria' | 'robust-video-matting';

export interface VideoBgRemovalRequest {
  /** URL of the video to process */
  videoUrl: string;
  /** Output container and codec (default: "webm_vp9" for alpha channel support) */
  outputFormat?: 'webm_vp9' | 'mp4_h264' | 'mp4_h265' | 'mov_proresks';
  /** Whether to preserve audio from the original video (default: true) */
  preserveAudio?: boolean;
  /** Estimated duration in seconds for cost calculation */
  durationSeconds: number;
  /** Which model to use (default: 'robust-video-matting') */
  model?: VideoBgRemovalModel;
}

export interface VideoBgRemovalResult {
  /** URL of the processed transparent video (or alpha mask for RVM) */
  url: string;
  /** Local path if downloaded */
  localPath?: string;
  /** Estimated cost in USD */
  cost: number;
  /** Duration in seconds */
  durationSeconds: number;
  /** Model used */
  model: VideoBgRemovalModel;
}

// ==================== Constants ====================

const BRIA_MODEL = 'bria/video-remove-background';
const ROBUST_VIDEO_MATTING_MODEL =
  'arielreplicate/robust_video_matting:73d2128a371922d5d1abf0712a1d974be0e4e2358cc1218e4e34714767232bac';

// ==================== Internal Helpers ====================

async function removeWithBria(
  videoUrl: string,
  outputFormat: string,
  preserveAudio: boolean,
  durationSeconds: number
): Promise<VideoBgRemovalResult> {
  const replicate = getReplicateClient();
  const startTime = Date.now();

  const output = await replicate.run(BRIA_MODEL, {
    input: {
      video_url: videoUrl,
      background_color: 'Transparent',
      output_container_and_codec: outputFormat,
      preserve_audio: preserveAudio,
    },
  });

  const url = extractReplicateUrl(output);
  const cost = durationSeconds * BRIA_VIDEO_BG_REMOVAL_COST_PER_SEC;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   Done in ${elapsed}s | Cost: ${formatCost(cost)}`);

  return { url, cost, durationSeconds, model: 'bria' };
}

async function removeWithRobustVideoMatting(
  videoUrl: string,
  durationSeconds: number
): Promise<VideoBgRemovalResult> {
  const replicate = getReplicateClient();
  const startTime = Date.now();

  const output = await replicate.run(ROBUST_VIDEO_MATTING_MODEL, {
    input: {
      input_video: videoUrl,
      output_type: 'alpha-mask',
    },
  });

  const url = extractReplicateUrl(output);
  const cost = ROBUST_VIDEO_MATTING_COST_PER_RUN;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   Done in ${elapsed}s | Cost: ${formatCost(cost)}`);

  return { url, cost, durationSeconds, model: 'robust-video-matting' };
}

/**
 * Composites original video with alpha mask via ffmpeg alphamerge to create transparent WebM.
 * Avoids chromakey color collisions (e.g. green clothing vs green screen).
 */
async function alphaMaskToTransparentWebM(
  originalVideoPath: string,
  maskVideoPath: string,
  outputPath: string,
  preserveAudio: boolean
): Promise<void> {
  const filterComplex = '[0:v]format=rgba[rgb];[1:v]format=gray[mask];[rgb][mask]alphamerge[out]';

  const args = [
    '-y',
    '-i', originalVideoPath,
    '-i', maskVideoPath,
    '-filter_complex', filterComplex,
    '-map', '[out]',
    ...(preserveAudio ? ['-map', '0:a?', '-c:a', 'libopus'] : ['-an']),
    '-c:v', 'libvpx-vp9',
    '-pix_fmt', 'yuva420p',
    '-auto-alt-ref', '0',
    '-b:v', '2M',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args, { timeout: 120_000 });
}

// ==================== Public API ====================

/**
 * Remove background from a video.
 * Default model is 'robust-video-matting' (cheap, flat-rate, good for overlays).
 * For RVM, the returned URL is an alpha mask — use removeVideoBackgroundAndDownload for a
 * composited transparent WebM.
 */
export async function removeVideoBackground(
  request: VideoBgRemovalRequest
): Promise<VideoBgRemovalResult> {
  const {
    videoUrl,
    outputFormat = 'webm_vp9',
    preserveAudio = true,
    durationSeconds,
    model = 'robust-video-matting',
  } = request;

  if (model === 'bria') {
    return removeWithBria(videoUrl, outputFormat, preserveAudio, durationSeconds);
  }

  return removeWithRobustVideoMatting(videoUrl, durationSeconds);
}

/**
 * Remove video background and download the result as a transparent WebM.
 *
 * For 'robust-video-matting', `originalLocalVideoPath` is required — it is the source
 * video that gets composited with the alpha mask via ffmpeg alphamerge.
 */
export async function removeVideoBackgroundAndDownload(
  request: VideoBgRemovalRequest,
  outputPath: string,
  originalLocalVideoPath?: string
): Promise<VideoBgRemovalResult> {
  const model = request.model ?? 'robust-video-matting';

  if (model === 'bria') {
    const result = await removeVideoBackground(request);
    await downloadAsset(result.url, outputPath);
    return { ...result, localPath: outputPath };
  }

  if (!originalLocalVideoPath) {
    throw new Error(
      'originalLocalVideoPath is required for robust-video-matting (needed for alpha compositing)'
    );
  }

  const result = await removeVideoBackground(request);

  const maskPath = outputPath.replace(/\.webm$/, '-mask.mp4');
  await downloadAsset(result.url, maskPath);

  await alphaMaskToTransparentWebM(
    originalLocalVideoPath,
    maskPath,
    outputPath,
    request.preserveAudio !== false
  );

  return { ...result, localPath: outputPath };
}
