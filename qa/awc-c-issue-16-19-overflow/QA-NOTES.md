# QA evidence — issue #16 + #19, header overflow

Lane `issue-16-19-overflow`, batch `awc-c-20260901`, branch `awc-c/issue-16-19-header-overflow`.

Method: `npm run build` + `npx astro preview --host 127.0.0.1 --port 4316`, headless Chrome
(`--headless=new`, `--hide-scrollbars`, `deviceScaleFactor: 1`) driven over CDP.
Before = `main` @ `dfdde7e`. After = this branch.

Two ways of emulating a large browser font are reported, because they are not the same thing:

- **browser default font** — CDP `Page.setFontSizes({standard, fixed})`. This is what a reader who
  raises their browser's default font size actually gets, and it is what `em` media queries resolve
  against (per spec, `em`/`rem` in a media query use the *initial* font size, never a `font-size`
  declared on `:root`).
- **the #19 snippet** — `document.documentElement.style.fontSize = 'Npx'`. This scales every `rem`
  in the page but leaves media queries evaluating at 16px, so it is a harder case than reality.
  Both are reported; both are clean after the fix.

`brand↔nav gap` is the first visible nav link's left edge minus the brandmark's right edge.
`row 2` means the bar deliberately used a second row (brandmark on one line, nav on the next)
rather than overflowing the page. `links` counts every anchor in the bar, i.e. seven section
links + Docs + GitHub = 9.

## Screenshots

| file | case |
|---|---|
| `before-914x400-header.png` / `after-914x400-header.png` | 914px — the worst reported width in #16 |
| `before-850x400-header.png` / `after-850x400-header.png` | 850px — middle of the 721–913px broken band |
| `before-768x600-root24.png` / `after-768x600-root24.png` | 768px at a 24px browser font — the 162px overflow in #19 |
| `before-390x800-root32.png` / `after-390x800-root32.png` | 390px at a 32px browser font — the 186px overflow in #19 |
| `before-300x800-narrow.png` / `after-300x800-narrow.png` | 300px — the 15.3px footer overflow in #19 |
| `before-320x400-header.png` / `after-320x400-header.png` | 320px — the documented two-row fallback |
| `before-1440x120-header-8links.png` / `after-1440x120-header-8links.png` | 1440px with PR #6's eighth link added locally |
| `after-1440x120-header-8links-suffix-hidden.png` | 1440px, eighth link, with `.brandmark .dim` hidden at every width — the one-line follow-on |

## Measurements

#### Widths at a 16px root font — seven section links (what this PR ships)

| viewport | before: page over | brand lines | brand↔nav gap | links | after: page over | brand lines | brand↔nav gap | links |
|---|---|---|---|---|---|---|---|---|
| 1920px | 0 | 1 | 33px | 9 | 0 | 1 | 33px | 9 |
| 1440px | 0 | 1 | 33px | 9 | 0 | 1 | 33px | 9 |
| 1120px | 0 | 1 | 33px | 9 | 0 | 1 | 33px | 9 |
| 1119px | 0 | 1 | 150px | 8 | 0 | 1 | 150px | 8 |
| 1060px | 0 | 1 | 91px | 8 | 0 | 1 | 91px | 8 |
| 1024px | 0 | 1 | 55px | 8 | 0 | 1 | 55px | 8 |
| 940px | 0 | 1 | 26px | 7 | 0 | 1 | 134px | 7 |
| 930px | 0 | **2** | 20px | 7 | 0 | 1 | 124px | 7 |
| 920px | 0 | **2** | 20px | 7 | 0 | 1 | 114px | 7 |
| 916px | 0 | **2** | 20px | 7 | 0 | 1 | 110px | 7 |
| 914px | 0 | **2** | 20px | 7 | 0 | 1 | 108px | 7 |
| 913px | 0 | **2** | 20px | 7 | 0 | 1 | 107px | 7 |
| 850px | 0 | **2** | 20px | 7 | 0 | 1 | 194px | 5 |
| 800px | 0 | **2** | 20px | 7 | 0 | 1 | 144px | 5 |
| 760px | 0 | **3** | 20px | 7 | 0 | 1 | 104px | 5 |
| 721px | 0 | **4** | 20px | 7 | 0 | 1 | 65px | 5 |
| 720px | 0 | 1 | 265px | 1 | 0 | 1 | 372px | 1 |
| 640px | 0 | 1 | 185px | 1 | 0 | 1 | 292px | 1 |
| 480px | 0 | 1 | 25px | 1 | 0 | 1 | 132px | 1 |
| 390px | 0 | **2** | 20px | 1 | 0 | 1 | 42px | 1 |
| 375px | 0 | **2** | 20px | 1 | 0 | 1 | 45px | 1 |
| 360px | 0 | **2** | 20px | 1 | 0 | 1 | 30px | 1 |
| 320px | 0 | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 300px | **15px** | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |

