---
layout: ../../layouts/Doc.astro
title: Architecture
eyebrow: Docs
description: How the pack, the repo seam, and the coordination backend fit together.
---

Three planes, three repos.

## The process plane — [agent-workflows](https://github.com/shakacode/agent-workflows)

The pack: portable skills and workflow prompts codifying plan → batch → review → audit,
plus the security preflight. Installed once per agent host (Codex or Claude Code), with
byte-identical skill text across both — host-specific verbs map at runtime.

## The repo seam

Each consumer repo exposes a small contract instead of copying the process:
`.agents/bin/` command wrappers, `.agents/agent-workflow.yml` policy, a trust
configuration for GitHub actors, and an `AGENTS.md` pointer.
`agent-workflow-seam-doctor` scaffolds and validates it.

## The protocol plane — [agent-coordination](https://github.com/shakacode/agent-coordination)

Claims — compare-and-swap leases on an issue or PR, with liveness-aware takeover — plus
TTL heartbeats (live → stale → dead), batch lanes with dependencies, and an append-only
phase-event log. State lives behind a generic `/v1/state` HTTP API on a Cloudflare Worker
and D1, with per-machine bearer tokens scoped to read/write path prefixes — or a
zero-config local store for a single machine. The protocol is plain HTTP and JSON, so any
language can implement a client.

## The operator view — [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard)

A separate, local console over the same state: a dense, searchable table of lanes and PRs
by liveness and phase, with “wedged” detection (a live heartbeat that has stopped making
progress) and universal search. It reads live over the coordination API and refreshes
every few seconds, and never mutates state. A published state-schema contract is the
decided direction
([ADR 0003](https://github.com/shakacode/agent-coordination/blob/main/docs/adr/0003-decouple-dashboard-via-state-contract.md))
that will replace the dashboard's hand-mirrored types.
