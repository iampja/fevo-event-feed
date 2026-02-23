import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import {
  getOrganization,
  getOffers,
  Organization,
  Offer,
  OffersMeta,
} from '@/api/feedApi';
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeVariant,
  formatPriceRange,
} from '@/utils/formatters';

const Container = styled.div`
  max-width: 1000px;
`;

const InfoBanner = styled.div`
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: #eff6ff;
  color: #1e40af;
  font-size: ${typography.fontSize.sm};
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

const OrgInfoRow = styled.div`
  display: flex;
  gap: ${spacings['2xl']};
  align-items: flex-start;
`;

const OrgLogo = styled.img`
  width: 80px;
  height: 80px;
  border-radius: ${radius.cornerRadiusMd};
  object-fit: contain;
  border: 1px solid ${colors.border.neutral.primary};
  background: ${colors.surface.neutral.bgSubtle};
`;

const OrgLogoPlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${radius.cornerRadiusMd};
  background: ${colors.surface.neutral.bgSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${typography.fontSize['2xl']};
  color: ${colors.text.neutral.tertiary};
  border: 1px solid ${colors.border.neutral.primary};
`;

const OrgFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacings.xl};
  flex: 1;
`;

const Field = styled.div``;

const FieldLabel = styled.div`
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.sm};
`;

const FieldValue = styled.div`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
`;

const MonoValue = styled.span`
  font-family: monospace;
  font-size: 13px;
  color: ${colors.text.neutral.secondary};
`;

type OfferRow = Offer & Record<string, unknown>;

const PER_PAGE = 25;

export const OrganizationDetailPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const [org, setOrg] = useState<Organization | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersMeta, setOffersMeta] = useState<OffersMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      setError(null);
      const [orgData, offersData] = await Promise.all([
        getOrganization(orgId),
        getOffers({
          organization_id: orgId,
          page,
          per_page: PER_PAGE,
          sort_by: 'created_at',
          sort_dir: 'desc',
        }),
      ]);
      setOrg(orgData);
      setOffers(offersData.data);
      setOffersMeta(offersData.meta);
    } catch {
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  }, [orgId, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Container>
        <PageHeader title="Loading..." />
      </Container>
    );
  }

  if (error || !org) {
    return (
      <Container>
        <PageHeader title="Organization Not Found" />
      </Container>
    );
  }

  const offerColumns: Column<OfferRow>[] = [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => <strong>{row.title}</strong>,
    },
    {
      header: 'Date',
      accessor: 'date',
      width: '140px',
      render: (row) => (row.date ? formatDateTime(row.date) : '-'),
    },
    {
      header: 'Price',
      accessor: 'price_min',
      width: '130px',
      render: (row) => formatPriceRange(row.price_min, row.price_max),
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '110px',
      render: (row) => (
        <Badge variant={getStatusBadgeVariant(row.status)}>
          {formatStatusLabel(row.status)}
        </Badge>
      ),
    },
    {
      header: 'Distribution',
      accessor: 'distribution_enabled',
      width: '120px',
      render: (row) => (
        <Badge variant={row.distribution_enabled ? 'success' : 'neutral'}>
          {row.distribution_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      width: '160px',
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <Container>
      <Breadcrumb
        items={[
          { label: 'Organizations', to: '/organizations' },
          { label: org.name },
        ]}
      />
      <PageHeader title={org.name} />

      <InfoBanner>
        Organizations are synced from FEVO and are read-only.
      </InfoBanner>

      {/* Org Info */}
      <Card>
        <SectionTitle>Organization Info</SectionTitle>
        <OrgInfoRow>
          {org.logo_url ? (
            <OrgLogo src={org.logo_url} alt={org.name} />
          ) : (
            <OrgLogoPlaceholder>{org.name.charAt(0)}</OrgLogoPlaceholder>
          )}
          <OrgFields>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldValue>{org.name}</FieldValue>
            </Field>
            <Field>
              <FieldLabel>FEVO Org ID</FieldLabel>
              <FieldValue>
                {org.fevo_org_id ? <MonoValue>{org.fevo_org_id}</MonoValue> : '-'}
              </FieldValue>
            </Field>
            <Field>
              <FieldLabel>Internal ID</FieldLabel>
              <FieldValue><MonoValue>{org.id}</MonoValue></FieldValue>
            </Field>
            <Field>
              <FieldLabel>Created</FieldLabel>
              <FieldValue>{formatDateTime(org.created_at)}</FieldValue>
            </Field>
            <Field>
              <FieldLabel>Updated</FieldLabel>
              <FieldValue>{formatDateTime(org.updated_at)}</FieldValue>
            </Field>
          </OrgFields>
        </OrgInfoRow>
      </Card>

      {/* Offers */}
      <Card>
        <SectionTitle>
          Offers {offersMeta ? `(${offersMeta.total})` : ''}
        </SectionTitle>
        <Table<OfferRow>
          columns={offerColumns}
          data={offers as OfferRow[]}
          onRowClick={(row) => navigate(`/offers/${row.id}`)}
          emptyMessage="No offers for this organization"
        />
        {offersMeta && offersMeta.total_pages > 1 && (
          <Pagination
            page={page}
            totalPages={offersMeta.total_pages}
            onPageChange={setPage}
          />
        )}
      </Card>
    </Container>
  );
};
