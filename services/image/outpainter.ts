/**
 * Image Outpainting Service
 *
 * Extends images to fill new aspect ratios using FLUX Fill Pro via Replicate.
 * Useful for adapting 9:16 content to 4:5, or expanding backgrounds seamlessly.
 * Cost: ~$0.05 per image.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { downloadAsset } from '../asset-cache.js';

const FLUX_FILL_PRO_MODEL = 'black-forest-labs/flux-fill-pro';

/** Cost per outpaint operation */
export const FLUX_FILL_COST = 0.05;

/**
 * Outpaint an image to a target aspect ratio using FLUX Fill Pro.
 *
 * @param imageUrl - URL of the source image
 * @param targetAspectRatio - Target aspect ratio (e.g. "4:5", "1:1", "16:9")
 * @param prompt - Optional prompt describing what to fill in the extended area
 * @returns URL of the outpainted image
 */
export async function outpaintImage(
  imageUrl: string,
  targetAspectRatio: string,
  prompt?: string
): Promise<string> {
  const replicate = getReplicateClient();

  const output = await replicate.run(FLUX_FILL_PRO_MODEL, {
    input: {
      image: imageUrl,
      aspect_ratio: targetAspectRatio,
      prompt: prompt ?? 'seamless background extension, natural continuation of the existing scene',
    },
  });

  return extractReplicateUrl(output);
}

/**
 * Outpaint an image and download the result.
 * Returns the local output path.
 */
export async function outpaintImageAndDownload(
  imageUrl: string,
  targetAspectRatio: string,
  outputPath: string,
  prompt?: string
): Promise<string> {
  const url = await outpaintImage(imageUrl, targetAspectRatio, prompt);
  await downloadAsset(url, outputPath);
  return outputPath;
}
