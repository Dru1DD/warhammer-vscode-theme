# Warhammer 40k: Grimdark Elite

> _"In the grim darkness of the far future, there is only code."_

A premium VS Code theme collection inspired by the factions of Warhammer 40k. Designed for developers who want **elegant**, **atmospheric**, and **genuinely comfortable** tooling — not a gamer aesthetic.

Sixteen themes. Ten dark. Six light. One Servo-Skull that watches everything — and a **Librarium** that maps how your codebase is actually connected.

---

## Installation

### From VSIX (local build)

**Requirements:** Node.js 18+, VS Code 1.85+

```bash
# 1. Install dependencies and package the extension
npm install
npm run package

# 2. Install into VS Code
code --install-extension warhammer-40k-theme-0.7.0.vsix
```

Or install via the VS Code UI:

1. Open VS Code
2. `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Run **Extensions: Install from VSIX...**
4. Select `warhammer-40k-theme-0.7.0.vsix`
5. Reload VS Code when prompted

### Apply a theme

`Cmd+Shift+P` → **Preferences: Color Theme** → select your faction

### Apply the icon theme

`Cmd+Shift+P` → **Preferences: File Icon Theme** → **Warhammer 40k: Grimdark Sigils**

---

## Themes

### Dark Themes

#### Blood Angels

Noble crimson elite aesthetic. Deep charcoal base with restrained crimson accents and relic gold function highlights. The red is rare — when it appears, it means something.

**Palette feel:** Cathedral starship. Command deck of a strike cruiser.

#### Deathwatch

Tactical black-silver aesthetic. Near-pure obsidian base with cool steel-grey tones and dim amber function highlights. No dominant color — only precision.

**Palette feel:** Kill-team insertion point. Void-black armor. One silver arm.

#### Necrons

Cold metallic greens on obsidian black. Minimal syntax noise. "Digital tomb" aesthetic — structured, ancient, inevitable.

**Palette feel:** Necrodermis awakening. A tomb world processing its first command in sixty million years.

| Role      | Color            |
| --------- | ---------------- |
| Keywords  | Spectral green   |
| Functions | Necrodermis teal |
| Types     | Void teal        |
| Strings   | Muted cold-green |

#### Ultramarines

Imperial blue and gold on dark navy. Highly readable. Structured like a tactical display.

**Palette feel:** Fortress Monastery command room. Codex Astartes printed in gilt on vellum.

| Role      | Color         |
| --------- | ------------- |
| Keywords  | Imperial blue |
| Functions | Imperial gold |
| Types     | Steel blue    |
| Strings   | Parchment     |

#### Adeptus Mechanicus

Dark industrial red-brown with brass and amber. Techno-religious. Terminal-precise.

**Palette feel:** Forge World cogitator array. The Omnissiah's logic engines processing litanies.

| Role      | Color                  |
| --------- | ---------------------- |
| Keywords  | Amber-brass            |
| Functions | Bright brass           |
| Types     | Copper                 |
| Strings   | Warm amber inscription |

#### Death Guard

Murky organic greens and bone yellows. Heavy contrast. Slow, inevitable palette.

**Palette feel:** Plague hulk drifting through the warp. Decay as permanence.

| Role      | Color            |
| --------- | ---------------- |
| Keywords  | Plague green     |
| Functions | Bone yellow      |
| Types     | Murky grey-green |
| Strings   | Dirty amber      |

#### Salamanders

Warm forest greens and forge amber on near-black. Mid-dark — brighter than the grimdark originals, designed for daytime use without sacrificing atmosphere.

**Palette feel:** Nocturne forge. Vulkan's armoury. Fire-lit promethium vault.

| Role      | Color            |
| --------- | ---------------- |
| Keywords  | Forest green     |
| Functions | Forge amber      |
| Types     | Muted grey-green |
| Strings   | Warm amber       |

#### Imperial Fists

Warm charcoal base with controlled tactical gold. Subdued and readable — the gold appears only where it earns its place.

**Palette feel:** Phalanx command deck. Siege warfare conducted with perfect patience.

| Role      | Color          |
| --------- | -------------- |
| Keywords  | Dull gold      |
| Functions | Tactical gold  |
| Types     | Warm grey      |
| Strings   | Aged parchment |

#### Craftworld Eldar

Cool blue-grey base with pale silver-blue and soft violet. Refined, alien, impossibly precise. Every element feels considered.

**Palette feel:** Craftworld wraithbone spire. An infinity circuit parsing ancient light.

| Role      | Color            |
| --------- | ---------------- |
| Keywords  | Muted blue       |
| Functions | Pale silver-blue |
| Types     | Soft violet      |
| Strings   | Deep teal        |

#### Tau Empire

Dark blue-grey base with clean ice-blue function highlights and controlled steel accents. Modern, tactical, uncluttered.

**Palette feel:** Kor'vattra command interface. The Greater Good rendered in pure signal.

| Role      | Color      |
| --------- | ---------- |
| Keywords  | Steel blue |
| Functions | Ice blue   |
| Types     | Blue-grey  |
| Strings   | Cool teal  |

---

### Light Themes

Built for daytime use. Parchment, stone, and marble backgrounds — not white. Each retains its faction's visual identity without resorting to a generic light mode.

#### White Scars

Pale stone base with muted crimson accents and tactical grey. Swift and clean — the fastest Chapter rendered in light.

**Palette feel:** Open steppe horizon. White armor under a wide sky. Wind before the charge.

| Role      | Color              |
| --------- | ------------------ |
| Keywords  | Muted crimson      |
| Functions | Deep slate-blue    |
| Types     | Tactical blue-grey |
| Strings   | Dark crimson-brown |

#### Thousand Sons

Dusty blue-parchment base with arcane dusty blue and turquoise function highlights. Scholarly, cursed, precise.

**Palette feel:** Tizca before the burning. Illuminated manuscripts beneath a cyclopean sky.

| Role      | Color             |
| --------- | ----------------- |
| Keywords  | Arcane dusty blue |
| Functions | Arcane turquoise  |
| Types     | Deep violet       |
| Strings   | Aged ochre        |

#### Sisters of Battle

Warm ivory base with cathedral crimson and relic gold. Devotional intensity held in careful check.

**Palette feel:** Ecclesiarchy scriptorium. Candle-lit iron and gilt.

| Role      | Color             |
| --------- | ----------------- |
| Keywords  | Cathedral crimson |
| Functions | Relic gold        |
| Types     | Deep burgundy     |
| Strings   | Dusty ochre       |

#### Raven Guard

Fog-grey base with dark tactical slate and pale silver. Quiet. Deliberate. Nothing wasted.

**Palette feel:** Low cloud over a ruined hive. Shadow-black armour in mist.

| Role      | Color               |
| --------- | ------------------- |
| Keywords  | Dark tactical slate |
| Functions | Tactical blue-grey  |
| Types     | Deep blue-slate     |
| Strings   | Muted teal          |

#### Alpha Legion

Muted teal base with layered blue-grey contrast. Every layer has a layer beneath it.

**Palette feel:** Hydra-cell coordination grid. A plan within a plan within a plan.

| Role      | Color          |
| --------- | -------------- |
| Keywords  | Deep teal-blue |
| Functions | Layered teal   |
| Types     | Slate blue     |
| Strings   | Steel-teal     |

#### Custodes

Pale warm marble base with restrained gold and imperial ivory. Authoritative without ostentation.

**Palette feel:** Sanctum Imperialis atrium. Gold-chased marble. Ten thousand years of patience.

| Role      | Color            |
| --------- | ---------------- |
| Keywords  | Deep amber-brown |
| Functions | Restrained gold  |
| Types     | Warm umber       |
| Strings   | Muted ochre      |

---

## Design Philosophy

All sixteen themes are built around three constraints:

1. **Clarity first** — readable at 6+ hours of daily use without eye strain
2. **Restraint** — Warhammer influence is atmospheric, not decorative
3. **Premium feel** — closer to Cursor or Linear's visual design than a gaming overlay

Faction identity lives in the syntax hierarchy and active UI states. Dark themes use near-black backgrounds with only a faction-tinted hint. Light themes use parchment, stone, or marble rather than white — faction color appears on functions (most prominent), keywords (structural), and accent elements. No saturated neon anywhere.

---

## Librarium — Project Knowledge Graph

> _"An archive is not a pile of records. It is the relations between them."_

The Librarium is a visual map of how your codebase is actually connected — files, modules, classes, functions, components, interfaces, and the imports and calls that bind them. It is a code-intelligence tool wearing Imperial vestments, not a decorated graph viewer.

**Everything is local.** No API keys, no accounts, no network calls, no external servers. The graph is built from your workspace on your machine by parsing your source. This is a product principle, not an implementation detail.

### Opening it

Click the **book icon** in the activity bar — that opens the Librarium directly, and the side panel next to it holds the quick actions (re-index, focus current file).

Or: `Cmd+Shift+P` → **Warhammer 40k: Consult the Librarium**

You can also right-click any supported file — in the editor or the Explorer — and choose **Warhammer 40k: Focus Librarium on Current File**. If the Librarium is opened while a file is active, it selects that file's record automatically, so there is always a bridge between the code you are reading and the architecture it belongs to.

### Supported languages

| Language                | How it is parsed                                      |
| ----------------------- | ----------------------------------------------------- |
| TypeScript              | TypeScript compiler API (real AST)                    |
| JavaScript              | TypeScript compiler API (real AST)                    |
| TSX / JSX               | TypeScript compiler API, with React component detection |
| Go                      | Comment- and string-aware scanner (see limitations)   |

Analyzers are pluggable: each one turns source into the same language-agnostic graph model, so adding a language means writing one analyzer, not touching the renderer.

### The three levels

The Librarium never dumps your whole repository on screen at once. It reveals detail as you ask for it.

**ARCHITECTURE** — the default. Workspace → directories → files. Directories are collapsible; double-click one to expand or collapse its subtree. The top two levels open automatically, which is enough to read a project's shape without drowning in it.

```text
                    WORKSPACE
                        │
        ┌───────────────┼───────────────┐
       API             AUTH          DATABASE
        │               │               │
    ┌───┴───┐       ┌───┴───┐           │
 users.ts payments.ts login.ts      postgres.ts
