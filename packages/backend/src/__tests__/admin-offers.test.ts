import request from 'supertest';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../server';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const API_KEY = 'efeed_test_key_offers_abc123';
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
    partner_name: 'Offers Test Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 100,
  });

  const now = new Date().toISOString();

  // Insert 4 active, distribution-enabled offers
  const activeEnabled = Array.from({ length: 4 }, (_, i) => ({
    id: `offer-ae-${i + 1}`,
    title: `Active Enabled ${i + 1}`,
    description: `Active enabled offer ${i + 1}`,
    image_url: null,
    price_min: 10 * (i + 1),
    price_max: 50 * (i + 1),
    currency: 'USD',
    date: `2026-0${i + 3}-15T19:00:00Z`,
    venue_name: 'Madison Square Garden',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-msg',
    organization_name: 'MSG Entertainment',
    checkout_url: `https://example.com/ae-${i + 1}`,
    tags: JSON.stringify(['nba']),
    status: 'active',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  // Insert 2 active, distribution-disabled offers
  const activeDisabled = Array.from({ length: 2 }, (_, i) => ({
    id: `offer-ad-${i + 1}`,
    title: `Active Disabled ${i + 1}`,
    description: `Active disabled offer ${i + 1}`,
    image_url: null,
    price_min: 20,
    price_max: 80,
    currency: 'USD',
    date: `2026-07-${10 + i}T19:00:00Z`,
    venue_name: 'Barclays Center',
    venue_city: 'Brooklyn',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-bse',
    organization_name: 'BSE Global',
    checkout_url: `https://example.com/ad-${i + 1}`,
    tags: JSON.stringify(['concert']),
    status: 'active',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  // Insert 1 inactive offer
  const inactiveOffer = {
    id: 'offer-inactive-1',
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
    organization_id: 'org-other',
    organization_name: 'Other Org',
    checkout_url: 'https://example.com/inactive',
    tags: JSON.stringify(['test']),
    status: 'inactive',
    distribution_enabled: false,
    distribution_enabled_at: null,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  };

  await db('offers').insert([...activeEnabled, ...activeDisabled, inactiveOffer]);

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

describe('GET /api/v1/event-feed/admin/offers', () => {
  it('should list offers with default pagination', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBe(7); // 4 + 2 + 1
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.per_page).toBe(25);
  });

  it('should filter by status=active', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?status=active')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(6); // 4 enabled + 2 disabled
    for (const offer of res.body.data) {
      expect(offer.status).toBe('active');
    }
  });

  it('should filter by status=inactive', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?status=inactive')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].id).toBe('offer-inactive-1');
  });

  it('should filter by distribution_enabled=true', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?distribution_enabled=true')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(4);
    for (const offer of res.body.data) {
      expect(offer.distribution_enabled).toBeTruthy();
    }
  });

  it('should combine status and distribution_enabled filters', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?status=active&distribution_enabled=true')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(4); // 4 active + enabled
    for (const offer of res.body.data) {
      expect(offer.status).toBe('active');
      expect(offer.distribution_enabled).toBeTruthy();
    }
  });

  it('should search by title', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?search=Inactive')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(1);
    expect(res.body.data[0].title).toBe('Inactive Offer');
  });

  it('should search by venue_name', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers?search=Barclays')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.meta.total).toBe(2);
    for (const offer of res.body.data) {
      expect(offer.venue_name).toBe('Barclays Center');
    }
  });

  it('should paginate with page/per_page', async () => {
    const page1 = await request(app)
      .get('/api/v1/event-feed/admin/offers?page=1&per_page=3')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(page1.body.data.length).toBe(3);
    expect(page1.body.meta.page).toBe(1);
    expect(page1.body.meta.per_page).toBe(3);
    expect(page1.body.meta.total).toBe(7);
    expect(page1.body.meta.total_pages).toBe(3);

    const page2 = await request(app)
      .get('/api/v1/event-feed/admin/offers?page=2&per_page=3')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(page2.body.data.length).toBe(3);
    expect(page2.body.meta.page).toBe(2);

    const page3 = await request(app)
      .get('/api/v1/event-feed/admin/offers?page=3&per_page=3')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(page3.body.data.length).toBe(1);
    expect(page3.body.meta.page).toBe(3);
  });
});

describe('GET /api/v1/event-feed/admin/offers/:offerId', () => {
  it('should return a single offer by ID', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/offer-ae-1')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBe('offer-ae-1');
    expect(res.body.data.title).toBe('Active Enabled 1');
    expect(res.body.data.status).toBe('active');
  });

  it('should return 404 for non-existent offer', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/non-existent-offer-id')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('GET /api/v1/event-feed/admin/offers/stats', () => {
  it('should return aggregate stats', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers/stats')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.total).toBe(7);
    expect(res.body.data.active).toBe(6);
    expect(res.body.data.inactive).toBe(1);
    expect(res.body.data.distribution_enabled).toBe(4);
    expect(res.body.data.distribution_disabled).toBe(3);
    expect(res.body.data.by_organization).toBeDefined();
    expect(Array.isArray(res.body.data.by_organization)).toBe(true);
    expect(res.body.data.by_organization.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Admin offers authentication', () => {
  it('should return 401 without internal auth token', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 with invalid internal auth token', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/offers')
      .set('x-internal-auth', 'wrong-token-value')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});
