import { defineConfig } from 'astro/config';

export default defineConfig({
  // CNAME decision pending: agent-workflows.shakacode.com (per design spec)
  // or a dedicated domain. Update before wiring Cloudflare Pages custom domain.
  site: 'https://agent-workflows.shakacode.com',
});
