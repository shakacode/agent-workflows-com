import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://agents.shakacode.com',
  vite: {
    resolve: {
      // Vite ships `resolve.tsconfigPaths` off by default; Astro opts it on in
      // `create-vite.js`. With it on, rolldown's resolver walks *every* ancestor
      // directory above the project root, eagerly loading each `tsconfig.json` it finds
      // and following that file's `extends`. When this repo is checked out inside
      // another checkout of itself (the nested-worktree layout agents use), the ancestor
      // has no `node_modules`, its `extends` cannot resolve, and the build dies with
      // `Tsconfig not found astro/tsconfigs/strict` — even with zero local changes.
      // Setting this back to `false` restores Vite's own default. We declare no
      // `compilerOptions.paths`, so it costs us nothing today; if we ever add some,
      // Astro's configAliasVitePlugin would still resolve them for JS/TS/Astro import
      // specifiers and quoted CSS `@import`/`url()` only — a fallback Astro marks
      // deprecated, and one that deliberately does not cover Sass `@use`/`@forward`,
      // Tailwind `@config`/`@reference`, or unquoted `url(...)`. See #12.
      tsconfigPaths: false,
    },
  },
});
