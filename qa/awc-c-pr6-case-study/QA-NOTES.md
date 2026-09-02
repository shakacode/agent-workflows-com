# QA evidence — PR #6 integration (lane awc-c-pr6-case-study)

Head under test: `961f515e6e030a609dccc08bf02bffea78f421d3` on `jg-codex/ai-workflow-audit-case-study`
(merge `7b2c32d` of `origin/main` @ `dfdde7e` + `961f515` nav tier).

Method: `npm run build` + `npx astro preview --host 127.0.0.1 --port 4311`, headless Chrome 152
(`--headless=new`, lane-private profile), measured over CDP. Header crops at DPR 2; page shots at DPR 1.
Raw numbers: `measurements.json` (nav + images) and `nav-measurements.json` (nav with/without the new link).

## 1. Canonical URLs (dist, 10 pages)

Exactly one page emits a foreign canonical; the other nine self-reference against `Astro.site`:

```
https://shakacode.com/blog/audit-30-ai-assisted-commits/   <- /case-studies/30-ai-assisted-commits/
https://agents.shakacode.com/                              <- every other page (9)
https://agents.shakacode.com/case-studies/
https://agents.shakacode.com/docs/  /docs/architecture/  /docs/distributions/
https://agents.shakacode.com/docs/quickstart/  /docs/terminology/  /docs/throughput/
https://agents.shakacode.com/methodology/
```

`og:url` tracks `canonical` on all 10 pages (the case study's `og:url` is the ShakaCode URL — the
correct convention for cross-published content: shares resolve to the canonical original).

## 2. Header at 11 widths (case-study page)

`Case studies` was given `hide-sm hide-md`, so it drops with `Model` below 1000px.

| width | visible nav links | nav rows | link overlap | document h-overflow |
|---|---|---|---|---|
| 1440 | 10 (Model … Case studies, Docs, GitHub) | 1 | none | 0 |
| 1120 | 10 | 1 | none | 0 |
| 1024 | 9 (Distributions dropped) | 1 | none | 0 |
| 999  | 7 (Model + Case studies dropped) | 1 | none | 0 |
| 930  | 7 | 1 | none | 0 |
| 914  | 7 | 1 | none | 0 |
| 850  | 7 | 1 | none | 0 |
| 760  | 7 | 1 | none | 0 |
| 721  | 7 | 1 | none | 0 |
| 720  | 1 (GitHub) | 1 | none | 0 |
| 390  | 1 (GitHub) | 1 | none | 0 |

No wrap of the nav itself, no link/link collision, and no horizontal page overflow at any width.

### Finding: the tenth link wraps the brandmark at >=1000px (NOT fixed here)

`.wrap` caps at 1120px, so 1440 and 1120 measure identically. Measured with the `Case studies`
anchor toggled `display:none` (before) vs shown (after):

| width | brandmark lines before -> after | brandmark width | nav width | bar height |
|---|---|---|---|---|
| 1440 | 1 -> **2** | 344.5 -> 246.6 | 694.9 -> 805.4 | 62 -> 62 |
| 1120 | 1 -> **2** | 344.5 -> 246.6 | 694.9 -> 805.4 | 62 -> 62 |
| 1024 | 1 -> **2** | 344.5 -> 269.0 | 576.5 -> 687.0 | 62 -> 62 |
| 999 and below | unchanged (link is hidden) | — | — | — |

`Agent Workflow Playbook / ShakaCode` breaks onto two lines at every desktop width:
`before-1440x62-header.png` vs `after-1440x62-header.png` (same for 1120 and 1024).

Root cause is not the tier choice — no tier keeps the link visible without this, because `.brandmark`
(`src/styles/global.css:163`) is a shrinkable flex item with no `white-space: nowrap` / `flex-shrink: 0`,
so the nav takes width from it. `global.css` is outside this lane's owned paths and the header lane
(issues #16/#19) owns the fix; recorded here as its input.

Separately reproduced and **pre-existing** (identical before and after the new link): the brandmark
already wraps to 2 lines at 930/914/850, 3 lines at 760, and 4 lines at 721 — the 721-913px band
that lane already owns.

## 3. Case-study images

Six PNGs, all inside the content column, all with non-empty `alt`, no overflow at either width.

| viewport | content column | doc h-overflow | rendered | worst overflow |
|---|---|---|---|---|
| 1440 | 340..1100 (760px) | 0 | 712px wide each | 0 |
| 390 | 0..390 (390px) | 0 | 342px wide each | 0 |

Natural vs rendered (1440): cover 1600x900 -> 712x401; audit-distribution / commit-noise /
two-controls 1200x675 -> 712x401; review-finding-final-retry 800x235 -> 712x209;
review-finding-transient-failure 800x545 -> 712x485.

Page weight of the six PNGs: **998,797 bytes (975 KiB)**.

| file | bytes |
|---|---|
| review-finding-transient-failure.png | 379,767 |
| cover.png | 155,692 |
| two-controls.png | 140,551 |
| review-finding-final-retry.png | 128,718 |
| audit-distribution.png | 99,744 |
| commit-noise.png | 94,325 |

`review-finding-transient-failure.png` is the heaviest file and the least dense
(800x545 natural for a 712px render — ~1.1x, so it is the only one that will look soft on a
2x display). Not changed here; noted as a follow-up candidate.

## Screenshots

- `after-1440x900-case-study.png`, `after-390x844-case-study.png` — case study, above the fold
- `after-1440-case-study-full.png`, `after-390-case-study-full.png` — case study, full page
- `after-1440x900-index.png`, `after-390x844-index.png` — /case-studies/ index
- `before-*x62-header.png` / `after-*x62-header.png` — header, without vs with the new link

## Validation at this head

```
.agents/bin/validate  -> exit 0 (astro build, 10 pages)
.agents/bin/test      -> exit 0 (build + check-adoption-ladder: OK)
```
