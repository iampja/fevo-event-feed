import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { getOffer, getDistributionStatus, updateDistribution, Offer, DistributionStatus } from '@/api/feedApi';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { DistributionToggle } from '@/components/distribution/DistributionToggle';
import { showSuccess, showError } from '@/components/ui/Toast';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeVariant,
  formatPriceRange,
} from '@/utils/formatters';

const Container = styled.div`
  max-width: 900px;
`;

const MetaBadges = styled.div`
  display: flex;
  gap: ${spacings.md};
  flex-wrap: wrap;
  margin-bottom: ${spacings['2xl']};
`;

const Card = styled.div`
  background: white;
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  padding: ${spacings['2xl']};
  margin-bottom: ${spacings.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.primary};
  margin: 0 0 ${spacings.xl} 0;
  padding-bottom: ${spacings.md};
  border-bottom: 1px solid ${colors.border.neutral.subtle};
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacings.xl};
`;

const Field = styled.div<{ $full?: boolean }>`
  grid-column: ${(p) => (p.$full ? '1 / -1' : 'auto')};
`;

const FieldLabel = styled.div`
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.sm};
`;

const FieldValue = styled.div`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  line-height: ${typography.lineHeight.normal};
`;

const MonoValue = styled.span`
  font-family: monospace;
  font-size: 13px;
  color: ${colors.text.neutral.secondary};
`;

const Thumbnail = styled.img`
  max-width: 200px;
  max-height: 140px;
  border-radius: ${radius.cornerRadiusMd};
  object-fit: cover;
  border: 1px solid ${colors.border.neutral.primary};
`;

const OrgLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const ExternalLink = styled.a`
  color: #2563eb;
  text-decoration: none;
  word-break: break-all;
  &:hover {
    text-decoration: underline;
  }
`;

