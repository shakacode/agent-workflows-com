---
layout: ../../layouts/Doc.astro
title: Architecture
description: How the pack, the repo seam, and the coordination backend fit together.
---

Three planes, three repos:

## The process plane — [agent-workflows](https://github.com/shakacode/agent-workflows)

The pack: portable skills and workflow prompts codifying plan → batch →
review → audit, plus the security preflight. Installed once per agent host
(Codex or Claude Code). Skills are byte-identical across hosts.

## The repo seam

Each consumer repo exposes a small contract instead of copying the process:
`.agents/bin/` command wrappers, `.agents/agent-workflow.yml` policy,
a trust configuration for GitHub actors, and an `AGENTS.md` pointer.
`agent-workflow-seam-doctor` validates it.

## The protocol plane — [agent-coordination](https://github.com/shakacode/agent-coordination)

Claims (leases on issue/PR targets with compare-and-swap and takeover),
heartbeats (TTL-derived live/stale/dead), batches, and a phase event log.
Backed by a Cloudflare Worker + D1 with per-machine scoped tokens, or a
local store for single-machine use. The protocol is plain HTTP + JSON —
any language can implement a client.

## The operator view — [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard)

A web dashboard over the same state: lanes, machines, liveness, and phases,
so an operator can see the whole fleet at a glance.