#### Widths at a 16px root font — eight section links (PR #6 “Case studies” added locally, never committed)

| viewport | before: page over | brand lines | brand↔nav gap | links | after: page over | brand lines | brand↔nav gap | links |
|---|---|---|---|---|---|---|---|---|
| 1920px | 0 | **2** | 20px | 10 | 0 | 1 | row 2 | 10 |
| 1440px | 0 | **2** | 20px | 10 | 0 | 1 | row 2 | 10 |
| 1120px | 0 | **2** | 20px | 10 | 0 | 1 | row 2 | 10 |
| 1119px | 0 | 1 | 40px | 9 | 0 | 1 | 40px | 9 |
| 1060px | 0 | **2** | 20px | 9 | 0 | 1 | row 2 | 9 |
| 1024px | 0 | **2** | 20px | 9 | 0 | 1 | row 2 | 9 |
| 940px | 0 | 1 | 26px | 7 | 0 | 1 | 134px | 7 |
| 930px | 0 | **2** | 20px | 7 | 0 | 1 | 124px | 7 |
| 920px | 0 | **2** | 20px | 7 | 0 | 1 | 114px | 7 |
| 916px | 0 | **2** | 20px | 7 | 0 | 1 | 110px | 7 |
| 914px | 0 | **2** | 20px | 7 | 0 | 1 | 108px | 7 |
| 913px | 0 | **2** | 20px | 7 | 0 | 1 | 107px | 7 |
| 850px | 0 | **2** | 20px | 7 | 0 | 1 | 194px | 5 |
| 800px | 0 | **2** | 20px | 7 | 0 | 1 | 144px | 5 |
| 760px | 0 | **3** | 20px | 7 | 0 | 1 | 104px | 5 |
| 721px | 0 | **4** | 20px | 7 | 0 | 1 | 65px | 5 |
| 720px | 0 | 1 | 265px | 1 | 0 | 1 | 372px | 1 |
| 640px | 0 | 1 | 185px | 1 | 0 | 1 | 292px | 1 |
| 480px | 0 | 1 | 25px | 1 | 0 | 1 | 132px | 1 |
| 390px | 0 | **2** | 20px | 1 | 0 | 1 | 42px | 1 |
| 375px | 0 | **2** | 20px | 1 | 0 | 1 | 45px | 1 |
| 360px | 0 | **2** | 20px | 1 | 0 | 1 | 30px | 1 |
| 320px | 0 | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 300px | **15px** | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |

#### Root font size — browser default font (Page.setFontSizes), seven links

| viewport | before: page over | brand lines | brand↔nav gap | links | after: page over | brand lines | brand↔nav gap | links |
|---|---|---|---|---|---|---|---|---|
| 768px | 0 | **3** | 20px | 7 | 0 | 1 | 112px | 5 |
| 768 px @ 20px root | **36px** | **4** | 20px | 7 | 0 | 1 | 353px | 1 |
| 768 px @ 24px root | **162px** | **4** | 20px | 7 | 0 | 1 | 286px | 1 |
| 768 px @ 32px root | **415px** | **5** | 20px | 7 | 0 | 1 | 188px | 1 |
| 390px | 0 | **2** | 20px | 1 | 0 | 1 | 42px | 1 |
| 390 px @ 20px root | 0 | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 390 px @ 24px root | **55px** | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 390 px @ 32px root | **186px** | **4** | 20px | 1 | **3px** | **2** | row 2 | 1 |

#### Root font size — the issue #19 snippet (documentElement.style.fontSize), seven links

