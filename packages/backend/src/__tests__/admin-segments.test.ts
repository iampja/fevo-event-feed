import request from 'supertest';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { app } from '../server';
import db from '../db/connection';
import { buildFeedIndex } from '../services/feedService';

const API_KEY = 'efeed_test_key_segments_abc123';
const INTERNAL_TOKEN = 'internal-dev-token';

function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Track IDs created during tests for cleanup and cross-test references
let createdSegmentId: string;

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

  // Insert test API key
  await db('api_keys').insert({
    id: uuidv4(),
    key_hash: hashKey(API_KEY),
    partner_name: 'Segments Test Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 100,
  });

  const now = new Date().toISOString();

  // Insert test offers to link to segments
  const testOffers = Array.from({ length: 3 }, (_, i) => ({
    id: `seg-test-offer-${i + 1}`,
    title: `Segment Test Offer ${i + 1}`,
    description: `Test offer ${i + 1} for segment tests`,
    image_url: null,
    price_min: 10 * (i + 1),
    price_max: 50 * (i + 1),
    currency: 'USD',
    date: `2026-0${i + 4}-15T19:00:00Z`,
    venue_name: 'Test Arena',
    venue_city: 'New York',
    venue_state: 'NY',
    availability: 'available',
    organization_id: 'org-seg-test',
    organization_name: 'Segment Test Org',
    checkout_url: `https://example.com/seg-offer-${i + 1}`,
    tags: JSON.stringify(['test-tag']),
    status: 'active',
    distribution_enabled: true,
    distribution_enabled_at: now,
    distribution_disabled_at: null,
    created_at: now,
    updated_at: now,
  }));

  await db('offers').insert(testOffers);

  // Insert an existing segment for duplicate slug test
  await db('event_feed_segments').insert({
    id: 'seg-existing-1',
    name: 'Existing Segment',
    slug: 'existing-segment',
    type: 'theme',
    rules: JSON.stringify({ tags_include: ['test'] }),
    is_curated: true,
    created_by: 'admin',
    created_at: now,
    updated_at: now,
  });

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

describe('POST /api/v1/event-feed/admin/segments', () => {
  it('should create a new segment', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        name: 'New Test Segment',
        slug: 'new-test-segment',
        type: 'theme',
        rules: { tags_include: ['nba'] },
        is_curated: true,
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('New Test Segment');
    expect(res.body.data.slug).toBe('new-test-segment');
    expect(res.body.data.type).toBe('theme');
    expect(res.body.data.is_curated).toBe(true);
    expect(res.body.data.id).toBeDefined();

    // Save the ID for later tests
    createdSegmentId = res.body.data.id;
  });

  it('should reject duplicate slug', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        name: 'Another Segment',
        slug: 'existing-segment',
        type: 'theme',
      })
      .expect(409);

    expect(res.body.error).toMatch(/already exists/i);
  });

  it('should validate required fields - missing name', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        slug: 'missing-name',
        type: 'theme',
      })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate required fields - missing slug', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        name: 'Missing Slug',
        type: 'theme',
      })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate required fields - missing type', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        name: 'Missing Type',
        slug: 'missing-type',
      })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate slug format - reject uppercase', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({
        name: 'Bad Slug',
        slug: 'BAD_SLUG',
        type: 'theme',
      })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });
});

describe('PUT /api/v1/event-feed/admin/segments/:id', () => {
  it('should update segment name', async () => {
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/segments/${createdSegmentId}`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ name: 'Updated Test Segment' })
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.name).toBe('Updated Test Segment');
    expect(res.body.data.slug).toBe('new-test-segment'); // unchanged
  });

  it('should return 404 for non-existent segment', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/segments/non-existent-segment-id')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ name: 'Will Fail' })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('POST /api/v1/event-feed/admin/segments/:id/offers', () => {
  it('should add an offer to a segment', async () => {
    const res = await request(app)
      .post(`/api/v1/event-feed/admin/segments/${createdSegmentId}/offers`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ offerId: 'seg-test-offer-1' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.segment_id).toBe(createdSegmentId);
    expect(res.body.data.offer_id).toBe('seg-test-offer-1');
    expect(res.body.data.added_at).toBeDefined();
  });

  it('should return 409 for duplicate offer in segment', async () => {
    const res = await request(app)
      .post(`/api/v1/event-feed/admin/segments/${createdSegmentId}/offers`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ offerId: 'seg-test-offer-1' })
      .expect(409);

    expect(res.body.error).toMatch(/already in/i);
  });

  it('should return 404 for non-existent segment', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments/non-existent-seg/offers')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ offerId: 'seg-test-offer-2' })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 404 for non-existent offer', async () => {
    const res = await request(app)
      .post(`/api/v1/event-feed/admin/segments/${createdSegmentId}/offers`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ offerId: 'non-existent-offer-id' })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('DELETE /api/v1/event-feed/admin/segments/:id/offers/:offerId', () => {
  it('should remove an offer from a segment', async () => {
    const res = await request(app)
      .delete(`/api/v1/event-feed/admin/segments/${createdSegmentId}/offers/seg-test-offer-1`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data.message).toMatch(/removed/i);
  });

  it('should return 404 when removing offer not in segment', async () => {
    const res = await request(app)
      .delete(`/api/v1/event-feed/admin/segments/${createdSegmentId}/offers/seg-test-offer-1`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('DELETE /api/v1/event-feed/admin/segments/:id', () => {
  it('should delete a segment', async () => {
    const res = await request(app)
      .delete(`/api/v1/event-feed/admin/segments/${createdSegmentId}`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data.message).toMatch(/deleted/i);
  });

  it('should return 404 for already-deleted segment', async () => {
    const res = await request(app)
      .delete(`/api/v1/event-feed/admin/segments/${createdSegmentId}`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 404 for non-existent segment', async () => {
    const res = await request(app)
      .delete('/api/v1/event-feed/admin/segments/non-existent-id')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('Segments authentication', () => {
  it('should return 401 without auth for POST', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/segments')
      .send({ name: 'No Auth', slug: 'no-auth', type: 'theme' })
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});
