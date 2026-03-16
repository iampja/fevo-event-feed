/**
 * In-memory sync progress tracker.
 * Stores timestamped log lines per sync ID so the admin UI can poll for live updates.
 */

interface ProgressEntry {
  time: string;
  message: string;
}

interface SyncProgress {
  syncId: string;
  lines: ProgressEntry[];
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  summary?: { created: number; updated: number; errors: number; duration: string };
}

const progressStore = new Map<string, SyncProgress>();

// Keep only the last 5 sync progress logs to avoid memory leaks
const MAX_STORED = 5;

function prune() {
  if (progressStore.size <= MAX_STORED) return;
  const entries = Array.from(progressStore.entries())
    .sort((a, b) => b[1].startedAt.localeCompare(a[1].startedAt));
  for (let i = MAX_STORED; i < entries.length; i++) {
    progressStore.delete(entries[i][0]);
  }
}

export function startProgress(syncId: string): void {
  progressStore.set(syncId, {
    syncId,
    lines: [{ time: new Date().toISOString(), message: 'Sync started' }],
    status: 'running',
    startedAt: new Date().toISOString(),
  });
  prune();
}

export function logProgress(syncId: string, message: string): void {
  const progress = progressStore.get(syncId);
  if (progress) {
    progress.lines.push({ time: new Date().toISOString(), message });
  }
}

export function completeProgress(
  syncId: string,
  status: 'completed' | 'failed',
  summary?: { created: number; updated: number; errors: number; duration: string },
): void {
  const progress = progressStore.get(syncId);
  if (progress) {
    progress.status = status;
    progress.summary = summary;
    progress.lines.push({
      time: new Date().toISOString(),
      message: status === 'completed'
        ? `Sync completed: ${summary?.created ?? 0} created, ${summary?.updated ?? 0} updated${summary?.errors ? `, ${summary.errors} errors` : ''} (${summary?.duration ?? '?'})`
        : `Sync failed${summary?.errors ? ` with ${summary.errors} errors` : ''}`,
    });
  }
}

export function getProgress(syncId: string): SyncProgress | null {
  return progressStore.get(syncId) || null;
}

/** Get the most recent progress (for when UI doesn't know the syncId yet). */
export function getLatestProgress(): SyncProgress | null {
  let latest: SyncProgress | null = null;
  for (const p of progressStore.values()) {
    if (!latest || p.startedAt > latest.startedAt) {
      latest = p;
    }
  }
  return latest;
}
