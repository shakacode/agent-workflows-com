# ShakaCode Workflows website

Documentation for ShakaCode Workflows, with the older agent stack retained for reference:

- [ShakaCode Workflows](https://github.com/shakacode/workflows) — one task, a verified PR, and a clear explanation

- [agent-workflows](https://github.com/shakacode/agent-workflows) — the portable playbook/pack for running Codex and Claude Code across repos
- [agent-coordination](https://github.com/shakacode/agent-coordination) — coordination backend (claims, heartbeats, liveness)
- [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard) — operator dashboard

[![ShakaCode Workflows — portable skills for AI-assisted development](https://workflows.shakacode.com/og.png)](https://workflows.shakacode.com)

**[Documentation →](https://workflows.shakacode.com)**

Built with [Astro](https://astro.build). Deploys to Cloudflare Pages at
[workflows.shakacode.com](https://workflows.shakacode.com).

Design source: [`docs/landing-page-design.md`](https://github.com/shakacode/agent-workflows/blob/main/docs/landing-page-design.md) in agent-workflows.

This repository supersedes the original design spec's proposal to keep the site in
a `site/` directory inside `agent-workflows`.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
```

## Checks

```bash
npm test   # builds the site, then runs the offline checkers
```

The adoption-ladder checker verifies the homepage ladder's required content and
links against the built Quickstart. The internal-link checker verifies local
page and asset references, including HTML fragment targets, across `dist/`.
The V2 navigation checker verifies that homepage and docs readers can reach the
pilot guide, six local canonical guides, and the existing V1 Quickstart.
These checks run offline; they do not validate external URLs over the network.

To run the checkers individually, build fresh output first:

```bash
npm run build
npm run check:adoption-ladder
npm run check:links
npm run check:v2-navigation
```

Hosted CI runs `.agents/bin/setup` (`npm ci`) and `.agents/bin/test` (`npm test`)
on every pull request and push to `main`. Manual runs are also available through
`workflow_dispatch` in the [deployment workflow](.github/workflows/deploy.yml).

## Refresh the canonical V2 guides

The generated Markdown in `src/pages/docs/v2/` is a snapshot of
`docs/getting-started.md`, `docs/working-with-your-agent.md`, `docs/verification.md`,
`docs/usage-reporting.md`, `docs/packaging.md`, and `docs/host-support.md` from
[`shakacode/workflows` at `d47e423d50170da37888b043a41ba8a3a51050ad`](https://github.com/shakacode/workflows/tree/d47e423d50170da37888b043a41ba8a3a51050ad/docs).
Edit the canonical source upstream, then refresh from a trusted local checkout:

```bash
npm run sync:v2-docs -- /path/to/agent-workflows-v2 d47e423d50170da37888b043a41ba8a3a51050ad
```

For a newer reviewed revision, replace the full commit SHA in the command and
update the snapshot reference above. The command reads only those six files
with `git show`, moves their titles into the existing Doc layout's frontmatter,
adds immutable source attribution, and rewrites relative Markdown links. Links
between imported guides stay local; links to other source files retain their
fragments and point to that same upstream revision. Other external links remain
unchanged. Guide prose comes from upstream; do not edit the generated pages.

Review the generated diff and run `.agents/bin/validate` and `.agents/bin/test`.
The snapshot is checked in: builds and tests use it offline without fetching or
requiring the source checkout. Sync is an explicit maintainer command, never a
build step.

## Deploy

Cloudflare Pages project: `agent-workflows-com`.

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Custom domain: `workflows.shakacode.com`
