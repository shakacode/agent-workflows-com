---
layout: ../../layouts/Doc.astro
title: Public terminology
eyebrow: Docs · Reference
description: Plain-language definitions for the public terms used to explain the Agent Workflows throughput-first objective.
---

These definitions describe the public model used by this explanatory site. For executable rules
and source-pack-specific vocabulary, use the normative
[agent-workflows documentation](https://github.com/shakacode/agent-workflows/blob/main/docs/README.md)
and its
[source-pack glossary](https://github.com/shakacode/agent-workflows/blob/main/docs/source-pack-glossary.md).

## Objective and limits

### Throughput-first objective

The organizing goal: maximize valuable, verified software changes per unit of human attention,
elapsed time, and tokens, subject to an explicit safety floor. It optimizes completed, trustworthy
outcomes—not activity or raw pull-request count.

### Valuable, verified software change

A change that solves a real user or project need, passes the checks appropriate to its risk, and
is ready to integrate or has been integrated. Unreviewed output and abandoned branches do not
count.

### Human attention

The limited time and mental effort people spend making decisions, answering questions, reviewing
changes, resolving exceptions, and authorizing sensitive actions.

### Elapsed time

Wall-clock time from starting the work to reaching the verified outcome required by the task. It includes
waiting for people, workers, tests, CI, services, and integration—not just active coding time.

### Tokens and token budget

Tokens are the units models process and generate. A token budget is the amount of model usage a
task or group of tasks can justify before it needs to stop, narrow scope, or request a decision.

### Safety floor

The small set of protections that stays mandatory at every speed or assurance level. Examples
include treating public text as untrusted, preventing conflicting writers, binding evidence to the
current change, protecting the base branch, and retaining required human authority for
irreversible actions.

## Work and concurrency

### Worker

An agent process or task doing a bounded piece of implementation, research, review, or
verification.

### Useful concurrency

The amount of independent work that can run at once while still improving verified delivery.
Concurrency stops being useful when human queues, integration pressure, machine contention, or
token cost outweigh the time saved.

### Human decision pressure

The arrival rate and difficulty of agent questions, reviews, exceptions, and approvals compared
with the attention people have available to resolve them.

### Integration pressure and integration backlog

Integration pressure is the load created by changes that must be reconciled, reviewed, ordered,
or merged. The integration backlog is the work already waiting in that part of the system.

### Machine and service capacity

The available worktrees, CPU, memory, storage, CI runners, preview environments, API rate limits,
and external services needed to run the work and its checks.

### Worktree

A separate Git checkout attached to a branch. Worktrees let independent changes execute without
sharing one working directory; they do not remove semantic dependencies between the changes.

### Lane

One bounded stream of work for a canonical issue or pull request, with its own ownership, status,
verification, and outcome.

### Coordination claim

A recorded assertion that one live task owns a target. It prevents two writers from changing the
same issue or pull request at the same time and supports an explicit handoff or takeover.

## Planning, execution, and integration

### Task brief

A short, human-readable statement of the objective, scope, non-goals, success conditions,
dependencies, important risks, and authority boundaries for a task.

### Skill

A versioned set of instructions and supporting resources that tells an agent how to perform a
reusable workflow. Stable rules live here instead of being rewritten into every task brief.

### Execution

Doing the work inside a lane: research, implementation, local checks, and preparation of the pull
request. Independent execution can happen concurrently.

### Integration

Reconciling a completed change with other changes and moving it through review, merge, and any
release or promotion gates. Integration may need an order even when execution was concurrent.

### Semantic dependency

A relationship in meaning or behavior between changes. One change may depend on an API, schema,
decision, or invariant supplied by another even when their files do not overlap.

### Shared main

The repository's common base branch on which developers, downstream branches, builds, or releases
depend. Its blast radius grows as more work relies on it.

## Assurance and release

### Assurance

The evidence and controls used to make confidence proportionate to the cost of being wrong:
tests, review, manual checks, current-head evidence, rollout controls, and required human
decisions.

### Current-head evidence

Test, review, or CI evidence tied to the exact commit being considered, rather than to an older
version of the branch.

### Production promotion gate

The required checks and authority between a tested candidate and production. It lets teams
experiment quickly before choosing which exact version may go live.

### Release train

A delivery pattern that groups changes into scheduled candidates or versions and concentrates
some integration and compatibility assurance before each release.

### Project risk and promotion risk

Project risk is the harm a faulty change could cause in its repository or product. Promotion risk
is the added harm from moving that change into a shared or production environment.

## Measurement and status

### Telemetry

Structured measurements about how the workflow operates. It should expose bottlenecks and
outcomes without treating activity alone as success.

### Planning latency

Elapsed time from accepting a candidate task to producing a brief that is ready to execute.

### Worker utilization

The share of available worker time spent on useful task work rather than waiting, retrying,
duplicating effort, or creating integration overhead.

### Human intervention

A point where a person must answer, correct, approve, resolve, or take over work.

### Review cycle

One pass from submitted change to review feedback and the resulting response or revision.

### Integration cost

The human time, worker time, tokens, compute, conflict resolution, reruns, and coordination needed
to land completed work safely.

### Escaped defect

A defect that was not caught by the required assurance before the change reached users or its
target environment.

### Principle

A durable decision rule used to design or evaluate the system. A principle does not claim that a
specific mechanism exists today.

### Current behavior

What the normative source pack and its documented integrations support now. The installed version
of the source pack is authoritative for an individual run.

### Proposed direction

An open design or implementation path that has not shipped as a reliable product contract.

### Explanatory site and normative source pack

This website, maintained in
[agent-workflows-com](https://github.com/shakacode/agent-workflows-com), explains the ideas in
plain language. The
[agent-workflows repository](https://github.com/shakacode/agent-workflows) is the normative source
pack: it owns the versioned skills, workflow rules, and technical documentation that agents
actually use.
