import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const router = Router();

const WEBHOOK_SECRET = process.env.FEVO_WEBHOOK_SECRET || '';

// ── Webhook signature validation ────────────────────────────────────────────

function validateWebhookSignature(req: Request): boolean {
  if (!WEBHOOK_SECRET) {
    // No secret configured — reject all webhooks in production
    if (process.env.NODE_ENV === 'production') return false;
    // Allow in dev for testing
    return true;
  }

  const signature = req.headers['x-fevo-webhook-secret'] as string | undefined;
  if (!signature) return false;

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(WEBHOOK_SECRET)
    );
  } catch {
    return false;
  }
}

// ── POST /fevo/offer-created ────────────────────────────────────────────────

router.post('/fevo/offer-created', async (req: Request, res: Response) => {
  if (!validateWebhookSignature(req)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    const {
      offer_id,
      offer_title,
      offer_url_code,
      event_id,
      event_title,
      event_date_utc,
      organization_id,
      organization_name,
      description,
      image_url,
      video_url,
      price_min,
      price_max,
      currency,
      venue_name,
      venue_city,
      venue_state,
      availability,
      tickets_available,
    } = req.body;

    if (!offer_id || !offer_title) {
      res.status(400).json({ error: 'Missing required fields: offer_id, offer_title' });
      return;
    }

    const now = new Date().toISOString();
    const checkoutUrl = offer_url_code ? `https://fevo.com/edp/${offer_url_code}` : null;

    // Upsert event if provided
    if (event_id) {
      const existingEvent = await db('events').where('fevo_event_id', event_id).first();
      if (!existingEvent) {
        await db('events').insert({
          id: uuidv4(),
          title: event_title || offer_title,
          fevo_event_id: event_id,
          organization_id: organization_id || null,
          venue_id: null,
          date_utc: event_date_utc || null,
          date_timezone: null,
          created_at: now,
          updated_at: now,
        });
      }
    }

    // Create the offer
    const existing = await db('offers').where('fevo_offer_id', offer_id).first();
    if (existing) {
      // Already exists, treat as update
      await db('offers').where('id', existing.id).update({
        title: offer_title,
        description: description ?? existing.description,
        image_url: image_url ?? existing.image_url,
        video_url: video_url ?? existing.video_url,
        price_min: price_min ?? existing.price_min,
        price_max: price_max ?? existing.price_max,
        currency: currency ?? existing.currency,
        date: event_date_utc ?? existing.date,
        venue_name: venue_name ?? existing.venue_name,
        venue_city: venue_city ?? existing.venue_city,
        venue_state: venue_state ?? existing.venue_state,
        availability: availability ?? existing.availability,
        tickets_available: tickets_available ?? existing.tickets_available,
        checkout_url: checkoutUrl ?? existing.checkout_url,
        fevo_url_code: offer_url_code ?? existing.fevo_url_code,
        fevo_synced_at: now,
        source: 'fevo_webhook',
        updated_at: now,
      });
    } else {
      await db('offers').insert({
        id: uuidv4(),
        title: offer_title,
        description: description || null,
        image_url: image_url || null,
        price_min: price_min ?? null,
        price_max: price_max ?? null,
        currency: currency || 'USD',
        date: event_date_utc || null,
        venue_name: venue_name || null,
        venue_city: venue_city || null,
        venue_state: venue_state || null,
        availability: availability || 'available',
        organization_id: organization_id || null,
        organization_name: organization_name || null,
        checkout_url: checkoutUrl,
        tags: null,
        status: 'active',
        distribution_enabled: false,
        fevo_offer_id: offer_id,
        fevo_url_code: offer_url_code || null,
        event_id: null,
        venue_id: null,
        video_url: video_url || null,
        tickets_available: tickets_available ?? null,
        is_sold_out: availability === 'sold_out',
        source: 'fevo_webhook',
        fevo_synced_at: now,
        created_at: now,
        updated_at: now,
      });
    }

    // Rebuild feed cache
    await buildFeedIndex();

    res.status(200).json({ received: true, offer_id });
  } catch (err: any) {
    console.error('Webhook offer-created error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ── POST /fevo/offer-updated ────────────────────────────────────────────────

router.post('/fevo/offer-updated', async (req: Request, res: Response) => {
  if (!validateWebhookSignature(req)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  try {
    const { offer_id, ...updateFields } = req.body;

    if (!offer_id) {
      res.status(400).json({ error: 'Missing required field: offer_id' });
      return;
    }

    const existing = await db('offers').where('fevo_offer_id', offer_id).first();
    if (!existing) {
      res.status(404).json({ error: `Offer not found: ${offer_id}` });
      return;
    }

    const now = new Date().toISOString();
    const updates: Record<string, any> = {
      updated_at: now,
      fevo_synced_at: now,
      source: 'fevo_webhook',
    };

    // Map incoming fields to DB columns
    if (updateFields.offer_title) updates.title = updateFields.offer_title;
    if (updateFields.description !== undefined) updates.description = updateFields.description;
    if (updateFields.image_url !== undefined) updates.image_url = updateFields.image_url;
    if (updateFields.video_url !== undefined) updates.video_url = updateFields.video_url;
    if (updateFields.price_min !== undefined) updates.price_min = updateFields.price_min;
    if (updateFields.price_max !== undefined) updates.price_max = updateFields.price_max;
    if (updateFields.currency) updates.currency = updateFields.currency;
    if (updateFields.event_date_utc) updates.date = updateFields.event_date_utc;
    if (updateFields.venue_name !== undefined) updates.venue_name = updateFields.venue_name;
    if (updateFields.venue_city !== undefined) updates.venue_city = updateFields.venue_city;
    if (updateFields.venue_state !== undefined) updates.venue_state = updateFields.venue_state;
    if (updateFields.availability) {
      updates.availability = updateFields.availability;
      updates.is_sold_out = updateFields.availability === 'sold_out';
    }
    if (updateFields.tickets_available !== undefined) updates.tickets_available = updateFields.tickets_available;
    if (updateFields.offer_url_code) {
      updates.fevo_url_code = updateFields.offer_url_code;
      updates.checkout_url = `https://fevo.com/edp/${updateFields.offer_url_code}`;
    }

    await db('offers').where('id', existing.id).update(updates);

    // Rebuild feed cache
    await buildFeedIndex();

    res.status(200).json({ received: true, offer_id });
  } catch (err: any) {
    console.error('Webhook offer-updated error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
