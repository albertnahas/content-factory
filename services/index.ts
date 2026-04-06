/**
 * Content Factory Services
 *
 * Barrel export for all media generation services.
 */

// Shared infrastructure
export * from './replicate-client.js';
export * from './cost-tracker.js';
export * from './asset-cache.js';

// Image services
export * from './image/generator.js';
export * from './image/background-remover.js';
export * from './image/outpainter.js';

// Video services
// SeedanceModelVariant is already exported from cost-tracker
export {
  generateVideo,
  generateVideoAndDownload,
  generateVideos,
  generateVideosAndDownload,
  generateVideoFromText,
} from './video/generator.js';
export type { VideoGenerationRequest, GeneratedVideo } from './video/generator.js';
export * from './video/lipsync.js';
export * from './video/bg-remover.js';
export * from './video/audio-driven.js';

// Audio services
export * from './audio/tts-minimax.js';
export * from './audio/tts-elevenlabs.js';
export * from './audio/transcription.js';
// music-lyria re-exports LYRIA_COST_PER_SECOND and calculateMusicCost — already in cost-tracker
export {
  generateMusic,
  generateMusicAndDownload,
  MAX_MUSIC_DURATION,
} from './audio/music-lyria.js';
export type { MusicGenerationRequest, GeneratedMusic } from './audio/music-lyria.js';
export * from './audio/music-jamendo.js';
export * from './audio/sfx-freesound.js';

// Presets
export * from './presets/camera.js';
export * from './presets/music.js';
