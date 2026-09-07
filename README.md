# agent-workflows-com

Landing page and simple docs for the ShakaCode agent stack:

- [agent-workflows](https://github.com/shakacode/agent-workflows) — the portable playbook/pack for running Codex and Claude Code across repos
- [agent-coordination](https://github.com/shakacode/agent-coordination) — coordination backend (claims, heartbeats, liveness)
- [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard) — operator dashboard

[![ShakaCode Agent Workflows — Run AI coding agents in fleets, safely](https://agents.shakacode.com/og.png)](https://agents.shakacode.com)

**[Documentation →](https://agents.shakacode.com)**

Built with [Astro](https://astro.build). Deploys to Cloudflare Pages at
[agents.shakacode.com](https://agents.shakacode.com).

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
npm test   # builds the site, then runs both offline checkers
```

The adoption-ladder checker verifies the homepage ladder's required content and
links against the built Quickstart. The internal-link checker verifies local
page and asset references, including HTML fragment targets, across `dist/`.
Both checks run offline; they do not validate external URLs over the network.

To run the checkers individually, build fresh output first:

```bash
npm run build
npm run check:adoption-ladder
npm run check:links
```

Hosted CI runs `.agents/bin/setup` (`npm ci`) and `.agents/bin/test` (`npm test`)
on every pull request and push to `main`. Manual runs are also available through
`workflow_dispatch` in the [deployment workflow](.github/workflows/deploy.yml).

## Deploy

Cloudflare Pages project: `agent-workflows-com`.

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Custom domain: `agents.shakacode.com`
