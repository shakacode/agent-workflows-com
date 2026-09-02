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
//   3. The ladder still has exactly three levels (matched by true class-TOKEN
//      membership, not a literal attribute string or a `\b`-boundary regex —
//      see hasClassToken below — so cosmetic class-order/extra-class/
//      similarly-prefixed-class edits don't false-positive), each level's
//      body is bounded by the ladder's own matching </ol> (not the first
//      </ol> anywhere in the section — see extractLevelBlocks), and each
//      level's problem / prerequisites / optional fields are present AND
//      have non-empty text content beyond their label (with the label found
//      by class token across every span in the field, not just the first
//      span encountered — see fieldText).
//   4. The "coordination backend and dashboard are not required for
//      standalone skills or ordinary single-lane work" statement is present
//      as a contiguous phrase (see the NOTE at Rule 4 below on what this
//      can and cannot catch).
//   5. The "when not to add more machinery" callout still contains both
//      required topics as affirmative, contiguous phrases pinned from the
//      shipped copy — a low-risk change, and work that isn't actually
//      parallel (see the NOTE at Rule 5 below).
//   6. Any external URLs inside the ladder are on the small allowlist below
//      (shape check only — this script never fetches anything).
//
// After Rules 1-6 run for real and print their own result: a small set of
// in-memory self-checks (see runCaveatSelfChecks, below) exercises the
// checker's OWN extraction logic — a synthetic fixture for the balanced-
// tag nested-wrapper regression (issue #24), plus two real-element
// mutation controls for #adopt-when-not's required phrases — and prints
// its own summary AFTER the real results. Self-checks never suppress,
// gate, or reorder a real Rule 1-6 finding; the process exits non-zero if
// either has a real failure.

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

// True class-TOKEN membership: split the class attribute on whitespace and
// test for an exact element, not a substring/regex-boundary match. A `\b`
// regex boundary is NOT enough here — `-` is a non-word character, so
// `\badopt-level\b` still matches inside `adopt-level-summary`, and a
// hand-rolled attribute string like `class="card adopt-level"` breaks the
// moment classes are reordered or a class is added. Splitting on whitespace
// and checking array membership is the only one of the three that is
// actually order- and neighbor-safe.
function classTokens(attrs) {
  const m = attrs.match(/class="([^"]*)"/);
  return m ? m[1].split(/\s+/).filter(Boolean) : [];
}
function hasClassToken(attrs, token) {
  return classTokens(attrs).includes(token);
}

// Finds the index of the closing tag that matches the OPENING tag assumed
// already consumed just before `fromIndex` (depth 1), via a depth-counted
// scan over every <tagName>/</tagName> tag of that SAME name from
// `fromIndex` onward. Returns -1 if the tags never balance. Generalizes the
// same technique extractLevelBlocks below uses for the ladder's own <ol>:
// a non-greedy "first closing tag of this kind" match breaks the moment the
// element nests another element of the same tag name.
// Assumptions (true of Astro's actual HTML5 output, not enforced here):
// tag names are lowercase in the source; no HTML comment contains literal
// "<tagName" / "</tagName" text; and no element of this tag name is ever
// self-closed (e.g. `<div />`) — a self-closing tag would be counted as an
// unmatched open and throw off the depth count.
function findMatchingTagClose(html, tagName, fromIndex) {
  const tagRe = new RegExp(`<(/?)${tagName}\\b[^>]*>`, 'g');
  tagRe.lastIndex = fromIndex;
  let depth = 1;
  let m;
  while ((m = tagRe.exec(html))) {
    if (m[1] === '/') {
      depth -= 1;
      if (depth === 0) return m.index;
    } else {
      depth += 1;
    }
  }
  return -1; // unmatched
}

// Extracts the element carrying id="${id}" — whatever its tag name is — as
// { tagName, openTag, innerHtml, matched }, by locating its own opening tag
// and then depth-counting every open/close tag of that SAME tag name from
// there (findMatchingTagClose) to find its real matching close. `matched` is
// false if the tags never balance (innerHtml then runs to end-of-string, and
// callers should treat that the same as "not found"). This replaces a
// non-greedy "id="${id}"[^>]*>([\s\S]*?)<\/TAG>" match, which is wrong the
// moment the element's own content nests another element of the same tag
// name (e.g. a future layout <div> wrapped around a caveat's heading) —
// that inner close tag ends the match early and truncates everything after
// it, producing a false failure even though the rendered text is unchanged.
// Returns null if no element with that id exists at all.
function extractElementById(html, id) {
  const openTagRe = /<([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = openTagRe.exec(html))) {
    const [full, tagName, attrs] = m;
    const idMatch = attrs.match(/\sid="([^"]*)"/);
    if (!idMatch || idMatch[1] !== id) continue;
    const contentStart = m.index + full.length;
    const closeIdx = findMatchingTagClose(html, tagName, contentStart);
    return {
      tagName,
      openTag: full,
      innerHtml: html.slice(contentStart, closeIdx !== -1 ? closeIdx : html.length),
      matched: closeIdx !== -1,
    };
  }
  return null;
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

