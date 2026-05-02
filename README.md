# Warhammer 40k: Grimdark Elite

> *"In the grim darkness of the far future, there is only code."*

A premium VS Code theme collection inspired by the Blood Angels and Deathwatch chapters. Designed for developers who want **elegant**, **atmospheric**, and **genuinely comfortable** tooling — not a gamer aesthetic.

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

An optional ambient companion that manifests in your status bar.

**Features:**
- Rotating status bar presence with Imperial transmissions
- Occasional flavor messages (40–60 minute intervals, disabled by default in focus mode)
- Rare reactions when you save files (8% chance)
- Fully configurable — disable any aspect independently

**Commands:**
- `Warhammer 40k: Toggle Servo-Skull Companion` — activate or dismiss
- `Warhammer 40k: Consult the Servo-Skull` — request an immediate transmission

**Settings:**
```json
{
  "warhammer.companion.enabled": true,
  "warhammer.companion.notificationsEnabled": true,
  "warhammer.companion.saveReactions": true
}
```

---

## Installation

**Via VS Code Marketplace:**
Search for "Warhammer 40k Grimdark Elite" and install.

**Via VSIX (local):**
```bash
npm install
npm run compile
npx vsce package
code --install-extension warhammer-40k-theme-0.1.0.vsix
```

**Apply the theme:**
`Ctrl+Shift+P` → `Preferences: Color Theme` → select **Blood Angels** or **Deathwatch**

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
- [ ] Animated servo-skull webview panel (sidebar companion)
- [ ] Chapter selector: Ultramarines, Space Wolves, Dark Angels variants
- [ ] Sound pack: cogitator hum, servo-skull chirps (opt-in)
- [ ] Purity seal notifications for milestone commits

---

## License

MIT — *In the Emperor's name, this code may be freely distributed.*
