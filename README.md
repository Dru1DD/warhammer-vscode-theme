# Warhammer 40k: Grimdark Elite

> *"In the grim darkness of the far future, there is only code."*

A premium VS Code theme collection inspired by the factions of Warhammer 40k. Designed for developers who want **elegant**, **atmospheric**, and **genuinely comfortable** tooling — not a gamer aesthetic.

Sixteen themes. Ten dark. Six light. One Servo-Skull that watches everything.

---

## Installation

### From VSIX (local build)

**Requirements:** Node.js 18+, VS Code 1.85+

```bash
# 1. Install dependencies and package the extension
npm install
npm run package

# 2. Install into VS Code
code --install-extension warhammer-40k-theme-0.5.0.vsix
```

Or install via the VS Code UI:

1. Open VS Code
2. `Cmd+Shift+P` (macOS) / `Ctrl+Shift+P` (Windows/Linux)
3. Run **Extensions: Install from VSIX...**
4. Select `warhammer-40k-theme-0.5.0.vsix`
5. Reload VS Code when prompted

### Apply a theme

`Cmd+Shift+P` → **Preferences: Color Theme** → select your faction

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

| Role | Color |
|---|---|
| Keywords | Spectral green |
| Functions | Necrodermis teal |
| Types | Void teal |
| Strings | Muted cold-green |

#### Ultramarines

Imperial blue and gold on dark navy. Highly readable. Structured like a tactical display.

**Palette feel:** Fortress Monastery command room. Codex Astartes printed in gilt on vellum.

| Role | Color |
|---|---|
| Keywords | Imperial blue |
| Functions | Imperial gold |
| Types | Steel blue |
| Strings | Parchment |

#### Adeptus Mechanicus

Dark industrial red-brown with brass and amber. Techno-religious. Terminal-precise.

**Palette feel:** Forge World cogitator array. The Omnissiah's logic engines processing litanies.

| Role | Color |
|---|---|
| Keywords | Amber-brass |
| Functions | Bright brass |
| Types | Copper |
| Strings | Warm amber inscription |

#### Death Guard

Murky organic greens and bone yellows. Heavy contrast. Slow, inevitable palette.

**Palette feel:** Plague hulk drifting through the warp. Decay as permanence.

| Role | Color |
|---|---|
| Keywords | Plague green |
| Functions | Bone yellow |
| Types | Murky grey-green |
| Strings | Dirty amber |

#### Salamanders

Warm forest greens and forge amber on near-black. Mid-dark — brighter than the grimdark originals, designed for daytime use without sacrificing atmosphere.

**Palette feel:** Nocturne forge. Vulkan's armoury. Fire-lit promethium vault.

| Role | Color |
|---|---|
| Keywords | Forest green |
| Functions | Forge amber |
| Types | Muted grey-green |
| Strings | Warm amber |

#### Imperial Fists

Warm charcoal base with controlled tactical gold. Subdued and readable — the gold appears only where it earns its place.

**Palette feel:** Phalanx command deck. Siege warfare conducted with perfect patience.

| Role | Color |
|---|---|
| Keywords | Dull gold |
| Functions | Tactical gold |
| Types | Warm grey |
| Strings | Aged parchment |

#### Craftworld Eldar

Cool blue-grey base with pale silver-blue and soft violet. Refined, alien, impossibly precise. Every element feels considered.

**Palette feel:** Craftworld wraithbone spire. An infinity circuit parsing ancient light.

| Role | Color |
|---|---|
| Keywords | Muted blue |
| Functions | Pale silver-blue |
| Types | Soft violet |
| Strings | Deep teal |

#### Tau Empire

Dark blue-grey base with clean ice-blue function highlights and controlled steel accents. Modern, tactical, uncluttered.

**Palette feel:** Kor'vattra command interface. The Greater Good rendered in pure signal.

| Role | Color |
|---|---|
| Keywords | Steel blue |
| Functions | Ice blue |
| Types | Blue-grey |
| Strings | Cool teal |

---

### Light Themes

Built for daytime use. Parchment, stone, and marble backgrounds — not white. Each retains its faction's visual identity without resorting to a generic light mode.

#### White Scars

Pale stone base with muted crimson accents and tactical grey. Swift and clean — the fastest Chapter rendered in light.

**Palette feel:** Open steppe horizon. White armor under a wide sky. Wind before the charge.

| Role | Color |
|---|---|
| Keywords | Muted crimson |
| Functions | Deep slate-blue |
| Types | Tactical blue-grey |
| Strings | Dark crimson-brown |

#### Thousand Sons

