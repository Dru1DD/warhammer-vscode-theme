# Changelog

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
