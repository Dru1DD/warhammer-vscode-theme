# Changelog

## 0.8.0

### Added

- **Vibrancy toggle** (`Warhammer 40k: Toggle Vibrancy`) — makes the active faction's editor, tabs, sidebar, activity bar, panel, terminal, title bar and status bar backgrounds translucent (theme-scoped `workbench.colorCustomizations`) and drives the [Vibrancy Continued](https://marketplace.visualstudio.com/items?itemName=illixion.vscode-vibrancy-continued) extension for the blur, offering to install it when missing. Running it again removes only the colours it wrote.
- **New setting** — `warhammer.vibrancy.opacity` (default 0.7, range 0–1); changes re-tint the active theme immediately while vibrancy is on
- **Two new colour-tuning targets** in the Servo-Skull sidebar — **Status Bar Icons** (`statusBar.foreground`) and **Sidebar & Panel Icons** (`icon.foreground`)

### Changed

- `npm test` also runs the vibrancy self-check

---

## 0.7.0

### Added

- **Librarium — local project knowledge graph** — a dedicated webview that maps how the current codebase is actually connected. Built entirely from local source: no API keys, no accounts, no network access.

  - **Three levels of abstraction** — `ARCHITECTURE` (workspace → collapsible directories → files, the default), `FILES` (directional file-to-file dependencies), and `ENTITIES` (classes, functions, interfaces, types, React components and the calls between them). Detail is revealed progressively; entity records stream on demand rather than all at once.
  - **Real parsing, not regex** — TypeScript, JavaScript and TSX/JSX are parsed with the TypeScript compiler API. Go uses a comment- and string-aware scanner with brace tracking, so declarations inside comments or string literals cannot create phantom records.
  - **Pluggable analyzers** — every language produces the same language-agnostic `CodeNode` / `CodeEdge` graph model. Adding a language means writing one analyzer.
  - **Relationships** — `contains`, `imports`, `dependsOn` (external packages), `calls`, `extends` (including embedded Go structs), `implements`, and `renders` for React components.
  - **Inspector panel** — record type, file, line range, dependency and dependent counts, methods, exports, imports, callers and children, with **Open Source** jumping to the exact file and line through the standard VS Code navigation.
  - **Focus mode** — collapses the graph to the selected record plus its direct dependencies and dependents.
  - **Search** — across files, directories, classes, functions, components, interfaces and types; selecting a result switches level, expands the path to it, and centres the graph on it. `/` focuses search, `f` toggles Focus, `Esc` clears.
  - **Filters** — by record type and by relationship type; nothing filtered by default.
  - **Metrics** — project summary, dependency hubs ranked by import degree, and **Heresy Detected**: circular dependencies found via strongly-connected components and displayed as a concrete ring.
  - **Recent Changes** — recently committed files, read from git when available. Git is optional and never required.
  - **Current-file bridge** — opening the Librarium with a file active selects that file's record; a right-click action in the editor and Explorer opens it focused on any supported file.
  - **Faction-aware styling** — one stylesheet driven by semantic CSS variables, fed from the existing faction palette and the active theme's light/dark kind. Repaints live when the theme changes.
  - **Performance** — per-file analysis cached by mtime and size and persisted to workspace storage, a debounced file watcher that invalidates only what changed, a configurable index cap (`warhammer.librarium.maxFiles`, default 2500), and a canvas renderer that draws at most the 800 most connected records per level.

  - **Activity-bar entry** — a book icon opens the Librarium directly, with a small side panel for re-indexing and focusing the current file.
  - **File outlines** — clicking a file lists its declarations (classes, functions, interfaces, types, with methods nested); clicking one jumps to its line, and double-clicking the file draws those declarations inline in the graph.
  - **Orientation for large graphs** — minimap with a live viewport rectangle, hover tooltips, a status strip naming the level and selection with one-click escapes, zoom controls, and a directory-clustered layout that groups records into labelled module blocks past ~60 nodes.
  - **Progressive opening** — directories open a level at a time within a readability budget, and collapsed directories show the number of files they hold. Small projects still open fully.

- **Three new commands** — `Warhammer 40k: Consult the Librarium`, `Warhammer 40k: Refresh Librarium`, `Warhammer 40k: Focus Librarium on Current File`
- **New setting** — `warhammer.librarium.maxFiles` (default 2500, range 100–20000)
- **Editor and Explorer context-menu action** for supported source files

### Fixed

- `import type { X } from './y'` was not being flagged as a type-only import by the new analyzer (caught by the test suite before release)
- Webview CSP blocked every write to `element.style`, which silently broke tooltip positioning and live theme switching. Dynamic styles now go through a single nonced stylesheet; the CSP itself was not weakened.
- Graph layouts no longer overlap or degenerate: wide directories and layers wrap into grids instead of one endless row, node width follows the label, and Fit stops at the zoom where labels are still rendered
- `.vscodeignore` no longer ships compiled tests and sourcemaps: a blanket `!out/**` negation was overriding the `**/*.map` and test exclusions below it

