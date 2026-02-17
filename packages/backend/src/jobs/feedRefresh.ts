import cron from 'node-cron';
import { buildFeedIndex } from '../services/feedService';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the cron job that rebuilds the feed index every 15 minutes.
 */
export function startFeedRefreshJob(): void {
  if (scheduledTask) {
    console.warn('Feed refresh job already running');
    return;
  }

  // Every 15 minutes: "*/15 * * * *"
  scheduledTask = cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[feed-refresh] Rebuilding feed index...');
      const count = await buildFeedIndex();
      console.log(`[feed-refresh] Feed index rebuilt with ${count} offers`);
    } catch (err) {
      console.error('[feed-refresh] Error rebuilding feed index:', err);
    }
  });

  console.log('[feed-refresh] Cron job scheduled: every 15 minutes');
}

/**
 * Stop the cron job (useful for testing/cleanup).
 */
export function stopFeedRefreshJob(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[feed-refresh] Cron job stopped');
  }
}

/**
 * Manually trigger a feed rebuild (useful for admin endpoints / testing).
 */
export async function triggerFeedRefresh(): Promise<number> {
  console.log('[feed-refresh] Manual rebuild triggered');
  const count = await buildFeedIndex();
  console.log(`[feed-refresh] Feed index rebuilt with ${count} offers`);
  return count;
}
