import type { PipelineResult } from './types.js';

export interface CarouselSlide {
  title: string;
  body?: string;
  imagePrompt?: string;
  imageSource?: 'generate' | 'stock' | 'screenshot';
  stockQuery?: string;
}

export interface CarouselConfig {
  type: 'character' | 'standard';
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  brand: {
    name: string;
    colors?: { primary?: string; background?: string; text?: string };
    font?: string;
    logo_path?: string;
  };
  outputDir: string;
  slug: string;
}

/**
 * Generate a social media carousel: slide images → compose with brand → export frames
 *
 * Pipeline steps:
 * 1. For each slide: generate or source image
 * 2. Composite with brand colors, font, and logo
 * 3. Export numbered frames to output dir
 * 4. Optionally post to Buffer (Instagram + TikTok)
 */
export async function generateCarousel(config: CarouselConfig): Promise<PipelineResult> {
  console.log(`Carousel Pipeline: "${config.slug}"`);
  console.log(`  Type: ${config.type}`);
  console.log(`  Slides: ${config.slides.length}`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
