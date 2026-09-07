---
layout: ../layouts/Doc.astro
title: The Methodology
eyebrow: Methodology
description: How ShakaCode actually runs AI coding agents — mindset, the core loop, adversarial review, verification, parallel work, and the anti-patterns to avoid.
---

Distilled from a working session between Justin Gordon and Robert on how we actually use
AI coding agents. The short version: **use AI aggressively, verify the risky parts,
document what was learned, and keep shipping.**

## Balance verification with delivery

Start with **what happens if this breaks?** A disposable app for yourself may need no
formal process: describe it, try it, and iterate. Using it is already a lightweight check.
You do not need a workflow pack to find out whether an idea is useful.

As dependence grows, add safeguards that address the consequences:

- **Friends or coworkers:** check important user journeys, protect saved data, and have a recovery path.
- **Customers depend on it:** automate critical behavior checks, review risky changes, monitor failures, and prepare rollback.
- **Critical service:** set reliability targets, stage releases, test failure modes, and practice recovery.

These are examples, not user-count thresholds. A five-person payroll tool can carry more
risk than a popular disposable toy. Sensitive data and irreversible actions raise the
stakes even for a personal app. Within one system, button copy and permission changes
also deserve different checks. [See the verification spectrum](/#verification).

Think in terms of **development + verification + expected failure cost + cost of delay**.
This is a decision aid, not a precise calculator. Ask which failure the next check could
catch, how likely and costly it would be, and whether the result would change the release
decision. Include human attention, flaky tests, and repeated review cycles in the cost.

Reducing exposure can help too: ship a smaller change, release to a limited audience,
and make recovery easier. Tests before release cannot replace monitoring and recovery
afterward. Google’s [Embracing Risk](https://sre.google/sre-book/embracing-risk/) discusses
why reliability investment should match the service’s needs and account for opportunity cost.

## Give verification a stopping rule

Before work starts, name the behavior to deliver, the evidence needed to accept it, and
the failures that must block release. Finish when that evidence is sufficient, required
checks pass, and remaining risks have an explicit disposition. An additional suggestion
is an observation to evaluate, not an automatic requirement.

If repair and review keep generating more work, pause the loop and decide whether the
next change addresses a real defect or expands the design. A pause is not permission to
ship an unresolved substantive defect or bypass a required security, review, or CI gate.

Our [September 5 backlog recovery plan](https://github.com/shakacode/agent-workflows/blob/7a5018e6433c656e7946af7ab9ac4236b88be190/docs/plans/2026-09-05-backlog-recovery-plan.md)
records this tradeoff. At its September 6 status update, a proposed two-round continuation
brake and five-PR adoption pilot were still unshipped. That historical proposal is not a
claim of measured improvement or a universal two-review limit.

## Seam files preserve attention across repositories

Verification choices become easier to carry between projects when their policies have
consistent homes. Small seam files establish that organization at adoption time:

- `AGENTS.md` points humans and agents to the repository’s workflow configuration.
- `.agents/bin/` holds wrappers for the repository’s real setup, validation, and test commands.
- `.agents/agent-workflow.yml` holds repository-owned non-command policy.

This is the [repo seam](/docs/architecture/#the-repo-seam). Shared skills read the local
contract, so moving between repositories does not require rediscovering where commands
and policies live. The prototype can declare a simple build check while another repo
requires integration tests. Consistent organization does not mean identical policies.

Seam files are a starting point to review and maintain, not proof that a command works
or a substitute for current task ownership and status. Keep repository-specific facts in
the repository and shared procedure in the pack. Start with the
[adoption guide](/docs/quickstart/#qs-repo-seam) when repeated context gathering becomes a cost.
A coordination backend is a separate choice for concurrent work.

## Measure before extracting more

Keep the skill entrypoint focused on mode selection and required boundaries.
Load detailed references when the selected route needs them. Use tested helpers
for repeatable operations whose inputs, outputs, and failure cases can be defined.
The [update-changelog example](/docs/architecture/#example-update-changelog)
shows a measured reduction in static instruction bytes with unchanged helper code.

Further extraction should follow measured task outcomes. Compare the same tasks
and acceptance criteria before and after a change. Record model and reasoning
settings, host, workflow revision, loaded references, tool access, and repository
state. Check completion, missed requirements, review corrections, and human
intervention alongside observed token use, elapsed time, and cost where available.
Report missing measurements and variation across repeated runs.

Keep an extraction when that evidence supports it. Rework it if agents miss a
reference, lose an authority check, or require more repair. Smaller instructions
alone do not show that tasks became faster, cheaper, or more correct.

## Mindset

Treat the agent as a continuous research, review, testing, and documentation partner —
not an oracle, and not a replacement. When you're blocked or unsure, ask one more precise
question that moves the task toward a concrete next action, rather than a broad "explain
everything." And whenever the agent explains a confusing repo process, ask the follow-up:
*should this become docs?* Documentation is high-leverage and usually low-risk — merge it
quickly.

## The core loop: plan → batch → review → audit

For coordinated production work, shape the work first (`plan-pr-batch`, `triage`, `spec`),
run it as coordinated lanes (`pr-batch`), review the changes, and audit the merged batch
(`post-merge-audit`). Use standalone skills for a single task and select review depth by
risk. Follow the repository’s required gates; an agent saying “done” is not acceptance evidence.

## Adversarial review before merge

For anything non-trivial, run a review whose job is to find what's *wrong* — production
risks, deployment risks, missing tests, unsafe assumptions — not to summarize the PR.
Start with concrete blockers and file/line references. A change is merge-ready when tests
pass, manual verification is adequate, adversarial review finds no serious issue, and the
remaining risk is understood.

## Verification habits

Evidence before assertions, always. CI is not "is it green?" but "did the step that proves
*this change* actually run?" Ask the agent which manual testing a change needs and in
which environment. Never accept "the agent said it tested" as proof without logs,
commands, or screenshots.

## Parallel work

Keep several things moving while slow operations run — CI, review apps, AI reviews.
Use explicit claims and lanes to coordinate ownership, and hand off cleanly across
machines. The [claim protocol](https://github.com/shakacode/agent-coordination#cli)
refuses a competing claim while the existing holder is protected by its liveness
or lease state. Workers must use the same backend and canonical repository/target
identity and respect a refusal. Claims do not prevent overlapping edits on different
targets or actions outside the protocol. Idle time is for the next PR's QA
checklist, a docs update, or a domain-expert handoff.

## Convert confusion into issues and docs

Don't let vague blockers stay vague. Capture the symptom, have the agent research likely
causes from repo context, decide whether it's a real bug, a docs gap, or expected
behavior. File a self-contained issue or docs PR when the impact warrants more work.
Keep optional observations in the original discussion unless there is a reason to schedule them.

## Anti-patterns to avoid

- Passing vague observations to teammates without first researching and packaging them.
- Treating "AI said it tested" as proof, with no logs or screenshots.
- Holding low-risk docs and comment PRs forever because review automation failed.
- Merging high-risk deploy or secret changes without narrowing the environment impact.
- Letting a large migration reach reviewers without a change map.
- Asking broad questions when a specific next-step question is what you need.
