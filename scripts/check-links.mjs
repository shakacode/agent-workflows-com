#!/usr/bin/env node
// Offline internal-link check over the built site (issue #11, direction
// item 2: "add ... an internal-link check over the built output" so a dead
// link or anchor fails CI, not a visitor's browser).
//
// Plain Node ESM, zero dependencies, fully offline and deterministic — it
// only reads files already produced by `astro build`; it never makes a
// network call. Run it after a build:
//
//   npm run build && node scripts/check-links.mjs
//
// What it does:
//
//   1. Walks every dist/**/*.html file.
//   2. Extracts href from <a>/<link>, src from <img>/<script>/<source>/
//      <video>, and every URL candidate inside a srcset on <img>/<source>.
//      Like scripts/check-adoption-ladder.mjs, this is regex-based HTML
//      scanning, not a real parser. Tags are tokenized first (so a raw ">"
//      inside an earlier quoted attribute value — e.g. a markdown-emitted
//      title="arrow > here" — doesn't truncate the tag and hide a later
//      href/src), then the target attribute's value is read whether it's
//      double-quoted, single-quoted, or bare/unquoted, matching what real
//      browsers accept.
//   3. Classifies each value as internal (starts with "/", or is a relative
//      path such as "foo", "./foo", "../foo") or not. mailto:, tel:,
//      http(s):, data:, javascript:, any other "scheme:" URL, and
//      protocol-relative "//host/..." URLs are all skipped — this script
//      never touches the network, so it cannot and does not check external
//      links.
//   4. For each internal link: strips any query string, resolves a
//      relative path against its source page's own directory, then
//      resolves the resulting site-absolute path to a file in dist/ by
//      trying, in order, the literal path as a file (covers assets like
//      "/favicon.svg" or "/_astro/foo.css"), "<path>/index.html" (what
//      this project's trailing-slash routing actually emits — see the
//      "generating static routes" build log), then "<path>.html" as a
//      fallback. Every path segment is matched against an exact
//      readdirSync() directory listing rather than existsSync()/statSync(),
//      so a wrong-case path (e.g. "/DOCS/quickstart/") is reported broken
//      even on a case-insensitive-but-preserving local filesystem like
//      macOS's default APFS — matching the case-sensitive filesystem
//      Cloudflare Pages serves from. If a "#fragment" is present, it
//      verifies an element with that id (double-quoted, single-quoted, or
//      unquoted) exists in the resolved target document — same-page
//      "#fragment" links (including bare "#", which is treated as "top of
//      this page" rather than a broken link) are checked against the
//      *source* page's own ids.
//   5. Reports every broken link as one line, `<source page> -> <href>
//      (<reason>)`, and exits 1. On success it prints one line with the
//      page and link counts and exits 0.
//
// Deliberately out of scope (not emitted by this project's Astro build, so
// not worth the added complexity): comparing percent-encoded fragments
// (e.g. href="#a%20b" against id="a b") and legacy <a name="..."> anchor
// targets. Revisit if either ever appears in the built output.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');

if (!existsSync(distDir)) {
  console.error(
    'check-links: dist/ not found. This check runs against the built site ' +
      '— run `npm run build` (or `.agents/bin/validate`) first.'
  );
  process.exit(1);
}

/** @type {string[]} */
const failures = [];
const fail = (message) => failures.push(message);

// --- Walk dist/ for every *.html file, deterministic order. --------------
function walkHtmlFiles(dir) {
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkHtmlFiles(abs));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(abs);
    }
  }
  return out;
}

const htmlFiles = walkHtmlFiles(distDir);

// --- id="..." lookups for a dist file, cached (many pages share the same ---
// nav targets, so this avoids re-reading/re-scanning the same file).
const idCache = new Map();
function idsFor(absFile) {
  if (idCache.has(absFile)) return idCache.get(absFile);
  const ids = new Set();
  if (absFile.endsWith('.html') && existsSync(absFile) && statSync(absFile).isFile()) {
    const html = readFileSync(absFile, 'utf8');
    // Same double/single/unquoted flexibility as getAttrValue above — an
    // id='target' or id=target is a real, working fragment target, not a
    // broken one.
    const re = /(?:^|\s)id\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/gi;
    let m;
    while ((m = re.exec(html))) {
      const id = m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
      if (id) ids.add(id);
    }
  }
  idCache.set(absFile, ids);
  return ids;
}

