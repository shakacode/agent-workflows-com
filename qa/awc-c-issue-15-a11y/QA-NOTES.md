# QA evidence — issue #15 accessibility debt (lane `issue-15-a11y`, batch awc-c-20260901)

Branch under test: `awc-c/issue-15-a11y-debt` @ `e0d9c53`. Baseline: `main` @ `dfdde7e`.

Revised after review: the footer column titles are `<h2>`, not `<h3>` as at `8d91ceb`.
Both the independent checker and the Codex reviewer asked for this, so the footer
groups are peers of the page's content headings rather than subsections of
whichever `<h2>` came last, and so `/docs/` no longer skips `h1 -> h3`. The
rendered output is byte-identical to `8d91ceb` — all eight screenshots below
compare equal byte for byte across the two heads — so only the outline and the
footer title's tag name changed.

Method: `npm run build` + `astro preview --host 127.0.0.1 --port 4315`, then headless
Chrome over the DevTools protocol. `Emulation.setEmulatedMedia` supplies
`prefers-color-scheme` (dark/light) and `prefers-reduced-motion`
(no-preference/reduce); `CSS.forcePseudoState` forces `:hover` for the motion check.
Contrast is computed from the element's computed `color` against its effective
background — every ancestor `background-color` alpha-composited down to the first
opaque one — using the WCAG 2.x relative-luminance formula. Screenshots are
`Page.captureScreenshot` clips at a 1440x900 viewport, `captureBeyondViewport`.

## 1. `--ink-faint` contrast (WCAG 1.4.3, 4.5:1 for normal-size text)

Token: `#6c7783` dark / `#7b8791` light -> `#78838f` dark / `#616b75` light.
All three usages resolve against `--bg` (`#0a0c0f` dark, `#f6f4ee` light); the
sticky header's `color-mix(... var(--bg) 74%, transparent)` composites to the same
color, so `.brandmark .dim` lands on `--bg` too.

| usage | dark before | dark after | light before | light after |
| --- | --- | --- | --- | --- |
| `.brandmark .dim` | 4.29 FAIL | **5.07 PASS** | 3.34 FAIL | **4.94 PASS** |
| `.site-footer` column title | 4.29 FAIL | **5.07 PASS** | 3.34 FAIL | **4.94 PASS** |
| `.site-footer .fine` | 4.29 FAIL | **5.07 PASS** | 3.34 FAIL | **4.94 PASS** |

The 4.29 / 3.34 before-numbers reproduce the figures in issue #15 exactly.
`--ink-dim` is unchanged at 8.90:1 dark / 7.26:1 light, so `--ink-faint` is still
visibly the fainter of the two.

## 2 + 3. Heading outline of the rendered homepage

Before (17 headings) — the footer jumped h2 -> h4, and 13 card titles were `<span>`:

```
h1 x1, h2 x10, h3 x4 (adoption ladder only), h4 x3 (footer)   SKIP: h2 -> h4
```

After (30 headings) — `h1 -> h2 -> h3`, no skips:

```
h1  The engineering system around your coding agents.
h2  The hard part isn't the code...
h2  Five things an agent should never leave implicit.
h2  Install the process once...
h2  A skill for every step of the loop.
h3    verify / tdd / adversarial-pr-review / address-review / update-changelog
h3    plan-pr-batch / triage / pr-batch / batch-status / post-merge-audit   (10 skill cards)
h2  Adopt only as much machinery as the work requires.
h3    Start with one recurring failure ... When not to add more machinery   (4, pre-existing)
h2  Agents a public issue can't hijack.
h2  The pack, the backend, and the dashboard.
h3    agent-workflows / agent-coordination / dashboard                      (3 stack cards)
h2  Customize freely. Keep the divergence visible.
h2  Bring the operating model into your organization.
h2  The stack / Learn / ShakaCode                                           (3 footer columns)
```

All eight built pages were re-checked for level skips against `dist/`. **All eight
are clean**, including `docs/index.html`, whose body is an `<h1>` plus a link list
with no `<h2>`: with `<h2>` footer titles its sequence is `1 2 2 2`, so the residual
`h1 -> h3` skip that `8d91ceb` still had is gone without adding a placeholder
heading to any page.

```
ok   docs/architecture/index.html      12222222
ok   docs/distributions/index.html     122223322222
ok   docs/index.html                   1222
ok   docs/quickstart/index.html        12222222
ok   docs/terminology/index.html       123333332333333332333333233333233333333333222
ok   docs/throughput/index.html        12233333322222
ok   index.html                        122223333333333233332233322222
ok   methodology/index.html            12222222222
ALL 8 PAGES CLEAN
```

## Rendered treatment — unchanged where it matters

Computed style + page-space rect, dark theme, before -> after:

| element | before | after |
| --- | --- | --- |
| footer column title | `H4` mono 11.52px w700 lh 19.008px ls 2.0736px uppercase, rect 415x19 | `H2` mono 11.52px w700 lh 19.008px ls 2.0736px uppercase, rect 415x19 |
| skill card title | `SPAN` mono 13.12px w400 lh 21.648px, block, rect 47x22 | `H3` mono 13.12px w400 lh 21.648px, block, rect 47x22 |
| skill card box | 252x211 @ y 4042 | 252x211 @ y 4042 |
| stack card title | `SPAN` mono 13.12px w400 lh 21.648px, **inline**, rect 134x17 | `H3` mono 13.12px w400 lh 21.648px, **block**, rect 289x22 |
| stack card box | 343x**237** @ y 8086 | 343x**231** @ y 8086 |
| footer box | 1440x420 @ y 10606 | 1440x420 @ y **10599** |

One intentional 6px layout delta: the stack-card title was an inline box, so its
line box took the card's own 28.05px strut (`a.card` is 17px/1.65). As a block `h3`
it uses its own 21.648px line box, making each stack card 6px shorter and shifting
everything below it up 7px. Typography is identical; only that leading changes, and
it brings the stack cards in line with the skill cards' spacing. See
`before-1440x900-stack-*.png` vs `after-1440x900-stack-*.png`.

## 4. `prefers-reduced-motion: reduce`, `:hover` forced

| selector | before (reduce) | after (reduce) | after (no-preference) |
| --- | --- | --- | --- |
| `.btn:hover` | `matrix(1,0,0,1,0,-1.906)`, transition `transform,background,border-color` / `.16s,.2s,.2s` | `none`, transition `none` / `0s` | `matrix(1,0,0,1,0,-1.803)`, transitions intact |
| `a.card:hover` | `matrix(1,0,0,1,0,-2.704)`, transition `border-color,transform` / `.2s,.16s` | `none`, transition `none` / `0s` | `matrix(1,0,0,1,0,-2.468)`, transitions intact |

(The fractional Y offsets before the fix are the transition mid-flight — proof the
lift was still animating under `reduce`.)

## Screenshots

`before-`/`after-1440x900-<region>-<THEME>.png` for `header`, `footer`, `skills`,
`stack` in `DARK` and `LIGHT`. 1440px wide, clipped to the region's page-space rect.
The `after-` shots were re-captured at `e0d9c53` and compare byte-identical to the
ones captured at `8d91ceb`, which is the evidence that moving the footer titles
from `h3` to `h2` changed nothing on screen.

## Validation at `e0d9c53`

- `npm run build` (`.agents/bin/validate`) — pass, 8 pages.
- `npm test` (`.agents/bin/test`) — pass, `check-adoption-ladder: OK`.
