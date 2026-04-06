/**
 * Music Generation Presets
 *
 * Reusable prompt presets for AI music generation (Lyria 2 / similar models).
 * Each preset provides a tested prompt and optional negative prompt.
 */

export interface MusicPreset {
  /** Human-readable preset name */
  name: string;
  /** Prompt describing the desired music */
  prompt: string;
  /** Elements to exclude from the generated audio */
  negativePrompt?: string;
}

/**
 * Predefined music presets for common content moods.
 */
export const MUSIC_PRESETS = {
  /** Upbeat and energetic — great for product or food content */
  upbeatEnergetic: {
    name: 'Upbeat Energetic',
    prompt:
      'upbeat electronic pop music, energetic positive vibes, catchy melody, bright and cheerful',
    negativePrompt: 'vocals singing lyrics',
  },

  /** Chill and relaxed — good for wellness or lifestyle content */
  chillWellness: {
    name: 'Chill Wellness',
    prompt: 'chill lo-fi beats, relaxing calming music, soft piano, peaceful ambient',
    negativePrompt: 'vocals singing lyrics',
  },

  /** Inspiring and motivational */
  motivational: {
    name: 'Motivational',
    prompt: 'inspiring electronic music, uplifting motivational, building energy, cinematic feel',
    negativePrompt: 'vocals singing lyrics',
  },

  /** Trendy short-form video style */
  trendyReels: {
    name: 'Trendy Reels',
    prompt: 'trendy social media music, catchy beat drop, modern electronic pop, high energy',
    negativePrompt: 'vocals singing lyrics',
  },

  /** Sophisticated and elegant */
  elegant: {
    name: 'Elegant',
    prompt:
      'sophisticated jazz-inspired electronic, elegant refined, smooth bass subtle percussion',
    negativePrompt: 'vocals singing lyrics',
  },

  /** Warm and cozy */
  cozy: {
    name: 'Cozy',
    prompt:
      'warm acoustic music, cozy cafe vibes, soft guitar gentle percussion, comfortable inviting',
    negativePrompt: 'vocals singing lyrics',
  },
} as const;

export type MusicPresetKey = keyof typeof MUSIC_PRESETS;

/** Get a music preset by key */
export function getMusicPreset(key: MusicPresetKey): MusicPreset {
  return MUSIC_PRESETS[key];
}

/** Get all available music preset keys */
export function getMusicPresetKeys(): MusicPresetKey[] {
  return Object.keys(MUSIC_PRESETS) as MusicPresetKey[];
}
