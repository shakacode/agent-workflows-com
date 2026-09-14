#!/usr/bin/env node
// Built-output link contract: catch an orphaned V2 guide or a V2 entrance
// that sends readers to GitHub instead of a local canonical guide.
// Browser checks cover visibility and focus.
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
// Catch an entrance that still sends readers away, a missing/empty guide,
// or a broken onward path after importing canonical Markdown.
for (const name of ['getting-started', 'working-with-your-agent', 'verification']) {
  const route = `/docs/v2/${name}/`;
  assert.ok(guideLinks.includes(route), `The V2 entrance must link to local ${name}`);
  const document = region(page(route.slice(1)), 'main');
  assert.ok(document.includes('<h1') && document.includes('<h2'),
    `${route} must render the guide, including its sections`);
  assert.ok(links(region(page(route.slice(1)), 'nav')).includes('/docs/v2/'),
    `${route} must retain primary navigation back to V2`);
}
assert.ok(links(region(page('docs/v2/getting-started/'), 'main'))
  .includes('/docs/v2/working-with-your-agent/'),
  'Installation readers must be able to continue to working with their agent locally');
assert.ok(guideLinks.includes('/docs/v2/getting-started/#upgrade-or-remove'),
  'The V2 entrance must link directly to the local upgrade instructions');
assert.ok(guideLinks.includes('/docs/quickstart/'), 'V1 installation must remain reachable from V2');
assert.ok(region(page('docs/quickstart/'), 'main').includes('<h1'), 'V1 Quickstart must still render');
console.log('check-v2-navigation: OK — homepage and docs → V2 → three local canonical guides and V1');