// Rule 5's two required topics, pinned as affirmative, contiguous phrases
// taken verbatim from the shipped copy in src/components/AdoptionLadder.astro
// (whitespace-normalized, curly apostrophes straightened, lowercased — see
// the normalization applied before matching, below). Update these
// deliberately, in the same diff, if that copy's wording changes.
const REQUIRED_CAVEAT_PHRASES = {
  lowRisk:
    "a low-risk change — a typo, a copy edit, a one-line config tweak — doesn't need a claim or a lane",
  nonParallel: "work that isn't actually parallel",
};

// Normalizes an extracted element's innerHTML into the same space-joined,
// straight-quote, lowercase, trimmed text used to test REQUIRED_CAVEAT_PHRASES.
// Shared by the real Rule 5 check below and by runCaveatSelfChecks'
// mutation controls, so both exercise the exact same normalization.
function normalizeCaveatText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/[‘’]/g, "'") // curly apostrophes -> straight, so the pinned phrases match either way
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

// Returns which keys of REQUIRED_CAVEAT_PHRASES are absent from an
// already-normalized text. Empty array means both required phrases are present.
function missingCaveatPhrases(normalizedText) {
  return Object.keys(REQUIRED_CAVEAT_PHRASES).filter(
    (key) => !normalizedText.includes(REQUIRED_CAVEAT_PHRASES[key])
  );
}

// External URLs are allowed in the ladder only from these origins/prefixes.
// This is a shape check — the script never fetches any of these.
const EXTERNAL_ALLOWLIST = [
  /^https:\/\/github\.com\/shakacode(\/|$)/,
  /^https:\/\/(www\.)?shakacode\.com(\/|$)/,
];

// ---------------------------------------------------------------------------
// Self-checks (issue #24): mutation controls for extractElementById / Rule
// 5's caveat extraction, run and printed AFTER the real Rule 1-6 results
// below — never before, never in their place. Only the checker's actual
// contract (adopt-* classes, data-level values, ids) is exercised; markup
// choices outside that contract (heading tag, bullet element) are not.
//
// "nested-wrapper regression" uses a small SYNTHETIC fixture (not the real
// build), heading wrapped in an extra <div> — issue #24's exact bug shape
// — so it is always applicable, independent of the real build's content
// (previously it ran against the real build and no-op'd whenever the real
// baseline had already regressed — exactly the scenario it exists to
// catch). The two "missing-<phrase>" controls mutate a COPY of the REAL,
// loaded #adopt-when-not element, removing one required caveat's <li> at a
// time. A control that can't locate what it needs to mutate (element
// unmatched, or no <li> currently holds the phrase — markup shape changed,
// or the phrase already regressed and Rule 5 above already reported it) is
// "skipped: <reason>", never failed; only a control whose mutation DID
// apply and then saw wrong extraction behavior fails.
// ---------------------------------------------------------------------------

// Minimal synthetic stand-in for #adopt-when-not, used only by the
// nested-wrapper control below so it never depends on real build content.
function buildSyntheticCaveat(headingHtml) {
  return (
    '<div id="adopt-when-not" class="card adopt-caveat">' +
    headingHtml +
    '<ul role="list">' +
    `<li>${REQUIRED_CAVEAT_PHRASES.lowRisk}.</li>` +
    `<li>${REQUIRED_CAVEAT_PHRASES.nonParallel}.</li>` +
    '<li>A backlog worked one item at a time.</li>' +
    '</ul>' +
    '</div>'
  );
}

// Always applicable: a synthetic caveat with its heading wrapped in an
// extra <div> (content-preserving; issue #24's bug shape) must still
// extract both required phrases via the balanced-tag scan.
function checkNestedWrapperRegression() {
  const fixture = buildSyntheticCaveat('<div class="self-check-wrap"><h3>When not to add more machinery</h3></div>');
  const el = extractElementById(fixture, 'adopt-when-not');
  const ok = !!el && el.matched && missingCaveatPhrases(normalizeCaveatText(el.innerHtml)).length === 0;
  return {
    name: 'nested-wrapper regression (synthetic fixture)',
    status: ok ? 'pass' : 'fail',
    detail: ok
      ? undefined
      : 'extraction must still find both required phrases when the caveat heading is wrapped in an extra <div> (issue #24)',
  };
}

