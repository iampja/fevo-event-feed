import request from 'supertest';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../server';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const INTERNAL_TOKEN = 'internal-dev-token';

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.migrate.latest();

  // Clean all tables in dependency order
  await db('event_feed_segment_offers').del();
  await db('event_feed_segments').del();
  await db('feed_exclusions').del();
  await db('event_feed_kills').del();
  await db('feed_cache').del();
  await db('api_keys').del();
  await db('offers').del();

  const now = new Date().toISOString();

  // Insert a few distribution-enabled active offers so the refresh has data
  const offers = Array.from({ length: 3 }, (_, i) => ({
    id: `refresh-offer-${i + 1}`,
    title: `Refresh Test Offer ${i + 1}`,
    description: `Offer for feed refresh test ${i + 1}`,
    image_url: null,
    price_min: 15 * (i + 1),
    price_max: 60 * (i + 1),
    currency: 'USD',
    date: `2026-0${i + 5}-10T19:00:00Z`,
    venue_name: 'Test Arena',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-refresh-test',
    organization_name: 'Refresh Test Org',
    checkout_url: `https://example.com/refresh-${i + 1}`,
    tags: JSON.stringify(['test']),
    status: 'active',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  // Also insert 1 inactive offer (should not be counted in feed)
  const inactiveOffer = {
    id: 'refresh-offer-inactive',
    title: 'Inactive Refresh Offer',
    description: 'Should not appear in feed',
    image_url: null,
    price_min: 10,
    price_max: 40,
    currency: 'USD',
    date: '2026-01-01T19:00:00Z',
    venue_name: 'Old Venue',
    venue_city: 'Boston',
    venue_state: 'MA',
    availability: 'available',
    organization_id: 'org-refresh-test',
    organization_name: 'Refresh Test Org',
    checkout_url: 'https://example.com/refresh-inactive',
    tags: JSON.stringify(['test']),
    status: 'inactive',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  };

  await db('offers').insert([...offers, inactiveOffer]);

  await buildFeedIndex();
});

afterAll(async () => {
  await db('event_feed_segment_offers').del();
  await db('event_feed_segments').del();
  await db('feed_exclusions').del();
  await db('event_feed_kills').del();
  await db('feed_cache').del();
  await db('api_keys').del();
  await db('offers').del();
  await db.destroy();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/v1/event-feed/admin/feed/refresh', () => {
  it('should rebuild the feed cache and return offer_count and rebuilt_at', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/feed/refresh')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.message).toMatch(/rebuilt/i);
    expect(res.body.data.offer_count).toBe(3); // only the 3 active+enabled offers
    expect(res.body.data.rebuilt_at).toBeDefined();

    // Validate rebuilt_at is a valid ISO date string
    const rebuiltAt = new Date(res.body.data.rebuilt_at);
    expect(rebuiltAt.getTime()).not.toBeNaN();
  });

  it('should reflect new data after adding an offer and refreshing', async () => {
    const now = new Date().toISOString();

    // Insert a new active+enabled offer directly into the DB
    await db('offers').insert({
      id: 'refresh-offer-new',
      title: 'Newly Added Offer',
      description: 'Added after initial build',
      image_url: null,
      price_min: 20,
      price_max: 80,
      currency: 'USD',
      date: '2026-09-01T19:00:00Z',
      venue_name: 'New Arena',
      venue_city: 'Chicago',
      venue_state: 'IL',
      availability: 'available',
      organization_id: 'org-refresh-test',
      organization_name: 'Refresh Test Org',
      checkout_url: 'https://example.com/refresh-new',
      tags: JSON.stringify(['new']),
      status: 'active',
      distribution_enabled: true,
      distribution_enabled_at: now,
      distribution_disabled_at: null,
      created_at: now,
      updated_at: now,
    });

    // Refresh the feed
    const res = await request(app)
      .post('/api/v1/event-feed/admin/feed/refresh')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    // Should now include the new offer
    expect(res.body.data.offer_count).toBe(4);
  });
});

describe('Feed refresh authentication', () => {
  it('should return 401 without auth', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/feed/refresh')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 with invalid auth token', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/feed/refresh')
      .set('x-internal-auth', 'bad-token')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});
