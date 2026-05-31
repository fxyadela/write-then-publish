# Niche AI Signal Radar

This guide defines the daily high-signal radar. The goal is not to collect more AI news. The goal is to find a small number of early, useful, content-worthy signals before they become mainstream summaries.

## Source Mix

Use these source classes in this order:

1. Independent and company blogs/RSS
   - AI engineering blogs, research blogs, founder blogs, product changelogs, niche newsletters.
   - Prefer first-party sources and posts with concrete demos, technical detail, benchmarks, or product changes.
2. GitHub AI projects
   - New or fast-growing AI/ML/LLM/agent/multimodal repos.
   - Prefer projects with a clear demo, unusual workflow, strong README, recent commits, and creator discussion.
3. ArXiv and research papers
   - Focus on papers that can become a product, workflow, explainer, benchmark, or creator-friendly story.
   - Do not push pure paper lists. Extract the practical content angle.
4. Builder and creator signals
   - X posts, podcasts, YouTube, Hacker News, Show HN, Product Hunt.
   - Use these mainly as second-order validation, not as the only source.
5. Mainstream news
   - Use only when it changes distribution, regulation, funding, platform access, model availability, or user behavior.

## Default Queries

Rotate these themes instead of searching generic "AI news":

- AI agents that changed a real workflow
- AI coding tools with a demo or repo
- multimodal AI products and hardware
- robotics, embodied AI, and edge devices
- open-source models and inference tools
- creator tools for video, images, audio, and design
- AI search, browser agents, and personal knowledge workflows
- evaluation, benchmarks, reliability, security, prompt injection
- papers with direct product implications

## Scoring

Score every candidate on a 10-point scale:

- Novelty: 0-2
- Practical usefulness: 0-2
- Source quality: 0-2
- Content potential for Xiaohongshu: 0-2
- Risk-adjusted clarity: 0-2

Exclude anything below 7. Only include P3 if it is a watchlist item, not a push-worthy item.

Priority:

- P1: worth making content within 24 hours
- P2: worth saving or tracking
- P3: watch only, no push unless it develops

## Output Rules

Keep the digest short. The user should be able to scan it in under two minutes.

### Two-layer output (avoid over-centralizing judgment)

The radar has two layers so the user can apply their own filter:

- **Layer A — Included signals (>= 7.0/10)**: what the radar formally includes.
  - P1/P2/P3 caps still apply.
- **Layer B — Candidate pool (6.0–6.9/10)**: not included, but kept for user review.
  - Cap: **max 10** items.
  - Provide original links + score breakdown + 1-line why it missed 7.
  - Do not “package” these into strong claims.

Do not list anything below 6.0 unless explicitly requested.

For each included item:

- Priority: P1/P2/P3
- Signal type: blog/RSS, GitHub, paper, builder, product, funding, controversy, hardware, robotics
- Propagation test title: a short Chinese hook for screening only
- Core fact: one factual sentence
- Original source link
- Why it matters
- Visual/material angle
- Risk or verification gap
- Score

### Score transparency

Always provide the score breakdown using the same 5 dimensions (0–2 each):

- Novelty (0–2)
- Practical usefulness (0–2)
- Source quality (0–2)
- Xiaohongshu content potential (0–2)
- Risk-adjusted clarity (0–2)

Do not generate a full publishing title set unless the user later selects an item.

## Persistence

Save the digest using Asia/Shanghai date:

- Markdown file under `outputs/niche_signal_radar/YYYY-MM-DD/YYYY-MM-DD_小众AI信号雷达.md`
- If Obsidian is writable, also save to `/Users/iamcora/Documents/Obsidian Vault/资讯雷达/AI科技/YYYY-MM-DD/`
- If IMA is reachable, push the same digest into the `AI资讯` folder or knowledge base.

If Obsidian or IMA fails, keep the local output and report the failure briefly.