// Replaces the <li> containing `phrase` with a neutral placeholder — a
// mutation of REAL markup. Returns { result, found }; found is false if no
// <li> contains the phrase (bullets restyled to something else, or the
// phrase is already gone) — the caller reports that as skipped.
function removeLiContainingPhrase(innerHtml, phrase) {
  let found = false;
  const result = innerHtml.replace(/<li\b[^>]*>[\s\S]*?<\/li>/g, (block) => {
    if (!found && normalizeCaveatText(block).includes(phrase)) {
      found = true;
      return '<li>This bullet no longer mentions that guidance at all.</li>';
    }
    return block;
  });
  return { result, found };
}

// Dropping the `key` phrase's <li> from the real, loaded #adopt-when-not
// element must still be reported missing. Skips if nothing applicable.
function checkMissingPhraseControl(caveatEl, key) {
  const name = `missing-${key} still fails`;
  if (!caveatEl || !caveatEl.matched) {
    return { name, status: 'skip', detail: 'no matched #adopt-when-not element in the real build to mutate — see Rule 5 above' };
  }
  const phrase = REQUIRED_CAVEAT_PHRASES[key];
  const { result: mutatedInner, found } = removeLiContainingPhrase(caveatEl.innerHtml, phrase);
  if (!found) {
    return {
      name,
      status: 'skip',
      detail: `no <li> in the real #adopt-when-not element currently contains the "${key}" phrase to remove — its markup shape may have changed, or the phrase is already missing (see Rule 5 above)`,
    };
  }
  const mutatedMarkup = `${caveatEl.openTag}${mutatedInner}</${caveatEl.tagName}>`;
  const mutatedEl = extractElementById(mutatedMarkup, 'adopt-when-not');
  const missing =
    mutatedEl && mutatedEl.matched
      ? missingCaveatPhrases(normalizeCaveatText(mutatedEl.innerHtml))
      : Object.keys(REQUIRED_CAVEAT_PHRASES);
  const ok = missing.includes(key);
  return {
    name,
    status: ok ? 'pass' : 'fail',
    detail: ok ? undefined : `extraction did not report the "${key}" phrase missing after its <li> was neutralized`,
  };
}

function runCaveatSelfChecks(caveatEl) {
  return [checkNestedWrapperRegression(), checkMissingPhraseControl(caveatEl, 'lowRisk'), checkMissingPhraseControl(caveatEl, 'nonParallel')];
}

