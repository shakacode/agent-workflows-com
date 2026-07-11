---
layout: ../layouts/Doc.astro
title: The Methodology
eyebrow: Methodology
description: How ShakaCode actually runs AI coding agents — mindset, the core loop, adversarial review, verification, parallel work, and the anti-patterns to avoid.
---

Distilled from a working session between Justin Gordon and Robert on how we actually use
AI coding agents. The short version: **use AI aggressively, verify the risky parts,
document what was learned, and keep shipping.**

## Mindset

Treat the agent as a continuous research, review, testing, and documentation partner —
not an oracle, and not a replacement. When you're blocked or unsure, ask one more precise
question that moves the task toward a concrete next action, rather than a broad "explain
everything." And whenever the agent explains a confusing repo process, ask the follow-up:
*should this become docs?* Documentation is high-leverage and usually low-risk — merge it
quickly.

## The core loop: plan → batch → review → audit

Shape the work first (`plan-pr-batch`, `triage`, `spec`), run it as coordinated lanes
(`pr-batch`), review every change adversarially, and audit the merged batch
(`post-merge-audit`). The loop is deliberately gated: nothing lands just because an agent
said it was done.

## Adversarial review before merge

For anything non-trivial, run a review whose job is to find what's *wrong* — production
risks, deployment risks, missing tests, unsafe assumptions — not to summarize the PR.
Start with concrete blockers and file/line references. A change is merge-ready when tests
pass, manual verification is adequate, adversarial review finds no serious issue, and the
remaining risk is understood.

## Verification habits

Evidence before assertions, always. CI is not "is it green?" but "did the step that proves
*this change* actually run?" Ask the agent which manual testing a change needs and in
which environment. Never accept "the agent said it tested" as proof without logs,
commands, or screenshots.

## Parallel work

Keep several things moving while slow operations run — CI, review apps, AI reviews.
Coordinate multiple agents with explicit claims and lanes so two workers never collide on
the same target, and hand off cleanly across machines. Idle time is for the next PR's QA
checklist, a docs update, or a domain-expert handoff.

## Convert confusion into issues and docs

Don't let vague blockers stay vague. Capture the symptom, have the agent research likely
causes from repo context, decide whether it's a real bug, a docs gap, or expected
behavior, and file a self-contained issue or a docs PR — so context lands where someone
can act on it.

## Anti-patterns to avoid

- Passing vague observations to teammates without first researching and packaging them.
- Treating "AI said it tested" as proof, with no logs or screenshots.
- Holding low-risk docs and comment PRs forever because review automation failed.
- Merging high-risk deploy or secret changes without narrowing the environment impact.
- Letting a large migration reach reviewers without a change map.
- Asking broad questions when a specific next-step question is what you need.
