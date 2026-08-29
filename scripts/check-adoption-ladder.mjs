#!/usr/bin/env node
// Drift check for the homepage adoption ladder (issue #9: "Add a risk-scaled
// adoption ladder from one workflow to coordinated fleets").
//
// Plain Node ESM, zero dependencies, fully offline and deterministic — it
// only reads files already produced by `astro build`; it never makes a
// network call. Run it after a build:
//
//   npm run build && node scripts/check-adoption-ladder.mjs
//
// It fails loudly, with one precise message per drifted thing, if any of the
// following stop being true:
//
//   1. Every internal link inside the #adopt section of dist/index.html
//      resolves: the target page exists in dist/, and every #fragment it
//      targets exists as an id="..." in that target page's built HTML.
//   2. At least one of those links points directly into the Quickstart
//      (/docs/quickstart/#...) — issue #9 requires level 1's next action to
//      land in the Quickstart, not the GitHub repo root.
//   3. The ladder still has exactly three levels, and each level still
//      carries its problem / prerequisites / optional / next-action content.
//   4. The "coordination backend and dashboard are not required for
//      standalone skills or ordinary single-lane work" statement is present.
//   5. Any external URLs inside the ladder are on the small allowlist below
//      (shape check only — this script never fetches anything).

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

/** @type {string[]} */
const failures = [];
const fail = (message) => failures.push(message);

function readDistFile(relPath) {
  const abs = path.join(distDir, relPath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf8');
}

function collectIds(html) {
  const ids = new Set();
  const re = /\sid="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) ids.add(m[1]);
  return ids;
}

// Maps a site-absolute path (e.g. "/docs/quickstart/") to the dist file
// Astro's static output produces for it, matching this project's
// trailing-slash routing (see the `generating static routes` build log).
function distFileForPath(urlPath) {
  const clean = urlPath.split('?')[0];
  if (clean === '/' || clean === '') return 'index.html';
  const trimmed = clean.replace(/^\/+/, '').replace(/\/+$/, '');
  return `${trimmed}/index.html`;
}

function extractLinks(html) {
  const links = [];
  const re = /<a\b[^>]*?href="([^"]*)"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) links.push(m[1]);
  return links;
}

// External URLs are allowed in the ladder only from these origins/prefixes.
// This is a shape check — the script never fetches any of these.
const EXTERNAL_ALLOWLIST = [
  /^https:\/\/github\.com\/shakacode(\/|$)/,
  /^https:\/\/(www\.)?shakacode\.com(\/|$)/,
];

const indexHtml = readDistFile('index.html');
if (indexHtml === null) {
  console.error(
    'check-adoption-ladder: dist/index.html not found. This check runs ' +
      'against the built site — run `npm run build` (or `.agents/bin/validate`) first.'
  );
  process.exit(1);
}

const SECTION_START = '<section id="adopt"';
const sectionStartIdx = indexHtml.indexOf(SECTION_START);
let sectionHtml = '';
if (sectionStartIdx === -1) {
  fail('dist/index.html has no <section id="adopt"> — the homepage adoption-ladder section is missing entirely.');
} else {
  const closeIdx = indexHtml.indexOf('</section>', sectionStartIdx);
  if (closeIdx === -1) {
    fail('<section id="adopt"> in dist/index.html has no matching </section>.');
  } else {
    sectionHtml = indexHtml.slice(sectionStartIdx, closeIdx);
  }
}

