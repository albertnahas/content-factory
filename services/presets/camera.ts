/**
 * Camera Movement Presets for Video Generation
 *
 * Tested camera movement prompts for Seedance and similar video generation models.
 * Designed for short-form vertical video (Instagram Reels, TikTok).
 */

export interface CameraPreset {
  /** Human-readable name */
  name: string;
  /** Camera movement prompt for the video model */
  prompt: string;
  /** Recommended duration in seconds */
  recommendedDuration: number;
  /** Whether to keep camera fixed */
  cameraFixed: boolean;
  /** Description of the visual effect */
  description: string;
}

/**
 * Predefined camera movement presets for common content scenarios.
 */
export const CAMERA_PRESETS = {
  /**
   * Slow dramatic zoom revealing textures.
   * Best for: Hero shots, appetizing reveals.
   */
  foodCloseup: {
    name: 'Food Close-up',
    prompt:
      'Slow cinematic dolly push-in on the subject, camera gradually zooming in to reveal textures and details, warm lighting, professional food commercial cinematography, stabilized gimbal motion',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Dramatic zoom revealing subject textures and details',
  },

  /**
   * Camera circles around the subject.
   * Best for: Top-down shots, 360 reveals.
   */
  orbit: {
    name: 'Orbit',
    prompt:
      'Smooth cinematic orbit around the subject, fluid arc rotation revealing different angles, steady camera gliding, professional photography, stabilized gimbal movement',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Camera slowly orbits around the subject',
  },

  /**
   * Subtle atmospheric movement.
   * Best for: Lifestyle shots, ambient scenes.
   */
  drift: {
    name: 'Gentle Drift',
    prompt:
      'Gentle camera drift revealing the scene, subtle atmospheric movement, warm ambient lighting, cozy ambiance, smooth stabilized footage',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Subtle atmospheric camera drift',
  },

  /**
   * Fast dynamic movement.
   * Best for: Hooks, attention-grabbing intros.
   */
  energetic: {
    name: 'Energetic Push',
    prompt:
      'Dynamic camera push forward, energetic movement, fast zoom into the subject, high impact visual, intense cinematography',
    recommendedDuration: 3,
    cameraFixed: false,
    description: 'Fast dynamic push for high-energy hooks',
  },

  /**
   * Very gentle movement.
   * Best for: Text overlays, stable backgrounds.
   */
  subtleMotion: {
    name: 'Subtle Motion',
    prompt:
      'Very subtle camera movement, barely perceptible drift, subject remains stable in frame, atmospheric ambience, smooth professional footage',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Minimal movement for text-heavy segments',
  },

  /**
   * Zoom out to reveal context.
   * Best for: Establishing shots, scene reveals.
   */
  pullBack: {
    name: 'Pull Back Reveal',
    prompt:
      'Camera slowly pulls back revealing the full scene, smooth dolly out movement, establishing shot cinematography, professional wide reveal',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Zoom out to reveal the full scene',
  },

  /**
   * Vertical pan from bottom to top.
   * Best for: Tall subjects, dramatic reveals.
   */
  tiltUp: {
    name: 'Tilt Up',
    prompt:
      'Smooth camera tilt from bottom to top, vertical pan revealing height, cinematic upward movement, professional cinematography',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Vertical pan revealing tall subjects',
  },

  /**
   * Follow alongside subject.
   * Best for: Action shots, movement sequences.
   */
  tracking: {
    name: 'Tracking',
    prompt:
      'Camera tracking alongside the subject, smooth lateral movement, following motion, professional tracking shot, stabilized gimbal',
    recommendedDuration: 5,
    cameraFixed: false,
    description: 'Camera follows alongside subject movement',
  },
} as const;

export type CameraPresetKey = keyof typeof CAMERA_PRESETS;

/** Get a camera preset by key */
export function getCameraPreset(key: CameraPresetKey): CameraPreset {
  return CAMERA_PRESETS[key];
}

/** Get all available camera preset keys */
export function getCameraPresetKeys(): CameraPresetKey[] {
  return Object.keys(CAMERA_PRESETS) as CameraPresetKey[];
}

/**
 * Build a camera prompt with optional modifiers appended.
 */
export function buildCameraPrompt(
  basePrompt: string,
  modifiers?: { lighting?: string; mood?: string; style?: string }
): string {
  const parts = [basePrompt];
  if (modifiers?.lighting) parts.push(modifiers.lighting);
  if (modifiers?.mood) parts.push(modifiers.mood);
  if (modifiers?.style) parts.push(modifiers.style);
  return parts.join(', ');
}
