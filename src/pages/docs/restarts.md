---
layout: ../../layouts/Doc.astro
title: Stopping and restarting
eyebrow: Docs
description: Recover agent work after a restart, crash, or account change without requiring a perfect shutdown.
---

You should be able to restart your machine or agent app when you need to.
Preparation helps, but recovery must work without warning. The aim is to
preserve completed work and identify what still needs verification before
continuing.

## Use the time you have

| Time available | What to do | What to expect |
| --- | --- | --- |
| None | Restart and recover afterward. | The last operation may have an uncertain result. |
| A little | Stop new work and allow one shared grace period, normally 60 seconds. | Some tasks may not acknowledge in time. |
| Planned maintenance | Choose a longer deadline for handoffs and known sensitive operations. | More complete evidence, with no guarantee against a crash. |

The grace period covers the whole affected machine, including dispatch and
waiting. Each task receives the same absolute deadline. It does not get another
minute when its message arrives. At the deadline, the coordinator reports what
is known and returns control to you. Missing replies mean preparation is
incomplete; they do not mean the machine is verified ready.

A deadline limits preparation. It does not authorize an agent to kill a running
deployment or restart the app automatically. If an operation is still running,
the report should identify it specifically so you can decide. Prompt-based
deadlines also cannot preempt every stalled host tool call.

## Recover from three sources together

1. **Checkpoints:** the task objective, current repository and branch, completed
   work, next action, owners, and existing approvals and limits.
2. **Newer logs:** task messages and tool results after the checkpoint. If there
   is no checkpoint, start with recent history and expand only as needed.
3. **Live state:** files, commits, running processes, ownership, and the actual
   result of any remote operation.

A checkpoint can be stale. A log can stop between starting a push and recording
its result. A remote command can finish after the app disappears. Check the
remote branch or PR before repeating the action, and verify that the previous
worker is no longer writing before replacing it.

Recover tasks independently. An ambiguous deployment can wait for inspection
while another task resumes verified unfinished work. Completed work stays
complete; successful tests need repeating only when interruption or subsequent
changes invalidate their evidence.

Paste this into the existing task after reopening it:

```text
Recover from interruption; preparation may be missing or incomplete.
Combine any checkpoint with newer relevant task logs and live Git, process,
remote-operation and ownership evidence. Verify uncertain effects before
repeating them. Preserve completed work, goals, approval scope and deliberate
pauses. Resume verified unfinished work within existing windows and budgets.
Use the installed recovery workflow and report evidence and next action.
```

Recovery does not require a new goal, new control tower, or replacement task.
One existing task can coordinate recovery on a machine that has no tower.

## Record progress before shutdown

Use existing task transcripts and workflow records throughout ordinary work.
Update compact recovery facts when a target starts, ownership changes, a
meaningful step finishes, or work enters an external wait. For consequential
operations, record intent before execution and the result afterward.

The source pack's [restart and recovery procedure](https://github.com/shakacode/agent-workflows/blob/main/docs/agent-runner-restarts.md)
defines the installed skills and available recording support. Install or update
the pack and check its revision before relying on a newer helper. The procedure
distinguishes commands recorded through a wrapper from native tool calls that
still rely on their transcripts; it does not promise a universal logging hook.

Keep recovery records in approved private local storage outside disposable
worktrees. Network or shared-drive outages should not prevent local recovery.
Mirror or back up separately for disk-loss protection. Do not commit raw task
transcripts, credentials, or private operation details to public repositories.

Codex documents its [session transcript and app log locations](https://developers.openai.com/codex/app/troubleshooting/).
Those records are useful evidence, but neither logs nor a local recorder can
guarantee that the last write survives every crash or that an external action
happens exactly once.

## Usage limits and account changes

Reaching a usage limit is different from quitting the app. Consult the current
[OpenAI usage guidance](https://developers.openai.com/codex/pricing/) before
deciding whether to wait for active work to settle. Recovery instructions should
not buy credits, change models, or extend a task's budget without authorization.

Treat switching accounts as an access and recovery boundary. Verify the intended
account, workspace, repository access, connectors and actual runtime permissions
before continuing. Do not assume cloud tasks or authenticated connections transfer
between accounts. See [OpenAI authentication guidance](https://developers.openai.com/codex/auth/).

The workflow provides preparation and evidence-based recovery. It cannot keep
a local agent turn alive after its host exits or make an uncertain external
operation safe to replay without checking its result.
