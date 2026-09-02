---
layout: ../../layouts/Doc.astro
title: Case Studies
eyebrow: Field evidence
description: Audits, failures, and improvements from running AI coding-agent workflows in real repositories.
---

The useful question is not whether coding agents ever make mistakes. It is which mistakes
escape, which gates catch them, and whether the delivery system improves after each miss.

## Published studies

### [We audited 30 commits from an AI-heavy workflow](/case-studies/30-ai-assisted-commits/)

An adversarial audit of Shakapacker found real defects, weak tests, incomplete provenance,
and a larger problem hiding in plain sight: generated process noise made the engineering
signal harder to see.

The study explains the remediation and the two-control model we now use: improve what gets
generated, then fail closed when integration evidence is incomplete.
