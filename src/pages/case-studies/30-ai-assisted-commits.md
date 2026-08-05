---
layout: ../../layouts/Doc.astro
title: We Audited 30 Commits from an AI-Heavy Workflow. The Biggest Problem Wasn't Broken Code
eyebrow: Case study · August 5, 2026
description: A public Shakapacker audit found real defects, weak tests, and a surprising amount of process noise. Here is what the evidence says—and the gates we are adding.
canonicalUrl: https://shakacode.com/blog/audit-30-ai-assisted-commits/
---

*By Justin Gordon. This case study is cross-published from the [ShakaCode blog](https://shakacode.com/blog/audit-30-ai-assisted-commits/), which is the canonical version.*

AI coding's next bottleneck is not generating code. It is preserving enough signal to review, integrate, and operate that code safely.

We recently tested that claim against our own work. A teammate audited the 30 most recent non-trivial commits in [Shakapacker](https://github.com/shakacode/shakapacker), our open-source bridge between Ruby on Rails and modern JavaScript bundlers.

The audit was deliberately adversarial. Thirty agents examined one commit each, read the surrounding code, traced behavior across files, and replayed selected claims with tests or primary sources.

The result was neither “AI is reckless” nor “the findings were only style complaints.” It was more useful:

> The largest visible AI failure was excessive process noise. The most important code failures were comparatively few, but they showed exactly where deterministic gates were missing.

## What the audit found

The audit covered commits from June 30 through August 3, 2026.

- **No CRITICAL or HIGH findings** appeared in the 30 commits.
- One **low-likelihood security regression** could make a helper search the application directory for a `node` executable when `PATH` was unset.
- One **Babel 8 smoke test** passed without proving that Babel 8 transformed anything.
- An extensionless Ruby helper triggered CI but was not actually linted by the job it triggered.
- Upgrade documentation contained stale version and dependency references.
- Several changes improved security or reliability, including safer proxy configuration, a closed file-descriptor leak, narrower secret scope, and less path leakage in error output.

These were real findings. “No high-severity defects” does not mean “nothing to fix.” Small defects accumulate, and test gaps often become expensive only after another change relies on them.

We opened focused remediations rather than debating the label:

- [Fail closed when `PATH` is unset](https://github.com/shakacode/shakapacker/pull/1240)
- [Make the Babel 8 smoke prove transformation](https://github.com/shakacode/shakapacker/pull/1241)
- [Actually lint the merge-readiness helper](https://github.com/shakacode/shakapacker/pull/1242)
- [Correct the stale upgrade references](https://github.com/shakacode/shakapacker/pull/1239)

## The loudest problem was not the code

The most obvious AI fingerprint was disproportionate prose in permanent artifacts.

One six-line code change carried a 154-line commit body containing a decision log, QA evidence, and review receipts. Other small changes accumulated generated summaries in both commit messages and pull-request descriptions.

That material can be useful while work is in progress. Repeating all of it in permanent Git history has a cost:

- `git log` becomes harder to scan;
- useful blame context gets buried;
- reviewers spend attention separating rationale from ceremony;
- important findings compete with dozens of low-value comments;
- another model asked to summarize the thread has more opportunities to amplify an old or incorrect claim.

The answer is not to discard evidence. It is to give each artifact one job.

| Artifact | Its job |
| --- | --- |
| Commit message | Concise, durable rationale and issue linkage |
| PR description | Change map, risk, and verification contract |
| Review ledger | Current unresolved findings and their dispositions |
| Coordination record | Detailed transcripts, receipts, and replay evidence |

We captured this as [agent-workflows #318](https://github.com/shakacode/agent-workflows/issues/318): keep generated commit messages proportional and store detailed audit receipts outside Git history.

## We also corrected our own audit narrative

One commit message cited a GitHub security advisory that had nothing to do with the dependency being changed. The original audit speculated that an AI had pattern-matched the wrong advisory.

The bad citation was verified. The AI attribution was not.

The contribution came from an outside pull request with no recorded Claude or Codex provenance. The defensible conclusion is narrower and more actionable:

> An incorrect security claim entered permanent history without source verification.

That distinction matters. If we blame the wrong mechanism, we build the wrong guardrail. Advisory identifiers should be verified against a primary source regardless of whether the author is a person or a model.

Model and workflow provenance should become ordinary engineering metadata: which model ran, at what reasoning level, using which workflow version, with which gates active. Without it, “AI caused this” is often an inference rather than a finding.

## Speed changes the denominator, not the standard

When delivery volume rises sharply, absolute defect count stops being a complete comparison. Ten defects across 1,000 meaningful changes is different from ten defects across 20 changes.

The self-driving-car analogy is imperfect but useful: total accidents matter, but accidents per mile and their severity determine whether the system is improving.

For software, we should track both delivery and outcomes:

- merged changes and lead time;
- escaped defects by severity;
- incidents, rollbacks, and customer-impact hours;
- defects caught before merge versus after merge;
- unresolved review findings present at merge;
- debugging and remediation time.

This is not an argument that velocity excuses defects. Faster delivery makes fail-closed CI, current-base integration tests, and release gates more important because more work reaches the boundary sooner.

## Two controls are better than one AI reviewer

The audit changed how we frame the problem. AI-assisted delivery needs two independent control systems.

### 1. Improve what gets generated

- Require tests that prove the changed behavior rather than merely execute the path.
- Use architecture or type-design review for changes that alter boundaries or state.
- Keep change sets focused enough that a reviewer can form a coherent model.
- Verify security claims and dependency facts against primary sources.

### 2. Fail closed during integration

- Bind CI and review evidence to the exact head being merged.
- Treat current unresolved review findings as untriaged work, not background commentary.
- Test the integrated result when several individually green branches will land together.
- Refuse release when repository state or current-head evidence is unknown.
- Audit the merged batch, not only each branch before merge.

The second category matters because a reviewer can find the right issue and the workflow can still ignore it. A green check proves that a job finished. It does not prove that every current finding was read, fixed, or consciously waived.

Our open-source follow-ups include:

- [Fail closed on unsettled configured reviews](https://github.com/shakacode/agent-workflows/issues/249)
- [Require coverage of the behavior that changed](https://github.com/shakacode/agent-workflows/issues/256)
- [Block merge on unfulfilled test-plan claims](https://github.com/shakacode/agent-workflows/issues/257)
- [Continuously detect downstream workflow drift](https://github.com/shakacode/agent-workflows/issues/319)

## A practical audit checklist

For your next batch of AI-assisted work, ask five questions:

1. **What escaped?** Count defects, but weight them by severity and customer impact.
2. **What was the denominator?** Record meaningful delivery volume and lead time.
3. **What produced each finding?** Capture model, workflow version, and active gates when possible.
4. **Was the test behavior-proving?** A test that passes is not necessarily a test of the advertised change.
5. **Could evidence be ignored?** Make unresolved current-head findings block integration until fixed or explicitly waived.

## Limits of this case study

This was one public repository, 30 commits, and a deliberately adversarial audit. It is not a controlled comparison of Claude, Codex, and human-only development. The provenance was incomplete, the changes varied in size and risk, and the sample was selected by recency rather than randomized.

That is exactly why the useful output is a set of mechanisms, not a sweeping verdict about a model.

## What we believe now

AI-assisted engineering can increase useful output dramatically. It can also produce weak tests, overcomplicated patches, incorrect claims, and mountains of plausible prose.

Human review has the same integration problem: a finding that nobody must disposition is only a suggestion.

The operating standard we want is simple:

> Move quickly, preserve the signal, and make the system prove that the risky parts are safe.

The workflows and open issues behind this work are public at [github.com/shakacode/agent-workflows](https://github.com/shakacode/agent-workflows). If your team is adopting coding agents faster than its review process can absorb them, [ShakaCode can help design the operating model](https://www.shakacode.com/contact/).
