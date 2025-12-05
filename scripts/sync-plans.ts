#!/usr/bin/env tsx

/**
 * Sync Plans Script
 *
 * Syncs subscription plans from LemonSqueezy API to local database.
 *
 * Usage:
 *   npm run sync:plans
 *   # or
 *   tsx scripts/sync-plans.ts
 *
 * This script should be run:
 * - After setting up LemonSqueezy for the first time
 * - When adding new plans in LemonSqueezy dashboard
 * - When updating plan pricing or details
 */

import { syncPlansFromLemonSqueezy } from '../src/lib/services/billing';

async function main() {
  console.log('🔄 Syncing plans from LemonSqueezy...\n');

  try {
    const plans = await syncPlansFromLemonSqueezy();

    console.log(`✅ Successfully synced ${plans.length} plans:\n`);

    plans.forEach((plan) => {
      const price = (parseInt(plan.price) / 100).toFixed(2);
      console.log(`  - ${plan.name} ($${price}/${plan.interval})`);
      console.log(`    Variant ID: ${plan.variantId}`);
      console.log(`    Active: ${plan.isActive ? '✓' : '✗'}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to sync plans:', error);
    process.exit(1);
  }
}

main();
