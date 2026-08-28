# QA evidence branch

Screenshot evidence captured by the independent QA checker (`awc-a-checker-hero`)
for pull requests in this repository. This branch carries **no site code** and is
never merged into `main`; it exists only so pull request bodies can reference
durable image URLs.

GitHub does not expose an image-upload API for comments outside the web UI, so an
agent-run QA lane has no other way to attach durable before/after evidence.

| Directory | PR | Head under test |
|---|---|---|
| `qa/awc-a-issue-8/` | #13 | `9e7151e17ebdf76bdd0872025f7b2daeb7af267a` |

Naming: `before-*` = `main` @ `76b1c13`, `after-*` = the first candidate `4be1eea`,
`after9e7-*` = the final head `9e7151e`. Images are downscaled to 1000px wide.

Safe to delete once the referencing pull requests are closed and archived.
