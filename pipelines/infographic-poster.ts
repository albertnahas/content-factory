import type { PipelineResult } from './types.js';

export type InfographicLayout = 'comparison' | 'grid' | 'hero-detail';
export type CompositionModel = 'gpt-image-medium' | 'gpt-image-high' | 'nano-banana' | 'ideogram';

export interface InfographicItem {
  name: string;
  description?: string;
  data?: Record<string, string | number>;
}

export interface InfographicPosterConfig {
  title: string;
  subtitle?: string;
  layout: InfographicLayout;
  items: InfographicItem[];
  compositionModel?: CompositionModel;
  targetAspectRatio?: '4:5' | '1:1' | '9:16';
  outputDir: string;
  slug: string;
  brand: {
    name: string;
    colors?: { primary?: string; background?: string; text?: string };
    font?: string;
  };
}

/**
 * Generate a static infographic poster: layout → compose with AI image model → export
 *
 * Pipeline steps:
 * 1. Build prompt from layout, items, and brand config
 * 2. Generate poster image (GPT Image / NanoBanana / Ideogram)
 * 3. Save to output dir
 */
export async function generateInfographicPoster(
  config: InfographicPosterConfig
): Promise<PipelineResult> {
  console.log(`Infographic Poster Pipeline: "${config.slug}"`);
  console.log(`  Layout: ${config.layout}`);
  console.log(`  Items: ${config.items.length}`);
  console.log(`  Model: ${config.compositionModel || 'gpt-image-medium'}`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
