# Changelog

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
