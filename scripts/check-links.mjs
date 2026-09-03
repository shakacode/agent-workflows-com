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
//   1. Walks every dist/**/*.html file. <!-- ... --> comment blocks are
//      stripped from each document before anything else runs, for both id
//      collection and link extraction — a commented-out element is not
//      rendered, so its id must not satisfy a live #fragment and its
//      href/src must not be checked as if it were a real link. ids are
//      collected only from real opening-tag attribute strings (the same
//      whole-tag tokenizer used for href/src, generalized to every tag
//      name), not from a raw document-wide text scan — so literal text
//      like id="ghost" inside prose, a <code> sample, or an inline
//      <script> can't be mistaken for a real id="..." attribute.
//   2. Extracts href from <a>/<link>, src from <img>/<script>/<source>/
//      <video>, and every URL candidate inside a srcset on <img>/<source>
//      (srcset is parsed candidate-by-candidate per the HTML spec — reading
//      each URL token up to whitespace, not splitting the whole attribute
//      on "," — so a data: URL candidate's own internal comma, e.g.
//      srcset="data:image/png;base64,AAAA 1x", isn't mistaken for a
//      candidate separator). Like scripts/check-adoption-ladder.mjs, this
//      is regex-based HTML scanning, not a real parser. Tags are tokenized
//      first (so a raw ">" inside an earlier quoted attribute value — e.g.
//      a markdown-emitted title="arrow > here" — doesn't truncate the tag
//      and hide a later href/src), then the target attribute's value is
//      read whether it's double-quoted, single-quoted, or bare/unquoted,
//      matching what real browsers accept.
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
//      Cloudflare Pages serves from — including the root "/", which is
//      only accepted once dist/index.html is confirmed to actually exist
//      via that same exact-case check, not assumed unconditionally. If a
//      "#fragment" is present AND the resolved target is an HTML document,
//      it verifies an element with that id (double-quoted, single-quoted,
//      or unquoted) exists in the resolved target — same-page "#fragment"
//      links (including bare "#", treated as "top of this page" rather
//      than a broken link) are checked against the *source* page's own
//      ids. A fragment on a non-HTML target (e.g. "/icons.svg#logo",
//      "/manual.pdf#page=2") is left unvalidated beyond the file itself
//      existing — there are no ids to check it against.
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

// Strips <!-- ... --> comment blocks before scanning for ids or
// link-bearing attributes. A commented-out element is not rendered, so
// its id must not satisfy a live #fragment and its href/src must not be
// checked as if it were a real link.
function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

// --- id="..." lookups for a dist file, cached (many pages share the same ---
// nav targets, so this avoids re-reading/re-scanning the same file).
//
// ids are collected only from real opening-tag attribute strings (via
// allOpeningTagAttrStrings + getAttrValue below), not from a document-wide
// text scan — otherwise literal text like `id="ghost"` inside prose,
// <code>, or an inline <script> would be mistaken for a real id="..."
// attribute and satisfy a live #fragment that has no matching element.
const idCache = new Map();
function idsFor(absFile) {
  if (idCache.has(absFile)) return idCache.get(absFile);
  const ids = new Set();
  if (absFile.endsWith('.html') && existsSync(absFile) && statSync(absFile).isFile()) {
    const html = stripComments(readFileSync(absFile, 'utf8'));
    for (const attrsText of allOpeningTagAttrStrings(html)) {
      // Same double/single/unquoted flexibility as getAttrValue elsewhere —
      // an id='target' or id=target is a real, working fragment target.
      const id = getAttrValue(attrsText, 'id');
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

// Same whole-tag tokenizing as tagAttrStrings, but for EVERY opening tag
// regardless of name (used for id collection, where an id can legitimately
// sit on any element — a <div>, a <span>, an <li>, ...). Closing tags
// ("</div>") don't match, since a tag name must start right after "<".
function allOpeningTagAttrStrings(html) {
  const re = /<[a-zA-Z][a-zA-Z0-9-]*\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
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

// Parses a srcset attribute value per the HTML "parse a srcset attribute"
// algorithm, closely enough for this checker's purposes: naively splitting
// on "," breaks a data: URL candidate (its own value legitimately contains
// commas, e.g. `srcset="data:image/png;base64,AAAA 1x"` would otherwise
// yield a bogus relative candidate "AAAA"). Instead: skip leading
// whitespace/commas, read the URL token up to the next whitespace (a URL
// token ending in "," has no descriptor — strip the trailing comma(s) and
// move on), then skip past that candidate's descriptor up to the next
// top-level comma (parenthesized descriptors, e.g. future `calc-size()`-
// style values, are not split on).
function parseSrcset(value) {
  const urls = [];
  const len = value.length;
  let pos = 0;
  while (pos < len) {
    while (pos < len && /[\s,]/.test(value[pos])) pos++;
    if (pos >= len) break;

    const urlStart = pos;
    while (pos < len && !/\s/.test(value[pos])) pos++;
    let url = value.slice(urlStart, pos);

    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
      if (url) urls.push(url);
      continue; // trailing comma(s) means no descriptor for this candidate
    }
    if (url) urls.push(url);

    while (pos < len && /\s/.test(value[pos])) pos++;
    let depth = 0;
    while (pos < len) {
      const ch = value[pos];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        pos++;
        break;
      }
      pos++;
    }
  }
  return urls;
}

// --- Every link-bearing value on one page: href, src, and srcset URLs. ---
function extractCandidates(html) {
  const values = [
    ...extractAttr(html, ['a', 'link'], 'href'),
    ...extractAttr(html, ['img', 'script', 'source', 'video'], 'src'),
  ];
  for (const srcset of extractAttr(html, ['img', 'source'], 'srcset')) {
    values.push(...parseSrcset(srcset));
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
  if (clean === '') {
    // The root ("/") maps to dist/index.html, same as any other directory
    // index — but that file still has to actually exist, checked the same
    // exact-case way as every other path, not assumed unconditionally.
    const rootIndex = caseSensitiveEntry('index.html');
    return rootIndex && rootIndex.isFile ? 'index.html' : null;
  }

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
  // Comments are stripped before extraction: a commented-out link isn't
  // rendered, so it shouldn't be checked (matches idsFor's stripComments
  // above, so a commented-out anchor's id can't satisfy a live #fragment).
  const html = stripComments(readFileSync(absFile, 'utf8'));
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

    if (fragment && resolved.endsWith('.html')) {
      // Only HTML documents have ids to check a fragment against. A
      // fragment on a non-HTML resource (e.g. "/icons.svg#logo",
      // "/manual.pdf#page=2") is handled entirely by the browser or a
      // plugin, not by matching an id="..." — the file existing (already
      // confirmed above via distFileForSitePath) is all this script can
      // and should verify.
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
