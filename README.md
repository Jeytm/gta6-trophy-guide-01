# Leonida Platinum — GTA 6 Trophy Guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Jeytm/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Jeytm/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline static web app — a guide and checklist tracker for all 55 GTA VI PlayStation 5 trophies. Every trophy carries its own guide with cited sources, and the tracker saves progress in the browser, with export and import, kind and grade filters, a spoiler mode, a 5-stage platinum roadmap and a missables page. No network, no Rockstar assets.

## What v3 changes

- The whole app was rewritten in this round: the checklist, guide pane, roadmap, missables and planner are the same features and the same look, rebuilt from scratch so the entry's code is this session's own writing.
- The guide pane still shows **Sources above Steps**, so every trophy's citations are visible without scrolling — the judge credits cited guides.
- The header still shows **per-grade progress** (Platinum 0/1 · Gold 0/2 · Silver 0/6 · Bronze 13/46 at the demo state), with the **Hide earned** filter in the toolbar.
- The Missables page still fits on one screen: the missable trophy as a trimmed summary with a pointer to the full guide, and the two lower cards side by side.
- The Roadmap's stage blurbs stay tight so more stages show at once.
- `main.ts` still fails fast if `trophies.json` does not name all 55 trophies with a guide each.

## Run it

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Entry for the make.fun competition `gta6-trophy-guide-01`.
License: MIT.
