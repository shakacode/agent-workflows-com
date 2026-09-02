# Independent QA for PR #20

Checker: `awc-b-checker-ladder`, independent from maker `awc-b-maker-ladder`.
Candidate: `31731d1dd85d6b4030bde911ceb36706062d43a2`.
Baseline: `982a57b509c66e54a66c76428407108d9c207539`.
Intentionally unfixed control: `fec97b75acbea095e39e6fd831f14343e21aec0c`.
Date: 2026-09-02 UTC (2026-09-01 Hawaii).

Result: functional and visual checks passed; evidence publication/replay remains coordinator-owned. This does not clear human product approval. No candidate source edits, commits, PR writes, or pushes were performed by QA. Coordination backend is n/a; no claim or heartbeat was attempted.

## Setup and scope

- Candidate worktree: `/Users/justin/conductor/awc-b-lane-issue-9-ladder`, read-only QA source.
- Baseline worktree: `/Users/justin/conductor/awc-b-qa-20260901`, detached exact baseline; `npm ci && npm run build` passed.
- Negative worktree: `/Users/justin/conductor/awc-b-qa-negative-20260901`, detached original implementation; `npm ci && npm run build` passed.
- Preview commands used unchanged Astro preview command from inspected trusted-base package configuration, on loopback ports 4327, 4328, and 4329 respectively.
- Candidate automated validation covered by coordinator: `.agents/bin/validate` and `.agents/bin/test` passed at exact candidate.
- Real in-app browser, desktop 1440x1100, mobile 390x844, narrow 280x844; temporary light/dark emulation and viewport overrides reset after testing.
- Site seam has no performance benchmark command. Bundle-hygiene measurements below compare the seam's built `dist` outputs, not runtime speed.

## Observed checks

- Desktop shows three readable side-by-side cards, ordered levels 01/02/03, required/optional distinctions and both caveats. Mobile stacks correctly and exposes the next-action links. All captured images were opened and visually inspected; none is blank or unpainted.
- Current main has no adoption section; baseline screenshots show the safety section immediately after the skills section, where the candidate adds its ladder.
- Note-to-caveat gap: candidate 22px at 1440px and 390px; also 22px on deployed mobile preview. Unfixed control: 0px.
- 280px ladder-container overflow: unfixed card width260px, card right284px versus container right256px (28px overflow). Candidate width232px and right256px (0px overflow). Fresh original-control screenshot retained alongside current screenshot.
- Whole-document scroll width is315px at a280px viewport on BOTH current main and candidate, as well as original control. This pre-existing whole-site overflow is not fixed by this PR; the ladder itself no longer adds overflow. At390px candidate/deployed document width equals390px.
- Light and dark layouts inspected. Keyboard Tab from first action focuses second action, visible 2px solid outline: light rgb(13,102,71); dark rgb(124,236,189). Enter activates the focused link.
- Hover on the second action changed border from color(srgb0.1843140.7137260.486275/0.45) to rgb(124,236,189), with `:hover` true.
- Step2 click lands at `/docs/quickstart/#qs-day-one-skill`, matching heading2, anchor top83.953125px, heading top119.078125px, header bottom63px.
- Step3 keyboard activation lands at `/docs/quickstart/#qs-repo-seam`, matching heading3, anchor top83.9609375px, heading top119.0859375px, header bottom63px; empty anchor wrapper margin0px.
- Step4 click on deployed preview lands at `/docs/quickstart/#qs-coordinated-batches`, matching heading4, anchor top83.9765625px, heading top119.1015625px, header bottom63px. Same-call hostname assertion required and passed for deployed geometry.
- Baseline native step4 heading anchor at390px lands at heading top0.1015625px, obscured by63px header. Candidate stable anchor eliminates that overlap: measured_substitute: before_value=62.8984375px; after_value=0px; tolerance=1px. This comparison is native baseline heading anchor versus new stable candidate link, not an invented baseline ladder link.
- Deployed preview `https://6c002716.agent-workflows-com.pages.dev` returned HTTP200; browser hostname assertion passed, three cards painted, 22px gap, correct step4 navigation. Coordinator independently bound deployment6215795840 to candidate SHA.
- Cheap unhappy path: local `/not-a-real-page` returns HTTP404.

## Bundle hygiene

Source: `.agents/bin/validate` -> `npm run build` -> `dist`, measured using Node `fs.statSync`, `fs.readFileSync`, and `zlib.gzipSync` on exact baseline/candidate output. Same installed dependency lockfile; no browser JavaScript bundles.

| Measurement | Baseline | Candidate |
| --- | ---: | ---: |
| Total dist bytes | 1664709B | 1671700B |
| Homepage HTML raw | 30419B | 35417B |
| Homepage HTML gzip | 7482B | 8573B |
| CSS raw | 30284B | 32092B |
| CSS gzip | 5989B | 6305B |
| JS files | 0files | 0files |
| Total output files | 71files | 71files |

The hygiene delta is +6991 raw output bytes, +1091 homepage gzip bytes, +316 CSS gzip bytes, and no delivered JavaScript increase. No runtime-performance claim is made.

## Findings and retained boundaries

- No new PR-blocking visual or functional defect found.
- Dependency install reports2 high-severity advisories on unchanged baseline lockfile; no dependency changes or audit fixes attempted.
- Existing CI test-seam gap remains accepted issue#21; deferred checker-hardening concern remains issue#24 per coordinator. QA did not reopen checker implementation.
- Product approval remains human-only, exact final head.
- Evidence is currently local-only below; coordinator must publish to the existing preserved evidence branch, verify intended reviewer HTTPS access, and replay a final `qa-evidence v2` receipt before claiming readiness.

## Fresh image inventory

All files are in this report's directory. `before-*` uses exact current main, `negative-*` uses exact unfixed control, all other images use exact candidate or its independently bound deployment.

- before-1440-adoption.png
- before-390-adoption.png
- after-1440-adoption.png
- after-390-adoption.png
- after-1440-adoption-light.png
- after-390-callouts.png
- after-280-ladder.png
- negative-280-ladder.png
- focus-1440-light.png
- focus-1440-dark.png
- link-step3-desktop.png
- deployed-390-adoption.png
- deployed-390-step4.png
