/**
 * Asset Cache Management
 *
 * Handles caching, existence checks, and file operations
 * for generated media assets.
 */

import { existsSync } from 'fs';
import { mkdir, writeFile, copyFile, readFile } from 'fs/promises';
import { dirname, join, basename } from 'path';

// ==================== Existence Checks ====================

/** Check if an asset exists at the given path */
export function assetExists(path: string): boolean {
  return existsSync(path);
}

/** Check if all assets in a list exist */
export function allAssetsExist(paths: string[]): boolean {
  return paths.every((path) => assetExists(path));
}

/** Filter out existing assets from a list */
export function filterMissingAssets(paths: string[]): string[] {
  return paths.filter((path) => !assetExists(path));
}

// ==================== File Operations ====================

/** Ensure a directory exists */
export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

/** Download a file from URL to local path */
export async function downloadAsset(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download asset: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await ensureDir(dirname(outputPath));
  await writeFile(outputPath, Buffer.from(buffer));
}

/** Copy a file to a new location */
export async function copyAsset(sourcePath: string, destPath: string): Promise<void> {
  await ensureDir(dirname(destPath));
  await copyFile(sourcePath, destPath);
}

/** Copy asset to a target folder, returning the filename */
export async function copyToFolder(
  sourcePath: string,
  targetDir: string,
  filename?: string
): Promise<string> {
  const targetFilename = filename || basename(sourcePath);
  const destPath = join(targetDir, targetFilename);
  await copyAsset(sourcePath, destPath);
  return targetFilename;
}

// ==================== Asset Path Helpers ====================

/** Generate standard asset paths for a segment by index */
export function getSegmentAssetPaths(
  outputDir: string,
  segmentIndex: number
): { framePath: string; videoPath: string } {
  return {
    framePath: join(outputDir, `frame-${segmentIndex + 1}.png`),
    videoPath: join(outputDir, `video-${segmentIndex + 1}.mp4`),
  };
}

/** Generate all asset paths for a multi-segment project */
export function getReelAssetPaths(
  outputDir: string,
  segmentCount: number
): { frames: string[]; videos: string[] } {
  const frames: string[] = [];
  const videos: string[] = [];

  for (let i = 0; i < segmentCount; i++) {
    const paths = getSegmentAssetPaths(outputDir, i);
    frames.push(paths.framePath);
    videos.push(paths.videoPath);
  }

  return { frames, videos };
}

// ==================== Cache Manifest ====================

interface CacheManifest {
  generatedAt: string;
  segments: Array<{
    index: number;
    imagePrompt: string;
    cameraPrompt: string;
    framePath: string;
    videoPath: string;
    imageUrl?: string;
    videoUrl?: string;
  }>;
  totalCost: number;
}

/** Save cache manifest for a generation session */
export async function saveCacheManifest(outputDir: string, manifest: CacheManifest): Promise<void> {
  const manifestPath = join(outputDir, 'manifest.json');
  await ensureDir(outputDir);
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

/** Load cache manifest if it exists */
export async function loadCacheManifest(outputDir: string): Promise<CacheManifest | null> {
  const manifestPath = join(outputDir, 'manifest.json');

  if (!assetExists(manifestPath)) return null;

  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as CacheManifest;
  } catch {
    return null;
  }
}

// ==================== URL Management ====================

/** Replicate URLs expire after ~1 hour; we cache for 50 minutes */
const URL_EXPIRY_MS = 50 * 60 * 1000;

interface UrlCache {
  [localPath: string]: {
    url: string;
    cachedAt: string;
    expiresAt: string;
  };
}

/** Save URL cache for a session */
export async function saveUrlCache(outputDir: string, urlCache: UrlCache): Promise<void> {
  const cachePath = join(outputDir, '.url-cache.json');
  await ensureDir(outputDir);
  await writeFile(cachePath, JSON.stringify(urlCache, null, 2));
}

/** Load URL cache */
export async function loadUrlCache(outputDir: string): Promise<UrlCache | null> {
  const cachePath = join(outputDir, '.url-cache.json');

  if (!assetExists(cachePath)) return null;

  try {
    const content = await readFile(cachePath, 'utf-8');
    return JSON.parse(content) as UrlCache;
  } catch {
    return null;
  }
}

/** Get cached URL if still valid (not expired) */
export async function getCachedUrl(outputDir: string, localPath: string): Promise<string | null> {
  const urlCache = await loadUrlCache(outputDir);

  if (!urlCache?.[localPath]) return null;

  const entry = urlCache[localPath];
  if (Date.now() > new Date(entry.expiresAt).getTime()) return null;

  return entry.url;
}

/** Cache a URL for a local path */
export async function cacheUrl(outputDir: string, localPath: string, url: string): Promise<void> {
  const urlCache = (await loadUrlCache(outputDir)) ?? {};
  const now = new Date();

  urlCache[localPath] = {
    url,
    cachedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + URL_EXPIRY_MS).toISOString(),
  };

  await saveUrlCache(outputDir, urlCache);
}
