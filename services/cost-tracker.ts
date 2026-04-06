/**
 * Cost Tracking for Media Generation
 *
 * Tracks and estimates costs for image, video, and composition API calls.
 */

export type SeedanceModelVariant = 'lite' | 'pro';

// ==================== Pricing Constants ====================

/** Ideogram V3 Turbo pricing (approximate) */
export const IDEOGRAM_COST_PER_IMAGE = 0.02;

/** GPT Image 1.5 (via Replicate) pricing by quality tier */
export const GPT_IMAGE_PRICING = {
  low: 0.013,
  medium: 0.05,
  high: 0.14,
} as const;

export type GPTImageQuality = keyof typeof GPT_IMAGE_PRICING;

/** Bria AI background removal cost per image */
export const BRIA_BG_REMOVAL_COST = 0.001;

/** Nano Banana Pro (Gemini 2.5 Flash) composition cost per image */
export const NANO_BANANA_PRO_COST = 0.15;

/** Seedance pricing per second by model variant and resolution */
export const SEEDANCE_PRICING = {
  lite: {
    '480p': 0.018,
    '720p': 0.036,
    '1080p': 0.072,
  },
  pro: {
    '480p': { withAudio: 0.025, withoutAudio: 0.013 },
    '720p': { withAudio: 0.052, withoutAudio: 0.026 },
    '1080p': { withAudio: 0.12, withoutAudio: 0.06 },
  },
} as const;

/**
 * Legacy alias for backward compatibility (points to Pro without audio)
 * @deprecated Use SEEDANCE_PRICING instead
 */
export const SEEDANCE_COST_PER_SECOND: Record<'480p' | '720p' | '1080p', number> = {
  '480p': SEEDANCE_PRICING.pro['480p'].withoutAudio,
  '720p': SEEDANCE_PRICING.pro['720p'].withoutAudio,
  '1080p': SEEDANCE_PRICING.pro['1080p'].withoutAudio,
};

/** Lyria 2 music generation pricing per second */
export const LYRIA_COST_PER_SECOND = 0.0001;

/** PixVerse lip-sync pricing per second of output video */
export const LIPSYNC_COST_PER_SECOND = 0.08325;

/** Bria AI video background removal cost per second */
export const BRIA_VIDEO_BG_REMOVAL_COST_PER_SEC = 0.14;

/** Robust Video Matting cost per run (flat rate, not per-second) */
export const ROBUST_VIDEO_MATTING_COST_PER_RUN = 0.046;

// ==================== Cost Calculation ====================

/** Calculate cost for Ideogram image generation */
export function calculateImageCost(imageCount: number = 1): number {
  return imageCount * IDEOGRAM_COST_PER_IMAGE;
}

/** Calculate cost for Seedance video generation */
export function calculateVideoCost(
  durationSeconds: number,
  resolution: '480p' | '720p' | '1080p' = '480p',
  modelVariant: SeedanceModelVariant = 'pro',
  generateAudio: boolean = false
): number {
  if (modelVariant === 'lite') {
    return durationSeconds * SEEDANCE_PRICING.lite[resolution];
  }

  const rate = generateAudio
    ? SEEDANCE_PRICING.pro[resolution].withAudio
    : SEEDANCE_PRICING.pro[resolution].withoutAudio;

  return durationSeconds * rate;
}

/** Calculate cost for Lyria 2 music generation */
export function calculateMusicCost(durationSeconds: number): number {
  return durationSeconds * LYRIA_COST_PER_SECOND;
}

/** Calculate cost for lip-sync video generation */
export function calculateLipsyncCost(durationSeconds: number): number {
  return durationSeconds * LIPSYNC_COST_PER_SECOND;
}

/** Calculate total cost for a reel with multiple segments */
export function calculateReelCost(
  segments: Array<{ duration: number }>,
  resolution: '480p' | '720p' = '480p'
): { imageCost: number; videoCost: number; totalCost: number } {
  const imageCount = segments.length;
  const totalDuration = segments.reduce((sum, s) => sum + s.duration, 0);

  const imageCost = calculateImageCost(imageCount);
  const videoCost = calculateVideoCost(totalDuration, resolution);
  const totalCost = imageCost + videoCost;

  return { imageCost, videoCost, totalCost };
}

