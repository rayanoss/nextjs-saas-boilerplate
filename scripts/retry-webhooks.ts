#!/usr/bin/env tsx

/**
 * Retry Failed Webhooks Script
 *
 * Retries ALL webhook events that failed processing.
 * Should be run periodically via cron job (e.g., every hour).
 *
 * Usage:
 *   npm run retry:webhooks
 *
 * Setup cron job on VPS:
 *   crontab -e
 *   0 * * * * cd /path/to/app && npm run retry:webhooks >> /var/log/webhooks-retry.log 2>&1
 */

import { getUnprocessedEvents, processWebhookEvent } from '../src/lib/services/webhooks';

const ALERT_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

async function main() {
  console.log('[WEBHOOK_RETRY] Starting retry process');

  try {
    const unprocessedEvents = await getUnprocessedEvents();

    if (unprocessedEvents.length === 0) {
      console.log('[WEBHOOK_RETRY] No failed webhooks found');
      process.exit(0);
    }

    console.log(`[WEBHOOK_RETRY] Found ${unprocessedEvents.length} unprocessed webhooks`);

    let successCount = 0;
    let failCount = 0;
    const oldWebhooks: string[] = [];

    for (const event of unprocessedEvents) {
      const age = Date.now() - new Date(event.createdAt).getTime();
      const ageHours = Math.floor(age / (1000 * 60 * 60));

      console.log(`[WEBHOOK_RETRY] Processing webhook ${event.id} (${event.eventName}, age: ${ageHours}h)`);

      if (age > ALERT_THRESHOLD_MS) {
        oldWebhooks.push(`${event.eventName} (${event.id}) - ${ageHours}h old`);
      }

      try {
        await processWebhookEvent(event.id);
        successCount++;
        console.log(`[WEBHOOK_RETRY] SUCCESS - Webhook ${event.id} processed`);
      } catch (error) {
        failCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[WEBHOOK_RETRY] FAILED - Webhook ${event.id}: ${errorMessage}`);
      }
    }

    console.log(`[WEBHOOK_RETRY] Summary: ${successCount} succeeded, ${failCount} failed`);

    if (oldWebhooks.length > 0) {
      console.warn('[WEBHOOK_RETRY] WARNING: Webhooks older than 24h detected:');
      oldWebhooks.forEach((msg) => console.warn(`  - ${msg}`));
      console.warn('[WEBHOOK_RETRY] Manual investigation required');
    }

    console.log('[WEBHOOK_RETRY] Retry process completed');

    if (failCount > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('[WEBHOOK_RETRY] Fatal error:', error);
    process.exit(1);
  }
}

main();
