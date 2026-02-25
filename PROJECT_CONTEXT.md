# FEVO Event Feed — Project Context Document

## Overview

The FEVO Event Feed is a monorepo providing a complete event distribution system. It enables FEVO to syndicate event offers to partner websites via an embeddable widget, with a backend API managing data sync from FEVO's platform and an admin UI for controlling distribution.

**Repository:** `fevo-event-feed`
**Monorepo Structure:** 3 npm workspaces under `packages/`
**Runtime:** Node 20.x
**Deployment:** Render (render.yaml in repo root)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Partner Site   │     │    Admin UI      │     │     FEVO API        │
│  (embeds widget) │     │  (React SPA)     │     │  (external source)  │
└────────┬────────┘     └────────┬─────────┘     └──────────┬──────────┘
         │                       │                           │
         │ GET /api/v1/          │ /admin/* endpoints        │ fetchOffers()
         │ event-feed            │ (internal auth)           │ webhooks
         │ (API key auth)        │                           │
         ▼                       ▼                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend (Express + SQLite)                      │
│                                                                        │
│  Routes: feed, admin, sync, webhooks                                   │
│  Services: feed, distribution, sync, apiKey, offer, segment, reward    │
│  Jobs: feedRefresh (cron), autoSync (cron)                             │
│  DB: Knex + better-sqlite3, 5 migrations                              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Package 1: Backend (`packages/backend`)

**Stack:** Express.js, Knex.js, better-sqlite3, node-cron
**Port:** 3001 (configurable)
**Database:** SQLite at `/data/eventfeed.db`

### Database Schema (5 migrations)

**Core Tables:**
- `organizations` — id, name, logo_url, fevo_org_id, distribution_enabled, timestamps
- `venues` — id, name, city, state, country, timezone
- `events` — id, title, fevo_event_id, organization_id, venue_id, date fields
- `offers` — 43 fields including title, description, pricing, venue, availability, distribution flags, FEVO sync metadata
- `event_feed_segments` — id, name, slug, type (theme/geography/organization/event_type/creator/partner/custom), rules JSON, is_curated
- `event_feed_segment_offers` — join table (segment_id, offer_id)
- `reward_programs` — id, offer_id, type (money/points/discount/merchandise/custom), headline, rule
- `reward_milestones` — id, program_id, tier, threshold, label, reward, description, image
- `api_keys` — id, key_hash (SHA-256), partner_name, rate_limit, revoked_at
- `feed_exclusions` — id, offer_id, reason (sold_out/inactive/deleted)
- `feed_cache` — cache_key, cached JSON
- `sync_log` — id, sync_type, organization_id, timestamps, counts, errors JSON
- `event_feed_kills` — soft delete records

### API Endpoints

**Public Feed (API key auth + rate limiting):**
- `GET /` — Feed with filters (segment, theme, geography, organization, event_type, creator) and pagination
- `GET /segments` — List all segments
- `GET /segments/:slug` — Segment detail with linked offers

**Admin (internal auth token):**
- `GET/PUT /admin/offers/:offerId/distribution` — Toggle offer distribution
- `GET/PUT /admin/organizations/:orgId/distribution` — Toggle org distribution
- `GET /admin/offers/stats` — Offer counts by status/distribution
- `GET /admin/offers` — List with filters, search, sort, pagination
- `GET /admin/offers/:offerId` — Offer detail
- Full CRUD for segments, API keys, organizations (read-only)
- `POST /admin/feed/refresh` — Rebuild feed cache

**Sync (internal auth):**
- `POST /admin/sync/organization/:orgId` — Sync single org from FEVO
- `POST /admin/sync/all` — Sync all configured orgs
- `GET /admin/sync/status` — Auto-sync status
- `GET /admin/sync/log` — Recent sync logs

**Webhooks (signature validated):**
- `POST /webhooks/fevo/offer-created` — Receive new offer
- `POST /webhooks/fevo/offer-updated` — Receive offer update

### Services

- **feedService** — Builds feed index cache, applies exclusions/filters, paginates, transforms to nested response format
- **feedTransformer** — Converts DB rows to nested FEVO-shaped response (batch-fetches org logos and rewards)
- **distributionService** — Enable/disable distribution at offer and org level (with transaction safety and exclusion management)
- **fevoSyncService** — Syncs offers from FEVO external API, upserts offers/events, logs operations
- **fevoApiClient** — Real client for FEVO API (`GM-Api-User-ID`/`GM-Api-Access-Key` headers) with MockFevoApiClient for development
- **apiKeyService** — Generate, hash, create, list, revoke API keys (`efeed_` prefixed)
- **offerService** — List/get offers with filters and stats
- **segmentService** — Full CRUD for segments with offer linking
- **rewardService** — Batch fetch rewards by offer IDs

### Middleware

- **apiKeyAuth** — SHA-256 hash lookup for partner API keys
- **internalAuth** — Timing-safe token comparison for admin endpoints
- **defaultRateLimiter** — 100 req/min per IP or API key
- **adminRateLimiter** — 30 req/min for admin endpoints

### Background Jobs

- **feedRefresh** — Cron job to rebuild feed cache periodically
- **autoSync** — Cron job to sync all FEVO organizations

### Tests

Located in `src/__tests__/`: admin-apikeys, admin-distribution, admin-feed-refresh, admin-offers, admin-segments, feed. Uses Jest + supertest.

---

## Package 2: Widget (`packages/widget`)

**Stack:** Preact, TypeScript, Vite (IIFE library build)
**Output:** `dist/event-feed-widget.js` — single self-contained bundle
**Dev Port:** 5174 (proxies `/api` to backend on 3001)

### Public API

```js
FevoEventFeed.init(config, targetElement?)  // Programmatic init
FevoEventFeed.destroy(targetElement)         // Remove instance
FevoEventFeed.renderMyFevo(target, theme)    // Rewards dashboard
FevoEventFeed.version                        // Bundle version
```

### Auto-Detection (No-Code Embed)

Finds elements with `id="fevo-event-feed"` or `class="fevo-event-feed"` and reads config from data attributes:
- `data-segment`, `data-theme` (light/dark), `data-columns` (1-4), `data-max-cards`
- `data-api-url`, `data-api-key`, `data-partner-id`, `data-geo` (or 'auto' for IP-based)
- Also detects `.fevo-my-fevo` elements for rewards dashboard

### Components

**Core:**
- **WidgetContainer** — Main orchestrator. Handles geo resolution, auto-refresh (60s polling with page visibility awareness), state management (loading/error/empty/ready), and analytics
- **OfferCard** — Card tile with image, reward badge overlay, title, date, venue, availability badge, CTA button. Intersection observer for view tracking, keyboard accessible
- **OfferDetailModal** — Portaled modal with hero image/video, org logo, full details, reward section, CTA. Escape to close, body scroll lock
- **SkeletonCard** — Loading placeholder
- **ErrorState** — Error message with retry button
- **EmptyState** — No offers message
- **PoweredByFevo** — Branding footer

**Reward Components:**
- **RewardBadge** — Badge overlay on card images
- **RewardSection** — Reward details in detail modal (milestones, progress, tiers)
- **RewardsDashboard** — Full "My FEVO" dashboard with 3 tabs:
  - Overview: stats, active programs, activity feed, monthly earnings chart, achievements, leaderboard
  - History: earning history with filters and transaction status
  - My Rewards: redemptions/payouts with status tracking
  - Uses mock data (`src/data/mockRewardsData.ts`)

### Hooks

- **useAutoRefresh** — 60s polling with visibility API awareness, tracks added/removed offers, returns offers/isRefreshing/error/retry
- **useIntersectionObserver** — Viewport visibility tracking (50% threshold) with fallback

### Utilities

- **buildCheckoutUrl** — Appends `source=widget`, `segment`, `partner` tracking params
- **formatDate** — Formats ISO strings or `{utc, timezone, display}` objects to "Apr 15, 2026 · 7:00 PM"
- **formatPrice** — Currency formatting (kept but **no longer used** in components — removed from cards and modal, kept for potential future use)
- **resolveGeo** — IP geolocation via ipapi.co, maps to city keys (NY, Boston, Chicago, etc.), 3s timeout, caches result

### Analytics

Dispatches `CustomEvent` on `window` as `fevo:analytics`:
- `widget_loaded`, `offer_card_viewed`, `offer_card_clicked`, `offer_detail_opened`, `widget_error`, `widget_refreshed`
- Partners listen via: `window.addEventListener('fevo:analytics', (e) => ...)`

### Styles

All CSS in `src/styles.ts` as a template literal, injected at runtime via `injectStyles()`. Prefixed with `fevo-ef-` to avoid host page conflicts. Supports light/dark themes via `data-theme` attribute. Responsive grid, card animations, modal with mobile bottom-sheet behavior.

### Types (`src/types.ts`)

- **WidgetConfig** — segment?, theme?, columns?, maxCards?, apiUrl?, apiKey?, partnerId?, geo?
- **Offer** — Full offer with nested price, date, venue, organization, media, reward, tags
- **FeedResponse** — `{data: Offer[], meta: {page, per_page, total, total_pages}}`
- **Reward/RewardMilestone** — Program details with tiers
- **UserLifetimeStats, UserProgramProgress** — Dashboard types
- Price field kept on Offer type (API still returns it)

### Demo Pages (`demo/`)

- `index.html` — Basic showcase with mock API
- `partner-mlb.html` — MLB-branded demo
- `showcase.html` — Feature showcase
- `rewards-demo.html` — Rewards dashboard demo
- `myfevo.html` — My FEVO page
- `collections.html` — Segment-based collections
- `checkout.html` — Sample checkout flow

Built via `scripts/build-demo.sh` which copies demos to dist/ and rewrites script paths.

---

## Package 3: Admin UI (`packages/admin-ui`)

**Stack:** React, Vite, styled-components, Axios, React Router
**Dev Port:** 5173 (proxies `/api` to backend on 3001)

### Pages

- **LoginPage** — Token-based auth (stores in localStorage)
- **AllOffersPage** — Offer list with stats cards, filters (status, distribution, org, search), pagination
- **OfferDetailPage** — Full offer view with distribution toggle
- **SegmentsPage** — Segment list with create/edit/delete modals
- **SegmentDetailPage** — Segment detail with linked offer management
- **OrganizationsPage** — Org list (read-only, synced from FEVO)
- **OrganizationDetailPage** — Org detail with distribution toggle
- **ApiKeysPage** — API key management (create, revoke, rate limit editing)
- **SyncDashboardPage** — Sync logs, trigger manual sync

### Shared Components

Layout: Sidebar, PageHeader, Breadcrumb
UI: Button, Modal, Table, Pagination, SearchInput, Select, Badge, StatCard, Switch, Toast, CopyField, FormLabel, HelperText
Feature: CreateApiKeyModal, ApiKeyCreatedModal, RevokeApiKeyModal, EditRateLimitModal, CreateSegmentModal, EditSegmentModal, DeleteSegmentModal, SegmentOffersPanel, DistributionToggle

### Auth

React Context with localStorage token. ProtectedRoute wrapper redirects to /login if unauthenticated. Token sent via Axios interceptor.

---

## Environment Variables

**Backend:**
| Variable | Purpose | Default |
|---|---|---|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3001 |
| `DB_PATH` | SQLite path | data/eventfeed.db |
| `INTERNAL_AUTH_TOKEN` | Admin auth | internal-dev-token |
| `FEVO_API_BASE_URL` | FEVO API URL | — |
| `FEVO_API_USER_ID` | FEVO API user | — |
| `FEVO_API_ACCESS_KEY` | FEVO API key | — |
| `FEVO_WEBHOOK_SECRET` | Webhook signature | — |
| `RESEED` | Force DB reseed | false |

**Admin UI:**
| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend URL | /api/v1/event-feed |

---

## Deployment (Render)

Configured in `render.yaml`:
- **Backend** — Node web service with SQLite disk persistence at `/data`
- **Admin UI** — Static site from `packages/admin-ui/dist`
- **Widget** — Static site from `packages/widget/dist`

---

## Development

```bash
npm run dev:backend   # Backend on :3001
npm run dev:admin     # Admin UI on :5173 (proxies to backend)
npm run dev:widget    # Widget on :5174 (proxies to backend)
npm run build         # Build all packages
npm test --workspaces # Run all tests
```

---

## Key Data Flows

**Widget Feed Request:** Partner widget → `GET /` with API key → apiKeyAuth → feedService.getFeed() → cache/DB query → apply exclusions → filter → paginate → feedTransformer → FeedResponse → widget renders cards

**FEVO Sync:** Cron or manual trigger → fevoApiClient.fetchOffers(orgId) → upsert offers/events → log to sync_log → rebuild feed cache

**Webhook:** FEVO POST → validate signature → create/update offer → rebuild feed cache

**Distribution Toggle:** Admin UI → `PUT /admin/offers/:id/distribution` → internalAuth → distributionService → update flags + manage exclusions (transaction) → rebuild feed cache → next widget fetch reflects change

---

## Recent Changes

- **Removed pricing from widget** — `formatPrice` import and price display removed from OfferCard and OfferDetailModal, along with `.fevo-ef-card-price` and `.fevo-ef-modal-price` CSS rules. The `formatPrice` utility, its tests, and the `price` field on the Offer type are all retained for potential future use. Pricing required a manifest call with primary ticketers which isn't available.