/** Calculate cost for Bria video background removal */
export function calculateVideoBgRemovalCost(durationSeconds: number): number {
  return durationSeconds * BRIA_VIDEO_BG_REMOVAL_COST_PER_SEC;
}

// ==================== Cost Estimation Display ====================

/** Format cost as USD string */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(3)}`;
}

/** Generate a cost breakdown summary */
export function generateCostSummary(costs: {
  imageCost: number;
  videoCost: number;
  totalCost: number;
}): string {
  return [
    'Cost Breakdown:',
    `  Images (Ideogram): ${formatCost(costs.imageCost)}`,
    `  Videos (Seedance): ${formatCost(costs.videoCost)}`,
    `  Total: ${formatCost(costs.totalCost)}`,
  ].join('\n');
}

/** Estimate cost before generation (for user confirmation) */
export function estimateReelCost(
  segmentCount: number,
  durationPerSegment: number = 5,
  resolution: '480p' | '720p' = '480p'
): { estimated: { imageCost: number; videoCost: number; totalCost: number }; summary: string } {
  const segments = Array(segmentCount).fill({ duration: durationPerSegment });
  const estimated = calculateReelCost(segments, resolution);

  const summary = [
    `Estimated cost for ${segmentCount} segments (${durationPerSegment}s each at ${resolution}):`,
    `  ${segmentCount} images: ~${formatCost(estimated.imageCost)}`,
    `  ${segmentCount} videos (${segmentCount * durationPerSegment}s total): ~${formatCost(estimated.videoCost)}`,
    `  Total: ~${formatCost(estimated.totalCost)}`,
  ].join('\n');

  return { estimated, summary };
}

// ==================== Cost Tracking State ====================

interface CostEntry {
  type:
    | 'image'
    | 'video'
    | 'music'
    | 'lipsync'
    | 'bg-removal'
    | 'video-bg-removal'
    | 'composition';
  cost: number;
  timestamp: Date;
  details?: string;
  modelVariant?: SeedanceModelVariant;
  generateAudio?: boolean;
}

/** Cost tracker for a generation session */
export class CostTracker {
  private entries: CostEntry[] = [];

  /** Record an image generation cost */
  recordImage(details?: string): void {
    this.entries.push({ type: 'image', cost: IDEOGRAM_COST_PER_IMAGE, timestamp: new Date(), details });
  }

  /** Record a video generation cost */
  recordVideo(
    durationSeconds: number,
    resolution: '480p' | '720p' = '480p',
    details?: string,
    modelVariant: SeedanceModelVariant = 'pro',
    generateAudio: boolean = false
  ): void {
    this.entries.push({
      type: 'video',
      cost: calculateVideoCost(durationSeconds, resolution, modelVariant, generateAudio),
      timestamp: new Date(),
      details,
      modelVariant,
      generateAudio,
    });
  }

  /** Record a lip-sync video generation cost */
  recordLipsync(durationSeconds: number, details?: string): void {
    this.entries.push({
      type: 'lipsync',
      cost: calculateLipsyncCost(durationSeconds),
      timestamp: new Date(),
      details,
    });
  }

  /** Record a music generation cost */
  recordMusic(durationSeconds: number, details?: string): void {
    this.entries.push({
      type: 'music',
      cost: calculateMusicCost(durationSeconds),
      timestamp: new Date(),
      details,
    });
  }

  /** Record a background removal cost (image) */
  recordBackgroundRemoval(details?: string): void {
    this.entries.push({ type: 'bg-removal', cost: BRIA_BG_REMOVAL_COST, timestamp: new Date(), details });
  }

  /** Record a video background removal cost */
  recordVideoBgRemoval(durationSeconds: number, details?: string): void {
    this.entries.push({
      type: 'video-bg-removal',
      cost: calculateVideoBgRemovalCost(durationSeconds),
      timestamp: new Date(),
      details,
    });
  }

  /** Record a Robust Video Matting cost (flat rate per run) */
  recordRobustVideoMatting(details?: string): void {
    this.entries.push({
      type: 'video-bg-removal',
      cost: ROBUST_VIDEO_MATTING_COST_PER_RUN,
      timestamp: new Date(),
      details: details ? `Robust Video Matting: ${details}` : 'Robust Video Matting',
    });
  }

  /** Record a GPT Image generation cost */
  recordGPTImage(quality: GPTImageQuality, details?: string): void {
    this.entries.push({
      type: 'image',
      cost: GPT_IMAGE_PRICING[quality],
      timestamp: new Date(),
      details: details ? `GPT Image ${quality}: ${details}` : `GPT Image ${quality}`,
    });
  }

  /** Record a composition cost (GPT Image or similar) */
  recordComposition(cost: number, details?: string): void {
    this.entries.push({ type: 'composition', cost, timestamp: new Date(), details });
  }

  getImageCost(): number {
    return this.entries.filter((e) => e.type === 'image').reduce((sum, e) => sum + e.cost, 0);
  }

  getVideoCost(): number {
    return this.entries.filter((e) => e.type === 'video').reduce((sum, e) => sum + e.cost, 0);
  }

  getLipsyncCost(): number {
    return this.entries.filter((e) => e.type === 'lipsync').reduce((sum, e) => sum + e.cost, 0);
  }

  getMusicCost(): number {
    return this.entries.filter((e) => e.type === 'music').reduce((sum, e) => sum + e.cost, 0);
  }

  getBgRemovalCost(): number {
    return this.entries.filter((e) => e.type === 'bg-removal').reduce((sum, e) => sum + e.cost, 0);
  }

  getVideoBgRemovalCost(): number {
    return this.entries.filter((e) => e.type === 'video-bg-removal').reduce((sum, e) => sum + e.cost, 0);
  }

  getCompositionCost(): number {
    return this.entries.filter((e) => e.type === 'composition').reduce((sum, e) => sum + e.cost, 0);
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  getBreakdown(): {
    images: number;
    videos: number;
    lipsync: number;
    music: number;
    bgRemoval: number;
    videoBgRemoval: number;
    composition: number;
    total: number;
  } {
    return {
      images: this.getImageCost(),
      videos: this.getVideoCost(),
      lipsync: this.getLipsyncCost(),
      music: this.getMusicCost(),
      bgRemoval: this.getBgRemovalCost(),
      videoBgRemoval: this.getVideoBgRemovalCost(),
      composition: this.getCompositionCost(),
      total: this.getTotalCost(),
    };
  }

  getEntries(): CostEntry[] {
    return [...this.entries];
  }

  getSummary(): string {
    const breakdown = this.getBreakdown();
    const count = (type: CostEntry['type']) => this.entries.filter((e) => e.type === type).length;

    const lines = [
      'Session Cost Summary:',
      `  Images: ${count('image')} generated, ${formatCost(breakdown.images)}`,
    ];

    if (count('video') > 0) lines.push(`  Videos: ${count('video')} generated, ${formatCost(breakdown.videos)}`);
    if (count('lipsync') > 0) lines.push(`  Lip-sync: ${count('lipsync')} generated, ${formatCost(breakdown.lipsync)}`);
    if (count('music') > 0) lines.push(`  Music: ${count('music')} generated, ${formatCost(breakdown.music)}`);
    if (count('bg-removal') > 0) lines.push(`  BG Removal: ${count('bg-removal')} processed, ${formatCost(breakdown.bgRemoval)}`);
    if (count('video-bg-removal') > 0) lines.push(`  Video BG Removal: ${count('video-bg-removal')} processed, ${formatCost(breakdown.videoBgRemoval)}`);
    if (count('composition') > 0) lines.push(`  Composition: ${count('composition')} generated, ${formatCost(breakdown.composition)}`);

    lines.push(`  Total: ${formatCost(breakdown.total)}`);

    return lines.join('\n');
  }

  reset(): void {
    this.entries = [];
  }
}
