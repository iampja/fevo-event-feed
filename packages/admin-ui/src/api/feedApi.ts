import { apiClient } from './client';

// ========================
// DISTRIBUTION TYPES & METHODS
// ========================

export interface DistributionStatus {
  offerId: string;
  offerName: string;
  offerStatus: 'active' | 'inactive' | 'sold_out' | 'deleted';
  distributionEnabled: boolean;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

export async function getDistributionStatus(
  offerId: string,
): Promise<DistributionStatus> {
  const response = await apiClient.get<{ data: DistributionStatus }>(
    `/admin/offers/${offerId}/distribution`,
  );
  return response.data.data;
}

export async function updateDistribution(
  offerId: string,
  enabled: boolean,
): Promise<DistributionStatus> {
  const response = await apiClient.put<{ data: DistributionStatus }>(
    `/admin/offers/${offerId}/distribution`,
    { enabled },
  );
  return response.data.data;
}

// ========================
// OFFER TYPES & METHODS
// ========================

export interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_min: number;
  price_max: number;
  currency: string;
  date: string;
  venue_name: string;
  venue_city: string;
  venue_state: string;
  availability: string;
  organization_id: string;
  organization_name: string;
  checkout_url: string;
  tags: string;
  status: 'active' | 'inactive' | 'sold_out' | 'deleted';
  distribution_enabled: boolean;
  source?: string;
  video_url?: string | null;
  tickets_available?: number | null;
  fevo_offer_id?: string | null;
  fevo_synced_at?: string | null;
  collections?: { id: string; name: string; slug: string }[];
  created_at: string;
  updated_at: string;
}

export interface OffersMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface OffersListParams {
  page?: number;
  per_page?: number;
  status?: string;
  distribution_enabled?: string;
  organization_id?: string;
  segment_id?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
}

export interface OfferStats {
  total: number;
  active: number;
  inactive: number;
  sold_out: number;
  deleted: number;
  distribution_enabled: number;
  distribution_disabled: number;
  by_organization: {
    organization_id: string;
    organization_name: string;
    count: number;
  }[];
}

export async function getOffers(
  params: OffersListParams = {},
): Promise<{ data: Offer[]; meta: OffersMeta }> {
  const response = await apiClient.get<{ data: Offer[]; meta: OffersMeta }>(
    '/admin/offers',
    { params },
  );
  return response.data;
}

export async function getOffer(offerId: string): Promise<Offer> {
  const response = await apiClient.get<{ data: Offer }>(
    `/admin/offers/${offerId}`,
  );
  return response.data.data;
}

export async function getOfferStats(): Promise<OfferStats> {
  const response = await apiClient.get<{ data: OfferStats }>(
    '/admin/offers/stats',
  );
  return response.data.data;
}

// ========================
// SEGMENT TYPES & METHODS
// ========================