| viewport | before: page over | brand lines | brand↔nav gap | links | after: page over | brand lines | brand↔nav gap | links |
|---|---|---|---|---|---|---|---|---|
| 768px | 0 | **3** | 20px | 7 | 0 | 1 | 112px | 5 |
| 768 px @ 20px root | **36px** | **4** | 20px | 7 | 0 | 1 | row 2 | 5 |
| 768 px @ 24px root | **162px** | **4** | 20px | 7 | 0 | 1 | row 2 | 5 |
| 768 px @ 32px root | **415px** | **5** | 20px | 7 | 0 | 1 | row 2 | 5 |
| 390px | 0 | **2** | 20px | 1 | 0 | 1 | 42px | 1 |
| 390 px @ 20px root | 0 | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 390 px @ 24px root | **55px** | **3** | 20px | 1 | 0 | 1 | row 2 | 1 |
| 390 px @ 32px root | **186px** | **4** | 20px | 1 | **3px** | **2** | row 2 | 1 |

#### Eighth link at the 1120px cap — why it needs one more line of CSS

The header `.wrap` caps at 1120px, so the bar's content box is 1072px at every width from 1120px up.

| configuration | brandmark | nav | + 20px min gap | fits in 1072px? |
|---|---|---|---|---|
| 7 section links, suffix shown | 344.5px | 694.9px | 1059.4px | yes, 12.6px to spare |
| 8 section links, suffix shown | 344.5px | 805.4px | 1169.9px | **no, 97.9px short** |
| 8 section links, suffix hidden | 237.4px | 805.4px | 1062.8px | yes, 9.2px to spare |

Measured with the suffix hidden at every width and the eighth link present
(`after-1440x120-header-8links-suffix-hidden.png`): one row, brandmark one line, all ten anchors on
one line, brand↔nav gap 29.3px, page overflow 0 — at 1920, 1440, 1200, 1120, 1119, 1060, 1024, 1000
and 999px.

## Known residual

`div.consulting-copy` and `div.panel.proof-panel` overflow by 2.7px at 390px with a 32px root font,
before and after, unchanged by this PR. Pre-existing; #19's snippet did not surface it because
`.rule-list li` (90.9px) was the outermost offender and masked it.

Light theme: layout is identical in both themes (`prefers-color-scheme` only changes tokens, no
box metrics), so no `-LIGHT` variants were captured.

---

## Addendum — remediation at head `33eaabe`

The first version of the `.card-top` fix used `flex-wrap: wrap`, which also changed the **16px desktop**
layout: three skill names (`adversarial-pr-review`, `update-changelog`, `post-merge-audit`) stopped
shrinking and pushed their tier pill onto a second row, growing each card 210.9px → 226.2px and the
page by ~31px. Replaced with `min-width: 0; overflow-wrap: anywhere` on `.card-top > *` and no
`flex-wrap`.

Why that is the smaller rule: `.card-top` is a grid item of `.card`, so its min-content sets the card
row, and `.tier` is `flex: none; white-space: nowrap`. The name's min-content therefore set the whole
row. `overflow-wrap: anywhere` (unlike `break-word`) reduces min-content sizing, so the name can
shrink and break. At a 16px root no card row is over-constrained, so nothing is ever squeezed and the
layout is identical.

### Computed-geometry diff, every element in `<main>`, base `dfdde7e` vs head `33eaabe`

`prefers-reduced-motion: reduce` emulated so the hero stagger animation cannot add sub-pixel noise.

| case | elements differing in `<main>` | page overflow before → after |
|---|---|---|
| 1440px @ 16px root | **0** | 0 → 0 |
| 1120px @ 16px root | **0** | 0 → 0 |
| 768px @ 16px root | **0** | 0 → 0 |
| 390px @ 16px root | **0** | 0 → 0 |
| 768px @ 24px root | **0** | 162px → 0 |
| 768px @ 32px root | 218 (intended: nav tiers, `.rule-list`) | 415px → 0 |
| 390px @ 24px root | 356 (intended) | 55px → 0 |
| 390px @ 32px root | 356 (intended) | 186px → 2.7px |
| 320px @ 16px root | 356 (intended: 1.7px header row) | 0 → 0 |
| 300px @ 16px root | 356 (intended: 1.7px header row) | 15.3px → 0 |

At 390px with a 32px root the only remaining offenders are `div.consulting-copy` and
`div.panel.proof-panel` at 2.7px — pre-existing, unchanged, tracked in #38. Neither `.card-top` nor
`.rule-list li` overflows.

`before-1440-skills.png` and `after-1440-skills.png` are the `#skills` grid at 1440px / 16px root and
are **byte-identical** (both `md5 a971869b651d2a0cabbee3a56a258ee7`).

