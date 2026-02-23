import request from 'supertest';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../server';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const API_KEY = 'efeed_test_key_dist_abc123';
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

  await db('feed_cache').del();
  await db('api_keys').del();
  await db('offers').del();

  // Insert test API key
  await db('api_keys').insert({
    id: uuidv4(),
    key_hash: hashKey(API_KEY),
    partner_name: 'Distribution Test Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 100,
  });

  const now = new Date().toISOString();

  // Active offer with distribution disabled (for enable test)
  await db('offers').insert({
    id: 'dist-offer-active-disabled',
    title: 'Active Disabled Dist',
    description: 'Active offer with dist disabled',
    image_url: null,
    price_min: 25,
    price_max: 100,
    currency: 'USD',
    date: '2026-06-15T19:00:00Z',
    venue_name: 'MSG',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-dist-test',
    organization_name: 'Dist Test Org',
    checkout_url: 'https://example.com/dist-active-disabled',
    tags: JSON.stringify(['nba']),
    status: 'active',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  });

  // Active offer with distribution enabled (for disable test)
  await db('offers').insert({
    id: 'dist-offer-active-enabled',
    title: 'Active Enabled Dist',
    description: 'Active offer with dist enabled',
    image_url: null,
    price_min: 30,
    price_max: 120,
    currency: 'USD',
    date: '2026-07-20T19:00:00Z',
    venue_name: 'Barclays',
    venue_city: 'Brooklyn',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-dist-test',
    organization_name: 'Dist Test Org',
    checkout_url: 'https://example.com/dist-active-enabled',
    tags: JSON.stringify(['concert']),
    status: 'active',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  });

  // Inactive offer (should fail to enable distribution)
  await db('offers').insert({
    id: 'dist-offer-inactive',
    title: 'Inactive Dist Offer',
    description: 'Inactive offer for dist test',
    image_url: null,
    price_min: 10,
    price_max: 40,
    currency: 'USD',
    date: '2026-01-01T19:00:00Z',
    venue_name: 'Some Venue',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-dist-test',
    organization_name: 'Dist Test Org',
    checkout_url: 'https://example.com/dist-inactive',
    tags: JSON.stringify(['test']),
    status: 'inactive',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  });

  await buildFeedIndex();
});

afterAll(async () => {
  await db('event_feed_segment_offers').del();
  await db('event_feed_segments').del();
  await db('feed_exclusions').del();

  await db('feed_cache').del();
  await db('api_keys').del();
  await db('offers').del();
  await db.destroy();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PUT /api/v1/event-feed/admin/offers/:offerId/distribution', () => {
  it('should enable distribution for an active offer', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/dist-offer-active-disabled/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ enabled: true })
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.offer_id).toBe('dist-offer-active-disabled');
    expect(res.body.data.distribution_enabled).toBe(true);
    expect(res.body.data.distribution_enabled_at).toBeDefined();
  });

  it('should disable distribution for an enabled offer', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/dist-offer-active-enabled/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ enabled: false })
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.offer_id).toBe('dist-offer-active-enabled');
    expect(res.body.data.distribution_enabled).toBe(false);
    expect(res.body.data.distribution_disabled_at).toBeDefined();
  });

  it('should return 404 for non-existent offer', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/non-existent-offer/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ enabled: true })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 422 when enabling distribution for a non-active offer', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/dist-offer-inactive/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ enabled: true })
      .expect(422);

    expect(res.body.error).toMatch(/Cannot enable/i);
  });

  it('should return 400 when enabled field is missing', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/dist-offer-active-disabled/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });
});

describe('GET /api/v1/event-feed/admin/offers/:offerId/distribution', () => {
  it('should return current distribution status', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/dist-offer-active-disabled/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.offer_id).toBe('dist-offer-active-disabled');
    expect(typeof res.body.data.distribution_enabled).toBe('boolean');
    expect(res.body.data.offer_status).toBeDefined();
    expect(res.body.data.offer_title).toBeDefined();
  });

  it('should return 404 for non-existent offer', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/non-existent-offer/distribution')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('Distribution authentication', () => {
  it('should return 401 without auth for PUT', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/offers/dist-offer-active-disabled/distribution')
      .send({ enabled: true })
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 without auth for GET', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/dist-offer-active-disabled/distribution')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});