// --- Tag tokenizing + attribute-value parsing -----------------------------
//
// A naive `<tag\b[^>]*attr="..."[^>]*>` regex truncates at the FIRST ">",
// including one that appears inside an EARLIER attribute's quoted value
// (e.g. a markdown link title `[x](/y/ "arrow > here")` emits
// `title="arrow > here"` raw into the built HTML, hiding a later href on
// the same tag). Match the whole tag first, letting quoted spans contain
// ">", then parse individual attributes out of the captured attribute text.
function tagAttrStrings(html, tagNames) {
  const tagAlt = tagNames.join('|');
  const re = new RegExp(`<(?:${tagAlt})\\b((?:[^>"']|"[^"]*"|'[^']*')*)>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out;
}

// Reads one attribute's value out of a tag's attribute text, accepting
// double-quoted, single-quoted, or bare/unquoted values — real browsers
// (and hand-written HTML) accept all three, so recognizing only double
// quotes silently skips the other two.
function attrValueRegex(attrName) {
  return new RegExp(
    '(?:^|\\s)' + attrName + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s"\'`=<>]+))',
    'i'
  );
}
function getAttrValue(attrsText, attrName) {
  const m = attrValueRegex(attrName).exec(attrsText);
  if (!m) return null;
  return m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3];
}

// --- Extract one attribute's value from every matching tag. --------------
function extractAttr(html, tagNames, attrName) {
  const values = [];
  for (const attrsText of tagAttrStrings(html, tagNames)) {
    const v = getAttrValue(attrsText, attrName);
    if (v !== null) values.push(v);
  }
  return values;
}

// --- Every link-bearing value on one page: href, src, and srcset URLs. ---
function extractCandidates(html) {
  const values = [
    ...extractAttr(html, ['a', 'link'], 'href'),
    ...extractAttr(html, ['img', 'script', 'source', 'video'], 'src'),
  ];
  for (const srcset of extractAttr(html, ['img', 'source'], 'srcset')) {
    for (const candidate of srcset.split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) values.push(url);
    }
  }
  return values;
}

// Explicit schemes this checker deliberately never follows (it must not
// touch the network). Any OTHER "scheme:" prefix (ftp:, sms:, a custom
// app scheme, ...) is treated the same way — skipped, not assumed internal.
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

function isInternal(value) {
  if (!value) return false;
  if (value.startsWith('//')) return false; // protocol-relative external URL
  if (value.startsWith('/')) return true;
  if (SCHEME_RE.test(value)) return false; // mailto:, tel:, http(s):, data:, javascript:, or any other scheme
  return true; // relative path: "foo", "./foo", "../foo"
}

// Splits off the fragment (if any) and strips the query string from what's
// left, per the coordinator decision ("strip query strings, and verify
// #fragment targets exist").
function splitQueryAndFragment(value) {
  const hashIdx = value.indexOf('#');
  const beforeHash = hashIdx === -1 ? value : value.slice(0, hashIdx);
  const fragment = hashIdx === -1 ? null : value.slice(hashIdx + 1);
  const queryIdx = beforeHash.indexOf('?');
  const pathPart = queryIdx === -1 ? beforeHash : beforeHash.slice(0, queryIdx);
  return { pathPart, fragment };
}

// The site-absolute directory a page's relative links resolve against,
// derived from its own path inside dist/ (e.g. "docs/quickstart/index.html"
// -> "/docs/quickstart").
function siteDirFor(relDistFile) {
  const dir = path.posix.dirname(relDistFile.split(path.sep).join('/'));
  return dir === '.' ? '/' : `/${dir}`;
}

// --- Case-sensitive existence checks --------------------------------------
//
// existsSync()/statSync() resolve through the OS filesystem, which on a
// default macOS (APFS) volume is case-insensitive-but-preserving: a link to
// "/DOCS/quickstart/" would resolve locally even though the on-disk entry
// is "docs". Cloudflare Pages serves from a case-sensitive filesystem, so
// that link 404s in production. Walk each path segment against an exact
// readdirSync() directory listing instead, so a wrong-case path is reported
// broken regardless of the local OS's case sensitivity.
const dirListingCache = new Map();
function dirEntries(absDir) {
  if (dirListingCache.has(absDir)) return dirListingCache.get(absDir);
  let entries;
  try {
    entries = readdirSync(absDir, { withFileTypes: true });
  } catch {
    entries = [];
  }
  dirListingCache.set(absDir, entries);
  return entries;
}

