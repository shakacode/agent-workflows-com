---
layout: ../../layouts/Doc.astro
title: The AI Reviewer Found It. We Merged Anyway.
eyebrow: Case study · August 5, 2026
description: An AI reviewer identified two real risks before merge. Both disappeared into an 83-item PR timeline. Our 30-commit audit shows why faster coding requires fail-closed integration.
canonicalUrl: https://shakacode.com/blog/audit-30-ai-assisted-commits/
---

*By Justin Gordon. Cross-published from the [ShakaCode blog](https://shakacode.com/blog/audit-30-ai-assisted-commits/), which is the canonical version.*

<img src="/images/case-studies/ai-audit/cover.png" alt="Review signal collapsed from 83 conversation items to two actionable findings, neither dispositioned before merge" style="max-width: 100%; height: auto;" />

The most uncomfortable failure in our AI-assisted workflow was not that an agent wrote bad code.

It was that an AI reviewer found two real problems, explained both clearly, and we merged the pull request without replying to or resolving either one.

The PR had six commits, 17 changed files, and **83 conversation items**. Hours before merge, the repository's Claude reviewer warned that:

1. a transient `429` or `5xx` API failure could be treated like a confirmed delisting and delete a healthy provider row;
2. the final exhausted retry could still sleep for up to 60 seconds even though no later attempt would use the wait.

Both findings were current. Both were unresolved. Both were unanswered when the PR merged.

<img src="/images/case-studies/ai-audit/review-finding-transient-failure.png" alt="An AI reviewer warns that a transient API failure can delete a healthy provider row" style="max-width: 100%; height: auto;" />

<img src="/images/case-studies/ai-audit/review-finding-final-retry.png" alt="An AI reviewer warns that the final exhausted retry can waste up to 60 seconds" style="max-width: 100%; height: auto;" />

*These are the original review comments. Human usernames, avatars, and repository-identifying headers have been cropped; the findings themselves are unchanged.*

That incident changed the question for us. “Can AI find bugs?” was not the issue. The reviewer did its job. The delivery system did not require anybody to disposition what it found.

## How 83 items became zero accountability

Review automation produces summaries, check updates, inline comments, replies, status changes, and new review waves after every push. Each artifact may be defensible on its own. Together they create an attention-allocation problem.

In this PR, two actionable findings existed inside a timeline of 83 items. GitHub showed them. Nothing made them authoritative.

That distinction matters:

> Detection succeeded. Integration discipline failed.

A green CI job tells us that a process finished. It does not prove that every current finding was fixed, rejected with a rationale, or consciously accepted. If a review comment is advisory forever, the system is relying on somebody noticing the right sentence in a very long page.

The fix is not “add another AI reviewer.” It is to make current findings stateful. Before merge, each one needs exactly one disposition:

- fixed and verified;
- explicitly rejected or accepted with a recorded rationale;
- converted into an owned follow-up with a defined trigger.

Until then, the merge gate should fail closed.

## Then we adversarially audited 30 recent commits

The missed-review incident was not our only input. Alexandre audited the 30 most recent non-trivial commits in [Shakapacker](https://github.com/shakacode/shakapacker), our open-source integration between Ruby on Rails and modern JavaScript bundlers.

The audit used one agent per commit. Each agent read surrounding code rather than only the diff, traced behavior across files, and replayed selected claims with tests or primary sources.

<img src="/images/case-studies/ai-audit/audit-distribution.png" alt="Twenty-five of 30 commits were rated clean, one low, four medium, and none high or critical" style="max-width: 100%; height: auto;" />

The findings were more nuanced than either side of the usual AI argument:

- **No CRITICAL or HIGH defects** appeared in the 30 commits.
- One low-likelihood security regression could make a helper search the application directory for `node` when `PATH` was unset.
- One Babel 8 smoke test passed without proving that Babel 8 transformed anything.
- An extensionless Ruby helper triggered CI but was not actually linted by the job it triggered.
- Upgrade documentation contained stale version and dependency references.
- Several commits improved security or reliability, including safer proxy behavior, narrower secret scope, and a fixed descriptor leak.

These were real problems. Calling them “mostly stylistic” would be wrong. Presenting them as evidence that agentic coding produced a catastrophically bad repository would also be wrong.

We opened focused fixes:

- [Fail closed when `PATH` is unset](https://github.com/shakacode/shakapacker/pull/1240)
- [Make the Babel 8 smoke prove transformation](https://github.com/shakacode/shakapacker/pull/1241)
- [Actually lint the merge-readiness helper](https://github.com/shakacode/shakapacker/pull/1242)
- [Correct stale upgrade references](https://github.com/shakacode/shakapacker/pull/1239)

## The loudest slop signal was not production code

It was permanent prose.

One six-line code change carried a **154-line commit body** containing a decision log, QA evidence, and review receipts.

<img src="/images/case-studies/ai-audit/commit-noise.png" alt="A 154-line commit body was 25.7 times longer than the six changed code lines" style="max-width: 100%; height: auto;" />

The evidence may have been useful while the task was running. Repeating all of it in permanent Git history imposed a cost on every later reader:

- `git log` became harder to scan;
- useful rationale became indistinguishable from generated ceremony;
- reviewers spent attention separating conclusions from receipts;
- later agents had more stale prose to summarize and amplify;
- important findings competed with dozens of low-value artifacts.

The answer is not to discard evidence. It is to give each artifact one job.

| Artifact | Its job |
| --- | --- |
| Commit message | Concise, durable rationale and issue linkage |
| PR description | Change map, risk, and verification contract |
| Review ledger | Current unresolved findings and their disposition |
| Coordination record | Detailed transcripts, receipts, and replay evidence |

We are tracking that change in [agent-workflows #318](https://github.com/shakacode/agent-workflows/issues/318).

## We almost blamed the wrong mechanism

The audit found a commit message that cited a GitHub security advisory unrelated to the dependency being changed. The factual error was verified. The audit initially speculated that an AI had pattern-matched the wrong advisory.

That attribution was not verified.

The contribution came from an outside pull request with no recorded Claude or Codex provenance. In the same sample, one known regression came from Codex, another finding had unknown model provenance, and the two missed integration findings were discovered by Claude.

That should make us cautious about claims such as “Claude creates more slop” or “Codex is safer.” Without model, reasoning level, workflow version, and gate configuration, those are anecdotes—not causal measurements.

The actionable conclusion is model-independent:

> An incorrect security claim entered permanent history without source verification.

So verify advisory identifiers against primary sources regardless of who—or what—authored the text.

## Speed changes the denominator, not the standard

When delivery volume rises sharply, absolute defect count stops being a complete comparison. Ten defects across 1,000 meaningful changes is different from ten defects across 20.

The self-driving-car analogy is imperfect but useful: total accidents matter, but accidents per mile and their severity tell us whether the system is improving.

For software, measure both output and outcomes:

- meaningful merged changes and lead time;
- escaped defects weighted by severity;
- incidents, rollbacks, and customer-impact hours;
- findings caught before versus after merge;
- current review findings left unresolved at merge;
- debugging and remediation time.

This does **not** mean velocity excuses defects. Higher throughput crosses more integration boundaries per week. That makes deterministic gates more important, not less.

## The operating model needs two controls

<img src="/images/case-studies/ai-audit/two-controls.png" alt="Generation quality and integration discipline converge at a fail-closed merge gate" style="max-width: 100%; height: auto;" />

### Control 1: improve what gets generated

- Require tests that prove changed behavior rather than merely execute a path.
- Keep change sets focused enough for a reviewer to understand coherently.
- Use architecture and type-design review for boundary or state changes.
- Verify security and dependency claims against primary sources.
- Keep permanent artifacts proportional to the change.

### Control 2: fail closed during integration

- Bind CI and review evidence to the exact head being merged.
- Treat current unresolved findings as untriaged work, not background commentary.
- Test the integrated result when individually green branches land together.
- Refuse release when repository state or current evidence is unknown.
- Audit merged batches, not only their branches before merge.

Our open-source follow-ups include:

- [Fail closed on unsettled configured reviews](https://github.com/shakacode/agent-workflows/issues/249)
- [Require coverage of the behavior that changed](https://github.com/shakacode/agent-workflows/issues/256)
- [Block merge on unfulfilled test-plan claims](https://github.com/shakacode/agent-workflows/issues/257)
- [Continuously detect downstream workflow drift](https://github.com/shakacode/agent-workflows/issues/319)

## What we believe now

AI-assisted engineering can increase useful output dramatically. It can also generate weak tests, incorrect claims, overcomplicated patches, and mountains of plausible prose.

But finding a defect is not the same as handling it. Human review and AI review share the same integration problem: a finding that nobody must disposition is only a suggestion.

Our standard is becoming:

> Move quickly, preserve the signal, and make the system prove that the risky parts are safe.

The workflows and open issues behind this work are public at [agents.shakacode.com](https://agents.shakacode.com) and [github.com/shakacode/agent-workflows](https://github.com/shakacode/agent-workflows). If your team is adopting coding agents faster than its review process can absorb them, [ShakaCode can help design the operating model](https://www.shakacode.com/contact/).
