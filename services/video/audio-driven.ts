/**
 * Audio-Driven Video Animation Service
 *
 * Generates animated videos from a static image + audio file using prunaai/p-video.
 * The model produces natural lip movements driven by the provided audio track.
 * Cost: ~$0.20-0.40 per video at 720p.
 */

import { getReplicateClient, extractReplicateUrl } from '../replicate-client.js';
import { downloadAsset } from '../asset-cache.js';

const P_VIDEO_MODEL = 'prunaai/p-video';

export interface AudioDrivenVideoOptions {
  /** Output width in pixels (default: 720) */
  width?: number;
  /** Output height in pixels (default: 1280) */
  height?: number;
  /** Whether to save the audio track in the output video (default: true) */
  saveAudio?: boolean;
}

/**
 * Generate an audio-driven animated video from a static image and audio clip.
 * The model animates the image with lip movements synchronized to the audio.
 *
 * @param imageUrl - URL of the source image (character to animate)
 * @param audioUrl - URL of the audio file driving the animation
 * @param options - Optional width/height and audio settings
 * @returns URL of the generated animated video
 */
export async function generateAudioDrivenVideo(
  imageUrl: string,
  audioUrl: string,
  options: AudioDrivenVideoOptions = {}
): Promise<string> {
  const { width = 720, height = 1280, saveAudio = true } = options;

  const replicate = getReplicateClient();

  const output = await replicate.run(P_VIDEO_MODEL, {
    input: {
      image: imageUrl,
      audio: audioUrl,
      width,
      height,
      save_audio: saveAudio,
    },
  });

  return extractReplicateUrl(output);
}

/**
 * Generate an audio-driven animated video and download it to a local path.
 */
export async function generateAudioDrivenVideoAndDownload(
  imageUrl: string,
  audioUrl: string,
  outputPath: string,
  options: AudioDrivenVideoOptions = {}
): Promise<string> {
  const url = await generateAudioDrivenVideo(imageUrl, audioUrl, options);
  await downloadAsset(url, outputPath);
  return outputPath;
}
