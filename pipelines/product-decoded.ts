import type { PipelineResult, VoiceConfig, MusicConfig } from './types.js';

export interface ProductComponent {
  name: string;
  data?: Record<string, string | number>;
  position?: { x: number; y: number };
}

export interface ProductDecodedConfig {
  productName: string;
  productDescription: string;
  components: ProductComponent[];
  imageStyle: string;
  voice: VoiceConfig;
  music: MusicConfig;
  outputDir: string;
  slug: string;
  timing?: {
    disassembly: number;
    float: number;
    dataOverlay: number;
    assembly: number;
    outro: number;
  };
}

/**
 * Generate a product-decoded reel: assembled image → disassembly video → float hold →
 * data overlay → assembly video → outro → voiceover → music → compose
 *
 * Pipeline steps:
 * 1. Generate assembled product image (GPT Image)
 * 2. Generate disassembly video (Seedance with lastFrameImage)
 * 3. Extract freeze frame for data overlay background
 * 4. Generate voiceover (TTS service)
 * 5. Download music (Jamendo)
 * 6. Compose 30s video with ffmpeg reverse trick + data overlay
 */
export async function generateProductDecoded(
  config: ProductDecodedConfig
): Promise<PipelineResult> {
  console.log(`Product Decoded Pipeline: "${config.slug}"`);
  console.log(`  Components: ${config.components.length}`);

  return {
    outputDir: config.outputDir,
    assets: [],
    cost: 0,
    costBreakdown: {},
  };
}
