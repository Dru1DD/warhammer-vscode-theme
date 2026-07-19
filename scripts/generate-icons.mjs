// Generates the Warhammer 40k "Grimdark Sigils" file-icon set.
//
// Single source of truth: edit the ICONS table / SYMBOLS / folder art below,
// then run `node scripts/generate-icons.mjs`. It emits one SVG per entry plus
// the VS Code icon-theme manifest into ../icons.
//
// Readability-first design: a dark data-slate plate, a bold accent gothic
// frame, a colour tint wash (so each tile reads by colour even at 16px), a
// purity-seal top notch, and one large heavy sans-serif glyph (or a drawn
// symbol). No fine filigree — it only muddies at tree size.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Lightens a #rrggbb toward white by amt (0..1) for a brighter glyph. */
function lighten(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** The plate + frame + tint wash + top notch. `inner` is the glyph/symbol. */
function slate(accent, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1b1622"/>
      <stop offset="1" stop-color="#0b0812"/>
    </linearGradient>
  </defs>
  <rect x="2.5" y="2" width="27" height="28" rx="4" fill="url(#g)" stroke="${accent}" stroke-width="1.4"/>
  <rect x="2.5" y="2" width="27" height="28" rx="4" fill="${accent}" fill-opacity="0.1"/>
  <path d="M12.6 2.1 h6.8 l-3.4 2.7 z" fill="${accent}" opacity="0.9"/>
  ${inner}
</svg>
`;
}

function textGlyph(accent, glyph, fs) {
  const t = lighten(accent, 0.42);
  return `<text x="16" y="21.4" text-anchor="middle" font-family="'Arial Black', 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${fs}" letter-spacing="0.2" fill="${t}">${esc(glyph)}</text>`;
}

// Drawn symbols (accent already lightened) — clearer than tiny text at 16px.
const SYMBOLS = {
  image: (c) =>
    `<rect x="8.5" y="10" width="15" height="12" rx="1.6" fill="none" stroke="${c}" stroke-width="1.6"/>
     <circle cx="13" cy="14.5" r="1.7" fill="${c}"/>
     <path d="M9.5 21 l4.5-4.5 3 3 3.5-3.5 3 3" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`,
  lock: (c) =>
    `<rect x="9.5" y="15" width="13" height="9.5" rx="1.6" fill="${c}" fill-opacity="0.16" stroke="${c}" stroke-width="1.6"/>
     <path d="M12 15 v-2.6 a4 4 0 0 1 8 0 V15" fill="none" stroke="${c}" stroke-width="1.6"/>
     <circle cx="16" cy="19.4" r="1.5" fill="${c}"/>`,
  git: (c) =>
    `<g fill="${c}"><circle cx="12" cy="10" r="2.1"/><circle cx="12" cy="22" r="2.1"/><circle cx="21" cy="14" r="2.1"/></g>
     <path d="M12 12 V20" stroke="${c}" stroke-width="1.7" fill="none"/>
     <path d="M12 16 C15.5 16 18.5 16 20 14.6" stroke="${c}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,
  docker: (c) =>
    `<g fill="${c}"><rect x="10" y="14" width="3.2" height="3.2"/><rect x="14" y="14" width="3.2" height="3.2"/><rect x="18" y="14" width="3.2" height="3.2"/><rect x="14" y="10" width="3.2" height="3.2"/></g>
     <path d="M7.5 18 h17 a4.5 4.5 0 0 1-4.5 4.5 H12 A4.5 4.5 0 0 1 7.5 18z" fill="${c}" opacity="0.55"/>`,
  text: (c) =>
    `<g stroke="${c}" stroke-width="1.7" stroke-linecap="round">
       <path d="M10 12 h12"/><path d="M10 16 h12"/><path d="M10 20 h8"/></g>`,
  table: (c) =>
    `<rect x="8.5" y="10" width="15" height="12" rx="1.4" fill="none" stroke="${c}" stroke-width="1.5"/>
     <path d="M8.5 14 h15 M8.5 18 h15 M13.5 10 v12 M18.5 10 v12" stroke="${c}" stroke-width="1.1" opacity="0.85"/>`,
  seal: (c) =>
    `<circle cx="16" cy="16.5" r="6.2" fill="${c}" fill-opacity="0.15" stroke="${c}" stroke-width="1.5"/>
     <path d="M16 12.5 v8 M12.4 16.5 h7.2" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/>`,
};

// id, glyph text (or symbol key), accent colour, optional font size.
const ICONS = [
  { id: 'js', glyph: 'JS', color: '#e0b83a' },
  { id: 'ts', glyph: 'TS', color: '#4a90d8' },
  { id: 'jsx', glyph: 'JX', color: '#e0b83a' },
  { id: 'tsx', glyph: 'TX', color: '#4a90d8' },
  { id: 'json', glyph: '{ }', color: '#4aa886', fs: 13 },
  { id: 'yaml', glyph: 'YM', color: '#9a80d0' },
  { id: 'sql', glyph: 'SQ', color: '#40b8c8' },
  { id: 'toml', glyph: 'TM', color: '#b8a878' },
  { id: 'config', glyph: '⚙', color: '#bcac78', fs: 17 },
  { id: 'md', glyph: 'MD', color: '#cab89a' },
  { id: 'html', glyph: '<>', color: '#d07a34', fs: 14 },
  { id: 'css', glyph: 'CS', color: '#5a94d8' },
  { id: 'scss', glyph: 'SC', color: '#d05a94' },
  { id: 'py', glyph: 'PY', color: '#e0cc4a' },
  { id: 'rust', glyph: 'RS', color: '#cc6a40' },
  { id: 'go', glyph: 'GO', color: '#50c8d8' },
  { id: 'shell', glyph: '>_', color: '#5ec87e', fs: 14 },
  { id: 'xml', glyph: 'X/', color: '#a080a8' },
  // ── New types ────────────────────────────────────────────────
  { id: 'java', glyph: 'JV', color: '#d0783a' },
  { id: 'c', glyph: 'C', color: '#6a90c8', fs: 17 },
  { id: 'cpp', glyph: 'C+', color: '#7a86d0', fs: 14 },
  { id: 'csharp', glyph: 'C#', color: '#6aa86a', fs: 14 },
  { id: 'php', glyph: 'PH', color: '#8a80c8' },
  { id: 'ruby', glyph: 'RB', color: '#cc4a4a' },
  { id: 'kotlin', glyph: 'KT', color: '#b07ad0' },
  { id: 'swift', glyph: 'SW', color: '#d08a3a' },
  { id: 'vue', glyph: 'VU', color: '#5aa86a' },
  { id: 'file', glyph: '✚', color: '#9a8878', fs: 15 }, // default
  // ── Symbol-based (drawn) ─────────────────────────────────────
  { id: 'image', symbol: 'image', color: '#9a80d0' },
  { id: 'lock', symbol: 'lock', color: '#bcac78' },
  { id: 'git', symbol: 'git', color: '#d06a40' },
  { id: 'docker', symbol: 'docker', color: '#4a90d8' },
  { id: 'text', symbol: 'text', color: '#a8a090' },
  { id: 'csv', symbol: 'table', color: '#5ca86a' },
  { id: 'license', symbol: 'seal', color: '#c9a84c' },
];

for (const { id, glyph, symbol, color, fs } of ICONS) {
  const inner = symbol
    ? SYMBOLS[symbol](lighten(color, 0.35))
    : textGlyph(color, glyph, fs ?? 13);
  writeFileSync(join(OUT, `${id}.svg`), slate(color, inner));
}

// ── Folder icons (distinct silhouette, gold Imperial trim) ──────────────────
const GOLD = '#c9a84c';
function folder(open) {
  const body = open
    ? `<path d="M4 9 h7.2 l2.3 2.5 H27.5 l-2.4 12.6 a1.6 1.6 0 0 1-1.57 1.3 H5.4 A1.4 1.4 0 0 1 4 24 Z" fill="url(#fg)" stroke="${GOLD}" stroke-width="1.3"/>`
    : `<path d="M4 9 h7.2 l2.3 2.5 H28 v13.4 a1.6 1.6 0 0 1-1.6 1.6 H5.6 A1.6 1.6 0 0 1 4 24.9 Z" fill="url(#fg)" stroke="${GOLD}" stroke-width="1.3"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#241a10"/>
      <stop offset="1" stop-color="#0f0b06"/>
    </linearGradient>
  </defs>
  ${body}
  <text x="16" y="21.5" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="9" fill="${GOLD}" opacity="0.8">✚</text>
</svg>
`;
}
writeFileSync(join(OUT, 'folder.svg'), folder(false));
writeFileSync(join(OUT, 'folder-open.svg'), folder(true));

// ── Icon-theme manifest ─────────────────────────────────────────────────────
const iconDefinitions = {
  _file: { iconPath: './file.svg' },
  _folder: { iconPath: './folder.svg' },
  _folderOpen: { iconPath: './folder-open.svg' },
};
for (const { id } of ICONS) iconDefinitions[id] = { iconPath: `./${id}.svg` };

const fileExtensions = {
  js: 'js', mjs: 'js', cjs: 'js',
  ts: 'ts', mts: 'ts', cts: 'ts',
  jsx: 'jsx', tsx: 'tsx',
  json: 'json', jsonc: 'json', json5: 'json',
  yaml: 'yaml', yml: 'yaml',
  sql: 'sql',
  toml: 'toml',
  ini: 'config', conf: 'config', cfg: 'config', env: 'config', properties: 'config',
  md: 'md', markdown: 'md', mdx: 'md',
  html: 'html', htm: 'html',
  css: 'css', less: 'css',
  scss: 'scss', sass: 'scss',
  py: 'py', pyi: 'py',
  rs: 'rust',
  go: 'go',
  sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell',
  xml: 'xml',
  java: 'java', jar: 'java',
  c: 'c', h: 'c',
  cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp', hxx: 'cpp',
  cs: 'csharp',
  php: 'php',
  rb: 'ruby',
  kt: 'kotlin', kts: 'kotlin',
  swift: 'swift',
  vue: 'vue',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  ico: 'image', bmp: 'image', svg: 'image',
  txt: 'text', log: 'text', rtf: 'text',
  csv: 'csv', tsv: 'csv',
  lock: 'lock',
};

const fileNames = {
  '.gitignore': 'git', '.gitattributes': 'git', '.gitmodules': 'git',
  '.editorconfig': 'config', '.env': 'config', '.env.local': 'config',
  '.eslintrc': 'config', '.eslintrc.json': 'config', '.prettierrc': 'config',
  dockerfile: 'docker', '.dockerignore': 'docker', 'docker-compose.yml': 'docker',
  makefile: 'config',
  license: 'license', 'license.md': 'license', 'license.txt': 'license',
  'package.json': 'json', 'tsconfig.json': 'json',
  'package-lock.json': 'lock', 'yarn.lock': 'lock', 'pnpm-lock.yaml': 'lock',
  'cargo.toml': 'toml', 'cargo.lock': 'lock',
  'readme.md': 'md',
};

const manifest = {
  information_for_contributors:
    'Warhammer 40k: Grimdark Sigils — generated by scripts/generate-icons.mjs',
  iconDefinitions,
  file: '_file',
  folder: '_folder',
  folderExpanded: '_folderOpen',
  fileExtensions,
  fileNames,
};

writeFileSync(
  join(OUT, 'warhammer-icon-theme.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

console.log(`Wrote ${ICONS.length + 2} SVG icons + manifest to icons/`);
