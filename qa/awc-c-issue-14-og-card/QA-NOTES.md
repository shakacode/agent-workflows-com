# QA evidence — Open Graph card (issue #14)

Lane `issue-14-og-card`, batch `awc-c-20260901`. Branch under review:
`awc-c/issue-14-og-card`. Base: `dfdde7e`. Head: `e74d080`.

> Updated after coordinator review. The head moved from `ec7b2b2` to `e74d080`
> for renderer-hardening and CSS fixes that do not touch the artwork: a
> re-render at `e74d080` is byte-identical to the committed `public/og.png`
> (sha256 `e99474eed144b1a606be5861ceff655411c1ff936b2359b4af6e157fd72b5a8d`),
> so every image below is still current.

## What changed

`public/og.png` is regenerated from a new, committed source
(`scripts/og-card.html` rendered by `scripts/render-og-card.mjs`), and
`src/layouts/Base.astro` line 39 `og:image:alt` is rewritten in the same commit
to describe the new artwork.

| | Before (`main`) | After |
|---|---|---|
| Headline | Run AI coding agents in fleets — safely. | The engineering system around your coding agents. |
| Art | Blue fan-out fleet topology | Site dark palette, atmospheric grid, `--brand: #2fb67c` accents |
| Type | Generic condensed sans | The site's own Fraunces + IBM Plex Mono webfonts |
| Dimensions | 1200×630 | 1200×630 |
| File size | 779,370 bytes (761.1 KB) | 140,653 bytes (137.4 KB) |
| Source of truth | none — hand-made binary | `scripts/og-card.html` |

## Images

- `before-1200x630-og-card.png` — `public/og.png` at `dfdde7e`, byte-identical
  (`git show dfdde7e:public/og.png | cmp -` passes).
- `after-1200x630-og-card.png` — `public/og.png` at `ec7b2b2` and `e74d080`
  (identical), byte-identical to the committed artifact.
- `before-300x157-og-card-thumbnail.png` / `after-300x157-og-card-thumbnail.png`
  — the same two images at 25%, roughly the size a card renders in a Slack or
  iMessage unfurl. The new headline is still legible at that scale; that was the
  sizing constraint that took the headline from 90px to 82px (at 90px
  "around your coding agents." wrapped and orphaned "agents." onto a third line).

## Measurements

```
$ sips -g pixelWidth -g pixelHeight public/og.png
  pixelWidth: 1200
  pixelHeight: 630

$ node scripts/render-og-card.mjs
render-og-card: wrote .../public/og.png (1200x630, 137.4 KB)
```

The renderer refuses to overwrite the target unless Chrome produced a complete
PNG of exactly 1200×630, so the image can never silently drift away from the
`og:image:width` / `og:image:height` meta tags.

Reproducibility check at `e74d080`:

```
$ node scripts/render-og-card.mjs --out /tmp/rerender.png
$ shasum -a 256 public/og.png /tmp/rerender.png
e99474eed144b1a606be5861ceff655411c1ff936b2359b4af6e157fd72b5a8d  public/og.png
e99474eed144b1a606be5861ceff655411c1ff936b2359b4af6e157fd72b5a8d  /tmp/rerender.png
```

Failure paths at `e74d080` (each exits 1 and leaves zero `og-card-chrome-*`
profile directories behind):

| Case | Message |
|---|---|
| `--out` with no path | `--out needs a path, e.g. --out /tmp/preview.png` |
| `--out --foo` | same |
| `CHROME_BIN=/bin/echo` (quits immediately) | `Chrome exited without producing a screenshot (code 0)` |
| `CHROME_BIN=/nope/chrome` | `Chrome not found at /nope/chrome` |

Built output at `e74d080` (`npm run build`):

```
<meta property="og:image" content="https://agents.shakacode.com/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Dark ShakaCode Agent Workflows card with the headline ‘The engineering system around your coding agents.’, the line ‘Your agent writes the code. This is everything around it.’, and a footer rail reading Context, Scope, Validation, Evidence, Review.">
```

## Not covered here

A live social-card debugger (Slack, X, LinkedIn, opengraph.xyz) cannot be run
offline against an unmerged branch. The maintainer should paste the Cloudflare
preview URL for this PR into a card debugger before merging.
