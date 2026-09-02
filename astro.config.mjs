import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://agents.shakacode.com',
  vite: {
    resolve: {
      // Astro turns on Vite's `resolve.tsconfigPaths`, which makes rolldown's resolver
      // walk *every* ancestor directory above the project root, eagerly loading each
      // `tsconfig.json` it finds and following that file's `extends`. When this repo is
      // checked out inside another checkout of itself (the nested-worktree layout agents
      // use), the ancestor has no `node_modules`, its `extends` cannot resolve, and the
      // build dies with `Tsconfig not found astro/tsconfigs/strict` — even with zero
      // local changes. We declare no `compilerOptions.paths`, so disabling this costs us
      // nothing today, and Astro's own configAliasVitePlugin still resolves path aliases
      // if we ever add them. See #12.
      tsconfigPaths: false,
    },
  },
});
