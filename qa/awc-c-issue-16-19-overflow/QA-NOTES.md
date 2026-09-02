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
