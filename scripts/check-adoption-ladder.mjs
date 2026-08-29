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
//   2. Each level's next-action link is an <a> with a non-empty href, and
//      that href matches EXPECTED_NEXT_HREF exactly for that level — not
//      just "some link happens to point into the Quickstart somewhere."
//   3. The ladder still has exactly three levels (matched by the
//      `adopt-level` class token, not a literal attribute string, so
//      cosmetic class-order/extra-class edits don't false-positive), and
//      each level's problem / prerequisites / optional fields are present
//      AND have non-empty text content beyond their label.
//   4. The "coordination backend and dashboard are not required for
//      standalone skills or ordinary single-lane work" statement is present
//      as a contiguous phrase (see the NOTE at Rule 4 below on what this
//      can and cannot catch).
//   5. The "when not to add more machinery" callout still names both
//      required topics — a low-risk change, and work that isn't actually
//      parallel — checked by content, not just by counting <li> elements.
//   6. Any external URLs inside the ladder are on the small allowlist below
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

// True class-token match — `\bTOKEN\b` inside the class attribute value —
// not a literal substring/attribute-order match. `class="adopt-level card"`,
// `class="card adopt-level featured"`, and `class="card adopt-level"` all
// match identically; only the token's presence is the contract.
function hasClassToken(attrsOrTag, token) {
  const re = new RegExp(`class="[^"]*\\b${token}\\b[^"]*"`);
  return re.test(attrsOrTag);
}

