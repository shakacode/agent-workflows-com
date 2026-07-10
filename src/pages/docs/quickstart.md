---
layout: ../../layouts/Doc.astro
title: Quickstart
description: Install the agent-workflows pack and get value in minutes.
---

<!-- DRAFT: keep in lockstep with agent-workflows README Quick Start.
     The install→value path is under active revision (init scaffold planned). -->

## 1. Install the pack (once per machine)

```bash
git clone https://github.com/shakacode/agent-workflows
cd agent-workflows
bin/install-agent-workflows --host claude   # or --host codex
```

## 2. Try a day-one skill — no backend required

These skills work immediately, with no coordination backend and no repo seam:

- `tdd` — red-green-refactor discipline
- `verify` — prove your branch is ready before a PR
- `address-review` — triage and resolve PR review comments
- `adversarial-pr-review` — red-team a PR before merge
- `update-changelog` — honest changelog from merged PRs

## 3. Adopt a repo (the seam)

Each repo exposes a small `.agents/` seam: command wrappers plus a policy
file. See the [adoption guide](https://github.com/shakacode/agent-workflows/blob/main/docs/adoption.md)
and validate with `bin/agent-workflow-seam-doctor`.

## 4. Level up: coordinated batches

To run multiple agents (or machines) safely against one backlog, add the
[coordination backend](https://github.com/shakacode/agent-coordination) —
claims, heartbeats, and takeover — and the
[dashboard](https://github.com/shakacode/agent-coordination-dashboard) to
watch lanes live.
