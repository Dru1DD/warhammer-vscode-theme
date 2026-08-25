/**
 * Librarium webview markup.
 *
 * Rendering choice: a hand-written canvas renderer instead of Cytoscape / D3 /
 * React Flow. The project builds with plain `tsc` and ships zero runtime
 * dependencies, so vendoring a graph library would mean adding a bundler step
 * and a ~1MB asset to satisfy the webview CSP. Canvas also degrades better at
 * scale than SVG/DOM renderers — a few thousand nodes stay at 60fps because
 * nothing is retained in the DOM. The layouts implemented here (layered
 * Sugiyama-style, tidy tree, force, radial) cover the three graph modes; if the
 * feature ever needs orthogonal edge routing or clustering, that is the moment
 * to reconsider ELK.
 *
 * Everything is inlined under a nonce-based CSP: no external origins, no
 * `unsafe-inline`, no filesystem access from the webview.
 */

import type { LibrariumTheme } from './theme';

export function renderLibrariumHtml(nonce: string, theme: LibrariumTheme): string {
  const vars = Object.entries(theme.variables)
    .map(([key, value]) => `    ${key}: ${value};`)
    .join('\n');

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy"
  content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src data:; font-src 'none';">
<title>Librarium</title>
<!--
  Dynamic styles go through this nonced stylesheet. A strict CSP (style-src with
  a nonce and no 'unsafe-inline') blocks writes to element.style, so tooltip
  positioning and live theme swaps must be done as rules, not inline styles.
-->
<style nonce="${nonce}" id="dynamic-style"></style>
<style nonce="${nonce}">
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
${vars}
    --librarium-font: ui-sans-serif, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --librarium-mono: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, monospace;
  }

  html, body {
    height: 100%;
    background: var(--librarium-background);
    color: var(--librarium-text);
    font-family: var(--librarium-font);
    font-size: 13px;
    overflow: hidden;
  }

  .shell { display: flex; flex-direction: column; height: 100vh; }

  /* ── header ─────────────────────────────────────────────────────────────── */
  header {
    display: flex; align-items: baseline; gap: 18px;
    padding: 16px 22px 14px;
    border-bottom: 1px solid var(--librarium-border);
    background: var(--librarium-surface);
  }
  .wordmark { font-size: 15px; letter-spacing: 0.30em; text-transform: uppercase; font-weight: 500; }
  .wordmark .mark { color: var(--librarium-accent); margin-right: 10px; }
  .subtitle {
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--librarium-muted);
  }
  .counts { margin-left: auto; font-size: 11px; color: var(--librarium-muted); font-variant-numeric: tabular-nums; }
  .counts b { color: var(--librarium-text); font-weight: 500; }
  .faction-tag {
    font-size: 9px; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--librarium-accent); opacity: 0.75;
  }

  /* ── toolbar ────────────────────────────────────────────────────────────── */
  .toolbar {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 9px 22px;
    border-bottom: 1px solid var(--librarium-border);
    background: var(--librarium-surface);
  }
  .segmented { display: flex; border: 1px solid var(--librarium-border); border-radius: 6px; overflow: hidden; }
  .segmented button {
    background: transparent; border: 0; color: var(--librarium-muted);
    font-family: inherit; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
    padding: 6px 13px; cursor: pointer;
  }
  .segmented button + button { border-left: 1px solid var(--librarium-border); }
  .segmented button:hover { color: var(--librarium-text); }
  .segmented button[aria-pressed="true"] {
    background: var(--librarium-accent-soft); color: var(--librarium-accent);
  }

  .search-wrap { position: relative; flex: 1 1 220px; max-width: 340px; }
  #search {
    width: 100%; padding: 7px 10px 7px 30px;
    background: var(--librarium-background);
    border: 1px solid var(--librarium-border);
    border-radius: 6px; color: var(--librarium-text);
    font-family: inherit; font-size: 12px;
  }
  #search:focus { outline: none; border-color: var(--librarium-border-strong); }
  #search::placeholder { color: var(--librarium-muted); }
  .search-icon { position: absolute; left: 10px; top: 7px; color: var(--librarium-muted); font-size: 12px; }
  .results {
    position: absolute; top: 36px; left: 0; right: 0; z-index: 20;
    max-height: 300px; overflow-y: auto;
    background: var(--librarium-surface-raised);
    border: 1px solid var(--librarium-border-strong); border-radius: 6px;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    display: none;
  }
  .results.open { display: block; }
  .result {
    padding: 7px 11px; cursor: pointer; display: flex; gap: 9px; align-items: baseline;
    border-bottom: 1px solid var(--librarium-border);
  }
  .result:last-child { border-bottom: 0; }
  .result:hover, .result.active { background: var(--librarium-accent-soft); }
  .result .name { font-size: 12px; }
  .result .kind {
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--librarium-accent);
  }
  .result .path { margin-left: auto; font-size: 10px; color: var(--librarium-muted); font-family: var(--librarium-mono); }

  select, .ghost-btn {
    background: var(--librarium-background); color: var(--librarium-text);
    border: 1px solid var(--librarium-border); border-radius: 6px;
    font-family: inherit; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 6px 10px; cursor: pointer;
  }
  .ghost-btn:hover { border-color: var(--librarium-border-strong); color: var(--librarium-accent); }
  .ghost-btn[aria-pressed="true"] { background: var(--librarium-accent-soft); color: var(--librarium-accent); }

  .filters { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .chip {
    font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 9px; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--librarium-border); color: var(--librarium-muted);
    background: transparent; font-family: inherit;
  }
  .chip[aria-pressed="true"] {
    border-color: var(--librarium-border-strong);
    color: var(--librarium-accent); background: var(--librarium-accent-soft);
  }
  .filter-label {
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--librarium-muted); margin-right: 2px;
  }

  /* ── body ───────────────────────────────────────────────────────────────── */
  .body { display: flex; flex: 1; min-height: 0; }

  aside {
    width: 236px; flex-shrink: 0; overflow-y: auto;
    border-right: 1px solid var(--librarium-border);
    background: var(--librarium-surface);
    padding: 16px 0 24px;
  }
  aside h3 {
    font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--librarium-muted); font-weight: 500;
    padding: 0 16px; margin: 18px 0 8px;
  }
  aside h3:first-child { margin-top: 0; }
  .metric { display: flex; justify-content: space-between; padding: 3px 16px; font-size: 11.5px; }
  .metric span:first-child { color: var(--librarium-muted); }
  .metric span:last-child { font-variant-numeric: tabular-nums; }
  .list-item {
    display: flex; align-items: baseline; gap: 8px;
    padding: 5px 16px; cursor: pointer; font-size: 11.5px;
  }
  .list-item:hover { background: var(--librarium-accent-soft); }
  .list-item .meta { margin-left: auto; color: var(--librarium-muted); font-size: 10px; font-variant-numeric: tabular-nums; }
  .list-item .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .empty-note { padding: 2px 16px 6px; font-size: 11px; color: var(--librarium-muted); }

  .heresy {
    margin: 0 12px 6px; padding: 9px 11px;
    border: 1px solid var(--librarium-warning); border-radius: 6px;
    background: color-mix(in srgb, var(--librarium-warning) 10%, transparent);
    cursor: pointer;
  }
  .heresy .title {
    font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--librarium-warning); margin-bottom: 5px;
  }
  .heresy .ring { font-family: var(--librarium-mono); font-size: 10.5px; line-height: 1.65; word-break: break-all; }

  .canvas-wrap { position: relative; flex: 1; min-width: 0; }
  canvas { display: block; width: 100%; height: 100%; cursor: grab; }
  canvas.dragging { cursor: grabbing; }
  canvas.pointing { cursor: pointer; }

  .overlay {
    position: absolute; inset: 0; display: none;
    align-items: center; justify-content: center; text-align: center;
    background: var(--librarium-background); padding: 40px;
  }
  .overlay.show { display: flex; }
  .overlay .inner { max-width: 420px; }
  .overlay h2 {
    font-size: 13px; letter-spacing: 0.28em; text-transform: uppercase;
    font-weight: 500; margin-bottom: 14px;
  }
  .overlay p { color: var(--librarium-muted); font-size: 12.5px; line-height: 1.85; }
  .overlay code {
    font-family: var(--librarium-mono); color: var(--librarium-accent); font-size: 12px;
  }

  .hint {
    position: absolute; left: 14px; bottom: 12px;
    font-size: 10px; color: var(--librarium-muted); letter-spacing: 0.06em;
    pointer-events: none; user-select: none;
  }

  /* Status strip: the answer to "where am I and what am I looking at". */
  .statusbar {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 22px;
    border-bottom: 1px solid var(--librarium-border);
    background: var(--librarium-background);
    font-size: 10.5px; color: var(--librarium-muted);
  }
  .crumb { display: flex; align-items: center; gap: 7px; }
  .crumb b {
    color: var(--librarium-accent); font-weight: 500;
    letter-spacing: 0.16em; text-transform: uppercase; font-size: 9.5px;
  }
  .crumb .sep { opacity: 0.4; }
  .crumb .where { font-family: var(--librarium-mono); color: var(--librarium-text); }
  .status-note { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .pill {
    border: 1px solid var(--librarium-border); border-radius: 999px;
    padding: 2px 9px; font-size: 9.5px; cursor: pointer;
    background: transparent; color: var(--librarium-muted); font-family: inherit;
  }
  .pill:hover { color: var(--librarium-accent); border-color: var(--librarium-border-strong); }
  .pill.warn { color: var(--librarium-warning); border-color: var(--librarium-warning); cursor: default; }

  /* Hover tooltip — the graph stays readable when labels are zoomed out. */
  .tooltip {
    position: absolute; z-index: 30; pointer-events: none;
    display: none; max-width: 320px;
    padding: 7px 10px; border-radius: 6px;
    background: var(--librarium-surface-raised);
    border: 1px solid var(--librarium-border-strong);
    box-shadow: 0 10px 26px rgba(0,0,0,0.4);
  }
  .tooltip.show { display: block; }
  .tooltip .t-name { font-size: 12px; color: var(--librarium-text); }
  .tooltip .t-path {
    font-family: var(--librarium-mono); font-size: 10px;
    color: var(--librarium-muted); word-break: break-all; margin-top: 2px;
  }
  .tooltip .t-meta {
    font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--librarium-accent); margin-top: 4px;
  }

  .minimap {
    position: absolute; right: 12px; top: 12px; z-index: 15;
    width: 190px; height: 130px; cursor: crosshair;
    border: 1px solid var(--librarium-border);
    border-radius: 6px;
    background: var(--librarium-surface);
    opacity: 0.92;
  }
  .minimap:hover { opacity: 1; border-color: var(--librarium-border-strong); }

  .zoom-controls {
    position: absolute; right: 12px; top: 154px; z-index: 15;
    display: flex; flex-direction: column; gap: 4px;
  }
  .zoom-controls button {
    width: 28px; height: 28px; cursor: pointer;
    background: var(--librarium-surface); color: var(--librarium-text);
    border: 1px solid var(--librarium-border); border-radius: 6px;
    font-family: inherit; font-size: 14px; line-height: 1;
  }
  .zoom-controls button:hover { border-color: var(--librarium-border-strong); color: var(--librarium-accent); }

  .legend {
    position: absolute; left: 14px; bottom: 30px; z-index: 15;
    display: flex; gap: 12px; flex-wrap: wrap;
    font-size: 9.5px; color: var(--librarium-muted);
    pointer-events: none; user-select: none;
  }
  .legend span { display: flex; align-items: center; gap: 5px; }
  .legend i { width: 16px; height: 0; border-top: 1px solid var(--librarium-edge); display: inline-block; }
  .legend i.solid { border-top-color: var(--librarium-edge-active); }
  .legend i.dashed { border-top-style: dashed; }
  .legend i.node {
    height: 9px; width: 12px; border: 1px solid var(--librarium-gold); border-radius: 2px;
  }
  .truncation {
    position: absolute; right: 14px; bottom: 12px;
    font-size: 10px; color: var(--librarium-warning);
    pointer-events: none;
  }

  /* ── info panel ─────────────────────────────────────────────────────────── */
  .info {
    width: 300px; flex-shrink: 0; overflow-y: auto;
    border-left: 1px solid var(--librarium-border);
    background: var(--librarium-surface);
    padding: 18px 18px 28px;
    display: none;
  }
  .info.open { display: block; }
  .info .kind-line {
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--librarium-accent); margin-bottom: 6px;
  }
  .info h2 { font-size: 15px; font-weight: 500; word-break: break-word; margin-bottom: 4px; }
  .info .path {
    font-family: var(--librarium-mono); font-size: 10.5px;
    color: var(--librarium-muted); word-break: break-all; margin-bottom: 14px;
  }
  .info-section { margin-top: 16px; }
  .info-section h4 {
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--librarium-muted); font-weight: 500; margin-bottom: 6px;
    padding-bottom: 5px; border-bottom: 1px solid var(--librarium-border);
  }
  .info-row {
    display: flex; gap: 8px; align-items: baseline;
    padding: 3px 0; font-size: 11.5px; cursor: pointer;
  }
  .info-row:hover .label { color: var(--librarium-accent); }
  .info-row .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .info-row .tag { font-size: 9px; color: var(--librarium-muted); letter-spacing: 0.1em; text-transform: uppercase; }
  .info-row.nested {
    padding-left: 14px; font-size: 11px; color: var(--librarium-muted);
    border-left: 1px solid var(--librarium-border); margin-left: 3px;
  }
  .info-section .pill { margin-top: 8px; }
  .info-actions { display: flex; gap: 8px; margin-top: 18px; }
  .primary-btn {
    flex: 1; padding: 8px 12px; cursor: pointer;
    background: var(--librarium-accent-soft);
    border: 1px solid var(--librarium-border-strong);
    color: var(--librarium-accent); border-radius: 6px;
    font-family: inherit; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
  }
  .primary-btn:hover { background: var(--librarium-accent); color: var(--librarium-background); }
