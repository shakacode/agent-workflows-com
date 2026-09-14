#!/usr/bin/env node
// Built-output link contract: catch an orphaned V2 guide or a V2 entrance
// that sends readers back into V1. Browser checks cover visibility and focus.
// Like the other offline checks, run after Astro builds dist/.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const page = (route) => readFileSync(new URL(`${route}index.html`, dist), 'utf8')
  .replace(/<!--[\s\S]*?-->/g, '');
const region = (html, tag) => html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] ?? '';
const links = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
  .filter((match) => match[2].replace(/<[^>]*>/g, '').trim())
  .map((match) => match[1]);

for (const route of ['', 'docs/']) {
  const html = page(route);
  assert.ok(links(region(html, 'main')).includes('/docs/v2/'),
    `/${route} must give readers a V2 guide entrance in its main content`);
  assert.ok(links(region(html, 'nav')).includes('/docs/v2/'),
    `/${route} must make the V2 guide reachable from primary navigation`);
}

const guide = region(page('docs/v2/'), 'main');
assert.ok(guide.includes('<h1'), 'The V2 route must render a document');
const guideLinks = links(guide);
for (const name of ['getting-started', 'working-with-your-agent']) {
  assert.ok(guideLinks.includes(`https://github.com/shakacode/agent-workflows-v2/blob/main/docs/${name}.md`),
    `The V2 guide must lead to its maintained ${name} source guide`);
}
assert.ok(guideLinks.includes('/docs/quickstart/'), 'V1 installation must remain reachable from V2');
assert.ok(region(page('docs/quickstart/'), 'main').includes('<h1'), 'V1 Quickstart must still render');
console.log('check-v2-navigation: OK — homepage and docs → V2 → source guides and V1');
