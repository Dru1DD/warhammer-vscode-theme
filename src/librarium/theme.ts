/**
 * Faction-aware theming for the Librarium webview.
 *
 * Rather than sixteen stylesheets, the panel ships one stylesheet driven by a
 * handful of semantic CSS variables. This module derives those variables from
 * the faction palette the mascot already defines (single source of truth) and
 * from the active theme's light/dark kind, so a light faction theme gets a
 * light Librarium without a second palette table.
 */

import * as vscode from 'vscode';
import { FACTION_PALETTE, getFactionFromThemeName, type Faction } from '../mascot';

export interface LibrariumTheme {
  faction: Faction;
  factionTag: string;
  isLight: boolean;
  variables: Record<string, string>;
}

/** The faction implied by the active color theme. */
export function activeFaction(): Faction {
  const themeName = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme', '');
  return getFactionFromThemeName(themeName);
}

/** Mixes `hex` toward white/black by `amount` (0..1). Used for tints only. */
function shade(hex: string, amount: number, toward: 'light' | 'dark'): string {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const target = toward === 'light' ? 255 : 0;
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16);
    return Math.round(c + (target - c) * amount);
  });
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

export function buildTheme(): LibrariumTheme {
  const faction = activeFaction();
  const palette = FACTION_PALETTE[faction];
  const isLight = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light ||
    vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrastLight;

  const accent = palette.accent;

  const variables: Record<string, string> = isLight
    ? {
      '--librarium-background': '#f2efe9',
      '--librarium-surface': '#faf8f4',
      '--librarium-surface-raised': '#ffffff',
      '--librarium-border': 'rgba(0,0,0,0.12)',
      '--librarium-border-strong': 'rgba(0,0,0,0.24)',
      '--librarium-text': '#1e1c19',
      '--librarium-muted': '#6c665d',
      '--librarium-accent': shade(accent, 0.1, 'dark'),
      '--librarium-accent-soft': `rgba(${palette.glowRgb}, 0.14)`,
      '--librarium-node': '#ffffff',
      '--librarium-node-text': '#1e1c19',
      '--librarium-node-selected': shade(accent, 0.06, 'dark'),
      '--librarium-node-dim': 'rgba(0,0,0,0.18)',
      '--librarium-edge': 'rgba(0,0,0,0.22)',
      '--librarium-edge-active': `rgba(${palette.glowRgb}, 0.85)`,
      '--librarium-warning': '#a2321f',
    }
    : {
      '--librarium-background': palette.bgBase,
      '--librarium-surface': shade(palette.bgTint, 0.06, 'light'),
      '--librarium-surface-raised': shade(palette.bgTint, 0.12, 'light'),
      '--librarium-border': 'rgba(255,255,255,0.09)',
      '--librarium-border-strong': `rgba(${palette.glowRgb}, 0.38)`,
      '--librarium-text': '#e8e4dc',
      '--librarium-muted': '#8b8579',
      '--librarium-accent': accent,
      '--librarium-accent-soft': `rgba(${palette.glowRgb}, 0.16)`,
      '--librarium-node': shade(palette.bgTint, 0.16, 'light'),
      '--librarium-node-text': '#e8e4dc',
      '--librarium-node-selected': accent,
      '--librarium-node-dim': 'rgba(255,255,255,0.06)',
      '--librarium-edge': 'rgba(255,255,255,0.14)',
      '--librarium-edge-active': `rgba(${palette.glowRgb}, 0.9)`,
      '--librarium-warning': '#d8703c',
    };

  variables['--librarium-gold'] = palette.gold;
  variables['--librarium-glow-rgb'] = palette.glowRgb;

  return { faction, factionTag: palette.tag, isLight, variables };
}