```

**FILES** — file-to-file dependencies with directional arrows. External packages appear as their own record type rather than as phantom files.

```text
checkout.ts ──▶ payment.ts ──▶ stripe.ts
```

**ENTITIES** — classes, functions, interfaces, types, and React components, with the calls, inheritance, and renders between them. Entity records are streamed on demand for the file you are looking at and its neighbours, which is what keeps large repositories responsive.

**Any file can be opened in place.** Click a file and the inspector lists its declarations — every class, function, interface and type, with a class's methods nested underneath. Clicking one jumps to that line. Double-click the file in the graph (or use **Show in graph**) to draw those declarations inline, next to the file they live in, without leaving the level you are on.

### Finding your way around a large graph

Large repositories are the case this view is designed for, so orientation is built in:

- **Progressive opening** — directories open a whole level at a time, only while the visible record count stays readable. A small project ends up fully expanded; a large one starts at the module level, and every collapsed directory shows how many files it is holding.
- **Minimap** — top right, with the current viewport drawn on it. Click or drag it to move.
- **Clustered layout** — past ~60 records the graph groups by directory into labelled blocks, so the first question a big graph answers is "which module is this". Module labels stay legible at any zoom.
- **Status strip** — under the toolbar: current level, selected record, how many records are drawn, and one-click ways out (clear focus, collapse declarations, clear filters).
- **Hover** — any record shows its name, path and type on hover, so you are never looking at unlabelled boxes.
- **Zoom controls and Fit** — Fit never zooms below the point where labels stop rendering; beyond that the minimap and panning are the way around.

### Navigating from graph to source

Click any record to open the inspector: its type, file, line range, dependency and dependent counts, methods, exports, imports, callers, and children. **Open Source** jumps straight to the file and line in VS Code — it uses the standard editor navigation, so it behaves exactly like any other Go-to.

Clicking a record also highlights its direct relationships and dims everything else. **Focus** collapses the graph to just the selection plus its direct dependencies and dependents, which is the way to read a hub file in a large project.

### Search and filters

The search field finds files, directories, classes, functions, components, interfaces, and types. Selecting a result switches to whichever level can show it, expands the directories needed to reach it, and centres the graph on it.

Filters narrow what is drawn — by record type (files, directories, components, classes, functions, interfaces, types, packages) and by relationship (imports, calls, extends, implements, renders, contains, external). Nothing is filtered by default; the plain view is the simple one.

**Keyboard:** `/` focuses search · `↑` `↓` `Enter` move through results · `f` toggles Focus on the selection · `Esc` clears.

**Mouse:** scroll to zoom · drag to pan · click to inspect · double-click a directory to open or collapse it · double-click a file to draw its declarations · `Alt`+double-click opens the source.

### Metrics, hubs, and heresy

The left rail carries a project summary — files, directories, classes, components, functions, interfaces, types, packages, and total relationships — plus three lists:

- **Most Connected** — dependency hubs ranked by import degree. Clicking one focuses the graph on it.
- **Heresy Detected** — circular dependencies, found with a strongly-connected-component pass and shown as a concrete ring (`auth.ts → user.ts → session.ts → auth.ts`), not an unordered blob. The lore label is decoration; the technical explanation stays visible.
- **Recent Changes** — recently committed files, read from git when a repository is present. Git is entirely optional; without it this list is simply empty.

### Relationships in the graph

| Relationship | Meaning                                                           |
| ------------ | ----------------------------------------------------------------- |
| `contains`   | Workspace → directory → file → entity                             |
| `imports`    | File depends on another file in the workspace                     |
| `dependsOn`  | File depends on an external package                               |
| `calls`      | Entity invokes another entity, resolved through import bindings    |
| `extends`    | Class inheritance, or an embedded struct in Go                     |
| `implements` | TypeScript `implements` clauses                                    |
| `renders`    | React component renders another component                          |

### Performance

Analysis is per-file and cached by modification time and size, so editing one file re-parses one file. The cache persists into the extension's workspace storage, which makes reopening an unchanged project close to instant. A file watcher invalidates only what changed, debounced so a burst of saves triggers one rebuild.

Large workspaces are indexed up to `warhammer.librarium.maxFiles` (default 2,500) and marked as a partial index; the canvas draws at most the 800 most connected records at any one level. Directories that stay collapsed cost nothing.

```json
{
  "warhammer.librarium.maxFiles": 2500
}
```

### Faction integration

The Librarium inherits your active theme. Faction accent, glow, and surface tints come from the same palette the Servo-Skull uses, expressed as semantic CSS variables (`--librarium-accent`, `--librarium-surface`, `--librarium-edge`, and friends) rather than sixteen separate stylesheets. Switching to a light faction theme gives you a light Librarium. Switching factions repaints it live.

### Known limitations

- **Go parsing is scanner-based, not a true AST.** There is no mature Go parser for Node, and requiring the Go toolchain would break the zero-setup principle. Comments and string literals are stripped before parsing, so they cannot create phantom records, and brace nesting is tracked rather than guessed — but generics, build tags, and unusual formatting can still be misread.
- **Call resolution is name-based.** A call edge is drawn when a called name matches an entity in the same file or in a file it imports. It has no type checker behind it, so identically named symbols in unrelated files can occasionally be conflated, and calls through dynamic dispatch are not traced.
- **Only top-level declarations become entities.** Nested helpers and plain data variables are deliberately excluded to keep the graph readable.
- **Path aliases are not resolved.** `tsconfig` `paths` and bundler aliases resolve as external packages rather than workspace files.
- **The first workspace folder is indexed.** Multi-root workspaces show only the first folder.
- **`.d.ts` files, `node_modules`, build output, and files over 512KB are skipped.**

---

## Icon Theme

**Warhammer 40k: Grimdark Sigils** — 37 custom file/folder SVG icons covering common languages, config formats, and file types. Enable via `Cmd+Shift+P` → **Preferences: File Icon Theme**.

---

## Theme Customization

`Warhammer 40k: Customize Theme (Inject Colour Rites)` layers a curated, faction-neutral palette (title bar, activity bar, status bar, cursor, terminal ANSI colors) on top of whichever theme is active. Existing `workbench.colorCustomizations` keys are preserved — only the managed keys are written.

For finer control, the Servo-Skull sidebar view offers **per-key colour tuning**: pick a target (comments, cursor, active line number, activity bar icons, status bar background, selection) and a swatch or custom hex. Overrides are written theme-scoped, so a tweak sticks to the faction it was made under.

---

## Servo-Skull Companion

### Explorer Sidebar

The Servo-Skull mascot lives permanently in your **Explorer sidebar**. Open the Explorer panel and look for the **Servo-Skull** section.

The view shows:

- The Servo-Skull mascot with a continuous floating animation and faction-colored pulsing glow ring
- A Warhammer-style background with faction tint, diagonal texture, and gothic corner ornaments
- A message area that updates in-place when events fire, with smooth cross-fade transitions
- An event badge showing what triggered each transmission
- A cycling status line at the bottom

Each of the 16 factions has a unique visual palette: background gradient, glow color, accent, and faction tag.

### Status Bar Presence

An ambient companion in your status bar with rotating Imperial status labels and occasional flavor transmissions.

- Rotating labels every 5 minutes
- Transmissions delivered every 40–60 minutes
- Rare reactions on file save (8% chance)

### Trigger Events

Messages update in the sidebar view automatically when these events fire:

| Event         | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| `projectOpen` | Fires 3.5 seconds after VS Code opens a workspace                 |
| `taskSuccess` | Build/test task exits with code 0                                 |
| `taskFail`    | Build/test task exits with non-zero code                          |
| `gitCommit`   | `.git/COMMIT_EDITMSG` changes (detects a new commit)              |
| `longSession` | Fires after N hours of continuous editing (configurable)          |
| `ambient`     | Random unprompted appearance at configurable frequency            |
| `lateNight`   | Ambient variant that fires automatically between midnight and 5am |

Each faction has a dedicated voice pool for every event — 7 events × 16 factions.

**Tech-Priest Mode:** on `projectOpen`, the workspace is inspected for a recognizable manifest (React, Vue, Rust, Go, Python, Node) and the transmission is tailored to the detected stack.

**Purity Seal milestones:** a lifetime commit counter persists across sessions; a notification fires at 10, 50, 100, 250, 500, and 1000 commits.

### Commands

| Command                                       | Description                                    |
| --------------------------------------------- | ---------------------------------------------- |
| `Warhammer 40k: Toggle Servo-Skull Companion` | Enable or disable the status bar companion     |
| `Warhammer 40k: Consult the Servo-Skull`      | Request an immediate status bar transmission   |
| `Warhammer 40k: Summon the Servo-Skull`       | Trigger an ambient transmission in the sidebar |
| `Warhammer 40k: Customize Theme (Inject Colour Rites)` | Layer a curated chrome palette on the active theme |
| `Warhammer 40k: Open the Inquisition Terminal` | Reopen the welcome page                        |
| `Warhammer 40k: Consult the Librarium`        | Open the project knowledge graph               |
| `Warhammer 40k: Refresh Librarium`            | Re-index the workspace from scratch            |
| `Warhammer 40k: Focus Librarium on Current File` | Open the Librarium focused on the active file |

### Settings

```json
{
  "warhammer.companion.enabled": true,
  "warhammer.companion.notificationsEnabled": true,
  "warhammer.companion.saveReactions": true,
  "warhammer.companion.customMessages": [],

  "warhammer.mascot.enabled": true,
  "warhammer.mascot.faction": "auto",
  "warhammer.mascot.displayDuration": 8,
  "warhammer.mascot.ambientFrequency": "rare",
  "warhammer.mascot.longSessionThreshold": 2,

  "warhammer.librarium.maxFiles": 2500
}
```

`faction` accepts `"auto"` (inherits from active theme) or any of the 16 faction keys:

| Value           | Faction                                         |
| --------------- | ----------------------------------------------- |
| `bloodAngels`   | Blood Angels — noble crimson authority          |
| `deathwatch`    | Deathwatch — tactical dark precision            |
| `necrons`       | Necrons — ancient machine consciousness         |
| `ultramarines`  | Ultramarines — codex-adherent authority         |
| `mechanicus`    | Adeptus Mechanicus — sacred machine communion   |
| `deathGuard`    | Death Guard — plague-touched endurance          |
| `salamanders`   | Salamanders — forge-craft and kinship           |
| `imperialFists` | Imperial Fists — unyielding fortification       |
| `craftEldar`    | Craftworld Eldar — ancient sorrowful foresight  |
| `tau`           | Tau Empire — the Greater Good                   |
| `whiteScars`    | White Scars — speed and open sky                |
| `thousandSons`  | Thousand Sons — cursed arcane knowledge         |
| `sistersBattle` | Sisters of Battle — faith as weapon and shield  |
| `ravenGuard`    | Raven Guard — strike from silence               |
| `alphaLegion`   | Alpha Legion — every plan has a plan            |
| `custodes`      | Adeptus Custodes — gold-clad imperial certainty |

`companion.customMessages` accepts an array of your own lore lines; they are merged into the ambient and event-driven pools alongside the built-in faction voices.

`ambientFrequency` accepts `"off"`, `"rare"` (every 90–130 min), or `"occasional"` (every 45–75 min).

---

## Language Support

Full semantic highlighting for:

- TypeScript / JavaScript / JSX / TSX
- Python
- Rust
- Go
- CSS / SCSS / Less
- HTML / JSX
- JSON / YAML / TOML
- Markdown
- Shell / Bash
- C / C++ / C#
- Java / Kotlin
- Ruby / PHP

---

## Semantic Highlighting

Enable semantic highlighting for the best experience:

```json
{
  "editor.semanticHighlighting.enabled": true
}
```

---

## Recommended Settings

```json
{
  "editor.fontFamily": "'JetBrains Mono', 'Fira Code', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 13,
  "editor.lineHeight": 22,
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",
  "workbench.tree.indent": 16,
  "editor.bracketPairColorization.enabled": true
}
```

---

## Roadmap

- [x] Icon theme with Imperial sigils for common file types
- [x] Animated servo-skull sidebar companion
- [x] 16 faction themes — 10 dark, 6 light
- [x] 16-faction mascot with distinct voice lines and visual palettes
- [x] Late-night transmission events
- [x] Purity seal notifications for milestone commits
- [x] Theme customization and per-key colour tuning
- [x] Librarium: local project knowledge graph (TypeScript, JavaScript, TSX/JSX, Go)
- [x] Circular dependency detection and dependency hubs
- [ ] Librarium: Go analysis via a true AST
- [ ] Librarium: `tsconfig` path-alias resolution and multi-root workspaces
- [ ] Sound pack: cogitator hum, servo-skull chirps (opt-in)

---

## License

MIT — _In the Emperor's name, this code may be freely distributed._
