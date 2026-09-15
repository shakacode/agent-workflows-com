---
layout: ../../layouts/Doc.astro
title: Docs
eyebrow: Docs
description: Documentation for the ShakaCode agent stack.
---

## Start with ShakaCode Workflows

[Give your agent a task. Get a verified PR and a clear explanation.](/docs/v2/)

ShakaCode Workflows guides one ordinary change from task to implementation, verification,
and a PR walkthrough. Choose whether the agent asks before merging or merges after
the required checks and approvals pass. Start with the
[ShakaCode Workflows guide](/docs/v2/) for installation, questions, evidence, and current limitations.

- [Getting started](/docs/v2/getting-started/) — install and complete your first task.
- [Working with your agent](/docs/v2/working-with-your-agent/) — questions, communication, and boundaries.
- [Verification](/docs/v2/verification/) — tests and visual evidence.
- [Usage reporting](/docs/v2/usage-reporting/) — available model, thinking, and token data.
- [Package installation](/docs/v2/packaging/) — build and install a local RubyGem.
- [Host support](/docs/v2/host-support/) — what has actually been verified.

## V1 and advanced workflows

The existing V1 pack remains available for standalone skills and advanced
multi-agent coordination. This site is its public, plain-language guide. The
[agent-workflows repository](https://github.com/shakacode/agent-workflows) is the normative source
pack: its versioned skills, workflow rules, and technical docs define what agents actually run.

- [The throughput-first objective](/docs/throughput/) — what the system optimizes for, why more
  workers are not always faster, and how safety and release confidence fit.
- [Public terminology](/docs/terminology/) — plain-language definitions for the terms used by the
  objective.
- [Quickstart](/docs/quickstart/) — install the pack and run your first skill in minutes.
- [Architecture](/docs/architecture/) — the pack, the seam, and the coordination backend.
- [Astra and model routing](/docs/astra/) — the advisory pilot, portable fallbacks, and evaluation guidance.
- [Git-native distributions and customization](/docs/distributions/) — the target model for
  trusted Upstream Releases, explicit forks, and contribution back.
- [Trust &amp; preflight](https://github.com/shakacode/agent-workflows/blob/main/docs/trust-and-preflight.md) — public-input risks, trust configuration, and preflight limits.
- [Security posture](https://github.com/shakacode/agent-workflows/blob/main/docs/security-posture.md) — the Rule of Two and the trust model.
- [Seam design](https://github.com/shakacode/agent-workflows/blob/main/docs/seam-design.md) — how a repo adopts the pack.
- [Coordination protocol by curl](https://github.com/shakacode/agent-coordination/blob/main/docs/protocol-curl.md) — the HTTP state API by hand.
- [Full docs in the repo →](https://github.com/shakacode/agent-workflows/tree/main/docs)
