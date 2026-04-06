/**
 * Image Background Removal Service
 *
 * Removes backgrounds from images using Bria AI via Replicate.
 * Cost: ~$0.001 per image.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { BRIA_BG_REMOVAL_COST } from '../cost-tracker.js';
import { downloadAsset } from '../asset-cache.js';

const BRIA_BG_REMOVAL_MODEL = 'bria-ai/bria-rmbg-2.0';

/**
 * Remove the background from an image.
 * Returns the URL of the processed image with transparent background.
 */
export async function removeBackground(imageUrl: string): Promise<string> {
  const replicate = getReplicateClient();

  const output = await replicate.run(BRIA_BG_REMOVAL_MODEL, {
    input: { image: imageUrl },
  });

  return extractReplicateUrl(output);
}

/**
 * Remove the background from an image and download the result.
 * Returns the local output path.
 */
export async function removeBackgroundAndDownload(
  imageUrl: string,
  outputPath: string
): Promise<string> {
  const url = await removeBackground(imageUrl);
  await downloadAsset(url, outputPath);
  return outputPath;
}

/**
 * Remove backgrounds from multiple images in parallel.
 * Returns an array of processed image URLs.
 */
export async function removeBackgrounds(imageUrls: string[]): Promise<string[]> {
  return Promise.all(imageUrls.map((url) => removeBackground(url)));
}

/** Cost per background removal (Bria AI) */
export { BRIA_BG_REMOVAL_COST };
