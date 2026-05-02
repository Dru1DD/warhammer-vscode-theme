# Changelog

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