// Prints the summary; returns true unless a control failed (skips don't
// count). Never exits — the caller decides overall status once both the
// real results and this summary have printed, so a failure here can't
// hide a real finding.
function reportSelfChecks(checks) {
  const failed = checks.filter((c) => c.status === 'fail');
  const skipped = checks.filter((c) => c.status === 'skip');
  const passed = checks.filter((c) => c.status === 'pass');

  console.log();
  if (failed.length > 0) {
    console.error("check-adoption-ladder: SELF-CHECK FAILED — the checker's own extraction logic is broken:\n");
    for (const c of failed) console.error(`  - ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
    if (skipped.length > 0) {
      console.error(`\nSkipped (mutation not applicable): ${skipped.map((c) => c.name).join(', ')}.`);
    }
    console.error(
      `\n${failed.length}/${checks.length} self-check control(s) failed. This is a bug in ` +
        'scripts/check-adoption-ladder.mjs itself, not in the built site.'
    );
    return false;
  }

  const skipNote = skipped.length > 0 ? `; ${skipped.length} skipped (${skipped.map((c) => c.name).join(', ')})` : '';
  console.log(
    `check-adoption-ladder: self-checks OK (${passed.length}/${passed.length} applicable mutation control(s) passed${skipNote}).`
  );
  return true;
}

const indexHtml = readDistFile('index.html');
if (indexHtml === null) {
  console.error(
    'check-adoption-ladder: dist/index.html not found. This check runs ' +
      'against the built site — run `npm run build` (or `.agents/bin/validate`) first.'
  );
  process.exit(1);
}

// Hoisted so the self-check summary at the very bottom of this file (after
// the real Rule 1-6 results print) can still reuse whatever Rule 5 found —
// null if the #adopt section itself was missing/unmatched.
let caveatEl = null;

const SECTION_START = '<section id="adopt"';
const sectionStartIdx = indexHtml.indexOf(SECTION_START);
let sectionHtml = '';
if (sectionStartIdx === -1) {
  fail('dist/index.html has no <section id="adopt"> — the homepage adoption-ladder section is missing entirely.');
} else {
  // Balanced-tag scan (findMatchingTagClose), not a blind
  // indexOf('</section>') — the same non-greedy-pattern bug class issue #24
  // fixes for #adopt-when-not: a blind first-occurrence match would be wrong
  // the moment the #adopt section itself nests another <section>.
  const openTagEnd = indexHtml.indexOf('>', sectionStartIdx);
  const closeIdx = openTagEnd === -1 ? -1 : findMatchingTagClose(indexHtml, 'section', openTagEnd + 1);
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

  // The ladder's own <ol> close is found via findMatchingTagClose (same
  // depth-counted balanced-tag scanner used everywhere else in this file),
  // not a blind `indexOf('</ol>')` — the latter finds the first </ol>
  // anywhere after it, which is wrong the moment a level's own field
  // contains a nested <ol> (e.g. <ol><li>...</li></ol> inside "Optional")
  // — that nested list's close sits before the ladder's real close, so
  // slicing to it truncates (or inverts, start > end) the last level's
  // body and misattributes the resulting failures to the wrong level
  // entirely.

  // Extracts each level's own HTML body by finding every <li> that carries
  // the "adopt-level" class token, then slicing from just after that <li>'s
  // own opening tag to the START of the NEXT such <li> (or, for the last
  // level, to the ladder <ol>'s own matching close) — not to the first
  // </li> (or </ol>) found anywhere inside it. A non-greedy "first closing
  // tag" boundary breaks the moment a level's own content contains ANY
  // nested list, because that inner close tag ends the match early and
  // truncates everything meant to come after it.
  function extractLevelBlocks(html) {
    const olOpenRe = /<ol\b([^>]*)>/g;
    let olOpenEnd = -1;
    let olMatch;
    while ((olMatch = olOpenRe.exec(html))) {
      if (hasClassToken(olMatch[1], 'adopt-ladder')) {
        olOpenEnd = olMatch.index + olMatch[0].length;
        break;
      }
    }
    const olCloseIdx = olOpenEnd !== -1 ? findMatchingTagClose(html, 'ol', olOpenEnd) : -1;

    const openRe = /<li\b([^>]*)>/g;
    const opens = [];
    let m;
    while ((m = openRe.exec(html))) {
      const attrs = m[1];
      if (!hasClassToken(attrs, 'adopt-level')) continue; // e.g. the caveat's plain <li> bullets
      opens.push({ attrs, tagStart: m.index, contentStart: m.index + m[0].length });
    }

    return opens.map(({ attrs, contentStart }, i) => {
      const end = i + 1 < opens.length ? opens[i + 1].tagStart : (olCloseIdx !== -1 ? olCloseIdx : html.length);
      return { attrs, body: html.slice(contentStart, end) };
    });
  }

  const levelBlocks = extractLevelBlocks(sectionHtml);

  if (levelBlocks.length !== 3) {
    fail(`Expected exactly 3 adoption-ladder levels (an <li> carrying the "adopt-level" class token), found ${levelBlocks.length}.`);
  }

  // Extracts the text of the "<p>" field carrying the given class token.
  // Every <span>...</span> in the field is scanned (globally, not just the
  // first one found) and the ONE whose own class tokens include
  // "adopt-label" — the "Problem" / "Prerequisites" / "Optional" label
  // itself — is removed; any other span (a decorative icon, or prose that
  // happens to be wrapped in a span) is left exactly as-is. This is a
  // targeted removal of the label specifically, not a blanket "strip every
  // span" — the latter would make a field whose real prose is wrapped in a
  // span read as empty, which is its own false positive.
  function fieldText(body, fieldClass) {
    const pRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = pRe.exec(body))) {
      const [, attrs, inner] = m;
      if (!hasClassToken(attrs, fieldClass)) continue;
      const withoutLabel = inner.replace(/<span\b([^>]*)>[\s\S]*?<\/span>/g, (full, spanAttrs) =>
        hasClassToken(spanAttrs, 'adopt-label') ? '' : full
      );
      return withoutLabel.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
    return null;
  }

  // Extracts the href of the <a> carrying the "adopt-next" class token —
  // returns null if no such <a> exists at all (e.g. it was swapped for a
  // link-less <span>, or the only <a> present carries some other class like
  // "adopt-next-icon"), and '' if it exists with an empty href.
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
  for (const { attrs, body } of levelBlocks) {
    const levelMatch = attrs.match(/data-level="([^"]*)"/);
    const levelNum = levelMatch ? levelMatch[1] : null;
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
      fail(`Ladder level ${levelNum}'s next action must be an <a> carrying the "adopt-next" class with a non-empty href — found no such <a> (it may have been replaced by a link-less element, or the only <a> present carries a different class).`);
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
  // Extracted with extractElementById's balanced-tag scanner (same as
  // Rule 5 below), not a non-greedy "first </p>" match — the same bug
  // class issue #24 fixes for #adopt-when-not.
  const backendEl = extractElementById(sectionHtml, 'adopt-backend-optional');
  if (!backendEl || !backendEl.matched) {
    fail('No element with id="adopt-backend-optional" found in the #adopt section — the "coordination backend and dashboard are not required" statement is missing.');
  } else {
    const text = backendEl.innerHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text.includes(REQUIRED_PHRASE)) {
      fail(`The #adopt-backend-optional statement no longer contains the phrase "${REQUIRED_PHRASE}" verbatim. Current text: "${text}"`);
    }
  }

  // --- Rule 5: the "when not to add more machinery" callout must still ----
  // contain BOTH required topics as affirmative, contiguous phrases.
  //
  // NOTE — same limitation as Rule 4, for the same reason: this is a drift
  // check, not a semantic reviewer. An earlier version of this rule matched
  // loose keywords near each other ("low-risk" anywhere; "not"/"isn't"/
  // "non-" within 40 characters of "parallel"), which a sentence stating the
  // OPPOSITE of both recommendations could still satisfy — e.g. "This is
  // not a low-risk change; it is parallel." mentions both topic words while
  // asserting the reverse of both, and passed. Pinning a longer, affirmative
  // phrase straight from the shipped copy (REQUIRED_CAVEAT_PHRASES, above)
  // raises the bar: a short negated fragment like "not a low-risk change"
  // does not contain the full pinned phrase, so it fails correctly. It is
  // still a string match, not an understanding of the sentence — a
  // determined, meaning-preserving rewrite that keeps these exact words in a
  // new, inverted sentence (the same class of attack as Rule 4's "ignore the
  // myth that ..." example) would still pass. Any rewrite of this callout,
  // inverted or not, still needs human review at PR time.
  //
  // The element itself is extracted with extractElementById's balanced-tag
  // scanner (depth-counting every <div>/</div> of #adopt-when-not's OWN tag
  // name from its opening tag onward) — not a non-greedy "first </div>"
  // match. The latter breaks the moment the callout's own content nests
  // another <div> (e.g. a future layout wrapper around the heading), which
  // truncates the extracted text before either pinned phrase and produces a
  // false failure even though the rendered caveat text hasn't changed
  // (issue #24). The self-checks at the bottom of this file (after the
  // real Rule 1-6 results print) pin exactly this case, plus regression
  // controls for the two required phrases.
  caveatEl = extractElementById(sectionHtml, 'adopt-when-not');
  if (!caveatEl || !caveatEl.matched) {
    fail('No element with id="adopt-when-not" found in the #adopt section — the "when not to add more machinery" guidance is missing.');
  } else {
    const normalized = normalizeCaveatText(caveatEl.innerHtml);
    const missing = missingCaveatPhrases(normalized);
    if (missing.includes('lowRisk')) {
      fail(`The "when not to add more machinery" block (#adopt-when-not) no longer contains the phrase "${REQUIRED_CAVEAT_PHRASES.lowRisk}" verbatim — the low-risk-change guidance is missing or was reworded. Current text: "${normalized}"`);
    }
    if (missing.includes('nonParallel')) {
      fail(`The "when not to add more machinery" block (#adopt-when-not) no longer contains the phrase "${REQUIRED_CAVEAT_PHRASES.nonParallel}" verbatim — the non-parallel-work guidance is missing or was reworded. Current text: "${normalized}"`);
    }
  }
}

// Print the real Rule 1-6 results FIRST, always — never gated behind or
// hidden by the self-checks below.
if (failures.length > 0) {
  console.error('check-adoption-ladder: FAILED\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n${failures.length} issue(s) found.`);
} else {
  console.log('check-adoption-ladder: OK — the homepage adoption ladder\'s links and content match the built Quickstart.');
}

// Then the self-checks, printed after — see the header comment above the
// "Self-checks" block for why they never gate or reorder the output above.
const selfChecksOk = reportSelfChecks(runCaveatSelfChecks(caveatEl));

if (failures.length > 0 || !selfChecksOk) {
  process.exit(1);
}
