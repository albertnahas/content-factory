import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Idea, IdeasBank, ContentFormat } from './types.js';

function getBankPath(projectRoot?: string): string {
  return join(projectRoot || process.cwd(), 'ideas-bank.json');
}

export function loadIdeasBank(projectRoot?: string): IdeasBank {
  const bankPath = getBankPath(projectRoot);
  if (!existsSync(bankPath)) {
    return { ideas: [], lastUpdated: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(bankPath, 'utf-8'));
}

export function saveIdeasBank(bank: IdeasBank, projectRoot?: string): void {
  const bankPath = getBankPath(projectRoot);
  bank.lastUpdated = new Date().toISOString();
  writeFileSync(bankPath, JSON.stringify(bank, null, 2));
}

export function getAvailableIdeas(
  bank: IdeasBank,
  options?: {
    format?: ContentFormat;
    category?: string;
    priority?: 'normal' | 'high' | 'banger';
    minSuitability?: 'low' | 'medium' | 'high';
    limit?: number;
  }
): Idea[] {
  const suitabilityRank = { low: 1, medium: 2, high: 3 };
  let filtered = bank.ideas;

  if (options?.format) {
    filtered = filtered.filter((idea) => !idea.generationStatus[options.format!]);
  }

  if (options?.category) {
    filtered = filtered.filter((idea) => idea.category === options.category);
  }

  if (options?.priority) {
    filtered = filtered.filter((idea) => idea.priority === options.priority);
  }

  if (options?.format && options?.minSuitability) {
    const minRank = suitabilityRank[options.minSuitability];
    filtered = filtered.filter((idea) => {
      const suit = idea.contentFormats[options.format!];
      return suit && suitabilityRank[suit.suitability] >= minRank;
    });
  }

  const priorityRank = { banger: 3, high: 2, normal: 1 };
  filtered.sort((a, b) => {
    const pDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (pDiff !== 0) return pDiff;
    if (options?.format) {
      const aSuit = a.contentFormats[options.format]?.suitability || 'low';
      const bSuit = b.contentFormats[options.format]?.suitability || 'low';
      return suitabilityRank[bSuit] - suitabilityRank[aSuit];
    }
    return 0;
  });

  if (options?.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function markIdeaAsUsed(
  bank: IdeasBank,
  slug: string,
  format: ContentFormat,
  projectRoot?: string
): boolean {
  const idea = bank.ideas.find((i) => i.slug === slug);
  if (!idea) return false;
  idea.generationStatus[format] = new Date().toISOString();
  saveIdeasBank(bank, projectRoot);
  return true;
}

export function getCategoryStats(
  bank: IdeasBank
): Record<string, { total: number; available: Record<string, number> }> {
  const stats: Record<string, { total: number; available: Record<string, number> }> = {};

  for (const idea of bank.ideas) {
    if (!stats[idea.category]) {
      stats[idea.category] = { total: 0, available: {} };
    }
    stats[idea.category].total++;

    for (const [format, status] of Object.entries(idea.generationStatus)) {
      if (!stats[idea.category].available[format]) {
        stats[idea.category].available[format] = 0;
      }
      if (!status) {
        stats[idea.category].available[format]++;
      }
    }
  }

  return stats;
}

export function printBankSummary(bank: IdeasBank): string {
  const stats = getCategoryStats(bank);
  const lines = [`Ideas Bank: ${bank.ideas.length} ideas (updated: ${bank.lastUpdated})`, ''];

  for (const [category, data] of Object.entries(stats)) {
    const available = Object.entries(data.available)
      .map(([f, c]) => `${f}: ${c}`)
      .join(', ');
    lines.push(`  ${category}: ${data.total} total (available: ${available || 'none'})`);
  }

  return lines.join('\n');
}