Dusty blue-parchment base with arcane dusty blue and turquoise function highlights. Scholarly, cursed, precise.

**Palette feel:** Tizca before the burning. Illuminated manuscripts beneath a cyclopean sky.

| Role | Color |
|---|---|
| Keywords | Arcane dusty blue |
| Functions | Arcane turquoise |
| Types | Deep violet |
| Strings | Aged ochre |

#### Sisters of Battle

Warm ivory base with cathedral crimson and relic gold. Devotional intensity held in careful check.

**Palette feel:** Ecclesiarchy scriptorium. Candle-lit iron and gilt.

| Role | Color |
|---|---|
| Keywords | Cathedral crimson |
| Functions | Relic gold |
| Types | Deep burgundy |
| Strings | Dusty ochre |

#### Raven Guard

Fog-grey base with dark tactical slate and pale silver. Quiet. Deliberate. Nothing wasted.

**Palette feel:** Low cloud over a ruined hive. Shadow-black armour in mist.

| Role | Color |
|---|---|
| Keywords | Dark tactical slate |
| Functions | Tactical blue-grey |
| Types | Deep blue-slate |
| Strings | Muted teal |

#### Alpha Legion

Muted teal base with layered blue-grey contrast. Every layer has a layer beneath it.

**Palette feel:** Hydra-cell coordination grid. A plan within a plan within a plan.

| Role | Color |
|---|---|
| Keywords | Deep teal-blue |
| Functions | Layered teal |
| Types | Slate blue |
| Strings | Steel-teal |

#### Custodes

Pale warm marble base with restrained gold and imperial ivory. Authoritative without ostentation.

**Palette feel:** Sanctum Imperialis atrium. Gold-chased marble. Ten thousand years of patience.

| Role | Color |
|---|---|
| Keywords | Deep amber-brown |
| Functions | Restrained gold |
| Types | Warm umber |
| Strings | Muted ochre |

---

## Design Philosophy

All sixteen themes are built around three constraints:

1. **Clarity first** — readable at 6+ hours of daily use without eye strain
2. **Restraint** — Warhammer influence is atmospheric, not decorative
3. **Premium feel** — closer to Cursor or Linear's visual design than a gaming overlay

Faction identity lives in the syntax hierarchy and active UI states. Dark themes use near-black backgrounds with only a faction-tinted hint. Light themes use parchment, stone, or marble rather than white — faction color appears on functions (most prominent), keywords (structural), and accent elements. No saturated neon anywhere.

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

| Event | Description |
|---|---|
| `projectOpen` | Fires 3.5 seconds after VS Code opens a workspace |
| `taskSuccess` | Build/test task exits with code 0 |
| `taskFail` | Build/test task exits with non-zero code |
| `gitCommit` | `.git/COMMIT_EDITMSG` changes (detects a new commit) |
| `longSession` | Fires after N hours of continuous editing (configurable) |
| `ambient` | Random unprompted appearance at configurable frequency |
| `lateNight` | Ambient variant that fires automatically between midnight and 5am |

Each faction has a dedicated voice pool for every event — 7 events × 16 factions.

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

`faction` accepts `"auto"` (inherits from active theme) or any of the 16 faction keys:

| Value | Faction |
|---|---|
| `bloodAngels` | Blood Angels — noble crimson authority |
| `deathwatch` | Deathwatch — tactical dark precision |
| `necrons` | Necrons — ancient machine consciousness |
| `ultramarines` | Ultramarines — codex-adherent authority |
| `mechanicus` | Adeptus Mechanicus — sacred machine communion |
| `deathGuard` | Death Guard — plague-touched endurance |
| `salamanders` | Salamanders — forge-craft and kinship |
| `imperialFists` | Imperial Fists — unyielding fortification |
| `craftEldar` | Craftworld Eldar — ancient sorrowful foresight |
| `tau` | Tau Empire — the Greater Good |
| `whiteScars` | White Scars — speed and open sky |
| `thousandSons` | Thousand Sons — cursed arcane knowledge |
| `sistersBattle` | Sisters of Battle — faith as weapon and shield |
| `ravenGuard` | Raven Guard — strike from silence |
| `alphaLegion` | Alpha Legion — every plan has a plan |
| `custodes` | Adeptus Custodes — gold-clad imperial certainty |

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
- [x] 16 faction themes — 10 dark, 6 light
- [x] 16-faction mascot with distinct voice lines and visual palettes
- [x] Late-night transmission events
- [ ] Sound pack: cogitator hum, servo-skull chirps (opt-in)
- [ ] Purity seal notifications for milestone commits

---

## License

MIT — *In the Emperor's name, this code may be freely distributed.*