</style>
</head>
<body>
<div class="shell">
  <header>
    <div>
      <div class="wordmark"><span class="mark">&#10010;</span>Librarium</div>
      <div class="subtitle">Project Knowledge Index</div>
    </div>
    <div class="faction-tag">${theme.factionTag}</div>
    <div class="counts" id="counts">Awaiting records...</div>
  </header>

  <div class="toolbar">
    <div class="segmented" role="group" aria-label="Graph level">
      <button data-mode="architecture" aria-pressed="true">Architecture</button>
      <button data-mode="files" aria-pressed="false">Files</button>
      <button data-mode="entities" aria-pressed="false">Entities</button>
    </div>

    <div class="search-wrap">
      <span class="search-icon">&#9906;</span>
      <input id="search" type="text" placeholder="Search Librarium..." autocomplete="off" spellcheck="false">
      <div class="results" id="results"></div>
    </div>

    <select id="layout" title="Layout">
      <option value="auto">Auto</option>
      <option value="clustered">Clustered</option>
      <option value="hierarchical">Hierarchical</option>
      <option value="force">Force</option>
      <option value="radial">Radial</option>
    </select>

    <button class="ghost-btn" id="focus-btn" aria-pressed="false" title="Collapse to the selection and its direct relations">Focus</button>
    <button class="ghost-btn" id="fit-btn" title="Fit graph to view">Fit</button>
    <button class="ghost-btn" id="refresh-btn" title="Re-index the workspace">Refresh</button>

    <div class="filters" id="node-filters"><span class="filter-label">Show</span></div>
    <div class="filters" id="edge-filters"><span class="filter-label">Links</span></div>
  </div>

  <div class="statusbar">
    <div class="crumb" id="crumb"></div>
    <div class="status-note" id="status-note"></div>
  </div>

  <div class="body">
    <aside id="sidebar"></aside>

    <div class="canvas-wrap">
      <canvas id="graph"></canvas>
      <canvas class="minimap" id="minimap" title="Click or drag to move the view"></canvas>
      <div class="zoom-controls">
        <button id="zoom-in" title="Zoom in">+</button>
        <button id="zoom-out" title="Zoom out">&minus;</button>
        <button id="zoom-reset" title="Reset view">&#8859;</button>
      </div>
      <div class="tooltip" id="tooltip"></div>
      <div class="legend">
        <span><i class="solid"></i> depends on</span>
        <span><i class="dashed"></i> contains</span>
        <span><i class="node"></i> active editor file</span>
      </div>
      <div class="hint">Scroll to zoom &middot; drag to pan &middot; click to inspect &middot; double-click a directory or file to expand it &middot; Alt+double-click opens the source</div>
      <div class="truncation" id="truncation"></div>
      <div class="overlay show" id="overlay">
        <div class="inner">
          <h2>Librarium</h2>
          <p id="overlay-text">Consulting the archive...</p>
        </div>
      </div>
    </div>

    <div class="info" id="info"></div>
  </div>
</div>