// Returns { isFile, isDirectory } for a dist/-relative POSIX path if it
// exists with that EXACT casing at every segment, or null otherwise. Each
// segment is looked up via dirEntries() of its parent, so a mismatch at any
// level (not just the last one) is caught.
function caseSensitiveEntry(relPath) {
  const segments = relPath.split('/').filter(Boolean);
  if (segments.length === 0) return { isFile: false, isDirectory: true };

  let currentAbs = distDir;
  let match = null;
  for (const seg of segments) {
    match = dirEntries(currentAbs).find((e) => e.name === seg) ?? null;
    if (!match) return null;
    currentAbs = path.join(currentAbs, seg);
  }
  return { isFile: match.isFile(), isDirectory: match.isDirectory() };
}

// Resolves a site-absolute path (always starts with "/"; path.posix.join /
// normalize below never let it escape above root, so no separate
// path-traversal guard is needed) to a dist/-relative file, trying the
// literal file, then "<path>/index.html", then "<path>.html" — each check
// exact-case via caseSensitiveEntry, not existsSync()/statSync().
function distFileForSitePath(sitePath) {
  const clean = sitePath.replace(/^\/+/, '');
  if (clean === '') return 'index.html';

  const literal = caseSensitiveEntry(clean);
  if (literal && literal.isFile) return clean;

  const asDirIndex = clean.endsWith('/') ? `${clean}index.html` : `${clean}/index.html`;
  const dirIndex = caseSensitiveEntry(asDirIndex);
  if (dirIndex && dirIndex.isFile) return asDirIndex;

  if (!clean.endsWith('/')) {
    const asHtml = `${clean}.html`;
    const htmlEntry = caseSensitiveEntry(asHtml);
    if (htmlEntry && htmlEntry.isFile) return asHtml;
  }

  return null;
}

let internalLinkCount = 0;

for (const absFile of htmlFiles) {
  const relFile = path.relative(distDir, absFile).split(path.sep).join('/');
  const html = readFileSync(absFile, 'utf8');
  const siteDir = siteDirFor(relFile);

  for (const value of extractCandidates(html)) {
    // Bare/same-page fragment: "#foo" (and "#" alone, treated as "top of
    // this page", not a broken link — a common JS-hook/placeholder pattern).
    if (value.startsWith('#')) {
      internalLinkCount += 1;
      const fragment = value.slice(1);
      if (fragment === '') continue;
      if (!idsFor(absFile).has(fragment)) {
        fail(`${relFile} -> ${value} (fragment "#${fragment}" has no matching id="${fragment}" on this page)`);
      }
      continue;
    }

    if (!isInternal(value)) continue;
    internalLinkCount += 1;

    const { pathPart, fragment } = splitQueryAndFragment(value);
    const siteAbsPath = path.posix.normalize(pathPart.startsWith('/') ? pathPart : path.posix.join(siteDir, pathPart));
    const resolved = distFileForSitePath(siteAbsPath);

    if (resolved === null) {
      fail(`${relFile} -> ${value} (no matching file in dist/ for "${siteAbsPath}")`);
      continue;
    }

    if (fragment) {
      if (!resolved.endsWith('.html')) {
        fail(`${relFile} -> ${value} (target "dist/${resolved}" is not an HTML document, so "#${fragment}" cannot be resolved)`);
        continue;
      }
      const targetAbs = path.join(distDir, resolved);
      if (!idsFor(targetAbs).has(fragment)) {
        fail(`${relFile} -> ${value} (fragment "#${fragment}" has no matching id="${fragment}" in dist/${resolved})`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('check-links: FAILED\n');
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`\n${failures.length} broken link(s) found across ${htmlFiles.length} page(s).`);
  process.exit(1);
}

console.log(`check-links: OK — ${htmlFiles.length} page(s), ${internalLinkCount} internal link(s) checked, 0 broken.`);
