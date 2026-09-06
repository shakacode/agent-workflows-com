---
layout: ../../layouts/Doc.astro
title: Astra and model routing
eyebrow: Docs
description: How Agent Workflows supports Astra in Codex, with portable fallbacks and evidence-based evaluation.
---

Astra is a model you can use through Codex. Agent Workflows provides the surrounding process: scope, verification, independent review, and the evidence needed to finish authorized work.

The pack includes an advisory Astra routing pilot. Its recommendations help choose a model and reasoning effort for a task; availability and your explicit choices still matter. An unavailable preference does not prevent work or invalidate an independent review. Claude Code remains supported by the same portable workflow text.

The workflow guidance also makes completion boundaries explicit and defines when passing local verification evidence can be reused. Reuse requires matching evidence and context; it does not replace hosted checks or independent review.

To adopt the changes, update your installed pack using the [installation and upgrade guide](https://github.com/shakacode/agent-workflows/blob/main/docs/installation-and-upgrades.md), then check which models and efforts your host provides. See the [canonical Astra guide](https://github.com/shakacode/agent-workflows/blob/main/docs/astra-tuning.md) for the pilot profile and evaluation procedure.

The pilot has not established measured quality, cost, or speed gains. The included evaluator organizes independently adjudicated trial metadata; it does not run models or select a winner.
