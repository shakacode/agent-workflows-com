# QA evidence — issue #17, hero diagram plain language

Lane `issue-17-hero-jargon`, batch `awc-c-20260901`.
PR branch: `awc-c/issue-17-hero-plain-language` @ `aedba56`.
Only `src/components/BatchLifecycle.astro` changed — text nodes, the `aria-label`,
and code comments. No CSS rule, colour, spacing or breakpoint was touched.

## Screenshots

Dark theme (the site's default; `prefers-color-scheme` follows the OS and the
headless run rendered dark). The change is text-only, so the light theme has
nothing distinct to show — no colour token, gate tint or border in the diagram
was modified.

| File | Viewport | What it shows |
| --- | --- | --- |
| `before-1440x900-hero.png` | 1440x900 | hero as shipped: `security preflight`, `plan / triage / pr-batch / review / audit`, `BACKED BY coordination backend · claims · heartbeats · liveness` |
| `after-1440x900-hero.png` | 1440x900 | same hero, plain labels, identical layout |
| `before-390x844-hero.png` | 390x844 | mobile fold as shipped |
| `after-390x844-hero.png` | 390x844 | mobile fold after |
| `before-390x1400-diagram.png` | 390x1400 | taller mobile capture so the whole diagram is visible before |
| `after-390x1400-diagram.png` | 390x1400 | same, after |

All captured at `--force-device-scale-factor=2` against `astro preview` on
127.0.0.1:4321 with headless Chrome 152.

## Rendered label sizes — before vs after

Computed `font-size` and border-box size of every text node in the diagram,
measured in-page (the homepage loaded in an iframe sized to the viewport, then
`getComputedStyle` + `getBoundingClientRect`).

### 390 wide

| Element | Before font-size | After font-size | Before box | After box |
| --- | --- | --- | --- | --- |
| `.lc-source` | 12.48px | 12.48px | 304x17 | 304x17 |
| `.lc-gate-name` | 16px | 16px | 270x21 | 270x21 |
| `.lc-gate-sub` | 13.12px | 13.12px | 270x19 | 270x38 |
| `.lc-step` (01–05) | 12.48px | 12.48px | 108x16 | 108x16 |
| `.lc-stage` (01–05) | 15.2px | 15.2px | 108x20 | 108x20 |
| `.lc-rail` | 12.8px | 12.8px | 276x49 | 276x49 |
| `.diagram-caption` | 12.48px | 12.48px | 304x82 | 304x82 |
| `.lc-flow` (whole diagram) | — | — | 304x409 | 304x428 |

### 1440 wide

| Element | Before font-size | After font-size | Before box | After box |
| --- | --- | --- | --- | --- |
| `.lc-source` | 12.48px | 12.48px | 479x17 | 479x17 |
| `.lc-gate-name` | 16px | 16px | 445x21 | 445x21 |
| `.lc-gate-sub` | 13.12px | 13.12px | 445x19 | 445x19 |
| `.lc-step` (01–05) | 12.48px | 12.48px | 119x16 / 195x16 | 119x16 / 195x16 |
| `.lc-stage` (01–05) | 15.2px | 15.2px | 119x20 / 195x20 | 119x20 / 195x20 |
| `.lc-rail` | 12.8px | 12.8px | 451x49 | 451x49 |
| `.diagram-caption` | 12.48px | 12.48px | 479x62 | 479x62 |
| `.lc-flow` (whole diagram) | — | — | 479x345 | 479x345 |

Every font size is byte-identical before and after, so the 12.5–15.2px legibility
floor PR #18 established is untouched.

### Whole-diagram height at every checked width

| Width | `.lc-flow` before | `.lc-flow` after | Delta |
| --- | --- | --- | --- |
| 320 | 234x447 | 234x447 | 0 |
| 390 | 304x409 | 304x428 | +19px |
| 768 | 672x262 | 672x262 | 0 |
| 1024 | 436x345 | 436x345 | 0 |
| 1440 | 479x345 | 479x345 | 0 |

The single delta is the gate sub-label `untrusted input never becomes
instructions` taking two lines at 390 where `untrusted text ≠ instructions` took
one. It already took two lines at 320 before this change, and it stays on one
line at 768, 1024 and 1440. The replacement rail string was chosen at the same
length as the one it replaces (52 characters), which is why the rail height is
unchanged at every width.

## Overflow check

`document.documentElement.scrollWidth` vs `clientWidth`, and `.lc-flow`
`scrollWidth` vs `clientWidth`, at 320 / 390 / 768 / 1024 / 1440:

| Width | doc | `.lc-flow` |
| --- | --- | --- |
| 320 | 320 vs 320 ok | 234 vs 234 ok |
| 390 | 390 vs 390 ok | 304 vs 304 ok |
| 768 | 768 vs 768 ok | 672 vs 672 ok |
| 1024 | 1024 vs 1024 ok | 436 vs 436 ok |
| 1440 | 1440 vs 1440 ok | 479 vs 479 ok |

No horizontal overflow, no clipped label, before or after.

## Jargon grep — the byte-offset proof from #8 / #17

Scan of the built `dist/index.html` from byte 0 to the `id="problem"` anchor,
case-insensitive:

Before (`origin/main`, anchor at byte 7229):

```
  FAIL pr-batch               2 hit(s)
  ok   seam                   0 hits
  ok   pack                   0 hits
  ok   protocol plane         0 hits
  FAIL coordination backend   2 hit(s)
  FAIL claims                 2 hit(s)
  FAIL heartbeats             2 hit(s)
  FAIL liveness               2 hit(s)
  FAIL preflight              2 hit(s)
  --- result: JARGON PRESENT ---
```

After (this branch, anchor at byte 7272):

```
  ok   pr-batch               0 hits
  ok   seam                   0 hits
  ok   pack                   0 hits
  ok   protocol plane         0 hits
  ok   coordination backend   0 hits
  ok   claims                 0 hits
  ok   heartbeats             0 hits
  ok   liveness               0 hits
  ok   preflight              0 hits
  --- result: CLEAN ---
```

Reproduce:

```sh
npm run build
OFF=$(grep -abo 'id="problem"' dist/index.html | head -1 | cut -d: -f1)
head -c "$OFF" dist/index.html > /tmp/prefix.html
for t in 'pr-batch' 'seam' 'pack' 'protocol plane' 'coordination backend' \
         'claims' 'heartbeats' 'liveness' 'preflight'; do
  printf '%-22s %s\n' "$t" "$(grep -io -- "$t" /tmp/prefix.html | wc -l)"
done
```

## Full visible text above `#problem`, after the change

```
Agent Workflow Playbook / ShakaCode | Model | How it works | Skills | Safety |
The stack | Distributions | For teams | Case studies | Docs | GitHub ↗ |
Open source · Codex + Claude Code |
The engineering system around your coding agents. |
Your agent writes the code. This is everything around it — the context it starts
from, the scope it may touch, the checks it must pass, the evidence it leaves,
and the human review that lands it. Start on one pull request; scale to fleets
across repos. |
Get started ↗ | Read the methodology → |
from github issues & prs |
security gate | untrusted input never becomes instructions | ↓ |
01 plan | 02 run | 03 check | 04 review | 05 audit |
backed by shared coordination, so parallel agents never collide |
How the work moves — the amber gate is the differentiator: untrusted input is
checked before an agent ever acts on it. The same path runs for one lane or many.
```

Nothing above the fold is project-specific vocabulary any more. The nav labels
(`The stack`, `Distributions`) are pre-existing site navigation, outside this
lane's scope.