### Changed

- `getFactionFromThemeName` and `FACTION_PALETTE` are now exported from the mascot module so the Librarium derives its theme from the same source of truth instead of duplicating it
- `typescript` moved from `devDependencies` to `dependencies` — the compiler API ships with the extension. Only `lib/typescript.js` is packaged, not the whole package.
- `npm test` runs the full self-check suite (32 Librarium checks plus the existing customize check)

---

## 0.6.1

### Added

- **Grimdark Sigils icon theme** — 37 custom SVG file/folder icons (`Warhammer 40k: Grimdark Sigils`), covering common languages, config formats, and file types, selectable via **Preferences: File Icon Theme**
- **Theme Customization command** (`Warhammer 40k: Customize Theme (Inject Colour Rites)`) — injects a curated, faction-neutral chrome palette (title bar, activity bar, status bar, cursor, terminal ANSI) on top of whichever theme is active
- **Per-key colour tuning** via the Servo-Skull sidebar — pick a target (comments, cursor, active line number, activity bar icons, status bar background, selection) and a swatch or custom hex; overrides are written theme-scoped, so a tweak only affects the faction it was made under
- **Inquisition Terminal welcome page** (`Warhammer 40k: Open the Inquisition Terminal`) — full-editor webview shown once on first activation, reopenable any time
- **Tech-Priest Mode** — detects the workspace's tech stack (React, Vue, Rust, Go, Python, Node) from manifest files and tailors the `projectOpen` voice line accordingly
- **Custom lore lines** (`warhammer.companion.customMessages`) — your own message strings, merged into the ambient and event-driven pools alongside the built-in faction voices
- **Purity Seal milestones** — lifetime commit counter persisted across sessions; a native notification fires at 10, 50, 100, 250, 500, and 1000 commits

---

## 0.5.0

### Added

- **Six new light / mid-light themes** — the first light-mode themes in the collection, each built for daytime coding without sacrificing faction identity

  - **White Scars** — pale stone base with muted crimson and tactical grey. Swift, open, fierce. Comments render in warm stone; no visual noise.
  - **Thousand Sons** — dusty blue-parchment base with arcane dusty blue keywords and turquoise functions. Scholarly melancholy. Feels like an illuminated manuscript running a compiler.
  - **Sisters of Battle** — warm ivory base with cathedral crimson and relic gold. Devotional intensity kept legible. The gold earns every appearance.
  - **Raven Guard** — fog-grey base with dark tactical slate and pale silver accents. Quiet, deliberate, shadow-precise.
  - **Alpha Legion** — muted teal base with layered blue-grey contrast. Intentionally layered. Nothing is where it first appears.
  - **Custodes** — pale warm marble base with restrained gold and imperial ivory. Measured. Authoritative. Built to last ten thousand years.

- **Expanded mascot system** — the Servo-Skull now supports all 16 factions with distinct voice lines, palettes, and idle personality

  - 16 selectable factions: `bloodAngels`, `deathwatch`, `necrons`, `ultramarines`, `mechanicus`, `deathGuard`, `salamanders`, `imperialFists`, `craftEldar`, `tau`, `whiteScars`, `thousandSons`, `sistersBattle`, `ravenGuard`, `alphaLegion`, `custodes`
  - 7 trigger events per faction: `taskSuccess`, `taskFail`, `gitCommit`, `projectOpen`, `longSession`, `ambient`, `lateNight`
  - New `lateNight` event fires automatically during midnight–5am ambient windows with faction-appropriate late-session lines
  - Each faction has a unique visual palette (background tint, accent, glow color) in the sidebar mascot view
  - `warhammer.mascot.faction` setting expanded with descriptions for all 16 factions

- **Expanded status bar transmissions** — 24 total flavor lines (up from 10), covering code review, documentation, dependencies, and deep lore

### Changed

- Comment colors lifted for readability in four dark themes:
  - **Deathwatch** — `#38383E` → `#6A6A7E` (steel-grey with blue undertone)
  - **Necrons** — `#253025` → `#507060` (pale oxidized green-grey)
  - **Adeptus Mechanicus** — `#3A2018` → `#7A5A40` (warm brass-grey)
  - **Death Guard** — `#28291E` → `#6A6A52` (foggy bone-grey with olive tinge)
  - All remain faction-accurate; contrast raised from near-invisible (~1.3:1) to readable (~3.5–4:1)

---

## 0.4.0

### Added