// Named, explicit level -> Quickstart-anchor mapping. This is the actual
// contract issue #9 asks for ("link the first level directly to the
// relevant Quickstart section") — a level's next-action href must match its
// own row here exactly, not merely "point somewhere in the Quickstart."
// Changing where a level points is a deliberate, one-line, reviewable edit
// to this table — it is not supposed to be easy to do by accident.
const EXPECTED_NEXT_HREF = {
  '01': '/docs/quickstart/#qs-day-one-skill',
  '02': '/docs/quickstart/#qs-repo-seam',
  '03': '/docs/quickstart/#qs-coordinated-batches',
};

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
  // --- Rule 1 & 6: every link resolves; external links are allowlisted. ---
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

  // --- Extract each level block by class TOKEN (order/extra-class safe), --
  // --- not by a literal "card adopt-level" attribute-value match. ---------
  const levelBlocks = [];
  {
    const liRe = /<li\b([^>]*)>([\s\S]*?)<\/li>/g;
    let m;
    while ((m = liRe.exec(sectionHtml))) {
      const [, attrs, body] = m;
      if (!hasClassToken(attrs, 'adopt-level')) continue; // e.g. the caveat's plain <li> bullets
      const levelMatch = attrs.match(/data-level="([^"]*)"/);
      levelBlocks.push({ level: levelMatch ? levelMatch[1] : null, body });
    }
  }

  if (levelBlocks.length !== 3) {
    fail(`Expected exactly 3 adoption-ladder levels (an <li> carrying the "adopt-level" class), found ${levelBlocks.length}.`);
  }

  // Extracts the text of a "<p class="...FIELD..."` field, with its
  // "adopt-label" span (the "Problem" / "Prerequisites" / "Optional" label
  // itself) stripped first so a label-only, content-emptied field reads as
  // empty rather than as "has text."
  function fieldText(body, fieldClass) {
    const re = new RegExp(`<p class="[^"]*\\b${fieldClass}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/p>`);
    const m = body.match(re);
    if (!m) return null;
    const withoutLabel = m[1].replace(/<span class="[^"]*\badopt-label\b[^"]*"[^>]*>[\s\S]*?<\/span>/, '');
    return withoutLabel.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  // Extracts the href of the <a> carrying the "adopt-next" class token —
  // returns null if no such <a> exists at all (e.g. it was swapped for a
  // link-less <span>), and '' if it exists with an empty href.
  function nextHref(body) {
    const aRe = /<a\b([^>]*)>/g;
    let m;
    while ((m = aRe.exec(body))) {
      const attrs = m[1];
      if (!hasClassToken(attrs, 'adopt-next')) continue;
      const hrefMatch = attrs.match(/href="([^"]*)"/);
      return hrefMatch ? hrefMatch[1] : '';
    }
    return null;
  }

  const seenLevels = new Set();
  const proseFields = ['adopt-problem', 'adopt-prereqs', 'adopt-optional'];
  for (const { level: levelNum, body } of levelBlocks) {
    if (levelNum === null) {
      fail('A ladder level <li> carries the "adopt-level" class but no data-level attribute.');
      continue;
    }
    if (seenLevels.has(levelNum)) fail(`Duplicate ladder level "${levelNum}" — data-level values must be unique.`);
    seenLevels.add(levelNum);

    // --- Rule 3: problem / prerequisites / optional must exist AND be non-empty.
    for (const cls of proseFields) {
      const text = fieldText(body, cls);
      if (text === null) {
        fail(`Ladder level ${levelNum} is missing its "${cls}" element entirely.`);
      } else if (text.length === 0) {
        fail(`Ladder level ${levelNum}'s "${cls}" field has no text content — the label is present but the sentence describing it was emptied.`);
      }
    }

    // --- Rule 2: next action must be a real, non-empty link to the exact ---
    // --- Quickstart anchor this level owns (EXPECTED_NEXT_HREF), not just
    // --- "the adopt-next class exists somewhere" or "some quickstart link
    // --- exists on the page."
    const href = nextHref(body);
    if (href === null) {
      fail(`Ladder level ${levelNum}'s next action must be an <a> carrying the "adopt-next" class with a non-empty href — found no such <a> (it may have been replaced by a link-less element).`);
    } else if (href === '') {
      fail(`Ladder level ${levelNum}'s "adopt-next" <a> has an empty href.`);
    } else if (!(levelNum in EXPECTED_NEXT_HREF)) {
      fail(`Ladder level ${levelNum} has no entry in EXPECTED_NEXT_HREF at the top of scripts/check-adoption-ladder.mjs — add one deliberately so this level's destination is pinned.`);
    } else if (href !== EXPECTED_NEXT_HREF[levelNum]) {
      fail(`Ladder level ${levelNum}'s next action links to "${href}", but EXPECTED_NEXT_HREF says it must link to "${EXPECTED_NEXT_HREF[levelNum]}". If this is a deliberate change, update EXPECTED_NEXT_HREF to match.`);
    }
  }

  // --- Rule 4: the "backend/dashboard not required" statement. ------------
  // NOTE — this is a drift check, not a semantic reviewer. It requires one
  // specific, contiguous phrase to still be present verbatim (whitespace-
  // normalized, case-insensitive). That is stricter than testing four
  // keywords independently (which a scrambled or reworded paragraph could
  // satisfy by accident), but it is NOT proof against a deliberate rewrite
  // that keeps the same words in a different sense — e.g. a sentence framed
  // as "ignore the myth that the coordination backend and the dashboard are
  // not required ... you need both from day one" would still contain this
  // exact phrase and would still pass. Catching a meaning flip that keeps
  // the same words requires human judgment, not a string match — any rewrite
  // of this statement, inverted or not, still needs human review at PR time.
  const REQUIRED_PHRASE =
    'coordination backend and the dashboard are not required for standalone skills or ordinary single-lane work';
  const noteMatch = sectionHtml.match(/id="adopt-backend-optional"[^>]*>([\s\S]*?)<\/p>/);
  if (!noteMatch) {
    fail('No element with id="adopt-backend-optional" found in the #adopt section — the "coordination backend and dashboard are not required" statement is missing.');
  } else {
    const text = noteMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text.includes(REQUIRED_PHRASE)) {
      fail(`The #adopt-backend-optional statement no longer contains the phrase "${REQUIRED_PHRASE}" verbatim. Current text: "${text}"`);
    }
  }

  // --- Rule 5: the "when not to add more machinery" callout must still ----
  // name BOTH required topics — a low-risk change, and work that isn't
  // actually parallel — checked by normalized content, not by counting
  // <li> elements (a count alone can't tell which topics survived).
  const caveatMatch = sectionHtml.match(/id="adopt-when-not"[^>]*>([\s\S]*?)<\/div>/);
  if (!caveatMatch) {
    fail('No element with id="adopt-when-not" found in the #adopt section — the "when not to add more machinery" guidance is missing.');
  } else {
    const normalized = caveatMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/[‘’]/g, "'") // curly apostrophes -> straight, so "isn't" matches either way
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim();
    const hasLowRiskTopic = /low-risk|low risk/.test(normalized);
    const hasNonParallelTopic = /\b(not|isn't|non-)\b[^.]{0,40}parallel/.test(normalized);
    if (!hasLowRiskTopic) {
      fail(`The "when not to add more machinery" block (#adopt-when-not) no longer mentions a low-risk change. Current text: "${normalized}"`);
    }
    if (!hasNonParallelTopic) {
      fail(`The "when not to add more machinery" block (#adopt-when-not) no longer mentions work that isn't actually parallel / parallelizable. Current text: "${normalized}"`);
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
