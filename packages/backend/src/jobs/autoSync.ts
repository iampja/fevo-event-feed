import cron from 'node-cron';
import { syncAllOrganizations } from '../services/fevoSyncService';

let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Start the cron job that syncs all FEVO organizations every 15 minutes.
 */
export function startAutoSyncJob(): void {
  if (scheduledTask) {
    console.warn('[auto-sync] Job already running');
    return;
  }

  // Every 15 minutes: "*/15 * * * *"
  scheduledTask = cron.schedule('*/15 * * * *', async () => {
    try {
      console.log('[auto-sync] Starting sync of all organizations...');
      const results = await syncAllOrganizations();
      const created = results.reduce((sum, r) => sum + r.offers_created, 0);
      const updated = results.reduce((sum, r) => sum + r.offers_updated, 0);
      console.log(
        `[auto-sync] Sync complete: ${results.length} orgs, ${created} created, ${updated} updated`,
      );
    } catch (err) {
      console.error('[auto-sync] Error syncing organizations:', err);
    }
  });

  console.log('[auto-sync] Cron job scheduled: every 15 minutes');
}

/**
 * Stop the auto-sync cron job.
 */
export function stopAutoSyncJob(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[auto-sync] Cron job stopped');
  }
}
