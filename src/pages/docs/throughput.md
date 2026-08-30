---
layout: ../../layouts/Doc.astro
title: The throughput-first objective
eyebrow: Docs · Operating principle
description: How Agent Workflows balances valuable delivery, human attention, elapsed time, tokens, concurrency, and a non-negotiable safety floor.
---

> Maximize valuable, verified software changes per unit of human attention, elapsed time,
> and tokens—subject to a small explicit safety floor.

In plain language: get more worthwhile, working software from the review time, waiting time,
and model budget available—without dropping the few protections that must always hold. Faster
is not the same as starting the most workers or merging the most pull requests. Work only counts
when it is useful, checked, and integrated safely.

This page is an **explanation**, not the workflow contract. The
[agent-workflows source-pack repository](https://github.com/shakacode/agent-workflows) owns the
versioned skills, workflow rules, and technical documentation. When this site and the installed
pack differ, the source pack is normative. The [terminology page](/docs/terminology/) defines the
public workflow terms used here.

## How to read the claims

- **Principle** means a durable way to reason about the system. It is not a claim that every
  mechanism has shipped.
- **Current behavior** means a capability or limitation in the source pack today.
- **Proposed direction** means open work under discussion. It should not be planned around as if
  it already exists.

## Principles

### Optimize flow, not worker count

Useful concurrency is the amount of independent work that can move without creating more delay
than it removes. Four limits set it together:

- **Human attention:** how many decisions, reviews, and exceptions people can handle promptly.
- **Integration pressure:** how much finished work is waiting to be reconciled, reviewed, or
  merged.
- **Machine and service capacity:** available worktrees, CPU, memory, CI runners, test
  environments, API limits, and external services.
- **Token budget:** how much model usage the work can justify.

Add workers while they shorten the path to verified changes. Stop adding them when review queues,
conflicts, machine contention, or token cost grow faster than useful output. There is no universal
best worker count.

### Brief the task; keep stable rules versioned

Planning should produce a short, human-readable task brief: the objective, scope, non-goals,
success conditions, dependencies, important risks, and authority boundaries. Stable workflow
rules belong in versioned skills and documentation. Repeating compressed copies in every prompt
makes the task harder to read and creates another place for the rules to drift.

### Execute independently; integrate deliberately

Independent implementation can run at the same time in isolated worktrees. Isolation prevents
two workers from writing through the same checkout, but it does not erase dependencies between
their changes or make the shared main branch accept everything at once.

```text
Execute together

worktree A → PR A ─┐
worktree B → PR B ─┼→ review
                   │
Integrate in order │
API PR → client PR ┘
                   ↓
             shared main
```

PR A and PR B can be implemented concurrently when they are independent. The client PR has a
semantic dependency on the API contract, so its final verification or merge follows the API.
Review capacity, conflicts, and release gates can still order otherwise independent pull requests.

### Match assurance to risk; keep the floor

Assurance should grow with the cost of being wrong and with the risk of promoting the change.
These are examples of operating patterns, not product profiles that exist today:

- A **production-critical enterprise service** may require broad automated checks, independent
  review, controlled rollout, and explicit production approval on every material change.
- A **product-discovery site behind a production promotion gate** can test many ideas quickly in
  previews. Moving a chosen version to production still requires current evidence and the person
  authorized to promote it.
- A **release-train open source project** can keep ordinary pull-request checks focused, then
  concentrate cross-version testing, integration review, and release evidence before a release
  candidate or final version.

The safety floor does not disappear in the faster patterns: public text remains untrusted; agents
do not push directly to a protected base branch; merge evidence is tied to the current change;
contradictory writers stop rather than race; and destructive, release, or other irreversible
actions keep the human authority required by repository policy.

### Treat shared main as shared infrastructure

The more developers, services, or releases depend on a main branch, the more expensive a bad
merge becomes. That does not mean every repository needs maximum ceremony. It means integration
and promotion controls should reflect the branch's real blast radius, not just the size of the
diff.

### Improve the limits from evidence

Telemetry should show where flow slows down and where assurance catches real problems. Useful
measures include planning latency, worker utilization, human interventions, review cycles,
integration cost, tokens, and escaped defects. Trends across comparable work are more useful than
one isolated number: they reveal whether another worker helped, whether a gate prevented a defect,
or whether coordination cost merely moved elsewhere.

## Current behavior

The source pack currently provides versioned skills and workflow documentation, repository-owned
setup and validation through the `.agents/` seam, isolated worktrees for concurrent lanes,
coordination claims that prevent conflicting writers, current-head verification and review gates,
and privacy-safe
[batch usage receipts](https://github.com/shakacode/agent-workflows/blob/main/docs/batch-usage-receipt.md).

The controls are configured through several separate gates today. There is no single shipped
assurance profile that turns the examples above into a `fast`, `balanced`, or `strict` mode. The
planner also still emits a goal prompt that contains some compressed workflow rules, and the
ordinary implementation topology can be simpler than every multi-lane capability the pack
supports.

For exact behavior, read the
[source-pack documentation](https://github.com/shakacode/agent-workflows/blob/main/docs/README.md)
and the version of the skills installed on the agent host.

## Proposed direction

Open source-pack work is exploring—not yet promising—the following changes:

- [#476](https://github.com/shakacode/agent-workflows/issues/476): replace duplicated compressed
  prompt rules with readable task briefs and versioned workflow pins.
- [#514](https://github.com/shakacode/agent-workflows/issues/514): define repository delivery
  policy and task merge authority in plain language, with risk-proportionate integration and
  promotion checks that preserve the invariant safety floor.
- [#189](https://github.com/shakacode/agent-workflows/issues/189): audit skills for the minimum
  sufficient instructions and move deterministic rules to better mechanisms where justified.
- [#402](https://github.com/shakacode/agent-workflows/issues/402): make one canonical issue or pull
  request the ordinary implementation topology, with multi-target supervision as an explicit
  exception.

The proposed changes should be evaluated against the objective at the top of this page: more
valuable, verified changes for the attention, time, and tokens spent, with no weakening of the
safety floor.
