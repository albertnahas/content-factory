import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

export interface ContentFactoryConfig {
  brand: {
    name: string;
    tagline?: string;
    colors?: {
      primary?: string;
      background?: string;
      text?: string;
    };
    font?: string;
    logo_path?: string;
    cta_default?: string;
  };
  content?: {
    categories?: Array<{
      slug: string;
      label: string;
      engagement?: string;
    }>;
    default_aspect_ratio?: '9:16' | '16:9' | '1:1' | '4:5';
    default_resolution?: '480p' | '720p' | '1080p';
    tts?: {
      provider?: 'minimax' | 'elevenlabs';
      voice_id?: string;
      voice_pool?: string[];
      speed?: number;
      emotion?: string;
    };
    tts_premium?: {
      provider?: 'elevenlabs';
      voice_id?: string;
      model?: string;
    };
  };
  output?: {
    base_dir?: string;
    remotion_public?: string;
  };
  cost?: {
    warn_threshold?: number;
    max_per_session?: number;
  };
  secrets_file?: string;
}

const DEFAULT_CONFIG: ContentFactoryConfig = {
  brand: { name: 'My Brand' },
  content: {
    default_aspect_ratio: '9:16',
    default_resolution: '480p',
    tts: { provider: 'minimax', speed: 1.0 },
  },
  output: { base_dir: './output' },
  cost: { warn_threshold: 1.0, max_per_session: 5.0 },
};

let cachedConfig: ContentFactoryConfig | null = null;

export function loadConfig(projectRoot?: string): ContentFactoryConfig {
  if (cachedConfig) return cachedConfig;

  const root = projectRoot ?? process.cwd();
  const yamlPath = join(root, 'content-factory.yaml');
  const jsonPath = join(root, 'content-factory.json');

  if (existsSync(jsonPath)) {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf-8')) as Partial<ContentFactoryConfig>;
    cachedConfig = { ...DEFAULT_CONFIG, ...raw };
    return cachedConfig;
  }

  if (existsSync(yamlPath)) {
    try {
      const require = createRequire(import.meta.url);
      const yaml = require('js-yaml') as { load: (s: string) => unknown };
      const raw = yaml.load(readFileSync(yamlPath, 'utf-8')) as Partial<ContentFactoryConfig>;
      cachedConfig = { ...DEFAULT_CONFIG, ...raw };
      return cachedConfig;
    } catch {
      console.warn('js-yaml not installed. Using default config or content-factory.json instead.');
    }
  }

  cachedConfig = DEFAULT_CONFIG;
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = null;
}

export function resolveSecretsFile(config: ContentFactoryConfig): string | null {
  if (!config.secrets_file) return null;
  const resolved = config.secrets_file.replace('~', process.env.HOME ?? '');
  return existsSync(resolved) ? resolved : null;
}
