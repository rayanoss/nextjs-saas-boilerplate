import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';
import { getWebhookSecret } from '@/lib/config/lemonsqueezy';
import { storeWebhookEvent, processWebhookEvent } from '@/lib/services/webhooks';

/**
 * LemonSqueezy Webhook Handler
 *
 * Receives and processes webhooks from LemonSqueezy for subscription events.
 *
 * Implementation notes:
 * - Verifies webhook signature for security
 * - Uses store-then-process pattern for idempotency
 * - Returns 200 OK immediately (processes async)
 * - Handles webhook events: subscription_created, subscription_updated, etc.
 *
 * @see https://docs.lemonsqueezy.com/guides/developer-guide/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Get signature from header
    const signature = request.headers.get('x-signature');

    if (!signature) {
      console.error('[WEBHOOK] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Verify webhook signature
    const webhookSecret = getWebhookSecret();
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = hmac.update(rawBody).digest('hex');

    if (digest !== signature) {
      console.error('[WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Extract event name
    const eventName = body.meta?.event_name;

    if (!eventName) {
      console.error('[WEBHOOK] Missing event_name in payload');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`[WEBHOOK] Received event: ${eventName}`);

    // Store webhook event immediately (idempotency)
    const webhookEvent = await storeWebhookEvent(eventName, body);

    // Process webhook asynchronously (don't block response)
    setImmediate(() => {
      processWebhookEvent(webhookEvent.id).catch((error) => {
        console.error('[WEBHOOK] Processing error:', error);
      });
    });

    // Return 200 OK immediately to LemonSqueezy
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[WEBHOOK] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