<script nonce="${nonce}">
(function () {
  'use strict';
  var vscodeApi = acquireVsCodeApi();

  // ── state ─────────────────────────────────────────────────────────────────
  var state = {
    nodes: new Map(),        // id -> node (structural + any streamed entities)
    edges: [],
    workspace: null,
    metadata: null,
    hubs: [],
    cycles: [],
    recentChanges: [],
    mode: 'architecture',
    layout: 'auto',
    selectedId: null,
    focusMode: false,
    activeFile: null,
    expanded: new Set(),     // directory ids expanded in architecture mode
    expandedFiles: new Set(),// file paths whose declarations are drawn inline
    entityFilesLoaded: new Set(),
    hoverId: null,
    clusters: [],            // {label, x, y, w, h} drawn behind clustered layouts
    childrenOf: new Map(),
    descendants: new Map(),
    nodeFilters: new Set(),  // empty = all
    edgeFilters: new Set(),
    positions: new Map(),    // id -> {x, y}
    view: { x: 0, y: 0, k: 1 },
    layoutKey: '',
    visible: [],
    visibleEdges: [],
    searchResults: [],
    searchIndex: -1
  };

  var MAX_RENDERED = 800;
  var NODE_W = 148, NODE_H = 30;
  var NODE_W_MIN = 92, NODE_W_MAX = 196;
  var LABEL_ZOOM = 0.45;

  /**
   * Node width follows its label. Fixed-width boxes wasted a third of the
   * canvas on short names, which pushed the whole graph below the zoom level
   * where labels are readable.
   */
  function widthOf(node) {
    if (!node || !node.name) return NODE_W;
    if (node._w) return node._w;
    ctx.font = '11.5px ' + css('--librarium-font');
    var text = ctx.measureText(node.name).width;
    var extra = (node.type === 'directory' || node.type === 'workspace') ? 34 : 0;
    node._w = Math.round(Math.max(NODE_W_MIN, Math.min(NODE_W_MAX, text + 40 + extra)));
    return node._w;
  }

  var NODE_FILTERS = [
    { id: 'file', label: 'Files' },
    { id: 'directory', label: 'Directories' },
    { id: 'component', label: 'Components' },
    { id: 'class', label: 'Classes' },
    { id: 'function', label: 'Functions' },
    { id: 'interface', label: 'Interfaces' },
    { id: 'type', label: 'Types' },
    { id: 'package', label: 'Packages' }
  ];
  var EDGE_FILTERS = [
    { id: 'imports', label: 'Imports' },
    { id: 'calls', label: 'Calls' },
    { id: 'extends', label: 'Extends' },
    { id: 'implements', label: 'Implements' },
    { id: 'renders', label: 'Renders' },
    { id: 'contains', label: 'Contains' },
    { id: 'dependsOn', label: 'External' }
  ];

  var el = {
    canvas: document.getElementById('graph'),
    counts: document.getElementById('counts'),
    sidebar: document.getElementById('sidebar'),
    info: document.getElementById('info'),
    overlay: document.getElementById('overlay'),
    overlayText: document.getElementById('overlay-text'),
    search: document.getElementById('search'),
    results: document.getElementById('results'),
    layout: document.getElementById('layout'),
    focusBtn: document.getElementById('focus-btn'),
    truncation: document.getElementById('truncation'),
    nodeFilters: document.getElementById('node-filters'),
    edgeFilters: document.getElementById('edge-filters'),
    minimap: document.getElementById('minimap'),
    tooltip: document.getElementById('tooltip'),
    crumb: document.getElementById('crumb'),
    statusNote: document.getElementById('status-note')
  };
  var ctx = el.canvas.getContext('2d');
  var miniCtx = el.minimap.getContext('2d');

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Writing to element.style is blocked by the webview CSP, so every dynamic
  // style is expressed as a rule inside one nonced stylesheet.
  var dynamicStyle = document.getElementById('dynamic-style');
  var dynamic = { themeVars: '', tooltip: '' };

  function flushDynamicStyle() {
    dynamicStyle.textContent =
      (dynamic.themeVars ? ':root {' + dynamic.themeVars + '}' : '') +
      (dynamic.tooltip ? '#tooltip {' + dynamic.tooltip + '}' : '');
  }

  function setThemeVariables(vars) {
    dynamic.themeVars = Object.keys(vars).map(function (key) {
      // Only our own token names and simple colour values ever land here.
      return key + ':' + String(vars[key]).replace(/[{}<>;]/g, '') + ';';
    }).join('');
    flushDynamicStyle();
  }

  function setTooltipPosition(x, y) {
    dynamic.tooltip = 'left:' + Math.round(x) + 'px;top:' + Math.round(y) + 'px;';
    flushDynamicStyle();
  }

  // ── helpers ───────────────────────────────────────────────────────────────
  function isEntity(type) {
    return type === 'class' || type === 'function' || type === 'interface' ||
           type === 'type' || type === 'component' || type === 'method';
  }

  function dirname(p) {
    var i = p.lastIndexOf('/');
    return i === -1 ? '' : p.slice(0, i);
  }

  function edgesFor(ids) {
    var set = ids instanceof Set ? ids : new Set(ids);
    return state.edges.filter(function (e) { return set.has(e.source) && set.has(e.target); });
  }

  function neighbours(id) {
    var out = new Set();
    for (var i = 0; i < state.edges.length; i++) {
      var e = state.edges[i];
      if (e.source === id) out.add(e.target);
      else if (e.target === id) out.add(e.source);
    }
    return out;
  }

  // ── containment index ─────────────────────────────────────────────────────
  /** Direct children and total descendant counts per container, built once. */
  function indexContainment() {
    state.childrenOf = new Map();
    state.descendants = new Map();
    state.edges.forEach(function (e) {
      if (e.type !== 'contains') return;
      if (!state.childrenOf.has(e.source)) state.childrenOf.set(e.source, []);
      state.childrenOf.get(e.source).push(e.target);
    });

    var self = function (id, seen) {
      if (state.descendants.has(id)) return state.descendants.get(id);
      if (seen.has(id)) return 0;
      seen.add(id);
      var total = 0;
      (state.childrenOf.get(id) || []).forEach(function (child) {
        var node = state.nodes.get(child);
        if (!node) return;
        if (node.type === 'file') total += 1;
        total += self(child, seen);
      });
      state.descendants.set(id, total);
      return total;
    };
    state.nodes.forEach(function (node) {
      if (node.type === 'directory' || node.type === 'workspace') self(node.id, new Set());
    });
  }

  /**
   * Opens directories breadth-first while the visible count stays inside a
   * readable budget. A small project ends up fully expanded; a large one stops
   * at the module level instead of dumping thousands of files on screen.
   */
  function autoExpand() {
    var BUDGET = 90;
    state.expanded = new Set(['ws']);
    var level = (state.childrenOf.get('ws') || []).slice();
    var shown = level.length + 1;

    // Whole levels, never a partial one: opening some sibling directories and
    // not others reads as arbitrary, and the point of this view is structure.
    while (level.length) {
      var dirs = level.filter(function (id) {
        var node = state.nodes.get(id);
        return node && node.type === 'directory' && (state.childrenOf.get(id) || []).length;
      });
      var cost = dirs.reduce(function (sum, id) {
        return sum + (state.childrenOf.get(id) || []).length;
      }, 0);
      if (!dirs.length || shown + cost > BUDGET) break;

      var next = [];
      dirs.forEach(function (id) {
        state.expanded.add(id);
        (state.childrenOf.get(id) || []).forEach(function (kid) { next.push(kid); });
      });
      shown += cost;
      level = next;
    }
  }

  // ── visibility: what each mode shows ──────────────────────────────────────
  function computeVisible() {
    var nodes = [];
    var i, node;
    var all = Array.from(state.nodes.values());

    // Declarations of files the user expanded are drawn inline, at every level.
    var inlineEntities = [];
    if (state.expandedFiles.size && state.mode !== 'entities') {
      for (i = 0; i < all.length; i++) {
        node = all[i];
        if (isEntity(node.type) && node.type !== 'method' && state.expandedFiles.has(node.filePath)) {
          inlineEntities.push(node);
        }
      }
    }

    if (state.mode === 'architecture') {
      // Directories are revealed level by level; a collapsed directory hides its
      // whole subtree, which is what keeps a 5,000-file repo readable.
      for (i = 0; i < all.length; i++) {
        node = all[i];
        if (node.type === 'workspace') { nodes.push(node); continue; }
        if (node.type === 'directory') {
          var parent = dirname(node.filePath);
          if (parent === '' || state.expanded.has('dir:' + parent)) nodes.push(node);
          continue;
        }
        if (node.type === 'file') {
          var fileDir = dirname(node.filePath);
          if (fileDir === '') { nodes.push(node); continue; }
          if (state.expanded.has('dir:' + fileDir)) nodes.push(node);
        }
      }
    } else if (state.mode === 'files') {
      for (i = 0; i < all.length; i++) {
        node = all[i];
        if (node.type === 'file' || node.type === 'package') nodes.push(node);
      }
    } else {
      for (i = 0; i < all.length; i++) {
        node = all[i];
        if (isEntity(node.type) && node.type !== 'method') nodes.push(node);
      }
    }

    if (inlineEntities.length) nodes = nodes.concat(inlineEntities);

    if (state.nodeFilters.size) {
      nodes = nodes.filter(function (n) {
        return n.type === 'workspace' || state.nodeFilters.has(n.type);
      });
    }

    if (state.focusMode && state.selectedId) {
      var keep = neighbours(state.selectedId);
      keep.add(state.selectedId);
      nodes = nodes.filter(function (n) { return keep.has(n.id); });
    }

    var truncated = false;
    if (nodes.length > MAX_RENDERED) {
      // Keep the most connected records: they carry the architecture.
      var degree = new Map();
      for (i = 0; i < state.edges.length; i++) {
        degree.set(state.edges[i].source, (degree.get(state.edges[i].source) || 0) + 1);
        degree.set(state.edges[i].target, (degree.get(state.edges[i].target) || 0) + 1);
      }
      nodes.sort(function (a, b) { return (degree.get(b.id) || 0) - (degree.get(a.id) || 0); });
      nodes = nodes.slice(0, MAX_RENDERED);
      truncated = true;
    }

    var ids = new Set(nodes.map(function (n) { return n.id; }));
    var edges = edgesFor(ids);
    if (state.mode !== 'architecture') {
      // Outside architecture mode the only useful containment is the link from
      // an expanded file to the declarations inside it.
      edges = edges.filter(function (e) {
        if (e.type !== 'contains') return true;
        var target = state.nodes.get(e.target);
        return !!target && isEntity(target.type);
      });
    }
    if (state.edgeFilters.size) {
      edges = edges.filter(function (e) { return state.edgeFilters.has(e.type); });
    }

    state.visible = nodes;
    state.visibleEdges = edges;
    el.truncation.innerHTML = truncated
      ? 'Showing the ' + MAX_RENDERED + ' most connected records &mdash; narrow with search, filters or Focus'
      : '';
  }

  // ── layouts ───────────────────────────────────────────────────────────────
  /** Widest label in a set, so grid columns never overlap. */
  function widestOf(nodes) {
    var max = NODE_W_MIN;
    for (var i = 0; i < nodes.length; i++) max = Math.max(max, widthOf(nodes[i]));
    return max;
  }
  function effectiveLayout() {
    if (state.layout !== 'auto') return state.layout;
    if (state.mode === 'architecture') return 'hierarchical';
    // A few hundred files in one layered graph is the hairball this feature
    // exists to avoid: group them by directory instead.
    if (state.mode === 'files') return state.visible.length > 60 ? 'clustered' : 'hierarchical';
    return state.visible.length > 60 ? 'clustered' : 'force';
  }

  function layoutTree(nodes, edges) {
    // Tidy tree over 'contains': depth sets the row, subtrees are packed left to
    // right. Wide leaf sets (a directory holding 200 files) are packed into a
    // grid instead of one endless row, which is what made large workspaces
    // render as a single unreadable line.
    var children = new Map();
    var hasParent = new Set();
    var byId = new Map();
    nodes.forEach(function (n) { byId.set(n.id, n); });

    edges.forEach(function (e) {
      if (e.type !== 'contains') return;
      if (!children.has(e.source)) children.set(e.source, []);
      children.get(e.source).push(e.target);
      hasParent.add(e.target);
    });

    var positions = new Map();
    var rowGap = 96, colGap = widestOf(nodes) + 26, leafRowGap = NODE_H + 16;
    var cursor = 0;

    function isLeaf(id) {
      var kids = (children.get(id) || []).filter(function (k) { return byId.has(k); });
      return kids.length === 0;
    }

    function place(id, depth, seen) {
      if (seen.has(id)) return null;
      seen.add(id);

      var kids = (children.get(id) || []).filter(function (k) { return byId.has(k) && !seen.has(k); });
      if (!kids.length) {
        var x = cursor * colGap;
        cursor++;
        positions.set(id, { x: x, y: depth * rowGap });
        return x;
      }

      var leafKids = kids.filter(isLeaf);
      var branchKids = kids.filter(function (k) { return !isLeaf(k); });
      var xs = [];

      // Grid-pack a wide run of leaves under their parent.
      if (leafKids.length > 4) {
        // Squarer blocks keep the tree from stretching into an unreadable strip.
        var cols = Math.max(3, Math.ceil(Math.sqrt(leafKids.length * 1.2)));
        var startCol = cursor;
        leafKids.forEach(function (kid, i) {
          seen.add(kid);
          positions.set(kid, {
            x: (startCol + (i % cols)) * colGap,
            y: depth * rowGap + rowGap + Math.floor(i / cols) * leafRowGap
          });
        });
        cursor = startCol + cols;
        xs.push((startCol) * colGap, (startCol + cols - 1) * colGap);
      } else {
        leafKids.forEach(function (kid) {
          var kx = place(kid, depth + 1, seen);
          if (kx !== null) xs.push(kx);
        });
      }

      branchKids.forEach(function (kid) {
        var kx = place(kid, depth + 1, seen);
        if (kx !== null) xs.push(kx);
      });

      var mid = xs.length ? (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2 : cursor * colGap;
      if (!xs.length) cursor++;
      positions.set(id, { x: mid, y: depth * rowGap });
      return mid;
    }

    var roots = nodes.filter(function (n) { return !hasParent.has(n.id); })
                     .map(function (n) { return n.id; });
    var seen = new Set();
    roots.forEach(function (r) { place(r, 0, seen); });

    // Orphans (their parent was filtered out) get their own row rather than
    // piling up at the origin.
    nodes.forEach(function (n) {
      if (!positions.has(n.id)) {
        positions.set(n.id, { x: cursor * colGap, y: 0 });
        cursor++;
      }
    });
    return positions;
  }

  function layoutLayered(nodes, edges) {
    // Sugiyama-lite: longest-path layering, then barycenter ordering sweeps.
    var byId = new Map();
    nodes.forEach(function (n) { byId.set(n.id, n); });
    var outgoing = new Map(), incoming = new Map();
    nodes.forEach(function (n) { outgoing.set(n.id, []); incoming.set(n.id, []); });
    edges.forEach(function (e) {
      if (!byId.has(e.source) || !byId.has(e.target) || e.source === e.target) return;
      outgoing.get(e.source).push(e.target);
      incoming.get(e.target).push(e.source);
    });

    var layer = new Map();
    var order = [], temp = new Set(), done = new Set();
    function visit(id) {
      if (done.has(id) || temp.has(id)) return; // cycles: first pass wins
      temp.add(id);
      outgoing.get(id).forEach(visit);
      temp.delete(id);
      done.add(id);
      order.push(id);
    }
    nodes.forEach(function (n) { visit(n.id); });
    order.forEach(function (id) {
      var deps = outgoing.get(id);
      var max = -1;
      for (var i = 0; i < deps.length; i++) {
        var l = layer.get(deps[i]);
        if (l !== undefined && l > max) max = l;
      }
      layer.set(id, max + 1);
    });

    var layers = [];
    nodes.forEach(function (n) {
      var l = layer.get(n.id) || 0;
      if (!layers[l]) layers[l] = [];
      layers[l].push(n.id);
    });

    for (var sweep = 0; sweep < 3; sweep++) {
      for (var l = 1; l < layers.length; l++) {
        var below = layers[l - 1] || [];
        var index = new Map();
        below.forEach(function (id, i) { index.set(id, i); });
        layers[l].sort(function (a, b) {
          return barycenter(a, index, outgoing) - barycenter(b, index, outgoing);
        });
      }
    }

    function barycenter(id, index, adjacency) {
      var list = adjacency.get(id) || [];
      var sum = 0, count = 0;
      for (var i = 0; i < list.length; i++) {
        var pos = index.get(list[i]);
        if (pos !== undefined) { sum += pos; count++; }
      }
      return count ? sum / count : 1e9;
    }

    var positions = new Map();
    var rowGap = 108, colGap = widestOf(nodes) + 30;
    // A layer wider than this wraps onto sub-rows; without the wrap, a layer
    // holding 200 files drew them all on one line and they overlapped.
    var perRow = Math.max(6, Math.ceil(Math.sqrt(nodes.length) * 1.6));
    var y = 0;
    for (var li = 0; li < layers.length; li++) {
      var row = layers[li] || [];
      var subRows = Math.ceil(row.length / perRow) || 1;
      for (var ci = 0; ci < row.length; ci++) {
        var sub = Math.floor(ci / perRow);
        var inRow = ci % perRow;
        var width = Math.min(perRow, row.length - sub * perRow);
        var offset = -((width - 1) * colGap) / 2;
        positions.set(row[ci], { x: offset + inRow * colGap, y: y + sub * (NODE_H + 26) });
      }
      y -= rowGap + (subRows - 1) * (NODE_H + 26);
    }
    return positions;
  }

  /**
   * Groups records by their directory and lays each group out as a compact
   * block. Reading a large repository is a matter of "which module is this in",
   * so the layout answers that first and the edges second.
   */
  function layoutClustered(nodes, edges) {
    var groups = new Map();
    nodes.forEach(function (node) {
      var key = node.type === 'package'
        ? 'external packages'
        : (dirname(node.filePath) || (node.type === 'directory' ? '' : 'root'));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(node);
    });

    // Busiest groups first so the eye lands on the important modules.
    var ordered = Array.from(groups.entries()).sort(function (a, b) {
      return b[1].length - a[1].length || String(a[0]).localeCompare(String(b[0]));
    });

    var positions = new Map();
    var clusters = [];
    var colGap = NODE_W_MIN + 22, rowGap = NODE_H + 20;
    var padding = 26, groupGapX = 46, groupGapY = 60;
    var maxRowWidth = Math.max(1400, Math.sqrt(nodes.length) * 320);
    var cursorX = 0, cursorY = 0, rowHeight = 0;

    ordered.forEach(function (entry) {
      var label = entry[0];
      var members = entry[1];
      colGap = widestOf(members) + 22;
      var cols = Math.max(1, Math.ceil(Math.sqrt(members.length * 1.6)));
      var rows = Math.ceil(members.length / cols);
      var width = cols * colGap + padding * 2;
      var height = rows * rowGap + padding * 2 + 24;

      if (cursorX > 0 && cursorX + width > maxRowWidth) {
        cursorX = 0;
        cursorY += rowHeight + groupGapY;
        rowHeight = 0;
      }

      members.forEach(function (node, i) {
        positions.set(node.id, {
          x: cursorX + padding + (i % cols) * colGap + colGap / 2,
          y: cursorY + padding + 18 + Math.floor(i / cols) * rowGap + NODE_H / 2
        });
      });

      clusters.push({
        label: label === '' ? 'root' : label,
        count: members.length,
        x: cursorX, y: cursorY, w: width, h: height
      });

      cursorX += width + groupGapX;
      rowHeight = Math.max(rowHeight, height);
    });

    state.clusters = clusters;
    return positions;
  }

  function layoutForce(nodes, edges) {
    // Fixed-iteration Barnes-Hut-free simulation. Runs once, then renders a
    // static result: continuous animation costs battery and helps nobody read.
    var positions = new Map();
    var n = nodes.length || 1;
    var radius = Math.max(240, Math.sqrt(n) * 78);
    nodes.forEach(function (node, i) {
      var angle = (i / n) * Math.PI * 2;
      positions.set(node.id, {
        x: Math.cos(angle) * radius * (0.55 + ((i * 37) % 45) / 100),
        y: Math.sin(angle) * radius * (0.55 + ((i * 61) % 45) / 100),
        vx: 0, vy: 0
      });
    });

    var links = edges.filter(function (e) {
      return positions.has(e.source) && positions.has(e.target);
    });
    var iterations = n > 500 ? 120 : 260;
    var repulsion = 9000, spring = 0.012, damping = 0.85;
    var ideal = widestOf(nodes) + 24;

    for (var step = 0; step < iterations; step++) {
      for (var i = 0; i < nodes.length; i++) {
        var a = positions.get(nodes[i].id);
        for (var j = i + 1; j < nodes.length; j++) {
          var b = positions.get(nodes[j].id);
          var dx = a.x - b.x, dy = a.y - b.y;
          var d2 = dx * dx + dy * dy || 0.01;
          if (d2 > 640000) continue; // far pairs contribute nothing visible
          var f = repulsion / d2;
          var d = Math.sqrt(d2);
          var fx = (dx / d) * f, fy = (dy / d) * f;
          a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
        }
      }
      for (var k = 0; k < links.length; k++) {
        var s = positions.get(links[k].source), t = positions.get(links[k].target);
        var lx = t.x - s.x, ly = t.y - s.y;
        var dist = Math.sqrt(lx * lx + ly * ly) || 0.01;
        var force = (dist - ideal) * spring;
        var ux = (lx / dist) * force, uy = (ly / dist) * force;
        s.vx += ux; s.vy += uy; t.vx -= ux; t.vy -= uy;
      }
      positions.forEach(function (p) {
        p.vx *= damping; p.vy *= damping;
        p.x += Math.max(-30, Math.min(30, p.vx));
        p.y += Math.max(-30, Math.min(30, p.vy));
      });
    }
    return positions;
  }

  function layoutRadial(nodes, edges) {
    var center = state.selectedId && state.nodes.has(state.selectedId)
      ? state.selectedId
      : (nodes[0] && nodes[0].id);
    var adjacency = new Map();
    nodes.forEach(function (n) { adjacency.set(n.id, []); });
    edges.forEach(function (e) {
      if (!adjacency.has(e.source) || !adjacency.has(e.target)) return;
      adjacency.get(e.source).push(e.target);
      adjacency.get(e.target).push(e.source);
    });

    var depth = new Map([[center, 0]]);
    var queue = [center];
    while (queue.length) {
      var id = queue.shift();
      var d = depth.get(id);
      (adjacency.get(id) || []).forEach(function (next) {
        if (depth.has(next)) return;
        depth.set(next, d + 1);
        queue.push(next);
      });
    }

    var rings = new Map();
    nodes.forEach(function (n) {
      var d = depth.has(n.id) ? depth.get(n.id) : 99;
      if (!rings.has(d)) rings.set(d, []);
      rings.get(d).push(n.id);
    });

    var positions = new Map();
    rings.forEach(function (members, d) {
      var r = d === 0 ? 0 : 160 + d * 150;
      members.forEach(function (id, i) {
        var angle = (i / members.length) * Math.PI * 2;
        positions.set(id, { x: Math.cos(angle) * r, y: Math.sin(angle) * r });
      });
    });
    return positions;
  }

  function runLayout() {
    var key = state.mode + '|' + state.layout + '|' + state.visible.length + '|' +
      (state.focusMode ? state.selectedId : '') + '|' + state.expanded.size + '|' +
      state.expandedFiles.size + '|' + state.nodeFilters.size + '|' + state.edgeFilters.size;
    if (key === state.layoutKey) return;
    state.layoutKey = key;

    var kind = effectiveLayout();
    var positions;
    state.clusters = [];
    if (kind === 'clustered') {
      positions = layoutClustered(state.visible, state.visibleEdges);
    } else if (kind === 'hierarchical' && state.mode === 'architecture') {
      positions = layoutTree(state.visible, state.visibleEdges);
    } else if (kind === 'hierarchical') {
      positions = layoutLayered(state.visible, state.visibleEdges);
    } else if (kind === 'radial') {
      positions = layoutRadial(state.visible, state.visibleEdges);
    } else {
      positions = layoutForce(state.visible, state.visibleEdges);
    }
    state.positions = positions;
    fitToView();
  }

  // ── camera ────────────────────────────────────────────────────────────────
  function fitToView() {
    if (!state.visible.length) return;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.visible.forEach(function (n) {
      var p = state.positions.get(n.id);
      if (!p) return;
      var half = widthOf(n) / 2;
      minX = Math.min(minX, p.x - half);
      maxX = Math.max(maxX, p.x + half);
      minY = Math.min(minY, p.y - NODE_H / 2);
      maxY = Math.max(maxY, p.y + NODE_H / 2);
    });
    if (minX === Infinity) return;

    var w = el.canvas.clientWidth, h = el.canvas.clientHeight;
    var pad = 64;
    var k = Math.min((w - pad * 2) / (maxX - minX || 1), (h - pad * 2) / (maxY - minY || 1));
    // Never fit below the zoom at which labels render: a screen of unlabelled
    // boxes tells the user nothing. Past that point the minimap and panning are
    // the way around the graph.
    k = Math.max(LABEL_ZOOM, Math.min(1.6, k));
    state.view.k = k;
    state.view.x = w / 2 - ((minX + maxX) / 2) * k;
    state.view.y = h / 2 - ((minY + maxY) / 2) * k;
    draw();
  }

  function centerOn(id, zoom) {
    var p = state.positions.get(id);
    if (!p) return;
    var w = el.canvas.clientWidth, h = el.canvas.clientHeight;
    if (zoom) state.view.k = Math.max(state.view.k, 0.85);
    state.view.x = w / 2 - p.x * state.view.k;
    state.view.y = h / 2 - p.y * state.view.k;
    draw();
  }

  // ── drawing ───────────────────────────────────────────────────────────────
  function resize() {
    var dpr = window.devicePixelRatio || 1;
    el.canvas.width = el.canvas.clientWidth * dpr;
    el.canvas.height = el.canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function nodeColor(node, selected, related) {
    if (selected) return css('--librarium-node-selected');
    if (node.type === 'workspace' || node.type === 'directory') return css('--librarium-surface-raised');
    return css('--librarium-node');
  }

  function typeGlyph(type) {
    if (type === 'directory') return '▦';
    if (type === 'workspace') return '❖';
    if (type === 'file') return '≡';
    if (type === 'class') return '◆';
    if (type === 'component') return '✦';
    if (type === 'interface') return '○';
    if (type === 'type') return '△';
    if (type === 'package') return '⬡';
    return 'ƒ';
  }

  function draw() {
    var w = el.canvas.clientWidth, h = el.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = css('--librarium-background');
    ctx.fillRect(0, 0, w, h);

    var v = state.view;
    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.scale(v.k, v.k);

    var related = null;
    if (state.selectedId) {
      related = neighbours(state.selectedId);
      related.add(state.selectedId);
    }

    // Cluster backdrops sit behind everything: they are the "which module is
    // this" layer that makes a large graph legible at a glance.
    if (state.clusters.length) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = css('--librarium-border');
      ctx.fillStyle = css('--librarium-surface');
      ctx.font = '11px ' + css('--librarium-mono');
      ctx.textBaseline = 'alphabetic';
      for (var c = 0; c < state.clusters.length; c++) {
        var cluster = state.clusters[c];
        ctx.globalAlpha = 0.55;
        roundRect(cluster.x, cluster.y, cluster.w, cluster.h, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.stroke();
        // Counter-scale the label so module names stay legible when the whole
        // graph is zoomed out — this is the map's district naming.
        var labelSize = Math.min(34, Math.max(11, 12 / v.k));
        ctx.fillStyle = css('--librarium-accent');
        ctx.font = labelSize + 'px ' + css('--librarium-mono');
        ctx.fillText(cluster.label + '  (' + cluster.count + ')', cluster.x + 12, cluster.y + labelSize + 4);
        ctx.font = '11px ' + css('--librarium-mono');
        ctx.fillStyle = css('--librarium-surface');
      }
      ctx.textBaseline = 'middle';
    }

    // edges first, so nodes always sit on top
    var edgeColor = css('--librarium-edge');
    var activeColor = css('--librarium-edge-active');
    for (var i = 0; i < state.visibleEdges.length; i++) {
      var e = state.visibleEdges[i];
      var a = state.positions.get(e.source), b = state.positions.get(e.target);
      if (!a || !b) continue;
      var isActive = related && (e.source === state.selectedId || e.target === state.selectedId);
      if (related && !isActive) {
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = edgeColor;
      } else {
        ctx.globalAlpha = isActive ? 0.95 : 0.5;
        ctx.strokeStyle = isActive ? activeColor : edgeColor;
      }
      ctx.lineWidth = isActive ? 1.6 : 1;
      if (e.type === 'contains') ctx.setLineDash([3, 4]); else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();

      if (e.type !== 'contains' && v.k > 0.4) {
        drawArrow(a, b, widthOf(state.nodes.get(e.target) || { name: '' }));
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    var showLabels = v.k >= LABEL_ZOOM - 0.03;
    for (var n = 0; n < state.visible.length; n++) {
      var node = state.visible[n];
      var p = state.positions.get(node.id);
      if (!p) continue;
      var selected = node.id === state.selectedId;
      var dim = related && !related.has(node.id);
      ctx.globalAlpha = dim ? 0.22 : 1;

      var isActiveFile = node.filePath && node.filePath === state.activeFile;
      var nw = widthOf(node);
      roundRect(p.x - nw / 2, p.y - NODE_H / 2, nw, NODE_H, 5);
      ctx.fillStyle = nodeColor(node, selected);
      ctx.fill();
      var hovered = node.id === state.hoverId;
      ctx.lineWidth = selected || isActiveFile || hovered ? 1.6 : 1;
      ctx.strokeStyle = selected || hovered
        ? css('--librarium-accent')
        : isActiveFile ? css('--librarium-gold') : css('--librarium-border');
      ctx.stroke();

      // An expanded file is marked so it is obvious what can be collapsed again.
      if (node.type === 'file' && state.expandedFiles.has(node.filePath) && v.k > 0.3) {
        ctx.fillStyle = css('--librarium-accent');
        ctx.fillRect(p.x + nw / 2 - 7, p.y - NODE_H / 2 + 4, 3, 3);
      }

      if (showLabels) {
        ctx.fillStyle = selected ? css('--librarium-background') : css('--librarium-accent');
        ctx.font = '11px ' + css('--librarium-mono');
        ctx.textBaseline = 'middle';
        ctx.fillText(typeGlyph(node.type), p.x - nw / 2 + 9, p.y);

        ctx.fillStyle = selected ? css('--librarium-background') : css('--librarium-node-text');
        ctx.font = '11.5px ' + css('--librarium-font');

        // A collapsed directory shows how much it is hiding, so the user knows
        // where the weight of the project sits before opening anything.
        var suffix = '';
        if ((node.type === 'directory' || node.type === 'workspace') && !state.expanded.has(node.id)) {
          var count = state.descendants.get(node.id) || 0;
          if (count) suffix = '  ' + count;
        }
        var labelWidth = nw - 34 - (suffix ? 26 : 0);
        ctx.fillText(truncate(node.name, labelWidth), p.x - nw / 2 + 24, p.y);
        if (suffix) {
          ctx.fillStyle = css('--librarium-muted');
          ctx.font = '10px ' + css('--librarium-mono');
          ctx.textAlign = 'right';
          ctx.fillText(suffix, p.x + nw / 2 - 9, p.y);
          ctx.textAlign = 'left';
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    drawMinimap();
  }

  function drawArrow(a, b, targetWidth) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    // Stop at the node border rather than the centre.
    var tipX = b.x - ux * ((targetWidth || NODE_W) / 2 + 2);
    var tipY = b.y - uy * (NODE_H / 2 + 2);
    var size = 6;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - ux * size - uy * size * 0.55, tipY - uy * size + ux * size * 0.55);
    ctx.lineTo(tipX - ux * size + uy * size * 0.55, tipY - uy * size - ux * size * 0.55);
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function truncate(text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    var out = text;
    while (out.length > 3 && ctx.measureText(out + '…').width > maxWidth) {
      out = out.slice(0, -1);
    }
    return out + '…';
  }

  // ── minimap ───────────────────────────────────────────────────────────────
  function graphBounds() {
    var b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    state.visible.forEach(function (n) {
      var p = state.positions.get(n.id);
      if (!p) return;
      b.minX = Math.min(b.minX, p.x); b.maxX = Math.max(b.maxX, p.x);
      b.minY = Math.min(b.minY, p.y); b.maxY = Math.max(b.maxY, p.y);
    });
    if (b.minX === Infinity) return null;
    // Padding keeps edge nodes off the minimap border.
    var padX = (b.maxX - b.minX) * 0.06 + NODE_W;
    var padY = (b.maxY - b.minY) * 0.06 + NODE_H;
    return { minX: b.minX - padX, maxX: b.maxX + padX, minY: b.minY - padY, maxY: b.maxY + padY };
  }

  function drawMinimap() {
    var w = el.minimap.clientWidth, h = el.minimap.clientHeight;
    var dpr = window.devicePixelRatio || 1;
    if (el.minimap.width !== w * dpr) {
      el.minimap.width = w * dpr;
      el.minimap.height = h * dpr;
    }
    miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    miniCtx.clearRect(0, 0, w, h);
    miniCtx.fillStyle = css('--librarium-surface');
    miniCtx.fillRect(0, 0, w, h);

    var bounds = graphBounds();
    if (!bounds) return;
    var scale = Math.min(w / (bounds.maxX - bounds.minX || 1), h / (bounds.maxY - bounds.minY || 1));
    var offX = (w - (bounds.maxX - bounds.minX) * scale) / 2;
    var offY = (h - (bounds.maxY - bounds.minY) * scale) / 2;
    state.miniTransform = { scale: scale, offX: offX, offY: offY, bounds: bounds };

    var accent = css('--librarium-accent');
    miniCtx.fillStyle = css('--librarium-node-dim');
    state.visible.forEach(function (n) {
      var p = state.positions.get(n.id);
      if (!p) return;
      var x = offX + (p.x - bounds.minX) * scale;
      var y = offY + (p.y - bounds.minY) * scale;
      var selected = n.id === state.selectedId;
      miniCtx.fillStyle = selected ? accent : css('--librarium-node-dim');
      var size = selected ? 4 : 2;
      miniCtx.fillRect(x - size / 2, y - size / 2, size, size);
    });

    // Viewport rectangle: the "you are here" marker.
    var vw = el.canvas.clientWidth, vh = el.canvas.clientHeight;
    var x0 = offX + ((-state.view.x / state.view.k) - bounds.minX) * scale;
    var y0 = offY + ((-state.view.y / state.view.k) - bounds.minY) * scale;
    miniCtx.strokeStyle = accent;
    miniCtx.lineWidth = 1;
    miniCtx.strokeRect(x0, y0, (vw / state.view.k) * scale, (vh / state.view.k) * scale);
  }

  function minimapJump(ev) {
    var t = state.miniTransform;
    if (!t) return;
    var rect = el.minimap.getBoundingClientRect();
    var gx = (ev.clientX - rect.left - t.offX) / t.scale + t.bounds.minX;
    var gy = (ev.clientY - rect.top - t.offY) / t.scale + t.bounds.minY;
    state.view.x = el.canvas.clientWidth / 2 - gx * state.view.k;
    state.view.y = el.canvas.clientHeight / 2 - gy * state.view.k;
    draw();
  }

  var miniDragging = false;
  el.minimap.addEventListener('mousedown', function (ev) { miniDragging = true; minimapJump(ev); });
  el.minimap.addEventListener('mousemove', function (ev) { if (miniDragging) minimapJump(ev); });
  window.addEventListener('mouseup', function () { miniDragging = false; });

  // ── status strip ──────────────────────────────────────────────────────────
  function renderStatus() {
    var modeLabel = state.mode === 'architecture' ? 'Architecture'
      : state.mode === 'files' ? 'Files' : 'Entities';
    var where = '';
    if (state.selectedId) {
      var node = state.nodes.get(state.selectedId);
      if (node) where = node.filePath || node.name;
    }

    var html = '<b>' + modeLabel + '</b>';
    if (where) html += '<span class="sep">/</span><span class="where">' + escapeHtml(where) + '</span>';
    html += '<span class="sep">&middot;</span>' + state.visible.length + ' shown';
    if (state.expandedFiles.size) {
      html += '<span class="sep">&middot;</span>' + state.expandedFiles.size + ' expanded';
    }
    el.crumb.innerHTML = html;

    var notes = '';
    if (state.focusMode) notes += '<button class="pill" data-action="clear-focus">Focus on &times;</button>';
    if (state.expandedFiles.size) notes += '<button class="pill" data-action="collapse-all">Collapse declarations</button>';
    if (state.nodeFilters.size || state.edgeFilters.size) {
      notes += '<button class="pill" data-action="clear-filters">Clear filters</button>';
    }
    // A graph this size is unreadable as a whole; say so and point at the way out.
    if (state.visible.length > 220 && !state.focusMode) {
      notes += '<span class="pill warn">Large view &mdash; search or Focus a record</span>';
    }
    el.statusNote.innerHTML = notes;
  }

  el.statusNote.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    if (action === 'clear-focus') setFocusMode(false);
    else if (action === 'collapse-all') { state.expandedFiles.clear(); state.layoutKey = ''; render(); }
    else if (action === 'clear-filters') {
      state.nodeFilters.clear();
      state.edgeFilters.clear();
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
        chip.setAttribute('aria-pressed', 'false');
      });
      state.layoutKey = '';
      render();
    }
  });

  // ── hit testing and pointer ───────────────────────────────────────────────
  function nodeAt(clientX, clientY) {
    var rect = el.canvas.getBoundingClientRect();
    var x = (clientX - rect.left - state.view.x) / state.view.k;
    var y = (clientY - rect.top - state.view.y) / state.view.k;
    for (var i = state.visible.length - 1; i >= 0; i--) {
      var node = state.visible[i];
      var p = state.positions.get(node.id);
      if (!p) continue;
      if (Math.abs(x - p.x) <= widthOf(node) / 2 && Math.abs(y - p.y) <= NODE_H / 2) return node;
    }
    return null;
  }

  function showTooltip(node, clientX, clientY) {
    var wrapRect = el.canvas.parentElement.getBoundingClientRect();
    var meta = node.metadata || {};
    var detail = node.type;
    if (node.type === 'file' && typeof meta.entityCount === 'number') {
      detail += ' &middot; ' + meta.entityCount + ' declarations';
    }
    if (node.type === 'directory' || node.type === 'workspace') {
      var files = state.descendants.get(node.id) || 0;
      detail += ' &middot; ' + files + ' files';
      detail += state.expanded.has(node.id) ? ' &middot; double-click to collapse' : ' &middot; double-click to open';
    }
    if (node.startLine) detail += ' &middot; line ' + node.startLine;
    el.tooltip.innerHTML =
      '<div class="t-name">' + escapeHtml(node.name) + '</div>' +
      (node.filePath ? '<div class="t-path">' + escapeHtml(node.filePath) + '</div>' : '') +
      '<div class="t-meta">' + detail + '</div>';
    el.tooltip.classList.add('show');
    // Flip the tooltip near the right/bottom edges so it never leaves the panel.
    var x = clientX - wrapRect.left + 14;
    var y = clientY - wrapRect.top + 14;
    if (x + el.tooltip.offsetWidth > wrapRect.width) x = x - el.tooltip.offsetWidth - 26;
    if (y + el.tooltip.offsetHeight > wrapRect.height) y = y - el.tooltip.offsetHeight - 26;
    setTooltipPosition(x, y);
  }

  function hideTooltip() {
    el.tooltip.classList.remove('show');
    if (state.hoverId) { state.hoverId = null; draw(); }
  }

  el.canvas.addEventListener('mousemove', function (ev) {
    if (drag) return; // panning: no hover chrome
    var node = nodeAt(ev.clientX, ev.clientY);
    if (!node) { hideTooltip(); el.canvas.classList.remove('pointing'); return; }
    el.canvas.classList.add('pointing');
    if (node.id !== state.hoverId) { state.hoverId = node.id; draw(); }
    showTooltip(node, ev.clientX, ev.clientY);
  });
  el.canvas.addEventListener('mouseleave', hideTooltip);

  var drag = null;
  el.canvas.addEventListener('mousedown', function (ev) {
    drag = { x: ev.clientX, y: ev.clientY, ox: state.view.x, oy: state.view.y, moved: false };
    el.canvas.classList.add('dragging');
  });
  window.addEventListener('mousemove', function (ev) {
    if (!drag) return;
    var dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    state.view.x = drag.ox + dx;
    state.view.y = drag.oy + dy;
    draw();
  });
  window.addEventListener('mouseup', function (ev) {
    if (drag && !drag.moved) {
      var node = nodeAt(ev.clientX, ev.clientY);
      if (node) select(node.id); else select(null);
    }
    drag = null;
    el.canvas.classList.remove('dragging');
  });

  el.canvas.addEventListener('dblclick', function (ev) {
    var node = nodeAt(ev.clientX, ev.clientY);
    if (!node) return;
    if (ev.altKey && node.filePath) { openSource(node.filePath, node.startLine); return; }
    if (node.type === 'directory' || node.type === 'workspace') {
      toggleExpand(node.id);
    } else if (node.type === 'file') {
      toggleFileDeclarations(node.filePath);
    } else if (node.filePath) {
      openSource(node.filePath, node.startLine);
    }
  });

  /** Draws (or hides) a file's classes and functions inline in the graph. */
  function toggleFileDeclarations(filePath) {
    if (state.expandedFiles.has(filePath)) {
      state.expandedFiles.delete(filePath);
    } else {
      state.expandedFiles.add(filePath);
      // Entity nodes are streamed, so ask the host the first time.
      if (!state.entityFilesLoaded.has(filePath)) {
        state.entityFilesLoaded.add(filePath);
        vscodeApi.postMessage({ command: 'requestEntities', paths: [filePath] });
      }
    }
    state.layoutKey = '';
    render();
  }

  el.canvas.addEventListener('wheel', function (ev) {
    ev.preventDefault();
    var rect = el.canvas.getBoundingClientRect();
    var mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    var factor = Math.exp(-ev.deltaY * 0.0016);
    var k = Math.max(0.06, Math.min(3.2, state.view.k * factor));
    // Zoom about the cursor so the point under the pointer stays put.
    state.view.x = mx - (mx - state.view.x) * (k / state.view.k);
    state.view.y = my - (my - state.view.y) * (k / state.view.k);
    state.view.k = k;
    draw();
  }, { passive: false });

  function toggleExpand(id) {
    if (state.expanded.has(id)) state.expanded.delete(id);
    else state.expanded.add(id);
    render();
  }

  // ── selection and info panel ──────────────────────────────────────────────
  function select(id) {
    state.selectedId = id;
    if (state.focusMode) { state.layoutKey = ''; }
    renderInfo();
    if (state.focusMode) render(); else draw();
  }

  function relationRows(id) {
    var imports = [], dependents = [], children = [], calls = [], callers = [];
    for (var i = 0; i < state.edges.length; i++) {
      var e = state.edges[i];
      if (e.source === id) {
        if (e.type === 'imports' || e.type === 'dependsOn') imports.push(e);
        else if (e.type === 'contains') children.push(e);
        else calls.push(e);
      } else if (e.target === id) {
        if (e.type === 'imports' || e.type === 'dependsOn') dependents.push(e);
        else if (e.type !== 'contains') callers.push(e);
      }
    }
    return { imports: imports, dependents: dependents, children: children, calls: calls, callers: callers };
  }

  function section(title, edges, direction) {
    if (!edges.length) return '';
    var rows = edges.slice(0, 40).map(function (e) {
      var otherId = direction === 'out' ? e.target : e.source;
      var other = state.nodes.get(otherId);
      if (!other) return '';
      return '<div class="info-row" data-goto="' + escapeAttr(otherId) + '">' +
        '<span class="label">' + escapeHtml(other.name) + '</span>' +
        '<span class="tag">' + escapeHtml(e.type) + '</span></div>';
    }).join('');
    var more = edges.length > 40 ? '<div class="empty-note">+ ' + (edges.length - 40) + ' more</div>' : '';
    return '<div class="info-section"><h4>' + title + ' (' + edges.length + ')</h4>' + rows + more + '</div>';
  }

  function renderInfo() {
    if (!state.selectedId) { el.info.classList.remove('open'); el.info.innerHTML = ''; return; }
    var node = state.nodes.get(state.selectedId);
    if (!node) { el.info.classList.remove('open'); return; }

    var rel = relationRows(node.id);
    var meta = node.metadata || {};
    var html = '';
    html += '<div class="kind-line">' + escapeHtml(node.type) + '</div>';
    html += '<h2>' + escapeHtml(node.name) + '</h2>';
    html += '<div class="path">' + escapeHtml(node.filePath || state.workspace && state.workspace.name || '') + '</div>';

    var facts = [];
    if (node.startLine) {
      facts.push(['Lines', node.startLine + (node.endLine && node.endLine !== node.startLine ? '–' + node.endLine : '')]);
    }
    if (meta.language) facts.push(['Language', String(meta.language)]);
    if (meta.packageName) facts.push(['Package', String(meta.packageName)]);
    if (typeof meta.entityCount === 'number') facts.push(['Entities', String(meta.entityCount)]);
    if (typeof meta.exported === 'boolean') facts.push(['Exported', meta.exported ? 'yes' : 'no']);
    facts.push(['Dependencies', String(rel.imports.length)]);
    facts.push(['Dependents', String(rel.dependents.length)]);
    if (facts.length) {
      html += '<div class="info-section"><h4>Record</h4>' + facts.map(function (f) {
        return '<div class="metric" style="padding-left:0;padding-right:0"><span>' +
          escapeHtml(f[0]) + '</span><span>' + escapeHtml(f[1]) + '</span></div>';
      }).join('') + '</div>';
    }

    // A file's own declarations, straight from the node payload: clicking a file
    // must answer "what is in it" without another round-trip.
    var outline = Array.isArray(meta.outline) ? meta.outline : [];
    if (outline.length) {
      var expanded = state.expandedFiles.has(node.filePath);
      html += '<div class="info-section"><h4>Declarations (' + outline.length + ')</h4>';
      html += outline.slice(0, 200).map(function (item) {
        var kids = Array.isArray(item.members) ? item.members : [];
        var row = '<div class="info-row" data-open="' + escapeAttr(node.filePath) +
          '" data-line="' + (item.startLine || 1) + '">' +
          '<span class="label">' + escapeHtml(item.name) +
          (item.kind === 'function' || item.kind === 'method' ? '()' : '') + '</span>' +
          '<span class="tag">' + escapeHtml(item.kind) + '</span></div>';
        row += kids.slice(0, 40).map(function (m) {
          return '<div class="info-row nested" data-open="' + escapeAttr(node.filePath) +
            '" data-line="' + (m.startLine || 1) + '">' +
            '<span class="label">' + escapeHtml(m.name) + '()</span></div>';
        }).join('');
        return row;
      }).join('');
      if (outline.length > 200) {
        html += '<div class="empty-note">+ ' + (outline.length - 200) + ' more</div>';
      }
      html += '<button class="pill" data-expand="' + escapeAttr(node.filePath) + '">' +
        (expanded ? 'Hide in graph' : 'Show in graph') + '</button></div>';
    }

    var members = Array.isArray(meta.members) ? meta.members : [];
    if (members.length) {
      html += '<div class="info-section"><h4>Methods (' + members.length + ')</h4>' +
        members.map(function (m) {
          return '<div class="info-row" data-open="' + escapeAttr(node.filePath) +
            '" data-line="' + (m.startLine || 1) + '"><span class="label">' +
            escapeHtml(m.name) + '()</span></div>';
        }).join('') + '</div>';
    }

    if (Array.isArray(meta.exports) && meta.exports.length) {
      html += '<div class="info-section"><h4>Exports (' + meta.exports.length + ')</h4>' +
        meta.exports.slice(0, 30).map(function (name) {
          return '<div class="info-row"><span class="label">' + escapeHtml(name) + '</span></div>';
        }).join('') + '</div>';
    }

    html += section('Imports', rel.imports, 'out');
    html += section('Used by', rel.dependents, 'in');
    html += section('Calls', rel.calls, 'out');
    html += section('Called by', rel.callers, 'in');
    if (node.type === 'directory' || node.type === 'workspace') {
      html += section('Contains', rel.children, 'out');
    }

    html += '<div class="info-actions">';
    if (node.filePath) {
      html += '<button class="primary-btn" data-open="' + escapeAttr(node.filePath) +
        '" data-line="' + (node.startLine || 1) + '">Open Source</button>';
    }
    html += '<button class="primary-btn" id="focus-node">Focus</button></div>';

    el.info.innerHTML = html;
    el.info.classList.add('open');
  }

  el.info.addEventListener('click', function (ev) {
    var openTarget = ev.target.closest('[data-open]');
    if (openTarget) {
      openSource(openTarget.getAttribute('data-open'), Number(openTarget.getAttribute('data-line')) || 1);
      return;
    }
    var expandTarget = ev.target.closest('[data-expand]');
    if (expandTarget) {
      toggleFileDeclarations(expandTarget.getAttribute('data-expand'));
      renderInfo();
      return;
    }
    var gotoTarget = ev.target.closest('[data-goto]');
    if (gotoTarget) {
      var id = gotoTarget.getAttribute('data-goto');
      revealNode(id);
      return;
    }
    if (ev.target.id === 'focus-node') setFocusMode(!state.focusMode);
  });

  function openSource(filePath, line) {
    vscodeApi.postMessage({ command: 'openSource', filePath: filePath, line: line || 1 });
  }

  function setFocusMode(on) {
    state.focusMode = on;
    el.focusBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    state.layoutKey = '';
    render();
  }

  /** Switches to whichever mode can show a node id, then centres on it. */
  function revealNode(id) {
    var node = state.nodes.get(id);
    if (!node) return;

    if (isEntity(node.type)) {
      if (state.mode !== 'entities') { setMode('entities', node.filePath); }
    } else if (node.type === 'file' || node.type === 'package') {
      if (state.mode === 'entities') setMode('files');
      if (state.mode === 'architecture') expandTo(node.filePath);
    } else if (node.type === 'directory') {
      if (state.mode !== 'architecture') setMode('architecture');
      expandTo(node.filePath + '/');
    }

    state.selectedId = id;
    render();
    centerOn(id, true);
    renderInfo();
  }

  /** Expands every ancestor directory so a path becomes visible. */
  function expandTo(path) {
    var dir = dirname(path);
    var parts = dir ? dir.split('/') : [];
    var sofar = '';
    for (var i = 0; i < parts.length; i++) {
      sofar = sofar ? sofar + '/' + parts[i] : parts[i];
      state.expanded.add('dir:' + sofar);
    }
    state.layoutKey = '';
  }

  // ── modes, filters, search ────────────────────────────────────────────────
  function setMode(mode, entityFileHint) {
    state.mode = mode;
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-mode') === mode ? 'true' : 'false');
    });
    if (mode === 'entities') requestEntities(entityFileHint);
    state.layoutKey = '';
    render();
  }

  /**
   * Entity nodes are streamed per file. Which files depends on context: the
   * focused/active file plus its direct neighbours, or the busiest files when
   * nothing is selected.
   */
  function requestEntities(hintPath) {
    var wanted = [];
    var seed = hintPath || state.activeFile;
    if (seed) {
      wanted.push(seed);
      var seedId = 'file:' + seed;
      neighbours(seedId).forEach(function (id) {
        var node = state.nodes.get(id);
        if (node && node.type === 'file') wanted.push(node.filePath);
      });
    }
    if (wanted.length < 6) {
      state.hubs.slice(0, 12).forEach(function (hub) { wanted.push(hub.filePath); });
    }
    var fresh = wanted.filter(function (p) {
      return p && !state.entityFilesLoaded.has(p);
    });
    if (!fresh.length) return;
    fresh.forEach(function (p) { state.entityFilesLoaded.add(p); });
    vscodeApi.postMessage({ command: 'requestEntities', paths: fresh });
  }

  function buildFilters() {
    NODE_FILTERS.forEach(function (f) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = f.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        if (state.nodeFilters.has(f.id)) state.nodeFilters.delete(f.id);
        else state.nodeFilters.add(f.id);
        btn.setAttribute('aria-pressed', state.nodeFilters.has(f.id) ? 'true' : 'false');
        state.layoutKey = '';
        render();
      });
      el.nodeFilters.appendChild(btn);
    });
    EDGE_FILTERS.forEach(function (f) {
      var btn = document.createElement('button');
      btn.className = 'chip';
      btn.textContent = f.label;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        if (state.edgeFilters.has(f.id)) state.edgeFilters.delete(f.id);
        else state.edgeFilters.add(f.id);
        btn.setAttribute('aria-pressed', state.edgeFilters.has(f.id) ? 'true' : 'false');
        state.layoutKey = '';
        render();
      });
      el.edgeFilters.appendChild(btn);
    });
  }

  function runSearch(query) {
    var q = query.trim().toLowerCase();
    if (!q) { el.results.classList.remove('open'); state.searchResults = []; return; }
    var matches = [];
    state.nodes.forEach(function (node) {
      if (node.type === 'workspace') return;
      var name = node.name.toLowerCase();
      var idx = name.indexOf(q);
      var pathIdx = node.filePath ? node.filePath.toLowerCase().indexOf(q) : -1;
      if (idx === -1 && pathIdx === -1) return;
      // Prefix matches on the name rank above substring and path hits.
      matches.push({ node: node, score: idx === 0 ? 0 : idx > 0 ? 1 : 2 });
    });
    matches.sort(function (a, b) {
      return a.score - b.score || a.node.name.length - b.node.name.length;
    });
    state.searchResults = matches.slice(0, 40).map(function (m) { return m.node; });
    state.searchIndex = state.searchResults.length ? 0 : -1;
    renderResults();
  }

  function renderResults() {
    if (!state.searchResults.length) { el.results.classList.remove('open'); return; }
    el.results.innerHTML = state.searchResults.map(function (node, i) {
      return '<div class="result' + (i === state.searchIndex ? ' active' : '') +
        '" data-id="' + escapeAttr(node.id) + '">' +
        '<span class="kind">' + escapeHtml(node.type) + '</span>' +
        '<span class="name">' + escapeHtml(node.name) + '</span>' +
        '<span class="path">' + escapeHtml(node.filePath || '') + '</span></div>';
    }).join('');
    el.results.classList.add('open');
  }

  el.results.addEventListener('click', function (ev) {
    var row = ev.target.closest('[data-id]');
    if (!row) return;
    revealNode(row.getAttribute('data-id'));
    el.results.classList.remove('open');
  });

  el.search.addEventListener('input', function () { runSearch(el.search.value); });
  el.search.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { el.search.value = ''; el.results.classList.remove('open'); el.search.blur(); return; }
    if (!state.searchResults.length) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      state.searchIndex = (state.searchIndex + 1) % state.searchResults.length;
      renderResults();
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      state.searchIndex = (state.searchIndex - 1 + state.searchResults.length) % state.searchResults.length;
      renderResults();
    } else if (ev.key === 'Enter' && state.searchIndex >= 0) {
      revealNode(state.searchResults[state.searchIndex].id);
      el.results.classList.remove('open');
    }
  });

  window.addEventListener('keydown', function (ev) {
    if (ev.target === el.search) return;
    if (ev.key === '/') { ev.preventDefault(); el.search.focus(); }
    else if (ev.key === 'f' && state.selectedId) setFocusMode(!state.focusMode);
    else if (ev.key === 'Escape') { select(null); if (state.focusMode) setFocusMode(false); }
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (btn) {
    btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
  });
  el.layout.addEventListener('change', function () {
    state.layout = el.layout.value;
    state.layoutKey = '';
    render();
  });
  el.focusBtn.addEventListener('click', function () { setFocusMode(!state.focusMode); });
  document.getElementById('fit-btn').addEventListener('click', fitToView);

  function zoomBy(factor) {
    var w = el.canvas.clientWidth, h = el.canvas.clientHeight;
    var k = Math.max(0.06, Math.min(3.2, state.view.k * factor));
    // Zoom about the viewport centre, matching what the buttons imply.
    state.view.x = w / 2 - (w / 2 - state.view.x) * (k / state.view.k);
    state.view.y = h / 2 - (h / 2 - state.view.y) * (k / state.view.k);
    state.view.k = k;
    draw();
  }
  document.getElementById('zoom-in').addEventListener('click', function () { zoomBy(1.25); });
  document.getElementById('zoom-out').addEventListener('click', function () { zoomBy(0.8); });
  document.getElementById('zoom-reset').addEventListener('click', fitToView);
  document.getElementById('refresh-btn').addEventListener('click', function () {
    el.overlayText.textContent = 'Re-indexing knowledge records...';
    el.overlay.classList.add('show');
    vscodeApi.postMessage({ command: 'refresh' });
  });

  // ── sidebar ───────────────────────────────────────────────────────────────
  function relativeTime(unixSeconds) {
    var diff = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
    if (diff < 60) return diff + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  }

  function renderSidebar() {
    var meta = state.metadata || {};
    var counts = meta.nodeTypeCounts || {};
    var html = '<h3>Project</h3>';
    var rows = [
      ['Files', meta.fileCount || 0],
      ['Directories', counts.directory || 0],
      ['Classes', counts.class || 0],
      ['Components', counts.component || 0],
      ['Functions', counts.function || 0],
      ['Interfaces', counts.interface || 0],
      ['Types', counts.type || 0],
      ['Packages', counts.package || 0],
      ['Relations', meta.edgeCount || 0]
    ];
    rows.forEach(function (r) {
      html += '<div class="metric"><span>' + r[0] + '</span><span>' + r[1] + '</span></div>';
    });

    html += '<h3>Most Connected</h3>';
    if (!state.hubs.length) html += '<div class="empty-note">No dependency hubs found.</div>';
    state.hubs.slice(0, 8).forEach(function (hub) {
      html += '<div class="list-item" data-id="' + escapeAttr(hub.nodeId) + '">' +
        '<span class="label">' + escapeHtml(hub.name) + '</span>' +
        '<span class="meta">' + hub.degree + '</span></div>';
    });

    html += '<h3>Heresy Detected</h3>';
    if (!state.cycles.length) {
      html += '<div class="empty-note">No circular dependencies. The archive is pure.</div>';
    } else {
      state.cycles.slice(0, 5).forEach(function (cycle, i) {
        var names = cycle.nodes.map(function (id) {
          var node = state.nodes.get(id);
          return node ? node.name : id.replace('file:', '');
        });
        html += '<div class="heresy" data-id="' + escapeAttr(cycle.nodes[0]) + '">' +
          '<div class="title">Circular dependency ' + (i + 1) + '</div>' +
          '<div class="ring">' + names.map(escapeHtml).join(' → ') +
          ' → ' + escapeHtml(names[0]) + '</div></div>';
      });
      if (state.cycles.length > 5) {
        html += '<div class="empty-note">+ ' + (state.cycles.length - 5) + ' more</div>';
      }
    }

    html += '<h3>Recent Changes</h3>';
    if (!state.recentChanges.length) {
      html += '<div class="empty-note">No git history available.</div>';
    } else {
      state.recentChanges.forEach(function (change) {
        var id = 'file:' + change.path;
        if (!state.nodes.has(id)) return;
        html += '<div class="list-item" data-id="' + escapeAttr(id) + '">' +
          '<span class="label">' + escapeHtml(change.path.split('/').pop()) + '</span>' +
          '<span class="meta">' + relativeTime(change.timestamp) + '</span></div>';
      });
    }

    el.sidebar.innerHTML = html;
  }

  el.sidebar.addEventListener('click', function (ev) {
    var row = ev.target.closest('[data-id]');
    if (row) revealNode(row.getAttribute('data-id'));
  });

  // ── render pipeline ───────────────────────────────────────────────────────
  function render() {
    computeVisible();
    runLayout();
    draw();
    renderStatus();
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(value) { return escapeHtml(value); }

  // ── host messages ─────────────────────────────────────────────────────────
  window.addEventListener('message', function (event) {
    var msg = event.data;
    if (msg.command === 'analyzing') {
      el.overlayText.textContent = 'Consulting the archive...';
      el.overlay.classList.add('show');
      return;
    }

    if (msg.command === 'empty') {
      el.overlay.classList.add('show');
      el.overlayText.innerHTML = msg.reason === 'no-workspace'
        ? 'No workspace is open. The Librarium indexes a folder, not a single file.'
        : 'No supported knowledge records detected.<br><br>Supported languages:<br>' +
          '<code>TypeScript</code> &middot; <code>JavaScript</code> &middot; <code>Go</code>' +
          '<br><br>The Librarium awaits further records.';
      el.counts.textContent = '';
      return;
    }

    if (msg.command === 'theme') {
      setThemeVariables(msg.theme.variables);
      draw();
      return;
    }

    if (msg.command === 'activeFile') {
      state.activeFile = msg.filePath;
      draw();
      return;
    }

    if (msg.command === 'focusFile') {
      var fileId = 'file:' + msg.filePath;
      if (state.nodes.has(fileId)) revealNode(fileId);
      return;
    }

    if (msg.command === 'entities') {
      msg.nodes.forEach(function (node) { state.nodes.set(node.id, node); });
      var known = new Set(state.edges.map(function (e) { return e.id; }));
      msg.edges.forEach(function (e) { if (!known.has(e.id)) state.edges.push(e); });
      state.layoutKey = '';
      render();
      return;
    }

    if (msg.command === 'graph') {
      var graph = msg.graph;
      state.nodes = new Map();
      graph.nodes.forEach(function (node) { state.nodes.set(node.id, node); });
      state.edges = graph.edges.slice();
      state.workspace = graph.workspace;
      state.metadata = graph.metadata;
      state.hubs = graph.hubs || [];
      state.cycles = graph.cycles || [];
      state.entityFilesLoaded = new Set();
      if (msg.recentChanges) state.recentChanges = msg.recentChanges;
      if (msg.activeFile) state.activeFile = msg.activeFile;

      indexContainment();
      if (!state.expanded.size) autoExpand();

      var meta = graph.metadata;
      el.counts.innerHTML = '<b>' + meta.fileCount + '</b> files &middot; <b>' +
        (meta.nodeTypeCounts.directory || 0) + '</b> modules &middot; <b>' +
        meta.edgeCount + '</b> relationships' +
        (meta.truncated ? ' &middot; partial index' : '');

      el.overlay.classList.remove('show');
      state.layoutKey = '';
      renderSidebar();
      render();

      if (msg.focusFile) {
        var target = 'file:' + msg.focusFile;
        if (state.nodes.has(target)) revealNode(target);
      } else if (state.activeFile && state.nodes.has('file:' + state.activeFile)) {
        revealNode('file:' + state.activeFile);
      }
    }
  });

  window.addEventListener('resize', resize);
  buildFilters();
  resize();
  vscodeApi.postMessage({ command: 'ready' });
})();
</script>
</body>
</html>`;
}