const LastUpdated = styled.div`
  margin-top: ${spacings.xl};
  padding: ${spacings.xl};
  background: ${colors.surface.neutral.bgSubtle};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
`;

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const OfferDetailPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [distribution, setDistribution] = useState<DistributionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!offerId) return;
    try {
      setLoading(true);
      setError(null);
      const [offerData, distData] = await Promise.all([
        getOffer(offerId),
        getDistributionStatus(offerId).catch(() => null),
      ]);
      setOffer(offerData);
      setDistribution(distData);
    } catch {
      setError('Failed to load offer');
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDistributionToggle = async (enabled: boolean) => {
    if (!offerId) return;
    try {
      setUpdating(true);
      const updated = await updateDistribution(offerId, enabled);
      setDistribution(updated);
      showSuccess(
        enabled
          ? 'Distribution enabled. Offer will appear in the Event Feed.'
          : 'Distribution disabled. Offer removed from the Event Feed.',
      );
    } catch {
      showError('Failed to update distribution');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <PageHeader title="Loading..." />
      </Container>
    );
  }

  if (error || !offer) {
    return (
      <Container>
        <PageHeader title="Offer Not Found" />
      </Container>
    );
  }

  const tags = parseTags(offer.tags);

  return (
    <Container>
      <Breadcrumb
        items={[
          { label: 'All Offers', to: '/offers' },
          { label: offer.title },
        ]}
      />
      <PageHeader title={offer.title} />

      <MetaBadges>
        <Badge variant={getStatusBadgeVariant(offer.status)}>
          {formatStatusLabel(offer.status)}
        </Badge>
        <Badge variant="neutral">{offer.source || 'manual'}</Badge>
        {offer.fevo_offer_id && <Badge variant="neutral">FEVO: {offer.fevo_offer_id}</Badge>}
        <Badge variant={offer.distribution_enabled ? 'success' : 'neutral'}>
          {offer.distribution_enabled ? 'Distributed' : 'Not Distributed'}
        </Badge>
      </MetaBadges>

      {/* Basic Info */}
      <Card>
        <SectionTitle>Basic Information</SectionTitle>
        <FieldGrid>
          <Field $full>
            <FieldLabel>Title</FieldLabel>
            <FieldValue>{offer.title}</FieldValue>
          </Field>
          <Field $full>
            <FieldLabel>Description</FieldLabel>
            <FieldValue>{offer.description || '-'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Organization</FieldLabel>
            <FieldValue>
              {offer.organization_id ? (
                <OrgLink to={`/organizations/${offer.organization_id}`}>
                  {offer.organization_name || offer.organization_id}
                </OrgLink>
              ) : (
                '-'
              )}
            </FieldValue>
          </Field>
          <Field>
            <FieldLabel>Tags</FieldLabel>
            <FieldValue>
              {tags.length > 0 ? tags.join(', ') : '-'}
            </FieldValue>
          </Field>
          <Field $full>
            <FieldLabel>Checkout URL</FieldLabel>
            <FieldValue>
              {offer.checkout_url ? (
                <ExternalLink href={offer.checkout_url} target="_blank" rel="noopener noreferrer">
                  {offer.checkout_url}
                </ExternalLink>
              ) : (
                '-'
              )}
            </FieldValue>
          </Field>
        </FieldGrid>
      </Card>

      {/* Media */}
      <Card>
        <SectionTitle>Media</SectionTitle>
        <FieldGrid>
          <Field>
            <FieldLabel>Image</FieldLabel>
            <FieldValue>
              {offer.image_url ? (
                <Thumbnail src={offer.image_url} alt={offer.title} />
              ) : (
                '-'
              )}
            </FieldValue>
          </Field>
          <Field>
            <FieldLabel>Video URL</FieldLabel>
            <FieldValue>
              {offer.video_url ? (
                <ExternalLink href={offer.video_url} target="_blank" rel="noopener noreferrer">
                  {offer.video_url}
                </ExternalLink>
              ) : (
                '-'
              )}
            </FieldValue>
          </Field>
        </FieldGrid>
      </Card>

      {/* Pricing */}
      <Card>
        <SectionTitle>Pricing &amp; Availability</SectionTitle>
        <FieldGrid>
          <Field>
            <FieldLabel>Price Range</FieldLabel>
            <FieldValue>{formatPriceRange(offer.price_min, offer.price_max)}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Currency</FieldLabel>
            <FieldValue>{offer.currency || 'USD'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Availability</FieldLabel>
            <FieldValue>{offer.availability || '-'}</FieldValue>
          </Field>
          {offer.tickets_available != null && (
            <Field>
              <FieldLabel>Tickets Available</FieldLabel>
              <FieldValue>{offer.tickets_available}</FieldValue>
            </Field>
          )}
        </FieldGrid>
      </Card>

      {/* Event & Venue */}
      <Card>
        <SectionTitle>Event &amp; Venue</SectionTitle>
        <FieldGrid>
          <Field>
            <FieldLabel>Date</FieldLabel>
            <FieldValue>{offer.date ? formatDateTime(offer.date) : '-'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Venue Name</FieldLabel>
            <FieldValue>{offer.venue_name || '-'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>City</FieldLabel>
            <FieldValue>{offer.venue_city || '-'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>State</FieldLabel>
            <FieldValue>{offer.venue_state || '-'}</FieldValue>
          </Field>
        </FieldGrid>
      </Card>

      {/* Distribution */}
      <Card>
        <SectionTitle>Distribution</SectionTitle>
        {distribution ? (
          <>
            <DistributionToggle
              offerId={distribution.offerId}
              enabled={distribution.distributionEnabled}
              onChange={handleDistributionToggle}
              offerStatus={distribution.offerStatus}
              loading={updating}
            />
            <LastUpdated>
              Last updated: {formatDateTime(distribution.lastUpdatedAt)} by{' '}
              {distribution.lastUpdatedBy}
            </LastUpdated>
          </>
        ) : (
          <FieldValue>Distribution status unavailable</FieldValue>
        )}
      </Card>

      {/* Metadata */}
      <Card>
        <SectionTitle>Metadata</SectionTitle>
        <FieldGrid>
          <Field>
            <FieldLabel>Internal ID</FieldLabel>
            <FieldValue><MonoValue>{offer.id}</MonoValue></FieldValue>
          </Field>
          {offer.fevo_offer_id && (
            <Field>
              <FieldLabel>FEVO Offer ID</FieldLabel>
              <FieldValue><MonoValue>{offer.fevo_offer_id}</MonoValue></FieldValue>
            </Field>
          )}
          <Field>
            <FieldLabel>Source</FieldLabel>
            <FieldValue>{offer.source || 'manual'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Created</FieldLabel>
            <FieldValue>{formatDateTime(offer.created_at)}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Updated</FieldLabel>
            <FieldValue>{formatDateTime(offer.updated_at)}</FieldValue>
          </Field>
          {offer.fevo_synced_at && (
            <Field>
              <FieldLabel>Last Synced</FieldLabel>
              <FieldValue>{formatDateTime(offer.fevo_synced_at)}</FieldValue>
            </Field>
          )}
        </FieldGrid>
      </Card>
    </Container>
  );
};
