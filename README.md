# agent-workflows-com

Landing page and simple docs for the ShakaCode agent stack:

- [agent-workflows](https://github.com/shakacode/agent-workflows) — the portable playbook/pack for running Codex and Claude Code across repos
- [agent-coordination](https://github.com/shakacode/agent-coordination) — coordination backend (claims, heartbeats, liveness)
- [agent-coordination-dashboard](https://github.com/shakacode/agent-coordination-dashboard) — operator dashboard

Built with [Astro](https://astro.build). Deploys to Cloudflare Pages.

Design source: [`docs/landing-page-design.md`](https://github.com/shakacode/agent-workflows/blob/main/docs/landing-page-design.md) in agent-workflows.

> **Open decision:** that design spec locked the site into a `site/` directory inside
> agent-workflows at `agent-workflows.shakacode.com`. This repo supersedes that
> location decision if we keep it — see the repo discussion before adding content
> in both places.

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

Cloudflare Pages, build command `npm run build`, output directory `dist`.
CNAME target TBD: `agent-workflows.shakacode.com` (per spec) or a dedicated domain.
