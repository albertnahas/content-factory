---
description: Research and populate the Ideas Bank with verified, high-quality content ideas for any configured category
---

Read `content-factory.yaml` from the project root to load brand context. Extract `brand.name`, `brand.tagline`, `content.categories`, and `output` paths. The Ideas Bank is located at `ideas-bank/ideas-bank.json`.

## Cost Estimate

This command uses no paid AI generation APIs. Cost: **free**.

---

## Step 1 — Analyze the Current Ideas Bank

Run the Ideas Bank CLI to get a summary of what already exists:

```bash
npx content-factory ideas list --summary
```

This outputs category statistics including total ideas, used count, available count, and priority breakdown.

From the summary, identify:
- Categories with **fewer than 10 available ideas** → need replenishment
- Categories with **0 banger-priority ideas** → need high-impact content
- Formats that are **underrepresented** (reel, ugc, carousel, ad, etc.)

If the user specified a category, focus only on that category. Otherwise, prioritize the most depleted categories.

---

## Step 2 — Identify Gaps

For each target category, run:
```bash
npx content-factory ideas list --category {category_slug} --json
```

Review existing idea slugs and topics to avoid duplication. Note:
- Topics already covered (never repeat the same angle)
- Engagement patterns in the brand's niche
- Seasonal or trending opportunities

Document the gaps as a list of **topic areas** that are not yet represented.

---

## Step 3 — Research Trending Topics

For each gap area, research current trends in the brand's domain.

Research sources to check (in order of authority):
1. **Platform trends**: TikTok Discover, Instagram Explore, YouTube Trending for the niche
2. **Google Trends**: Compare relative search interest for topic variations
3. **Reddit**: Browse subreddits relevant to the brand's audience for common questions
4. **Quora/Stack forums**: Find frequently asked questions in the domain
5. **Competitor content**: What formats and topics get the most engagement

For each potential topic, evaluate:
- Is it **searchable**? (people actively look for this)
- Is it **surprising**? (the answer isn't immediately obvious)
- Is it **actionable**? (viewer can do something with the info)
- Is it **brand-relevant**? (connects to what the brand offers)

---

## Step 4 — Verify Facts from Authoritative Sources

Every idea that includes data points, statistics, or claims MUST be verified before adding to the bank.

Verification tiers:
- **Tier 1 (gold)**: Peer-reviewed study, government data, industry report → `verified: true`, `source_tier: "primary"`
- **Tier 2 (silver)**: Major publication citing a study, well-known organization → `verified: true`, `source_tier: "secondary"`
- **Tier 3 (unverified)**: Common knowledge, community consensus → `verified: false` — flag for manual review

For unverified ideas, add a `verification_note` explaining what needs checking before use.

Do not add ideas with false or misleading claims. Brand credibility depends on accuracy.

---

## Step 5 — Create Idea Objects

For each researched and verified idea, create an idea object following this schema:

```typescript
interface Idea {
  /** Unique URL-friendly identifier */
  slug: string;
  /** Human-readable title */
  title: string;
  /** The category from content.categories in config */
  category: string;
  /** Content format this idea is best suited for */
  format: 'reel' | 'ugc' | 'carousel' | 'ad' | 'talking-character' | 'infographic';
  /** Priority based on engagement potential */
  priority: 'banger' | 'solid' | 'filler';
  /** The hook — the most compelling single sentence */
  hook: string;
  /** Key data points or facts used in the content (verified) */
  data_points: Array<{
    claim: string;
    value?: string;
    source?: string;
    verified: boolean;
  }>;
  /** Brief description of the content angle */
  description: string;
  /** Usage tracking */
  used: boolean;
  used_formats: string[];
  /** ISO timestamp */
  created_at: string;
}
```

### Priority Evaluation Criteria

| Priority | Criteria |
|----------|----------|
| `banger` | Surprising stat/fact, contradicts common belief, high share potential, emotionally resonant |
| `solid` | Useful and accurate, moderate surprise factor, good for regular posting |
| `filler` | True and relevant but not remarkable, use only when higher-priority ideas are depleted |

Aim for at least 30% banger priority in each replenishment batch.

### Slug Format

- Lowercase, hyphen-separated, descriptive
- Include category prefix: `{category_slug}-{topic}`
- Examples: `tips-triple-output-method`, `myth-morning-routine-debunked`
- Must be unique across the entire ideas bank

### Hook Writing Rules

The hook is the most critical field. It must:
- Be a single sentence (max 15 words)
- Create immediate curiosity or state a surprising fact
- NOT reveal the answer
- Work as the opening line of a reel or carousel

Bad hook: "Here are some tips about {topic}"
Good hook: "The #1 thing everyone gets wrong about {topic}"
Great hook: "{surprising_fact} — and most people don't know why"

---

## Step 6 — Add to Ideas Bank

Write a Node.js script to add the new ideas to the bank. Import from the ideas-bank utilities:

```typescript
import { addIdeas } from '../ideas-bank/utils.js';

const newIdeas: Idea[] = [
  // ... your researched ideas
];

await addIdeas(newIdeas);
console.log(`Added ${newIdeas.length} ideas to the bank`);
```

Run the script from the project root:
```bash
node --loader ts-node/esm scripts/add-ideas.ts
```

Or if the project uses CommonJS:
```bash
npx ts-node scripts/add-ideas.ts
```

---

## Step 7 — Verify and Report

After adding ideas, verify the bank was updated correctly:

```bash
npx content-factory ideas list --summary
```

Confirm the counts increased as expected.

Report the results:

```
Ideas Bank Replenishment Complete
==================================
Category: {category_slug}
Ideas added: {n}
  - Bangers: {banger_count}
  - Solid: {solid_count}
  - Filler: {filler_count}

Format breakdown:
  - Reel: {n}
  - Carousel: {n}
  - UGC: {n}
  - etc.

Verification status:
  - Fully verified (Tier 1+2): {n}
  - Needs verification: {n} (flagged)

New total available: {total_available}
```

Flag any ideas marked `verified: false` for the user to review before use.

---

## Idea Quality Standards

Before adding any idea to the bank, run it through this checklist:

- [ ] Hook is genuinely surprising or provocative — not generic
- [ ] All data points have a source cited (even if just "per {source}")
- [ ] Slug is unique (no duplicate in the bank)
- [ ] Category matches one of the configured categories in `content.categories`
- [ ] Format is the most natural fit for this content type
- [ ] Priority is honest — not inflated to "banger" when it's "solid"
- [ ] Description gives enough context to generate the content without further research
- [ ] No claims that could mislead or harm the audience

## Quality Checklist

- [ ] Current bank analyzed before adding ideas (no duplicates)
- [ ] Each idea verified from an authoritative source where applicable
- [ ] At least 30% of new ideas rated `banger` priority
- [ ] Hooks follow the curiosity-gap formula (no reveals)
- [ ] All formats represented in the batch
- [ ] Ideas added via script (not manual JSON editing)
- [ ] Summary report generated after addition
- [ ] Unverified ideas flagged for review
