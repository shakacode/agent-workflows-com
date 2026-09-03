# agent-workflows-com

Landing page and simple docs for the ShakaCode agent stack:

- [agent-workflows](https://github.com/shakacode/agent-workflows) — the portable playbook/pack for running Codex and Claude Code across repos
- [agent-coordination](https://github.com/shakacode/agent-coordination) — coordination backend (claims, heartbeats, liveness)
- [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard) — operator dashboard

<p align="center">
  <a href="https://agents.shakacode.com">
    <img src="https://agents.shakacode.com/og.png" alt="ShakaCode Agent Workflows — Run AI coding agents in fleets, safely" width="100%">
  </a>
  <br>
  <strong><a href="https://agents.shakacode.com">Documentation →</a></strong>
</p>

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

## Deploy

Cloudflare Pages project: `agent-workflows-com`.

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`
- Custom domain: `agents.shakacode.com`
