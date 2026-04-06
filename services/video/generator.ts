/**
 * Video Generation Service using Seedance
 *
 * Generates AI-animated videos from static images via Replicate's Seedance API.
 * Supports both Seedance-1-Lite and Seedance-1.5-Pro models.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { calculateVideoCost } from '../cost-tracker.js';
import { downloadAsset, cacheUrl } from '../asset-cache.js';

// ==================== Types ====================

export type SeedanceModelVariant = 'lite' | 'pro';

export interface VideoGenerationRequest {
  /** URL or local path to the first frame image */
  imageUrl: string;
  /** Camera movement description for Seedance */
  cameraPrompt: string;
  /** Video duration in seconds (2-12, default: 5) */
  duration?: number;
  /** Video resolution (default: "480p" for cost efficiency) */
  resolution?: '480p' | '720p';
  /** Aspect ratio (default: "9:16") */
  aspectRatio?: '9:16' | '16:9' | '1:1';
  /** Keep camera fixed (no movement) */
  cameraFixed?: boolean;
  /** Random seed for reproducibility */
  seed?: number;
  /** Model variant to use (default: "pro") */
  modelVariant?: SeedanceModelVariant;
  /** Generate audio for the video (Pro only, default: false) */
  generateAudio?: boolean;
  /** Optional last frame image for better loops (Pro only) */
  lastFrameImage?: string;
}

export interface GeneratedVideo {
  type: 'video';
  /** Remote URL from Replicate */
  url: string;
  /** Local cached path (if downloaded) */
  localPath?: string;
  /** Estimated cost in USD */
  cost: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Camera prompt used */
  cameraPrompt: string;
  /** Video duration in seconds */
  duration: number;
  /** Video resolution */
  resolution: '480p' | '720p';
}

// ==================== Model Selection ====================

const SEEDANCE_MODELS = {
  lite: 'bytedance/seedance-1-lite',
  pro: 'bytedance/seedance-1.5-pro',
} as const;

function getSeedanceModel(requestedVariant?: SeedanceModelVariant): string {
  const variant =
    requestedVariant ||
    (process.env.SEEDANCE_MODEL_VARIANT as SeedanceModelVariant | undefined) ||
    'pro';

  return SEEDANCE_MODELS[variant] ?? SEEDANCE_MODELS.pro;
}

function resolveVariant(requestedVariant?: SeedanceModelVariant): SeedanceModelVariant {
  return (
    requestedVariant ||
    (process.env.SEEDANCE_MODEL_VARIANT as SeedanceModelVariant | undefined) ||
    'pro'
  );
}

// ==================== Video Generation ====================

/**
 * Generate a video from an image using Seedance.
 */
export async function generateVideo(request: VideoGenerationRequest): Promise<GeneratedVideo> {
  const {
    imageUrl,
    cameraPrompt,
    duration = 5,
    resolution = '480p',
    aspectRatio = '9:16',
    cameraFixed = false,
    seed,
    modelVariant,
    generateAudio = false,
    lastFrameImage,
  } = request;

  const actualVariant = resolveVariant(modelVariant);
  const model = getSeedanceModel(actualVariant);
  const replicate = getReplicateClient();

  const input: Record<string, unknown> = {
    prompt: cameraPrompt,
    image: imageUrl,
    duration,
    resolution,
    aspect_ratio: aspectRatio,
    camera_fixed: cameraFixed,
  };

  if (seed !== undefined) input.seed = seed;

  if (actualVariant === 'pro') {
    input.generate_audio = generateAudio;
    if (lastFrameImage) input.last_frame_image = lastFrameImage;
  }

  const output = await replicate.run(model as `${string}/${string}`, { input });
  const videoUrl = extractReplicateUrl(output);
  const cost = calculateVideoCost(duration, resolution, actualVariant, generateAudio);

  return {
    type: 'video',
    url: videoUrl,
    cost,
    generatedAt: new Date(),
    cameraPrompt,
    duration,
    resolution,
  };
}

/**
 * Generate a video and download it to a local path.
 */
export async function generateVideoAndDownload(
  request: VideoGenerationRequest,
  outputPath: string,
  cacheDir?: string
): Promise<GeneratedVideo> {
  const result = await generateVideo(request);

  await downloadAsset(result.url, outputPath);

  if (cacheDir) {
    await cacheUrl(cacheDir, outputPath, result.url);
  }

  return { ...result, localPath: outputPath };
}

/**
 * Generate multiple videos sequentially (to avoid rate limits).
 */
export async function generateVideos(
  requests: VideoGenerationRequest[]
): Promise<GeneratedVideo[]> {
  const results: GeneratedVideo[] = [];
  for (const request of requests) {
    results.push(await generateVideo(request));
  }
  return results;
}

/**
 * Generate multiple videos and download them sequentially.
 */
export async function generateVideosAndDownload(
  requests: Array<{ request: VideoGenerationRequest; outputPath: string }>,
  cacheDir?: string
): Promise<GeneratedVideo[]> {
  const results: GeneratedVideo[] = [];
  for (const { request, outputPath } of requests) {
    results.push(await generateVideoAndDownload(request, outputPath, cacheDir));
  }
  return results;
}

/**
 * Generate a video from a text prompt (no input image).
 */
export async function generateVideoFromText(
  prompt: string,
  options: {
    duration?: number;
    resolution?: '480p' | '720p';
    aspectRatio?: '9:16' | '16:9' | '1:1';
    seed?: number;
    modelVariant?: SeedanceModelVariant;
    generateAudio?: boolean;
  } = {}
): Promise<GeneratedVideo> {
  const {
    duration = 5,
    resolution = '480p',
    aspectRatio = '9:16',
    seed,
    modelVariant,
    generateAudio = false,
  } = options;

  const actualVariant = resolveVariant(modelVariant);
  const model = getSeedanceModel(actualVariant);
  const replicate = getReplicateClient();

  const input: Record<string, unknown> = {
    prompt,
    duration,
    resolution,
    aspect_ratio: aspectRatio,
    camera_fixed: false,
  };

  if (seed !== undefined) input.seed = seed;
  if (actualVariant === 'pro') input.generate_audio = generateAudio;

  const output = await replicate.run(model as `${string}/${string}`, { input });
  const videoUrl = extractReplicateUrl(output);
  const cost = calculateVideoCost(duration, resolution, actualVariant, generateAudio);

  return {
    type: 'video',
    url: videoUrl,
    cost,
    generatedAt: new Date(),
    cameraPrompt: prompt,
    duration,
    resolution,
  };
}
