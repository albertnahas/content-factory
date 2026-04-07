---
name: marketing-plan
description: Create a full marketing plan for any project — market research, positioning, funnel strategy, content roadmap, channel mix, and KPIs. Triggers on "marketing plan", "marketing strategy", "go-to-market", "GTM plan", "marketing roadmap", "how to market this", or when a user needs a comprehensive marketing blueprint for a product or service.
---

# Full Marketing Plan — SOSTAC + Content Factory

Generate a comprehensive, research-backed marketing plan using the SOSTAC framework (Situation, Objectives, Strategy, Tactics, Action, Control) integrated with content-factory production capabilities.

## How to Use This Skill

When invoked, execute all 6 phases sequentially. Each phase produces a section of the final marketing plan document. The output is a single markdown file saved to the project's output directory.

---

## Phase 1: Situation Analysis

Research extensively before writing anything. Use web search, competitor analysis, and user input.

### 1.1 Product Audit

Extract from user input and project files:

- **Product**: What it does, core value proposition, pricing model
- **Current state**: Existing users, revenue, traction, testimonials
- **Assets**: Website, social accounts, email list, content library

### 1.2 Market Research

Use web search to gather:

- **Market size**: TAM, SAM, SOM with sources
- **Growth rate**: CAGR and trajectory
- **Key trends**: What's changing in this space right now
- **Regulatory/compliance**: Anything that constrains marketing

### 1.3 Customer Research

Define 2-3 customer segments using the Jobs-to-Be-Done framework:

| Segment | Job to Be Done | Pain (current alternative) | Desired Outcome |
|---------|----------------|---------------------------|-----------------|
| Name | "When I [situation], I want to [motivation], so I can [outcome]" | What they use now and why it fails | Measurable success state |

For each segment, identify:
- **Demographics**: Age, role, income, location
- **Psychographics**: Values, fears, aspirations, identity
- **Watering holes**: Where they spend time online (subreddits, newsletters, communities, podcasts)
- **Buying triggers**: What event makes them search for a solution
- **Objections**: Top 3 reasons they wouldn't buy

### 1.4 Competitive Landscape

Research 3-5 direct competitors and 2-3 indirect alternatives:

| Competitor | Positioning | Pricing | Strengths | Weaknesses | Market Share |
|-----------|-------------|---------|-----------|------------|-------------|
| Name | Their tagline/angle | Model + price | What they do well | Where they fall short | Est. % |

Identify the **strategic gap** — what no competitor owns that this product can credibly claim.

### 1.5 SWOT Summary

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | Strengths | Weaknesses |
| **External** | Opportunities | Threats |

---

## Phase 2: Objectives

Set SMART goals across three time horizons.

### 2.1 North Star Metric

Define one metric that best captures value delivery:
- **Metric**: e.g., "Monthly active projects generating content"
- **Current**: baseline value
- **Target**: 90-day, 6-month, 12-month targets

### 2.2 Goal Hierarchy

| Timeframe | Awareness Goal | Acquisition Goal | Activation Goal | Revenue Goal |
|-----------|---------------|-----------------|-----------------|-------------|
| 30 days | X visitors/mo | Y signups | Z activated | $R MRR |
| 90 days | ... | ... | ... | ... |
| 12 months | ... | ... | ... | ... |

### 2.3 Funnel Metrics

Define target conversion rates for each funnel stage:

```
Awareness → Interest:     X% (content engagement rate)
Interest → Consideration: X% (site visit → signup)
Consideration → Trial:    X% (signup → first use)
Trial → Purchase:         X% (trial → paid)
Purchase → Advocacy:      X% (paid → referral)
```

---

## Phase 3: Strategy

### 3.1 Positioning Statement

Use the format:

> For [target segment] who [job to be done], [Product] is the [category] that [key differentiator] unlike [primary alternative] which [competitor weakness].

Test positioning against these filters:
- **Credible**: Can you prove it?
- **Differentiated**: Does anyone else claim this?
- **Relevant**: Does the customer care?
- **Durable**: Will this hold in 12 months?

### 3.2 Messaging Architecture

| Level | Message | Where Used |
|-------|---------|-----------|
| **Tagline** | 5-8 words, memorable | Logo lockup, social bios |
| **Value Prop** | 1 sentence, outcome-focused | Homepage hero, ad headlines |
| **Elevator Pitch** | 30 seconds, problem→solution→proof | Landing pages, pitch decks |
| **Full Narrative** | 2-3 paragraphs, story arc | About page, PR, long-form |

### 3.3 Brand Voice

Define along 4 dimensions:

| Dimension | This | Not That |
|-----------|------|----------|
| **Tone** | e.g., Confident | Arrogant |
| **Language** | e.g., Plain, direct | Jargon-heavy |
| **Humor** | e.g., Dry wit | Slapstick |
| **Perspective** | e.g., Peer/collaborator | Guru/authority |

### 3.4 Pricing Strategy

Evaluate using the Value-Based Pricing framework:

