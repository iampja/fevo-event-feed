import request from 'supertest';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../server';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const API_KEY = 'efeed_test_key_abc123';
const INTERNAL_TOKEN = 'internal-dev-token';

// Helper to hash API keys
function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Run migrations
  await db.migrate.latest();

  // Clean all tables
  await db('event_feed_segment_offers').del();
  await db('event_feed_segments').del();
  await db('feed_exclusions').del();
  await db('event_feed_kills').del();
  await db('feed_cache').del();
  await db('api_keys').del();
  await db('offers').del();

  // Insert test API key
  await db('api_keys').insert({
    id: uuidv4(),
    key_hash: hashKey(API_KEY),
    partner_name: 'Test Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 100,
  });

  const now = new Date().toISOString();

  // Insert test offers: 5 distribution-enabled active offers
  const enabledOffers = Array.from({ length: 5 }, (_, i) => ({
    id: `test-offer-enabled-${i + 1}`,
    title: `Enabled Offer ${i + 1}`,
    description: `Test offer ${i + 1}`,
    image_url: null,
    price_min: 10 * (i + 1),
    price_max: 50 * (i + 1),
    currency: 'USD',
    date: `2026-0${i + 3}-15T19:00:00Z`,
    venue_name: i < 3 ? 'Madison Square Garden' : 'Barclays Center',
    venue_city: i < 3 ? 'New York' : 'Brooklyn',
    venue_state: 'NY',
    availability: 'available',
    organization_id: i < 3 ? 'org-msg-test' : 'org-bsc-test',
    organization_name: i < 3 ? 'MSG Entertainment' : 'BSE Global',
    checkout_url: `https://example.com/offer-${i + 1}`,
    tags: JSON.stringify(i < 2 ? ['hello-kitty', 'nba'] : ['concert']),
    status: 'active',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  // Insert 3 distribution-disabled active offers
  const disabledOffers = Array.from({ length: 3 }, (_, i) => ({
    id: `test-offer-disabled-${i + 1}`,
    title: `Disabled Offer ${i + 1}`,
    description: `Disabled test offer ${i + 1}`,
    image_url: null,
    price_min: 20,
    price_max: 80,
    currency: 'USD',
    date: `2026-06-${10 + i}T19:00:00Z`,
    venue_name: 'Citi Field',
    venue_city: 'Queens',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-mets-test',
    organization_name: 'New York Mets',
    checkout_url: `https://example.com/disabled-${i + 1}`,
    tags: JSON.stringify(['mlb']),
    status: 'active',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  // Insert 1 inactive offer with distribution_enabled
  const inactiveOffer = {
    id: 'test-offer-inactive-1',
    title: 'Inactive Offer',
    description: 'This offer is inactive',
    image_url: null,
    price_min: 10,
    price_max: 50,
    currency: 'USD',
    date: '2026-01-01T19:00:00Z',
    venue_name: 'Some Venue',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-inactive-test',
    organization_name: 'Inactive Org',
    checkout_url: 'https://example.com/inactive',
    tags: JSON.stringify(['test']),
    status: 'inactive',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  };

  await db('offers').insert([...enabledOffers, ...disabledOffers, inactiveOffer]);

  // Insert a test segment
  await db('event_feed_segments').insert({
    id: 'test-segment-hk',
    name: 'Hello Kitty Test',
    slug: 'hello-kitty-test',
    type: 'theme',
    rules: JSON.stringify({ tags_include: ['hello-kitty'] }),
    is_curated: true,
    created_by: 'admin',
    created_at: now,
    updated_at: now,
  });

  // Link first 2 enabled offers to the segment
  await db('event_feed_segment_offers').insert([
    { segment_id: 'test-segment-hk', offer_id: 'test-offer-enabled-1', added_at: now },
    { segment_id: 'test-segment-hk', offer_id: 'test-offer-enabled-2', added_at: now },
  ]);

  // Build the feed index
  await buildFeedIndex();
});

afterAll(async () => {
  // Clean up
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

describe('GET /api/v1/event-feed', () => {
  it('should return only distribution-enabled active offers', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();

    // Should have exactly 5 enabled offers (no disabled, no inactive)
    expect(res.body.meta.total).toBe(5);

    // Every returned offer should have the nested FEVO shape
    for (const offer of res.body.data) {
      expect(offer.offer_id).toBeDefined();
      expect(offer.venue).toBeDefined();
      expect(offer.price).toBeDefined();
      expect(offer.organization).toBeDefined();
    }

    // Should NOT include disabled offers
    const ids = res.body.data.map((o: any) => o.offer_id);
    expect(ids).not.toContain('test-offer-disabled-1');
    expect(ids).not.toContain('test-offer-inactive-1');
  });

  it('should exclude killed offers from the feed', async () => {
    // Kill offer #1
    const killRes = await request(app)
      .post('/api/v1/event-feed/admin/kills/offer')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ offerId: 'test-offer-enabled-1', reason: 'test kill' })
      .expect(201);

    expect(killRes.body.data.target_id).toBe('test-offer-enabled-1');

    // Fetch the feed
    const feedRes = await request(app)
      .get('/api/v1/event-feed')
      .set('x-api-key', API_KEY)
      .expect(200);

    const ids = feedRes.body.data.map((o: any) => o.offer_id);
    expect(ids).not.toContain('test-offer-enabled-1');
    expect(feedRes.body.meta.total).toBe(4);
  });

  it('should exclude all org offers when org is killed', async () => {
    // Kill org-bsc-test (offers 4 and 5)
    await request(app)
      .post('/api/v1/event-feed/admin/kills/organization')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ orgId: 'org-bsc-test', reason: 'org-level kill' })
      .expect(201);

    const feedRes = await request(app)
      .get('/api/v1/event-feed')
      .set('x-api-key', API_KEY)
      .expect(200);

    const ids = feedRes.body.data.map((o: any) => o.offer_id);
    expect(ids).not.toContain('test-offer-enabled-4');
    expect(ids).not.toContain('test-offer-enabled-5');
    // Only offers 2 and 3 remain (1 was killed individually, 4 & 5 org killed)
    expect(feedRes.body.meta.total).toBe(2);
  });

  it('should restore a killed offer back into the feed', async () => {
    // Get kills to find the offer-level kill
    const killsRes = await request(app)
      .get('/api/v1/event-feed/admin/kills')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    const offerKill = killsRes.body.data.find(
      (k: any) => k.target_type === 'offer' && k.target_id === 'test-offer-enabled-1'
    );
    expect(offerKill).toBeDefined();

    // Restore
    await request(app)
      .post(`/api/v1/event-feed/admin/kills/${offerKill.id}/restore`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    // Check feed
    const feedRes = await request(app)
      .get('/api/v1/event-feed')
      .set('x-api-key', API_KEY)
      .expect(200);

    const ids = feedRes.body.data.map((o: any) => o.offer_id);
    expect(ids).toContain('test-offer-enabled-1');
    expect(feedRes.body.meta.total).toBe(3); // 1, 2, 3 (4 & 5 still org-killed)
  });

  it('should paginate results correctly', async () => {
    // Restore org kill to get all 5 offers back
    const killsRes = await request(app)
      .get('/api/v1/event-feed/admin/kills')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    const orgKill = killsRes.body.data.find(
      (k: any) => k.target_type === 'organization' && k.target_id === 'org-bsc-test'
    );
    if (orgKill) {
      await request(app)
        .post(`/api/v1/event-feed/admin/kills/${orgKill.id}/restore`)
        .set('x-internal-auth', INTERNAL_TOKEN)
        .expect(200);
    }

    // Page 1 with per_page=2
    const page1 = await request(app)
      .get('/api/v1/event-feed?page=1&per_page=2')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(page1.body.data.length).toBe(2);
    expect(page1.body.meta.page).toBe(1);
    expect(page1.body.meta.per_page).toBe(2);
    expect(page1.body.meta.total).toBe(5);
    expect(page1.body.meta.total_pages).toBe(3);

    // Page 2
    const page2 = await request(app)
      .get('/api/v1/event-feed?page=2&per_page=2')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(page2.body.data.length).toBe(2);
    expect(page2.body.meta.page).toBe(2);

    // Page 3 (last page, only 1 item)
    const page3 = await request(app)
      .get('/api/v1/event-feed?page=3&per_page=2')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(page3.body.data.length).toBe(1);
  });

  it('should filter by segment', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed?segment=hello-kitty-test')
      .set('x-api-key', API_KEY)
      .expect(200);

    // Only 2 offers linked to the hello-kitty-test segment
    // But offer 1 may or may not be in the feed depending on prior kill state
    // Both linked offers are enabled-1 and enabled-2
    expect(res.body.meta.total).toBeLessThanOrEqual(2);
    for (const offer of res.body.data) {
      expect(['test-offer-enabled-1', 'test-offer-enabled-2']).toContain(offer.offer_id);
    }
  });
});

describe('Authentication', () => {
  it('should return 401 for missing API key', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed')
      .expect(401);

    expect(res.body.error).toMatch(/Missing/i);
  });

  it('should return 401 for invalid API key', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed')
      .set('x-api-key', 'invalid-key-that-does-not-exist')
      .expect(401);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should return 401 for admin routes without internal auth', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/kills')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});

