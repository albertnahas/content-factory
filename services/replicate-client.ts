/**
 * Shared Replicate client for all media generation services.
 * Resolves API token from environment, secrets file, or config.
 */

import Replicate from 'replicate';
import { readFileSync, existsSync } from 'fs';

let replicateClient: Replicate | null = null;

/**
 * Load Replicate API token from multiple sources (priority order):
 * 1. REPLICATE_API_TOKEN environment variable
 * 2. Secrets file (if path provided)
 */
export function loadReplicateToken(secretsFilePath?: string): string {
  if (process.env.REPLICATE_API_TOKEN) {
    return process.env.REPLICATE_API_TOKEN;
  }

  if (secretsFilePath) {
    const resolved = secretsFilePath.replace('~', process.env.HOME || '');
    if (existsSync(resolved)) {
      try {
        const content = readFileSync(resolved, 'utf-8');
        const match = content.match(/REPLICATE_API_TOKEN=(.+)/);
        if (match) return match[1].trim();
      } catch { /* fall through */ }
    }
  }

  throw new Error(
    'REPLICATE_API_TOKEN not found. Set it as an environment variable or in your secrets file.'
  );
}

/**
 * Get or create a singleton Replicate client.
 */
export function getReplicateClient(secretsFilePath?: string): Replicate {
  if (!replicateClient) {
    const token = loadReplicateToken(secretsFilePath);
    process.env.REPLICATE_API_TOKEN = token;
    replicateClient = new Replicate();
  }
  return replicateClient;
}

/**
 * Reset the client (useful for testing or re-authentication).
 */
export function resetReplicateClient(): void {
  replicateClient = null;
}

/**
 * Extract URL from various Replicate output formats.
 */
export function extractReplicateUrl(output: unknown): string {
  if (typeof output === 'string') return output;

  if (output && typeof output === 'object') {
    if ('url' in output && typeof (output as { url: () => URL }).url === 'function') {
      return (output as { url: () => URL }).url().toString();
    }
    if ('href' in output && typeof (output as { href: string }).href === 'string') {
      return (output as { href: string }).href;
    }
  }

  // Handle array output (some models return [FileOutput])
  if (Array.isArray(output) && output.length > 0) {
    return extractReplicateUrl(output[0]);
  }

  throw new Error(`Unknown Replicate output format: ${JSON.stringify(output)}`);
}
