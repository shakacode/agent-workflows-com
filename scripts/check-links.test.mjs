// Runs scripts/check-links.mjs against small fixture sites, so each parser
// edge case has a negative control that fails without its fix.
//
//   node --test scripts/check-links.test.mjs

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-links.mjs');
const fixtures = [];
after(() => fixtures.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

// Builds a fixture site from { 'relative/path': 'contents' } and runs the checker on it.
function check(files) {
  const dist = mkdtempSync(path.join(tmpdir(), 'check-links-'));
  fixtures.push(dist);
  for (const [rel, contents] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dist, rel)), { recursive: true });
    writeFileSync(path.join(dist, rel), contents);
  }
  const run = spawnSync(process.execPath, [checker, dist], { encoding: 'utf8' });
  return { status: run.status, output: run.stdout + run.stderr };
}

const page = (body) => `<!doctype html><html><body>${body}</body></html>`;

test('a site whose internal links all resolve passes', () => {
  const result = check({
    'index.html': page('<a href="/docs/">Docs</a> <a href="#top">Top</a> <h1 id="top">Home</h1>'),
    'docs/index.html': page('<a href="/">Home</a>'),
  });
  assert.equal(result.status, 0, result.output);
});

test('a link to a missing page is reported', () => {
  const result = check({ 'index.html': page('<a href="/missing/">Gone</a>') });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /index\.html -> \/missing\//);
});

// #40 item 1: <script> and <style> bodies are raw text, not markup.
test('an id inside a script body does not satisfy a fragment', () => {
  const result = check({
    'index.html': page(`<a href="#ghost">Ghost</a><script>const s = '<div id="ghost"></div>';</script>`),
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /#ghost/);
});

test('a link-shaped string inside a script or style body is not checked', () => {
  const result = check({
    'index.html': page(
      `<script>const s = '<a href="/missing-script/">x</a>';</script>` +
        `<style>/* <img src="/missing-style.png"> */</style>` +
        `<script src="/app.js"></script>`
    ),
    'app.js': '',
  });
  assert.equal(result.status, 0, result.output);
});

test('the src on a script opening tag is still checked', () => {
  const result = check({ 'index.html': page('<script src="/missing.js"></script>') });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /\/missing\.js/);
});

// Comments and raw-text bodies are read left to right, whichever starts first.
test('a script tag mentioned inside a comment does not hide later links', () => {
  const result = check({
    'index.html': page('<!-- example <script> --><a href="/missing/">x</a><script>ok()</script>'),
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /\/missing\//);
});

test('a comment opener inside a script body does not hide later links', () => {
  const result = check({
    'index.html': page('<script>const s = "<!--";</script><a href="/missing/">x</a><!-- end -->'),
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /\/missing\//);
});

// #40 item 2: a query-only link stays on the current document.
test('a query-only fragment on a non-index page checks that page', () => {
  const result = check({
    'index.html': page('<p>Home without the section.</p>'),
    'docs.html': page('<a href="?mode=x#section">Jump</a><h2 id="section">Section</h2>'),
  });
  assert.equal(result.status, 0, result.output);
});

test('a query-only fragment missing from its non-index page is reported', () => {
  const result = check({
    'index.html': page('<h2 id="section">Only on home</h2>'),
    'docs.html': page('<a href="?mode=x#section">Jump</a>'),
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /docs\.html -> \?mode=x#section/);
});

// #40 comment item 3: a trailing slash names a directory, never a file.
test('a trailing slash after a regular file is reported', () => {
  const result = check({
    'index.html': page('<a href="/favicon.svg/">Icon</a>'),
    'favicon.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /\/favicon\.svg\//);
});

// #40 comment item 4: URL attributes ignore surrounding ASCII whitespace.
test('whitespace around a site-absolute href is ignored', () => {
  const result = check({
    'guide/index.html': page('<a href=" /docs/ ">Docs</a>'),
    'docs/index.html': page('<p>Docs</p>'),
    'index.html': page('<p>Home</p>'),
  });
  assert.equal(result.status, 0, result.output);
});
