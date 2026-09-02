---
layout: ../../layouts/Doc.astro
title: Quickstart
eyebrow: Docs
description: Install the agent-workflows pack and get value in minutes.
---

## 1. Install the pack (once per machine)

```bash
git clone https://github.com/shakacode/agent-workflows
cd agent-workflows
bin/install-agent-workflows --host claude   # or --host codex
```

Codex users can also install it as a native plugin via `.codex-plugin/plugin.json`.

<span id="qs-day-one-skill" class="qs-anchor"></span>

## 2. Try a day-one skill — no backend, no seam

These skills work immediately, with no coordination backend and no repo seam:

- `tdd` — red-green-refactor discipline
- `verify` — prove your branch is ready before a PR
- `address-review` — triage and resolve PR review comments
- `adversarial-pr-review` — red-team a PR before merge
- `update-changelog` — an honest changelog from merged PRs

<span id="qs-repo-seam" class="qs-anchor"></span>

## 3. Adopt a repo (the seam)

Each repo exposes a small `.agents/` seam — command wrappers plus a policy file — so
shared skills resolve its real commands instead of copying a config tree. Scaffold and
validate it in one step:

```bash
bin/agent-workflow-seam-doctor --init
```

See the [adoption guide](https://github.com/shakacode/agent-workflows/blob/main/docs/adoption.md).

<span id="qs-coordinated-batches" class="qs-anchor"></span>

## 4. Level up: coordinated batches

To run several agents (or machines) against one backlog without collisions, add the
[coordination backend](https://github.com/shakacode/agent-coordination) — claims,
heartbeats, and takeover. Try it with zero setup:

```bash
agent-coord demo     # a deterministic walkthrough; no remote backend
```

Then watch the lanes live in the
[dashboard](https://github.com/shakacode/agent-coordination-dashboard).
