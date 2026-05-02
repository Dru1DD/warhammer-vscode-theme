# Warhammer 40k: Grimdark Elite

> *"In the grim darkness of the far future, there is only code."*

A premium VS Code theme collection inspired by the factions of Warhammer 40k. Designed for developers who want **elegant**, **atmospheric**, and **genuinely comfortable** tooling — not a gamer aesthetic.

---

## Installation

### From VSIX (local build)

**Requirements:** Node.js 18+, VS Code 1.85+

```bash
# 1. Install dependencies and package the extension
npm install
npm run package

# 2. Install into VS Code
code --install-extension warhammer-40k-theme-0.3.0.vsix
```

Or install via the VS Code UI:

1. Open VS Code
2. `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Run **Extensions: Install from VSIX...**
4. Select `warhammer-40k-theme-0.3.0.vsix`
5. Reload VS Code when prompted

### Apply a theme

`Cmd+Shift+P` → **Preferences: Color Theme** → select your faction

---

## Themes

### Blood Angels

Noble crimson elite aesthetic. Deep charcoal base with restrained crimson accents and relic gold function highlights. The red is rare — when it appears, it means something.

**Palette feel:** Cathedral starship. Command deck of a strike cruiser.

### Deathwatch

Tactical black-silver aesthetic. Near-pure obsidian base with cool steel-grey tones and dim amber function highlights. No dominant color — only precision.

**Palette feel:** Kill-team insertion point. Void-black armor. One silver arm.

### Necrons

Cold metallic greens on obsidian black. Minimal syntax noise. "Digital tomb" aesthetic — structured, ancient, inevitable.

**Palette feel:** Necrodermis awakening. A tomb world processing its first command in sixty million years.

| Role | Color |
|---|---|
| Keywords | Spectral green |
| Functions | Necrodermis teal |
| Types | Void teal |
| Strings | Muted cold-green |

### Ultramarines

Imperial blue and gold on dark navy. Highly readable. Structured like a tactical display.

**Palette feel:** Fortress Monastery command room. Codex Astartes printed in gilt on vellum.

| Role | Color |
|---|---|
| Keywords | Imperial blue |
| Functions | Imperial gold |
| Types | Steel blue |
| Strings | Parchment |

### Adeptus Mechanicus

Dark industrial red-brown with brass and amber. Techno-religious. Terminal-precise.

**Palette feel:** Forge World cogitator array. The Omnissiah's logic engines processing litanies.

| Role | Color |
|---|---|
| Keywords | Amber-brass |
| Functions | Bright brass |
| Types | Copper |
| Strings | Warm amber inscription |

### Death Guard

Murky organic greens and bone yellows. Heavy contrast. Slow, inevitable palette.

**Palette feel:** Plague hulk drifting through the warp. Decay as permanence.

| Role | Color |
|---|---|
| Keywords | Plague green |
| Functions | Bone yellow |
| Types | Murky grey-green |
| Strings | Dirty amber |

---

## Design Philosophy

All six themes are built around three constraints:

1. **Clarity first** — readable at 6+ hours of daily use without eye strain
2. **Restraint** — Warhammer influence is atmospheric, not decorative
3. **Premium feel** — closer to Cursor or Linear's visual design than a gaming overlay

Faction identity lives in the syntax hierarchy and active UI states. The background is always near-black with only a faction-tinted hint. Faction color appears on functions (most prominent), keywords (structural), and accent elements — not saturated across the whole surface.

---

## Servo-Skull Companion

### Explorer Sidebar

The Servo-Skull mascot lives permanently in your **Explorer sidebar**. Open the Explorer panel and look for the **Servo-Skull** section.

The view shows:
- The Servo-Skull mascot with a continuous floating animation and pulsing glow ring
- A Warhammer-style dark background with faction tint, diagonal texture, and gothic corner ornaments
- A message area that updates in-place when events fire, with smooth cross-fade transitions
- An event badge showing what triggered each transmission
- A cycling status line at the bottom

### Status Bar Presence

An ambient companion in your status bar with rotating Imperial status labels and occasional flavor transmissions.

- Rotating labels every 5 minutes
- Transmissions delivered every 40–60 minutes
- Rare reactions on file save (8% chance)

### Trigger Events

Messages update in the sidebar view automatically when these events fire:

| Event | Blood Angels | Deathwatch |
|---|---|---|
| Project open | *"Litany of Awakening complete."* | *"Watch Station active. Standing by."* |
| Successful task | *"Machine Spirit appeased."* | *"Target eliminated. Move to the next."* |
| Failed task | *"Tech-Heresy detected. Purge and recommit."* | *"Abort. Purge. Recommit."* |
| Git commit | *"A purity seal has been applied."* | *"Intel logged. The Watch remembers."* |
| Long session | *"Even in death, code still serves."* | *"Vigilance is the price of deployment."* |
| Ambient | *"Faith is compiled in silence."* | *"The Watch endures."* |

Faction is auto-detected from your active color theme, or set manually in settings.

### Commands

| Command | Description |
|---|---|
| `Warhammer 40k: Toggle Servo-Skull Companion` | Enable or disable the status bar companion |
| `Warhammer 40k: Consult the Servo-Skull` | Request an immediate status bar transmission |
| `Warhammer 40k: Summon the Servo-Skull` | Trigger an ambient transmission in the sidebar |

### Settings

```json
{
  "warhammer.companion.enabled": true,
  "warhammer.companion.notificationsEnabled": true,
  "warhammer.companion.saveReactions": true,

  "warhammer.mascot.enabled": true,
  "warhammer.mascot.faction": "auto",
  "warhammer.mascot.displayDuration": 8,
  "warhammer.mascot.ambientFrequency": "rare",
  "warhammer.mascot.longSessionThreshold": 2
}
```

`faction` accepts `"auto"` (inherits from active theme), `"bloodAngels"`, or `"deathwatch"`.  
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

- [ ] Icon theme with Imperial sigils for common file types
- [x] Animated servo-skull sidebar companion
- [x] Chapter selector: Necrons, Ultramarines, Adeptus Mechanicus, Death Guard
- [ ] Sound pack: cogitator hum, servo-skull chirps (opt-in)
- [ ] Purity seal notifications for milestone commits
- [ ] Faction mascot variants per theme

---

## License

MIT — *In the Emperor's name, this code may be freely distributed.*
