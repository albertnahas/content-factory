import { loadIdeasBank, getAvailableIdeas, markIdeaAsUsed, printBankSummary } from './store.js';
import type { ContentFormat } from './types.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  const bank = loadIdeasBank();

  const isSummary = args.includes('--summary');
  if (isSummary) {
    console.log(printBankSummary(bank));
    process.exit(0);
  }

  const format = args.find((_, i) => args[i - 1] === '--format') as ContentFormat | undefined;
  const category = args.find((_, i) => args[i - 1] === '--category');
  const priority = args.find((_, i) => args[i - 1] === '--priority') as
    | 'normal'
    | 'high'
    | 'banger'
    | undefined;
  const suitability = args.find((_, i) => args[i - 1] === '--suitability') as
    | 'low'
    | 'medium'
    | 'high'
    | undefined;
  const limitStr = args.find((_, i) => args[i - 1] === '--limit');
  const limit = limitStr ? parseInt(limitStr) : undefined;
  const isJson = args.includes('--json');

  const ideas = getAvailableIdeas(bank, {
    format,
    category,
    priority,
    minSuitability: suitability,
    limit,
  });

  if (isJson) {
    console.log(JSON.stringify(ideas, null, 2));
  } else {
    if (ideas.length === 0) {
      console.log('No matching ideas found.');
    } else {
      for (const idea of ideas) {
        const formats = Object.entries(idea.contentFormats)
          .filter(([, v]) => v.suitability !== 'low')
          .map(([k, v]) => `${k}:${v.suitability}`)
          .join(', ');
        console.log(`[${idea.priority.toUpperCase()}] ${idea.title}`);
        console.log(`  slug: ${idea.slug} | category: ${idea.category}`);
        console.log(`  formats: ${formats}`);
        console.log(`  hook: ${idea.hookAngle}`);
        console.log('');
      }
      console.log(`Showing ${ideas.length} idea(s)`);
    }
  }
} else if (command === 'mark') {
  const slug = args[1];
  const format = args.find((_, i) => args[i - 1] === '--format') as ContentFormat;

  if (!slug || !format) {
    console.error('Usage: ideas mark <slug> --format <format>');
    process.exit(1);
  }

  const bank = loadIdeasBank();
  const success = markIdeaAsUsed(bank, slug, format);

  if (success) {
    console.log(`Marked "${slug}" as used for format "${format}"`);
  } else {
    console.error(`Idea "${slug}" not found`);
    process.exit(1);
  }
} else {
  console.log('Usage:');
  console.log(
    '  ideas list [--format <format>] [--category <cat>] [--priority <p>] [--suitability <s>] [--limit <n>] [--summary] [--json]'
  );
  console.log('  ideas mark <slug> --format <format>');
}
