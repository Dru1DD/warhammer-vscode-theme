# Warhammer 40k: Grimdark Elite

> *"In the grim darkness of the far future, there is only code."*

A premium VS Code theme collection inspired by the Blood Angels and Deathwatch chapters. Designed for developers who want **elegant**, **atmospheric**, and **genuinely comfortable** tooling — not a gamer aesthetic.

---

## Installation

### From VSIX (local build)

**Requirements:** Node.js 18+, VS Code 1.85+

```bash
# 1. Install dependencies and package the extension
npm install
npm run package

# 2. Install into VS Code
code --install-extension warhammer-40k-theme-0.2.0.vsix
```

Or install via the VS Code UI:

1. Open VS Code
2. `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Run **Extensions: Install from VSIX...**
4. Select `warhammer-40k-theme-0.2.0.vsix`
5. Reload VS Code when prompted

### Apply the theme

`Cmd+Shift+P` → **Preferences: Color Theme** → select **Blood Angels** or **Deathwatch**

---

## Themes

### Blood Angels

Noble crimson elite aesthetic. Deep charcoal base with restrained crimson accents and relic gold syntax highlighting. The red is rare. When it appears, it means something.

**Palette feel:** Cathedral starship. Command deck of a strike cruiser.

### Deathwatch

Tactical black-silver aesthetic. Near-pure obsidian base with cool steel-grey tones and dim amber function highlights. No dominant color — only precision.

**Palette feel:** Kill-team insertion point. Void-black armor. One silver arm.

---

## Design Philosophy

This theme is built around three constraints:

1. **Clarity first** — readable at 6+ hours of daily use without eye strain
2. **Restraint** — Warhammer influence is atmospheric, not decorative
3. **Premium feel** — closer to Cursor or Linear's visual design than a gaming overlay

The crimson in Blood Angels is used only for active states, errors, and critical accents. The syntax hierarchy is clear: functions are gold, keywords are steel-blue, strings are warm parchment, types are soft lilac-silver.

---

## Servo-Skull Companion

### Status Bar Presence

An ambient companion that manifests in your status bar with rotating Imperial status labels and occasional flavor transmissions.

- Rotating labels every 5 minutes
- Transmissions delivered every 40–60 minutes
- Rare reactions on file save (8% chance)

### Mascot Companion

A floating Servo-Skull that appears beside your editor during key IDE moments. It never steals focus, never blocks your code, and fades away on its own.

**Triggers:**

| Moment | Example message |
|---|---|
| Project open | *"Litany of Awakening complete."* |
| Successful build/task | *"Machine Spirit appeased."* |
| Failed build/task | *"Tech-Heresy detected. Purge and recommit."* |
| Git commit | *"The Codex records your actions."* |
| Long coding session | *"Even in death, code still serves."* |
| Ambient | *"Faith is compiled in silence."* |

Messages differ between Blood Angels and Deathwatch factions. Faction is auto-detected from your active color theme, or set manually in settings.

**Commands:**

| Command | Description |
|---|---|
| `Warhammer 40k: Toggle Servo-Skull Companion` | Enable or disable the status bar companion |
| `Warhammer 40k: Consult the Servo-Skull` | Request an immediate status bar transmission |
| `Warhammer 40k: Summon the Servo-Skull` | Trigger an immediate mascot appearance |
| `Warhammer 40k: Dismiss the Servo-Skull` | Close the mascot panel immediately |

**Settings:**

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
- [x] Animated servo-skull webview companion
- [ ] Chapter selector: Ultramarines, Space Wolves, Dark Angels variants
- [ ] Sound pack: cogitator hum, servo-skull chirps (opt-in)
- [ ] Purity seal notifications for milestone commits

---

## License

MIT — *In the Emperor's name, this code may be freely distributed.*