if (sectionHtml) {
  // --- Rule 1 & 5: every link resolves; external links are allowlisted. ---
  const links = extractLinks(sectionHtml);
  if (links.length === 0) {
    fail('The #adopt section has no <a href> links at all — expected at least one "next action" link per level.');
  }

  const homepageIds = collectIds(indexHtml);

  for (const href of links) {
    if (href.startsWith('#')) {
      const fragment = href.slice(1);
      if (!homepageIds.has(fragment)) {
        fail(`Ladder link "${href}" targets fragment "#${fragment}" on the homepage itself, but no element with id="${fragment}" exists in dist/index.html.`);
      }
      continue;
    }

    if (href.startsWith('/')) {
      const [rawPath, fragment] = href.split('#');
      const relFile = distFileForPath(rawPath);
      const targetHtml = readDistFile(relFile);
      if (targetHtml === null) {
        fail(`Ladder link "${href}" points at "${rawPath}", but dist/${relFile} does not exist in the built site.`);
        continue;
      }
      if (fragment && !collectIds(targetHtml).has(fragment)) {
        fail(`Ladder link "${href}" targets fragment "#${fragment}" in dist/${relFile}, but no element with id="${fragment}" exists there.`);
      }
      continue;
    }

    if (/^https?:\/\//.test(href)) {
      const allowed = EXTERNAL_ALLOWLIST.some((re) => re.test(href));
      if (!allowed) {
        fail(`Ladder link "${href}" is an external URL not on the allowlist in scripts/check-adoption-ladder.mjs. Add it there deliberately, or point the ladder at an internal page instead.`);
      }
      continue;
    }

    fail(`Ladder link "${href}" is neither a same-page fragment, a site-absolute path, nor an http(s) URL — this check doesn't know how to validate it.`);
  }

  // --- Rule 2: at least one link lands directly in the Quickstart. --------
  const quickstartLinks = links.filter((href) => href.startsWith('/docs/quickstart/#'));
  if (quickstartLinks.length === 0) {
    fail('No ladder link points into /docs/quickstart/#... — issue #9 requires level 1\'s next action to link directly to the relevant Quickstart section, not just the GitHub repo root.');
  }

  // --- Rule 3: exactly three levels, each with all four required fields. --
  const levelBlocks = [...sectionHtml.matchAll(/<li class="card adopt-level" data-level="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
  if (levelBlocks.length !== 3) {
    fail(`Expected exactly 3 adoption-ladder levels (<li class="adopt-level" data-level="...">), found ${levelBlocks.length}.`);
  }
  const seenLevels = new Set();
  const requiredFields = ['adopt-problem', 'adopt-prereqs', 'adopt-optional', 'adopt-next'];
  for (const [, levelNum, body] of levelBlocks) {
    if (seenLevels.has(levelNum)) fail(`Duplicate ladder level "${levelNum}" — data-level values must be unique.`);
    seenLevels.add(levelNum);
    for (const cls of requiredFields) {
      const re = new RegExp(`class="[^"]*\\b${cls}\\b[^"]*"`);
      if (!re.test(body)) {
        fail(`Ladder level ${levelNum} is missing its "${cls}" content — every level must state a problem, prerequisites, what's optional, and a next action.`);
      }
    }
  }

  // --- Rule 4: the "backend/dashboard not required" statement. ------------
  const noteMatch = sectionHtml.match(/id="adopt-backend-optional"[^>]*>([\s\S]*?)<\/p>/);
  if (!noteMatch) {
    fail('No element with id="adopt-backend-optional" found in the #adopt section — the "coordination backend and dashboard are not required" statement is missing.');
  } else {
    const text = noteMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hasBackend = /coordination backend/i.test(text);
    const hasDashboard = /\bdashboard\b/i.test(text);
    const hasNotRequired = /not required/i.test(text);
    const hasScope = /(single-lane|standalone skill)/i.test(text);
    if (!(hasBackend && hasDashboard && hasNotRequired && hasScope)) {
      fail(`The #adopt-backend-optional statement no longer says the coordination backend AND dashboard are NOT REQUIRED for standalone skills / single-lane work. Current text: "${text}"`);
    }
  }

  // --- Rule 3b (part of "when not to add more machinery" acceptance item):
  // the caveat block must still exist and still be non-trivial.
  const caveatMatch = sectionHtml.match(/id="adopt-when-not"[^>]*>([\s\S]*?)<\/div>/);
  if (!caveatMatch) {
    fail('No element with id="adopt-when-not" found in the #adopt section — the "when not to add more machinery" guidance is missing.');
  } else {
    const items = [...caveatMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
    if (items.length < 2) {
      fail(`The "when not to add more machinery" block (#adopt-when-not) has only ${items.length} item(s) — expected at least 2.`);
    }
  }
}

if (failures.length > 0) {
  console.error('check-adoption-ladder: FAILED\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n${failures.length} issue(s) found.`);
  process.exit(1);
}

console.log('check-adoption-ladder: OK — the homepage adoption ladder\'s links and content match the built Quickstart.');