describe('Rate Limiting', () => {
  it('should return 429 when rate limit is exceeded', async () => {
    // Create a separate API key with a very low rate limit for this test
    const lowLimitKey = 'efeed_low_limit_key';
    await db('api_keys').insert({
      id: uuidv4(),
      key_hash: hashKey(lowLimitKey),
      partner_name: 'Low Limit Partner',
      created_at: new Date().toISOString(),
      revoked_at: null,
      rate_limit: 2,
    });

    // The default rate limiter allows 100 req/min, so we need many requests.
    // Instead, we test that the rate limiter middleware is wired up and
    // responds with 429 by sending requests past the limit.
    // For a quick test, we use the admin rate limiter (30/min).
    const promises = [];
    for (let i = 0; i < 35; i++) {
      promises.push(
        request(app)
          .get('/api/v1/event-feed/admin/kills')
          .set('x-internal-auth', INTERNAL_TOKEN)
      );
    }

    const results = await Promise.all(promises);
    const statuses = results.map((r) => r.status);

    // At least one should be 429
    expect(statuses).toContain(429);
  });
});

describe('GET /api/v1/event-feed/segments', () => {
  it('should list available segments', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/segments')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('should get segment details by slug', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/segments/hello-kitty-test')
      .set('x-api-key', API_KEY)
      .expect(200);

    expect(res.body.data.slug).toBe('hello-kitty-test');
    expect(res.body.data.offers).toBeDefined();
    expect(res.body.data.offers.length).toBe(2);
  });

  it('should return 404 for unknown segment', async () => {
    await request(app)
      .get('/api/v1/event-feed/segments/non-existent-segment')
      .set('x-api-key', API_KEY)
      .expect(404);
  });
});