export interface Segment {
  id: string;
  name: string;
  slug: string;
  type: string;
  rules?: Record<string, unknown>;
  is_curated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SegmentWithOffers extends Segment {
  offers: Offer[];
}

export interface CreateSegmentPayload {
  name: string;
  slug: string;
  type: string;
  rules?: Record<string, unknown>;
  is_curated?: boolean;
}

export interface UpdateSegmentPayload {
  name?: string;
  slug?: string;
  type?: string;
  rules?: Record<string, unknown>;
  is_curated?: boolean;
}

export async function getSegments(): Promise<Segment[]> {
  const response = await apiClient.get<{ data: Segment[] }>(
    '/admin/segments',
  );
  return response.data.data;
}

export async function getSegmentBySlug(
  slug: string,
): Promise<SegmentWithOffers> {
  const response = await apiClient.get<{ data: SegmentWithOffers }>(
    `/admin/segments/${slug}`,
  );
  return response.data.data;
}

export async function createSegment(
  payload: CreateSegmentPayload,
): Promise<Segment> {
  const response = await apiClient.post<{ data: Segment }>(
    '/admin/segments',
    payload,
  );
  return response.data.data;
}

export async function updateSegment(
  segmentId: string,
  payload: UpdateSegmentPayload,
): Promise<Segment> {
  const response = await apiClient.put<{ data: Segment }>(
    `/admin/segments/${segmentId}`,
    payload,
  );
  return response.data.data;
}

export async function deleteSegment(segmentId: string): Promise<void> {
  await apiClient.delete(`/admin/segments/${segmentId}`);
}

export async function addOfferToSegment(
  segmentId: string,
  offerId: string,
): Promise<void> {
  await apiClient.post(`/admin/segments/${segmentId}/offers`, { offerId });
}

export async function removeOfferFromSegment(
  segmentId: string,
  offerId: string,
): Promise<void> {
  await apiClient.delete(`/admin/segments/${segmentId}/offers/${offerId}`);
}

export async function getOfferSegments(offerId: string): Promise<Segment[]> {
  const response = await apiClient.get<{ data: Segment[] }>(
    `/admin/offers/${offerId}/segments`,
  );
  return response.data.data;
}

// ========================
// API KEY TYPES & METHODS
// ========================

export interface ApiKey {
  id: string;
  partner_name: string;
  created_at: string;
  revoked_at: string | null;
  rate_limit: number;
}

export interface CreateApiKeyPayload {
  partner_name: string;
  rate_limit?: number;
}

export interface CreateApiKeyResponse {
  data: ApiKey;
  key: string;
  warning: string;
}

export async function getApiKeys(): Promise<ApiKey[]> {
  const response = await apiClient.get<{ data: ApiKey[] }>('/admin/api-keys');
  return response.data.data;
}

export async function createApiKey(
  payload: CreateApiKeyPayload,
): Promise<CreateApiKeyResponse> {
  const response = await apiClient.post<CreateApiKeyResponse>(
    '/admin/api-keys',
    payload,
  );
  return response.data;
}

export async function revokeApiKey(keyId: string): Promise<void> {
  await apiClient.post(`/admin/api-keys/${keyId}/revoke`);
}

export async function updateApiKeyRateLimit(
  keyId: string,
  rateLimit: number,
): Promise<void> {
  await apiClient.put(`/admin/api-keys/${keyId}/rate-limit`, {
    rate_limit: rateLimit,
  });
}

// ========================
// ORGANIZATION TYPES & METHODS
// ========================

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  fevo_org_id: string | null;
  distribution_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgDistributionStatus {
  orgId: string;
  orgName: string;
  distributionEnabled: boolean;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  activeOfferCount: number;
}

export async function getOrganizations(): Promise<Organization[]> {
  const response = await apiClient.get<{ data: Organization[] }>(
    '/admin/organizations',
  );
  return response.data.data;
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const response = await apiClient.get<{ data: Organization }>(
    `/admin/organizations/${orgId}`,
  );
  return response.data.data;
}

export async function getOrgDistributionStatus(
  orgId: string,
): Promise<OrgDistributionStatus> {
  const response = await apiClient.get<{ data: OrgDistributionStatus }>(
    `/admin/organizations/${orgId}/distribution`,
  );
  return response.data.data;
}

export async function updateOrgDistribution(
  orgId: string,
  enabled: boolean,
): Promise<OrgDistributionStatus> {
  const response = await apiClient.put<{ data: OrgDistributionStatus }>(
    `/admin/organizations/${orgId}/distribution`,
    { enabled },
  );
  return response.data.data;
}

// ========================
// SYNC TYPES & METHODS
// ========================

export interface SyncLogEntry {
  id: string;
  sync_type: string;
  organization_id: string | null;
  started_at: string;
  completed_at: string | null;
  offers_created: number;
  offers_updated: number;
  errors: string | null;
  status: string;
}

export async function syncOrganization(orgId: string): Promise<SyncLogEntry> {
  const response = await apiClient.post<{ data: SyncLogEntry }>(
    `/admin/sync/organization/${orgId}`,
  );
  return response.data.data;
}

export async function syncAll(): Promise<{
  data: SyncLogEntry[];
  meta: { organizations_synced: number; total_created: number; total_updated: number };
}> {
  const response = await apiClient.post('/admin/sync/all');
  return response.data;
}

export async function getSyncLogs(): Promise<SyncLogEntry[]> {
  const response = await apiClient.get<{ data: SyncLogEntry[] }>(
    '/admin/sync/log',
  );
  return response.data.data;
}
