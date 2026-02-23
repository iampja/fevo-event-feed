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

// Track IDs created during tests
let createdKeyId: string;
let createdKeyRaw: string;

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

  // Insert a pre-existing API key for listing tests
  await db('api_keys').insert({
    id: 'apikey-preexisting-1',
    key_hash: hashKey('efeed_preexisting_key_1'),
    partner_name: 'Pre-existing Partner',
    created_at: new Date().toISOString(),
    revoked_at: null,
    rate_limit: 50,
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

describe('POST /api/v1/event-feed/admin/api-keys', () => {
  it('should create a new API key with partner name', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ partner_name: 'New Test Partner' })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.key).toBeDefined();
    expect(res.body.key).toMatch(/^efeed_/);
    expect(res.body.warning).toBeDefined();
    expect(res.body.data.partner_name).toBe('New Test Partner');
    expect(res.body.data.rate_limit).toBe(100); // default
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.revoked_at).toBeNull();
    // key_hash should NOT be exposed in the response
    expect(res.body.data.key_hash).toBeUndefined();

    createdKeyId = res.body.data.id;
    createdKeyRaw = res.body.key;
  });

  it('should create a key with custom rate_limit', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ partner_name: 'Custom Limit Partner', rate_limit: 500 })
      .expect(201);

    expect(res.body.data.rate_limit).toBe(500);
    expect(res.body.data.partner_name).toBe('Custom Limit Partner');
  });

  it('should validate required fields - missing partner_name', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate partner_name is not empty', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ partner_name: '' })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate rate_limit lower bound', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ partner_name: 'Low Limit', rate_limit: 0 })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate rate_limit upper bound', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ partner_name: 'High Limit', rate_limit: 99999 })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });
});

describe('GET /api/v1/event-feed/admin/api-keys', () => {
  it('should list all API keys', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    // At least the pre-existing key and the 2 created in POST tests
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('should not expose key_hash in listed keys', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/api-keys')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    for (const key of res.body.data) {
      expect(key.key_hash).toBeUndefined();
      expect(key.id).toBeDefined();
      expect(key.partner_name).toBeDefined();
      expect(key.rate_limit).toBeDefined();
    }
  });
});

describe('POST /api/v1/event-feed/admin/api-keys/:id/revoke', () => {
  it('should revoke an API key', async () => {
    const res = await request(app)
      .post(`/api/v1/event-feed/admin/api-keys/${createdKeyId}/revoke`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(200);

    expect(res.body.data.message).toMatch(/revoked/i);
  });

  it('should return 404 when revoking already-revoked key', async () => {
    const res = await request(app)
      .post(`/api/v1/event-feed/admin/api-keys/${createdKeyId}/revoke`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 404 for non-existent key', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys/non-existent-key-id/revoke')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('PUT /api/v1/event-feed/admin/api-keys/:id/rate-limit', () => {
  it('should update rate limit for an active key', async () => {
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/api-keys/apikey-preexisting-1/rate-limit`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ rate_limit: 200 })
      .expect(200);

    expect(res.body.data.message).toMatch(/updated/i);
  });

  it('should validate rate_limit lower bound', async () => {
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/api-keys/apikey-preexisting-1/rate-limit`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ rate_limit: 0 })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate rate_limit upper bound', async () => {
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/api-keys/apikey-preexisting-1/rate-limit`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ rate_limit: 99999 })
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should validate rate_limit is required', async () => {
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/api-keys/apikey-preexisting-1/rate-limit`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/Invalid/i);
  });

  it('should return 404 for non-existent key', async () => {
    const res = await request(app)
      .put('/api/v1/event-feed/admin/api-keys/non-existent-key-id/rate-limit')
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ rate_limit: 50 })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });

  it('should return 404 for revoked key', async () => {
    // createdKeyId was revoked in the revoke test above
    const res = await request(app)
      .put(`/api/v1/event-feed/admin/api-keys/${createdKeyId}/rate-limit`)
      .set('x-internal-auth', INTERNAL_TOKEN)
      .send({ rate_limit: 150 })
      .expect(404);

    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('API keys authentication', () => {
  it('should return 401 without auth for POST', async () => {
    const res = await request(app)
      .post('/api/v1/event-feed/admin/api-keys')
      .send({ partner_name: 'No Auth' })
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 without auth for GET', async () => {
    const res = await request(app)
      .get('/api/v1/event-feed/admin/api-keys')
      .expect(401);

    expect(res.body.error).toMatch(/Unauthorized/i);
  });
});
