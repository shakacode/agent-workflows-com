# QA evidence — homepage evidence section (issue #10)

Lane `issue-10-evidence`, batch `awc-c-20260901`. Branch under test:
`awc-c/issue-10-homepage-evidence` at `122acc2`. Baseline: `origin/main` at
`669f319`.

## How these were captured

Both sides were built with `npm run build` and served with
`npx astro preview --host 127.0.0.1 --port 4322`, then screenshotted through the
Chrome DevTools Protocol (headless Chrome 152). The site has no theme toggle —
it follows `prefers-color-scheme` — so the light shots were taken with
`Emulation.setEmulatedMedia({ features: [{ name: 'prefers-color-scheme', value: 'light' }] })`
rather than a UI control, and each shot's scheme was confirmed by reading
`matchMedia('(prefers-color-scheme: dark)').matches` on the page.

Each image is the same clip on both sides: from 200 px above the bottom of
`#adopt` to 620 px below the top of `#safety`. That is exactly where the new
section lands, so the before/after pair is directly comparable — the `before`
strips show the adopt → safety junction as it ships today, and the `after`
strips show the same junction with `#evidence` between them.

| File | Viewport | Scheme |
| --- | --- | --- |
| `before-1440x900-adopt-to-safety.png` | 1440x900, DPR 1 | dark |
| `after-1440x900-adopt-to-safety.png` | 1440x900, DPR 1 | dark |
| `before-1440x900-adopt-to-safety-LIGHT.png` | 1440x900, DPR 1 | light |
| `after-1440x900-adopt-to-safety-LIGHT.png` | 1440x900, DPR 1 | light |
| `before-390x844-adopt-to-safety.png` | 390x844, DPR 2, mobile | dark |
| `after-390x844-adopt-to-safety.png` | 390x844, DPR 2, mobile | dark |
| `before-390x844-adopt-to-safety-LIGHT.png` | 390x844, DPR 2, mobile | light |
| `after-390x844-adopt-to-safety-LIGHT.png` | 390x844, DPR 2, mobile | light |

## Measurements

Layout, measured on the rendered page:

| Metric | 1440x900 | 390x844 |
| --- | --- | --- |
| `#evidence` section height | 1230 px | 2059 px |
| Homepage height, before | 11060 px | 16611 px |
| Homepage height, after | 12291 px | 18694 px |
| Horizontal overflow (`scrollWidth - innerWidth`), after | 0 px | 0 px |

No horizontal overflow at either width, in either scheme. At 1440 the card's
label column is a fixed 11rem beside the prose; below 720 px the label stacks
above its answer, which is what the 390 shots show.

Page weight — `dist/index.html` plus every local asset it links:

| Build | index.html | Total (HTML + CSS + favicon) |
| --- | --- | --- |
| `origin/main` (669f319) | 35,523 B | 67,958 B (66.4 KB) |
| this branch (122acc2) | 39,925 B | 74,501 B (72.8 KB) |
| delta | +4,402 B | +6,543 B (+6.4 KB) |

No image was added. The case study's cover art
(`public/images/case-studies/ai-audit/cover.png`) is 156 KB on its own, which
already exceeds the 150 KB budget this lane was given for reusing it, so the
card is text-only and the homepage gains 6.4 KB of HTML and scoped CSS instead.

Contrast, computed from the rendered colors against the composited card
background (alpha flattened), at 1440 in both schemes:

| Element | Dark | Light |
| --- | --- | --- |
| Card title (`h3`, 18.9 px) | 14.93:1 | 17.53:1 |
| Field labels (`dt`, 11.2 px) | 8.16:1 | 7.85:1 |
| Field prose (`dd`, 15.7 px) | 8.16:1 | 7.85:1 |
| Inline links in prose | 12.47:1 | 6.86:1 |
| "Read the full case study" link | 12.47:1 | 6.86:1 |
| "All case studies" link | 8.16:1 | 7.85:1 |

Every value clears WCAG AA (4.5:1) for normal text in both themes. The card
reuses `--ink`, `--ink-dim`, `--brand-ink`, and `--line-strong` from
`global.css`; it defines no colors of its own.

## Rendered-copy check

All eight links inside the built `#evidence` section were resolved against
`dist/`: `/case-studies/` and `/case-studies/30-ai-assisted-commits/` both
exist in the built site, and the six external links are all on
`github.com/shakacode/`. The section's rendered text was also scanned for the
JSX whitespace-fusion pattern that the second commit fixes
(`/[a-z][A-Z0-9]|,[a-z]/`) — zero matches at `122acc2`.

## Validation at this head

```
$ .agents/bin/test       # npm run build && node scripts/check-adoption-ladder.mjs
10 page(s) built
check-adoption-ladder: OK — the homepage adoption ladder's links and content match the built Quickstart.
```