### Footer one-column step

The step is `22.5em` = **360px** at a 16px root, although `main` only overflowed below 320px (15.3px at
300px). So the footer is deliberately single-column across 320–360px: at 360px the two remaining
columns are (360 − 48 − 32) / 2 = 140px each, which is too narrow for the link text. Tighten to `20em`
if the two-column layout is wanted down to 320px.

### Other residuals, pre-existing and identical on `main` (tracked in #38)

- `/methodology/` — `h1` overflows by 41.6px at 390px with a 32px root (single unbreakable word).
- `/docs/architecture/` — `h1` overflows by 25.1px in the same case.
- `/` — `div.consulting-copy` / `div.panel.proof-panel` by 2.7px in the same case.

---

## Addendum 2 — post-rebase remediation at head `e0b0354`

The branch is rebased onto `main` @ `669f319`, which carries PR #6's "Case studies" link. The nav is
now ten anchors for real; nothing is injected any more.

### 1. Brandmark suffix off at every width (coordinator decision, reversible)

`.wrap` caps at 1120px, so the bar has 1072px of content box at every width from 1120px up.

| configuration | brandmark | nav | + 20px min gap | fits in 1072px? |
|---|---|---|---|---|
| ten anchors, suffix shown (`main` today) | 344.5px | 805.4px | 1169.9px | **no, 97.9px short at every width** |
| ten anchors, suffix hidden (this PR) | 237.4px | 805.4px | 1062.8px | yes, 29.3px measured gap |

Full width matrix at a 16px root, measured on this head with the real link present:

| viewport | page overflow | brandmark lines | brand↔nav gap | anchors | header height |
|---|---|---|---|---|---|
| 1920px | 0 | 1 | 29.3px | 10 | 62px |
| 1440px | 0 | 1 | 29.3px | 10 | 62px |
| 1120px | 0 | 1 | 29.3px | 10 | 62px |
| 1119px | 0 | 1 | 146.6px | 9 | 62px |
| 1060px | 0 | 1 | 87.6px | 9 | 62px |
| 1024px | 0 | 1 | 51.6px | 9 | 62px |
| 1000px | 0 | 1 | 27.6px | 9 | 62px |
| 940–913px | 0 | 1 | 133.5 → 106.5px | 7 | 62px |
| 850–721px | 0 | 1 | 193.6 → 64.6px | 5 | 62px |
| 720–390px | 0 | 1 | 371.6 → 41.6px | 1 | 62px |
| 375px | 0 | 1 | 44.9px | 1 | 62px |
| 360px | 0 | 1 | 29.9px | 1 | 62px |
| 320px, 300px | 0 | 1 | second row | 1 | 63.7px |

Brandmark one line and nav one row at every width from 1000px up; tablet and phone rows are
unchanged from the original table. `main` at the same widths: brandmark **two lines** at 1920, 1440,
1120 and 1024 (`before-1440x110-header-ten-anchors.png`, `before-1024x110-header-ten-anchors.png`).

### 2. Deep links under a header that can wrap

The 84px `scroll-margin-top` assumed a fixed 62px header. That was true on `main` — it never wraps,
it squeezes the brandmark instead, which is the #16 bug — but not once the wrap valve exists. Header
height measured as a multiple of the root font size, across 7 viewports x 4 root sizes x both
font-size methods: worst case **5.32x** (127.6px at a 24px root, 161.1px at 32px, 150.8px at 390px/32px).

New rule: `.qs-anchor, main section[id] { scroll-margin-top: max(84px, calc(6rem - 12px)); }` — exactly
84px at a 16px root, rising with the root font once 6rem passes it.

`/docs/quickstart/#qs-repo-seam`, gap between the heading's top and the sticky header's bottom:

| case | header height | before (main) | after |
|---|---|---|---|
| 1440x900 @ 16px root | 63px → 63px | 56.3px clear | **56.3px clear, scrollY 724 — identical** |
| 768x600 @ 24px root | 63px → 63px | 74px clear | 122px clear |
| 390x800 @ 32px root | 63px → 150.8px | 91.1px clear | 99.1px clear |
| 360x800 @ 24px root | 63px → 118.5px | 74.1px clear | 66.1px clear |

Screenshots: `before-deeplink-*.png` / `after-deeplink-*.png`. The homepage `section[id]` targets had
no offset at all before and now share the rule.
