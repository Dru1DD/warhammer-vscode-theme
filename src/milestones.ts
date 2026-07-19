import * as vscode from 'vscode';

/**
 * Feature 4 — Purity Seal Milestones.
 *
 * Persists a lifetime commit counter in `globalState` and awards a native
 * notification when the count crosses a milestone. This lives OUTSIDE the
 * mascot pacing engine on purpose: every commit must be counted, even the ones
 * where the servo-skull stays silent because of its rarity/cooldown gates.
 */

const COUNTER_KEY = 'warhammer.commitCount';
const MILESTONES: readonly number[] = [10, 50, 100, 250, 500, 1000];

/** Commit watchers can fire create+change for a single commit; collapse those. */
const DEBOUNCE_MS = 4_000;

export class PuritySealTracker {
  private lastCommitAt = 0;

  constructor(private readonly context: vscode.ExtensionContext) {}

  get count(): number {
    return this.context.globalState.get<number>(COUNTER_KEY, 0);
  }

  /**
   * Records a single commit. Debounced so a paired create/change from the
   * file-system watcher counts once. Awards a Purity Seal on milestone counts.
   */
  async recordCommit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCommitAt < DEBOUNCE_MS) return;
    this.lastCommitAt = now;

    const next = this.count + 1;
    await this.context.globalState.update(COUNTER_KEY, next);

    if (MILESTONES.includes(next)) {
      this.award(next);
    }
  }

  private award(count: number): void {
    void vscode.window.showInformationMessage(
      `✚ PURITY SEAL AWARDED ✚  —  ${count} commits sanctified. ` +
        'The Omnissiah records your diligence in the eternal ledger.'
    );
  }
}