- **Reference price**: What do alternatives cost?
- **Differentiation value**: What's the $ value of what you do better?
- **Willingness to pay**: What did customer research reveal?
- **Recommended model**: Freemium / free trial / paid-only / usage-based
- **Price anchoring**: How to frame the price (per day, vs. alternative, ROI)

---

## Phase 4: Tactics

Map specific marketing tactics to each funnel stage. For each tactic, specify which content-factory capabilities and external skills to use.

### 4.1 Awareness Tactics

#### Organic Content (use content-factory commands)

| Tactic | Content Factory Tool | Frequency | Skill Reference |
|--------|---------------------|-----------|-----------------|
| Short-form video (Reels/TikTok/Shorts) | `/generate-reel`, `/generate-talking-character` | 4-5/week | `content-strategy`, `video-production` |
| Video ads for cold audiences | `/generate-ad`, `/generate-ugc-ad` | 2-3 variants/week | `ad-script-writing`, `gen-ai-media` |
| Educational carousels | `/generate-carousel` | 2-3/week | `content-strategy` |
| Product explainers | `/generate-product-decoded` | 1/week | `video-production` |
| Infographic posters | `/generate-infographic` | 1-2/week | `content-strategy` |

#### SEO & Content Marketing (use external skills)

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Site architecture planning | `/site-architecture` | Sitemap + URL hierarchy |
| SEO audit | `/seo-audit` | Technical fixes + on-page optimization |
| Programmatic SEO pages | `/programmatic-seo` | Template pages at scale |
| Schema markup | `/schema-markup` | JSON-LD structured data |
| AI search optimization | `/ai-seo`, `/llm-search-optimization` | LLM-friendly content |
| Competitor/alternative pages | `/competitor-alternatives` | vs. pages and alternative pages |
| Content strategy | `/content-strategy` | Topic clusters + editorial calendar |

#### Paid Acquisition (use external skills)

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Ad campaign planning | `/paid-ads` | Campaign structure, targeting, budgets |
| Ad creative generation | `/ad-creative` | Headlines, descriptions, variations |
| Screenshot ads for app stores | `/generate-screenshot-ad` | 3 static ad variants |

#### Community & PR

| Tactic | Approach | Deliverable |
|--------|----------|-------------|
| Product Hunt launch | `/launch-strategy` | Launch plan + assets |
| Cold outreach to partners | `/cold-email` | Email sequences |
| Social content calendar | `/social-content` | Platform-specific posts |

### 4.2 Acquisition Tactics

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Landing page copy | `/copywriting` | Hero, benefits, social proof, CTA |
| Landing page CRO | `/page-cro` | Conversion audit + improvements |
| Signup flow optimization | `/signup-flow-cro` | Friction reduction, progressive profiling |
| Form optimization | `/form-cro` | Lead capture improvements |
| Popup/modal strategy | `/popup-cro` | Exit intent, email capture |
| Free tool as lead magnet | `/free-tool-strategy` | Engineering-as-marketing tool |
| A/B testing plan | `/ab-test-setup` | Hypotheses + experiment design |

### 4.3 Activation Tactics

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Onboarding flow | `/onboarding-cro` | First-run experience, time-to-value |
| Welcome email sequence | `/email-sequence` | 5-7 email drip campaign |
| Analytics tracking | `/analytics-tracking` | GA4 + event tracking setup |

### 4.4 Revenue Tactics

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Pricing page optimization | `/pricing-strategy` | Tier design, anchoring, packaging |
| Upgrade/paywall screens | `/paywall-upgrade-cro` | In-app conversion flows |
| Sales collateral | `/sales-enablement` | One-pagers, objection handling |

### 4.5 Retention & Referral Tactics

| Tactic | Skill to Invoke | Deliverable |
|--------|----------------|-------------|
| Churn prevention | `/churn-prevention` | Cancel flow, save offers, dunning |
| Referral program | `/referral-program` | Incentive structure, viral loops |
| Email lifecycle | `/email-sequence` | Re-engagement, milestone, NPS |

---

## Phase 5: Action Plan

### 5.1 Execution Roadmap

Produce a 12-week phased roadmap:

#### Weeks 1-2: Foundation
- [ ] Finalize positioning and messaging (Phase 3 output)
- [ ] Set up analytics tracking (`/analytics-tracking`)
- [ ] Configure content-factory with brand identity (`content-factory.yaml`)
- [ ] Set up social accounts and Buffer integration
- [ ] Create SEO baseline (`/seo-audit`)

#### Weeks 3-4: Content Engine
- [ ] Populate Ideas Bank with 30+ verified ideas (`/generate-ideas`)
- [ ] Produce first batch: 5 reels, 3 carousels, 2 ads
- [ ] Set up posting cadence (per `content-strategy` skill)
- [ ] Write landing page copy (`/copywriting`)
- [ ] Implement schema markup (`/schema-markup`)

