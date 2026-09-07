---
layout: ../../layouts/Doc.astro
title: Architecture
eyebrow: Docs
description: How the pack, the repo seam, and the coordination backend fit together.
---

Three planes, three repos.

## The process plane — [agent-workflows](https://github.com/shakacode/agent-workflows)

The pack: portable skills and workflow prompts codifying plan → batch → review → audit,
plus the security preflight. Shared skill sources support Codex and Claude Code,
with host-specific installation and invocation guidance.

## Small entrypoints, conditional references, executable helpers

A skill entrypoint tells the agent when to use the skill, which mode applies, and
which authority and safety checks remain required. Detailed instructions live in
references that the agent reads when that mode or phase needs them. Moving text
to a reference helps only if the entrypoint gives a clear loading condition.

Executable helpers handle repeatable operations, such as enumerating merged PRs.
Their tests check defined inputs, outputs, and failure cases. The agent still
interprets the evidence and makes the judgment calls assigned by the skill.
A helper test does not prove that an agent followed the surrounding instructions.

### Example: update-changelog

[PR #789](https://github.com/shakacode/agent-workflows/pull/789) separated the
`update-changelog` entrypoint from four references. At merged commit
[`37ed910`](https://github.com/shakacode/agent-workflows/commit/37ed91013e485c09db37deeff99bb1a229110bc9),
the entrypoint changed from **572 lines / 42,477 bytes** to **97 lines / 6,148 bytes**,
compared with the merge commit’s first parent. Its
[merged-PR enumeration helper and tests](https://github.com/shakacode/agent-workflows/tree/37ed91013e485c09db37deeff99bb1a229110bc9/skills/update-changelog/bin)
were unchanged.

The [mode table](https://github.com/shakacode/agent-workflows/blob/37ed91013e485c09db37deeff99bb1a229110bc9/skills/update-changelog/SKILL.md#select-the-mode)
selects these instruction sets:

| Route | References added to the entrypoint | UTF-8 bytes |
| --- | --- | ---: |
| Standalone classification sweep | Classification Sweep | 13,337 |
| Ordinary Unreleased update | History, Classification Sweep, Entry Format | 20,360 |
| Prerelease header, entries already present | History, Classification Sweep, Release | 32,707 |
| Full release with entries | All four references | 35,526 |

These are static instruction-byte totals, counting each selected file once.
They exclude repository context, shared workflows, helper source and output, and
conversation history. They are **not measured tokens, cost, speed, or quality results**.
Actual loading depends on the task and host; a smaller entrypoint does not establish
better correctness.

To reproduce the counts in a clone of `shakacode/agent-workflows` that contains the commit:

```bash
revision=37ed91013e485c09db37deeff99bb1a229110bc9
skill=skills/update-changelog
git show "${revision}^1:${skill}/SKILL.md" | wc -l -c
git show "${revision}:${skill}/SKILL.md" | wc -l -c
for reference in classification-sweep history entries release; do
  git show "${revision}:${skill}/references/${reference}.md" | wc -c
done
git diff "${revision}^1" "$revision" -- "$skill/bin/"
```

The reference sizes, in that order, are 7,189, 4,204, 2,819, and 15,166 bytes.
Add the 6,148-byte entrypoint to the selected references to reproduce each route.
The final command produces no diff. Use
[measured task outcomes](/methodology/#measure-before-extracting-more) to decide
whether to extract more instructions or helper behavior.

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
every few seconds, as a read-only view of coordination state. A published state-schema contract is the
decided direction
([ADR 0003](https://github.com/shakacode/agent-coordination/blob/main/docs/adr/0003-decouple-dashboard-via-state-contract.md))
that will replace the dashboard's hand-mirrored types.
