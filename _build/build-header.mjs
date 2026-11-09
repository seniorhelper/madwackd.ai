// Writes the one shared site header into every page that has one.
// Run from the repo root:  node _build/build-header.mjs
// Edit the header here (or the logo in _build/brand.html), run it, commit the pages.
// The underscore folder is not published by GitHub Pages (Jekyll skips it).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const NAV_CSS_V = '20261108a';
const brand = fs.readFileSync(path.join(here, 'brand.html'), 'utf8').trim();

// Custom icons: 24px grid, 1.9 stroke, round caps and joins, currentColor.
const svg = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
const ICON = {
  dash: '<rect x="3" y="3" width="8" height="9" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="10" width="8" height="11" rx="2"/><rect x="3" y="14" width="8" height="7" rx="2"/>',
  tools: '<path d="M4 20 14.5 9.5"/><path d="m13 8 3 3"/><path d="M17 3v3M15.5 4.5h3M20 9.5v2M19 10.5h2M10 3.5v1.5M9.25 4.25h1.5"/>',
  studio: '<path d="M3.5 10h17v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="m3.5 10-.6-3.2a1.5 1.5 0 0 1 1.2-1.7L17.4 2.6a1.5 1.5 0 0 1 1.7 1.2l.5 2.7z"/><path d="m8 4.5 2 4M13 3.6l2 4"/><path d="m10.5 13.5 4 2-4 2z"/>',
  genie: '<path d="M4 13h13.5c0 3-3 5-7 5s-6.5-2-6.5-5z"/><path d="M17.5 13c1.8 0 3-1.3 4-3.5"/><path d="M4 13c-1.6 0-2.3-2.4-.6-3.2"/><path d="M8.5 13a2.5 2.5 0 0 1 5 0"/><path d="M8 21h6M11 18v3"/><path d="M15 3.5v3M13.5 5h3"/>',
  price: '<path d="M3 3h8.2l9.3 9.3a1.8 1.8 0 0 1 0 2.5l-5.7 5.7a1.8 1.8 0 0 1-2.5 0L3 11.2z"/><circle cx="7.6" cy="7.6" r="1.4"/>',
  people: '<circle cx="12" cy="9" r="3.6"/><path d="M5 21c.6-3.6 3.4-6 7-6s6.4 2.4 7 6"/><path d="M6.6 9.5V8.6a5.4 5.4 0 0 1 10.8 0v.9"/><path d="M17.4 9.5v1.2c0 1.2-1 2.1-2.2 2.1H13.5"/>',
  phone: '<path d="M5.2 3h3.1l1.7 4.4-2.2 1.5a12 12 0 0 0 7.3 7.3l1.5-2.2 4.4 1.7v3.1a2.2 2.2 0 0 1-2.4 2.2A16.5 16.5 0 0 1 3 5.4 2.2 2.2 0 0 1 5.2 3z"/>',
  go: '<path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5"/>',
};

// The 6 main items. --c/--g are the madwackd neon tube colors; --on is the icon color when the tile is lit.
const NAV = [
  { href: '/choose/', label: 'Dashboards', icon: 'dash', c: '#00B8F0', g: '#8B3DFF' },
  { href: '/creator-studio/', label: 'Free Tools', icon: 'tools', c: '#7ED321', g: '#00B8F0', tour: 'creator-studio', on: '#0B1A3A' },
  { href: '/pro-studio/', label: 'Pro Studio', icon: 'studio', c: '#8B3DFF', g: '#FF2E93' },
  { href: '/custom-creator-studio/', label: 'Genie', icon: 'genie', c: '#FFD60A', g: '#FF8A00', on: '#0B1A3A' },
  { href: '/pricing/', label: 'Pricing', icon: 'price', c: '#FF8A00', g: '#FF2E93', tour: 'pricing' },
  { href: '/producers/', label: 'Producers', icon: 'people', c: '#FF2E93', g: '#8B3DFF' },
];

function header(pagePath, acct) {
  const tiles = NAV.map((n) => {
    const cur = pagePath.startsWith(n.href) ? ' aria-current="page"' : '';
    const tour = n.tour ? ` data-tour="${n.tour}"` : '';
    const style = `--c:${n.c};--g:${n.g}` + (n.on ? `;--on:${n.on}` : '');
    return `<a class="mh-t" href="${n.href}" style="${style}"${tour}${cur}><span class="mh-em">${svg(ICON[n.icon])}</span><span class="mh-l">${n.label}</span></a>`;
  }).join('');
  return `<header class="site-header mh">
  <div class="mh-bar">
    ${brand}
    <nav class="mh-tiles" aria-label="Main">${tiles}</nav>
    <div class="mh-acts">${acct ? '<span class="mw-acct" data-mw-account></span>' : ''}<a class="mh-call" href="tel:+18004818638">${svg(ICON.phone)}<span class="mh-num"><span class="sr-only">Call </span>1-800-481-8638</span></a><a class="mh-cta" href="/studio/?buy=test_drive" data-tour="start">Start for $5${svg(ICON.go)}</a></div>
  </div>
</header>`;
}

const HEADER_RE = /<header class="site-header[^"]*">[\s\S]*?<\/header>/;
let changed = 0, skipped = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('_') || e.name === 'node_modules' || e.name === 'assets') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!e.name.endsWith('.html')) continue;
    const src = fs.readFileSync(p, 'utf8');
    const m = src.match(HEADER_RE);
    if (!m) continue;
    // The Studio app has its own slim header (Home + Connection); leave it alone.
    if (!/id="site-nav"|class="mh-tiles"/.test(m[0])) { skipped.push(path.relative(root, p)); continue; }
    let rel = '/' + path.relative(root, p).split(path.sep).join('/');
    rel = rel.replace(/index\.html$/, '');
    let out = src.replace(HEADER_RE, header(rel, m[0].includes('data-mw-account')));
    // Header styles live in their own sheet, loaded right after site.css (bump NAV_CSS_V when nav.css changes).
    const link = `<link rel="stylesheet" href="/assets/nav.css?v=${NAV_CSS_V}">`;
    if (/\/assets\/nav\.css\?v=[^"]*">/.test(out)) out = out.replace(/<link rel="stylesheet" href="\/assets\/nav\.css\?v=[^"]*">/, link);
    else out = out.replace(/(<link rel="stylesheet" href="\/assets\/site\.css[^"]*">)/, `$1\n${link}`);
    if (out !== src) { fs.writeFileSync(p, out); changed++; }
  }
})(root);
console.log(`header written to ${changed} page(s); left alone: ${skipped.join(', ') || 'none'}`);