#### Weeks 5-6: Acquisition
- [ ] Launch landing page with CRO best practices (`/page-cro`)
- [ ] Set up signup flow (`/signup-flow-cro`)
- [ ] Create lead magnet or free tool (`/free-tool-strategy`)
- [ ] Write welcome email sequence (`/email-sequence`)
- [ ] Start organic posting at full cadence

#### Weeks 7-8: Amplification
- [ ] Launch paid ads with 3 creative variants (`/paid-ads`, `/ad-creative`)
- [ ] Create competitor comparison pages (`/competitor-alternatives`)
- [ ] Begin programmatic SEO (`/programmatic-seo`)
- [ ] Run first A/B test (`/ab-test-setup`)

#### Weeks 9-10: Optimization
- [ ] Analyze funnel metrics, identify drop-off points
- [ ] Optimize top-performing content formats (double down)
- [ ] CRO pass on signup and onboarding (`/signup-flow-cro`, `/onboarding-cro`)
- [ ] Launch referral program (`/referral-program`)

#### Weeks 11-12: Scale
- [ ] Scale paid budget on winning creatives
- [ ] Plan Product Hunt or major launch (`/launch-strategy`)
- [ ] Set up churn prevention flows (`/churn-prevention`)
- [ ] Review all KPIs against Phase 2 goals
- [ ] Plan next quarter based on learnings

### 5.2 Resource Requirements

| Resource | Monthly Estimate | Notes |
|----------|-----------------|-------|
| Content-factory generation costs | $X | Based on cadence x cost-per-unit |
| Paid ad spend | $X | Start small, scale winners |
| Tools/subscriptions | $X | Analytics, email, social tools |
| Time investment | X hrs/week | Content review, strategy, optimization |

### 5.3 Content Production Calendar

Map the first 4 weeks day-by-day:

| Day | Format | Category | Content Factory Command | Idea Source |
|-----|--------|----------|------------------------|-------------|
| Mon | Reel | Shock | `/generate-reel` | Ideas Bank |
| Tue | Carousel | Authority | `/generate-carousel` | Ideas Bank |
| Wed | Reel | Utility | `/generate-reel` | Ideas Bank |
| Thu | Ad | Aspiration | `/generate-ad` | Brief |
| Fri | Reel | Curiosity | `/generate-reel` | Ideas Bank |
| Sat | Infographic | Authority | `/generate-infographic` | Ideas Bank |
| Sun | — | — | — | Rest / plan next week |

Follow the category rotation rules from the `content-strategy` skill: never repeat the same category on consecutive days, prioritize bangers on Tue-Thu.

---

## Phase 6: Control

### 6.1 KPI Dashboard

Track weekly:

| Metric | Source | Target | Current |
|--------|--------|--------|---------|
| Impressions | Social analytics | X/week | — |
| Engagement rate | Social analytics | X% | — |
| Website visitors | GA4 | X/week | — |
| Signup conversion | GA4 | X% | — |
| Activation rate | Product analytics | X% | — |
| MRR | Stripe/billing | $X | — |
| CAC | Ad spend / new customers | $X | — |
| LTV:CAC ratio | Calculated | >3:1 | — |
| Content cost per piece | Cost tracker | $X | — |

### 6.2 Review Cadence

| Frequency | Review |
|-----------|--------|
| Daily | Content performance (impressions, saves, shares) |
| Weekly | Funnel metrics, ad performance, content calendar adherence |
| Bi-weekly | A/B test results, CRO experiments |
| Monthly | Full KPI review, budget reallocation, strategy adjustments |
| Quarterly | Strategic review against Phase 2 objectives |

### 6.3 Decision Triggers

Define when to pivot:

| Signal | Action |
|--------|--------|
| Content format consistently >2x avg engagement | Double production frequency |
| Content format consistently <50% avg engagement | Pause, diagnose, or drop |
| CAC > LTV/3 on a channel | Pause spend, investigate |
| Signup → activation <20% | Prioritize onboarding CRO |
| Churn >5%/month | Activate churn prevention flows |
| Organic ranking on target keywords | Shift budget from paid to content |

---

## Output Format

Save the completed marketing plan as:

```
{output_dir}/marketing-plan-{product-slug}-{YYYY-MM-DD}.md
```

Include all 6 phases as sections. Use tables for structured data. Include sources for all market research claims. Link to specific content-factory commands and skills throughout.

## Quality Checklist

Before finalizing the plan, verify:

- [ ] All market research claims have sources with dates
- [ ] Customer segments use Jobs-to-Be-Done format (not demographics-only)
- [ ] Positioning passes all 4 filters (credible, differentiated, relevant, durable)
- [ ] Every funnel stage has at least 2 tactics with specific skill references
- [ ] Roadmap has concrete deliverables, not vague goals
- [ ] KPIs are measurable with identified data sources
- [ ] Budget estimates are realistic for the project's stage
- [ ] Content calendar follows category rotation rules
- [ ] Decision triggers define specific thresholds, not subjective judgments
