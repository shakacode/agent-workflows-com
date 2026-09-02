#!/usr/bin/env node
/**
 * Render scripts/og-card.html to public/og.png — the 1200x630 Open Graph /
 * Twitter card that src/layouts/Base.astro points every shared link at.
 *
 * Usage:
 *
 *     node scripts/render-og-card.mjs
 *     CHROME_BIN=/path/to/chromium node scripts/render-og-card.mjs
 *     node scripts/render-og-card.mjs --out /tmp/preview.png   # render elsewhere
 *
 * Requirements: Google Chrome (or any Chromium with `--headless=new`) and
 * `npm install`, because the card embeds the site's own webfonts straight out
 * of node_modules/@fontsource*. No npm dependencies: Node built-ins only.
 *
 * `public/og.png` is a build artifact of `scripts/og-card.html`. Edit the HTML,
 * re-run this script, and commit both. Never hand-edit the PNG.
 *
 * The script fails loudly rather than writing a wrong card: it only replaces the
 * target once Chrome has produced a complete PNG of exactly 1200x630 pixels,
 * which is what the og:image:width / og:image:height meta tags promise.
 */

import { spawn } from 'node:child_process';
import { closeSync, existsSync, mkdtempSync, openSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** Soft budget. Social scrapers refetch this file constantly; keep it lean. */
const SIZE_WARN_BYTES = 250 * 1024;
const RENDER_TIMEOUT_MS = 60_000;

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..');
const source = join(repoRoot, 'scripts', 'og-card.html');

const outFlag = process.argv.indexOf('--out');
const target = outFlag === -1 ? join(repoRoot, 'public', 'og.png') : resolve(process.argv[outFlag + 1] ?? '');

const chrome = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function die(message) {
  console.error(`render-og-card: ${message}`);
  process.exit(1);
}

if (!existsSync(source)) die(`missing source artwork: ${source}`);
if (!existsSync(chrome)) {
  die(`Chrome not found at ${chrome}\n  Set CHROME_BIN to a Chrome/Chromium binary and retry.`);
}
if (!existsSync(join(repoRoot, 'node_modules', '@fontsource-variable', 'fraunces'))) {
  die('node_modules/@fontsource-variable/fraunces is missing — run `npm install` first.');
}

/**
 * A finished PNG, checked without a decoder: the signature, an IHDR chunk we can
 * read the dimensions out of, and a trailing IEND so we never pick up a
 * half-written capture. Returns null while the file is still incomplete.
 */
function finishedPng(file) {
  let buf;
  try {
    buf = readFileSync(file);
  } catch {
    return null;
  }
  if (buf.length < 45) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  if (buf.toString('latin1', 12, 16) !== 'IHDR') return null;
  if (buf.toString('latin1', buf.length - 8, buf.length - 4) !== 'IEND') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf };
}

const profile = mkdtempSync(join(tmpdir(), 'og-card-chrome-'));
const staged = join(profile, 'og.png');
const logPath = join(profile, 'chrome.log');
// Chrome's helper processes inherit our stdio and outlive the browser, so a pipe
// would never close. Give it a plain file and read the log back on failure.
const log = openSync(logPath, 'w');

const args = [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  // the webfonts come from node_modules over file://, which Chrome otherwise
  // refuses as a cross-origin subresource
  '--allow-file-access-from-files',
  '--force-device-scale-factor=1',
  `--window-size=${OG_WIDTH},${OG_HEIGHT}`,
  `--user-data-dir=${profile}`,
  `--screenshot=${staged}`,
  pathToFileURL(source).href,
];

// `detached` puts Chrome in its own process group so one kill takes the helper
// processes with it. Some Chrome builds write the screenshot and then linger, so
// poll for a finished PNG rather than waiting on exit.
const child = spawn(chrome, args, { stdio: ['ignore', log, log], detached: true });
child.on('error', (err) => die(`could not run Chrome: ${err.message}`));

let exited = false;
child.on('exit', () => {
  exited = true;
});

function stopChrome() {
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    /* already gone */
  }
}

const deadline = Date.now() + RENDER_TIMEOUT_MS;
let png = null;
while (Date.now() < deadline) {
  await sleep(200);
  png = finishedPng(staged);
  if (png || exited) break;
}
stopChrome();
png ??= finishedPng(staged);
closeSync(log);

try {
  if (!png) {
    const tail = existsSync(logPath) ? readFileSync(logPath, 'utf8').trimEnd().split('\n').slice(-12).join('\n') : '';
    die(`Chrome did not produce a screenshot within ${RENDER_TIMEOUT_MS / 1000}s\n${tail}`);
  }
  if (png.width !== OG_WIDTH || png.height !== OG_HEIGHT) {
    die(
      `expected ${OG_WIDTH}x${OG_HEIGHT}, got ${png.width}x${png.height} — refusing to ` +
        'overwrite the card. Check that this Chrome honours --force-device-scale-factor=1.',
    );
  }

  writeFileSync(target, png.bytes);
  const kb = (statSync(target).size / 1024).toFixed(1);
  console.log(`render-og-card: wrote ${target} (${png.width}x${png.height}, ${kb} KB)`);
  if (png.bytes.length > SIZE_WARN_BYTES) {
    console.warn(
      `render-og-card: warning — ${kb} KB is over the ${SIZE_WARN_BYTES / 1024} KB budget; ` +
        'simplify the gradients in scripts/og-card.html.',
    );
  }
} finally {
  rmSync(profile, { recursive: true, force: true });
}