- **Four new mid-dark faction themes** — warmer and lighter than the original grimdark set, designed for day-shift coding

  - **Salamanders** — warm forest green and forge amber on near-black. Fire-lit, grounded. Excellent daytime theme.
  - **Imperial Fists** — warm charcoal with controlled tactical gold. Subdued, patient, siege-certain.
  - **Craftworld Eldar** — cool blue-grey with pale silver-blue and soft violet. Refined alien OS aesthetic.
  - **Tau Empire** — dark blue-grey with ice-blue function highlights. Clean, modern, uncluttered tactical display.

### Changed

- **Adeptus Mechanicus full usability overhaul** — critical contrast fixes applied across activity bar, status bar, icon colors, terminal ANSI palette, and git decorations. Several elements were near-invisible at previous values.

---

## 0.3.0

### Added

- **Four new faction themes** — premium dark themes designed for long coding sessions, each with a distinct Warhammer 40k identity

  - **Necrons** — obsidian blacks and necrodermis green. Minimal noise. "Digital tomb" aesthetic. Functions glow cold teal-green; keywords are restrained spectral green. Feels engraved into ancient metal.

  - **Ultramarines** — dark navy base with imperial blue keywords and imperial gold functions. The gold is used sparingly — only on callsites and headings, the way rank insignia appears on armor. Strings are warm parchment against the cool military blue.

  - **Adeptus Mechanicus** — industrial dark red-brown base. Amber-brass for keywords, bright brass for functions, copper for types. Sacred red reserved for HTML tags and active UI borders — high ceremony, not everyday syntax. Feels like a cogitator terminal.

  - **Death Guard** — murky organic dark with plague green keywords, bone-yellow functions, and murky grey-green types. Strings are dirty amber. Comments are barely legible at near-invisible `#28291E`. Heavy and unhurried.

- **Servo-Skull Explorer view** — the mascot moves from the floating bottom panel to a **persistent sidebar view in the Explorer**. The Servo-Skull is now always visible; no longer a toast that appears and disappears.
  - Mascot image rendered with a continuous float animation and pulsing radial glow ring
  - Warhammer faction background: layered dark gradient, diagonal texture lines, and faction-colored top glow
  - Gothic corner ornaments at all four edges
  - Faction tag header (`BLOOD ANGELS` / `DEATHWATCH`) with gradient separator lines
  - Message area with shimmer borders and cross-fade transitions on text update
  - Event badge (`Mission Complete`, `Anomaly Detected`, `Codex Updated`, etc.) fades in on trigger events
  - Blinking status dot with randomly cycling status lines
  - On trigger events: message cross-fades in-place without disturbing editor focus
  - After `displayDuration` seconds: smoothly returns to a rotating idle message

### Changed

- `Warhammer 40k: Dismiss the Servo-Skull` command removed — no longer applicable now that the mascot is a persistent sidebar view
- Version bumped to `0.3.0`

---

## 0.2.0

### Added

- **Servo-Skull Mascot Companion** — a floating ambient mascot that appears near your work during key IDE moments
  - Renders in an atmospheric webview panel beside the editor with `preserveFocus` — typing is never interrupted
  - Floating idle animation with pulsing glow rings and gothic corner ornaments
  - Faction-accurate color treatment: crimson/gold for Blood Angels, slate/silver for Deathwatch
  - Auto-detects active color theme to select faction; can be overridden in settings
  - Auto-dismisses with a fade-out after a configurable duration (default: 8 seconds)
  - If triggered while already visible, updates the message in-place rather than opening a second panel

- **Event triggers:**
  - Project open — *"Litany of Awakening complete."*
  - Successful task / build — *"Machine Spirit appeased."*
  - Failed task / build — *"Tech-Heresy detected."*
  - Git commit — *"The Codex records your actions."*
  - Long coding session (after N hours of editing) — *"Even in death, code still serves."*
  - Random ambient appearances at configurable intervals

- **Faction message pools** — Blood Angels and Deathwatch each have distinct voice lines across all trigger categories (50+ lines total)

- **New commands:**
  - `Warhammer 40k: Summon the Servo-Skull` — trigger an immediate ambient appearance
  - `Warhammer 40k: Dismiss the Servo-Skull` — force-close the mascot panel

- **New settings** under `warhammer.mascot.*`:
  - `enabled` — toggle the mascot entirely
  - `faction` — `auto` (inherits from active theme), `bloodAngels`, or `deathwatch`
  - `displayDuration` — seconds visible before fade-out (3–30, default 8)
  - `ambientFrequency` — `off`, `rare` (90–130 min), `occasional` (45–75 min)
  - `longSessionThreshold` — hours before the long-session message fires (1–8, default 2)

---

## 0.1.0

- Initial release
- Blood Angels color theme: noble crimson elite aesthetic
- Deathwatch color theme: tactical black-silver aesthetic
- Servo-Skull companion with status bar presence
- Semantic highlighting for TypeScript, JavaScript, Python, CSS, HTML, Markdown
