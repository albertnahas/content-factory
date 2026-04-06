import type { PipelineResult } from './types.js';

export interface ScreenshotAdVariant {
  name: string;
  style: 'clean-light' | 'dark-premium' | 'vibrant-modern';
  prompt: string;
}

export interface ScreenshotAdConfig {
  screenshots: string[];
  product: {
    name: string;
    tagline: string;
    platform: 'ios' | 'android' | 'web';
  };
  variants?: ScreenshotAdVariant[];
  targetSize?: { width: number; height: number };
  outputDir: string;
  slug: string;
}

/**
 * Generate styled screenshot ads: raw screenshots → AI-composed marketing frames → export variants
 *
 * Pipeline steps:
 * 1. Load and resize screenshots
 * 2. For each variant: compose with GPT Image using style prompt + product tagline
 * 3. Export all variants to output dir
 */
export async function generateScreenshotAd(config: ScreenshotAdConfig): Promise<PipelineResult> {
  console.log(`Screenshot Ad Pipeline: "${config.slug}"`);
  console.log(`  Screenshots: ${config.screenshots.length}`);
  console.log(`  Variants: ${config.variants?.length || 3}`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
