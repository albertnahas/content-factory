/**
 * Image Generation Service using Ideogram V3 Turbo
 *
 * Generates high-quality images via Replicate's Ideogram API.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { IDEOGRAM_COST_PER_IMAGE } from '../cost-tracker.js';
import { downloadAsset, cacheUrl } from '../asset-cache.js';

// ==================== Types ====================

export interface ImageGenerationRequest {
  /** The prompt describing the image to generate */
  prompt: string;
  /** Aspect ratio for the image (default: "9:16") */
  aspectRatio?: '9:16' | '16:9' | '1:1' | '2:3' | '3:2' | '4:5' | '5:4';
  /** Style type for Ideogram (default: "Auto") */
  styleType?: 'Auto' | 'General' | 'Realistic' | 'Design' | 'Render 3D';
  /** Enable magic prompt enhancement (default: true) */
  magicPrompt?: boolean;
}

export interface GeneratedImage {
  type: 'image';
  /** Remote URL from Replicate */
  url: string;
  /** Local cached path (if downloaded) */
  localPath?: string;
  /** Estimated cost in USD */
  cost: number;
  /** Generation timestamp */
  generatedAt: Date;
  /** Original prompt used */
  prompt: string;
}

// ==================== Image Generation ====================

/**
 * Generate an image using Ideogram V3 Turbo.
 */
export async function generateImage(request: ImageGenerationRequest): Promise<GeneratedImage> {
  const { prompt, aspectRatio = '9:16', styleType = 'Auto', magicPrompt = true } = request;

  const replicate = getReplicateClient();

  const output = await replicate.run('ideogram-ai/ideogram-v3-turbo', {
    input: {
      prompt,
      aspect_ratio: aspectRatio,
      style_type: styleType,
      magic_prompt_option: magicPrompt ? 'On' : 'Off',
    },
  });

  const imageUrl = extractReplicateUrl(output);

  return {
    type: 'image',
    url: imageUrl,
    cost: IDEOGRAM_COST_PER_IMAGE,
    generatedAt: new Date(),
    prompt,
  };
}

/**
 * Generate an image and download it to a local path.
 */
export async function generateImageAndDownload(
  request: ImageGenerationRequest,
  outputPath: string,
  cacheDir?: string
): Promise<GeneratedImage> {
  const result = await generateImage(request);

  await downloadAsset(result.url, outputPath);

  if (cacheDir) {
    await cacheUrl(cacheDir, outputPath, result.url);
  }

  return { ...result, localPath: outputPath };
}

/**
 * Generate multiple images in parallel.
 */
export async function generateImages(
  requests: ImageGenerationRequest[]
): Promise<GeneratedImage[]> {
  return Promise.all(requests.map((request) => generateImage(request)));
}

/**
 * Generate multiple images and download them in parallel.
 */
export async function generateImagesAndDownload(
  requests: Array<{ request: ImageGenerationRequest; outputPath: string }>,
  cacheDir?: string
): Promise<GeneratedImage[]> {
  return Promise.all(
    requests.map(({ request, outputPath }) =>
      generateImageAndDownload(request, outputPath, cacheDir)
    )
  );
}
