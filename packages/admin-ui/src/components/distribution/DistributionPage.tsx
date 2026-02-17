import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { getDistributionStatus, updateDistribution, DistributionStatus } from '@/api/feedApi';
import { DistributionToggle } from './DistributionToggle';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { showSuccess, showError } from '@/components/ui/Toast';

const PageWrapper = styled.div`
  max-width: 720px;
`;

const OfferInfoCard = styled.div`
  background: ${colors.surface.neutral.primary};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  padding: ${spacings['2xl']};
  margin-bottom: ${spacings['2xl']};
  box-shadow: ${shadows.sm};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.lg};
  margin-bottom: ${spacings.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  min-width: 120px;
`;

const InfoValue = styled.span`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
`;

const LastUpdated = styled.div`
  margin-top: ${spacings['2xl']};
  padding: ${spacings.xl};
  background: ${colors.surface.neutral.bgSubtle};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacings['4xl']};
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.md};
`;

const ErrorState = styled.div`
  padding: ${spacings['2xl']};
  background: ${colors.surface.danger.subtle};
  border: 1px solid ${colors.surface.danger.primary};
  border-radius: ${radius.cornerRadiusMd};
  color: ${colors.text.danger.primary};
  font-size: ${typography.fontSize.md};
`;

function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'neutral';
    case 'sold_out':
      return 'warning';
    case 'deleted':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatStatusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export const DistributionPage: React.FC = () => {
  const { offerId } = useParams<{ offerId: string }>();
  const [status, setStatus] = useState<DistributionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!offerId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getDistributionStatus(offerId);
      setStatus(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load distribution status';
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleToggle = async (enabled: boolean) => {
    if (!offerId) return;
    try {
      setUpdating(true);
      const updated = await updateDistribution(offerId, enabled);
      setStatus(updated);
      showSuccess(
        enabled
          ? 'Distribution enabled. Offer will appear in the Event Feed.'
          : 'Distribution disabled. Offer removed from the Event Feed.',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update distribution';
      showError(message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <PageHeader title="Distribution Settings" />
        <LoadingState>Loading distribution status...</LoadingState>
      </PageWrapper>
    );
  }

  if (error || !status) {
    return (
      <PageWrapper>
        <PageHeader title="Distribution Settings" />
        <ErrorState>
          {error || 'Could not load distribution status for this offer.'}
        </ErrorState>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Distribution Settings"
        subtitle={`Manage event feed distribution for this offer`}
      />

      <OfferInfoCard>
        <InfoRow>
          <InfoLabel>Offer Name</InfoLabel>
          <InfoValue>{status.offerName}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Offer ID</InfoLabel>
          <InfoValue style={{ fontFamily: 'monospace', fontSize: '13px' }}>
            {status.offerId}
          </InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Status</InfoLabel>
          <Badge variant={getStatusBadgeVariant(status.offerStatus)}>
            {formatStatusLabel(status.offerStatus)}
          </Badge>
        </InfoRow>
      </OfferInfoCard>

      <DistributionToggle
        offerId={status.offerId}
        enabled={status.distributionEnabled}
        onChange={handleToggle}
        offerStatus={status.offerStatus}
        loading={updating}
      />

      <LastUpdated>
        Last updated: {formatTimestamp(status.lastUpdatedAt)} by {status.lastUpdatedBy}
      </LastUpdated>
    </PageWrapper>
  );
};
