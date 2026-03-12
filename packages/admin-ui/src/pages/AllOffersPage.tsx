import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { spacings, colors, typography, radius } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column, SortState } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { showError, showSuccess } from '@/components/ui/Toast';
import {
  getOffers,
  getOfferStats,
  getSegments,
  addOfferToSegment,
  removeOfferFromSegment,
  Offer,
  OffersMeta,
  OfferStats,
  Segment,
} from '@/api/feedApi';
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/utils/formatters';

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${spacings.xl};
  margin-bottom: ${spacings['2xl']};
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.xl};
  margin-bottom: ${spacings['2xl']};
`;

const FilterGroup = styled.div`
  display: flex;
  gap: ${spacings.md};
`;

const CollectionCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const CollectionChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: ${colors.surface.neutral.bgSubtle};
  border: 1px solid ${colors.border.neutral.subtle};
  border-radius: ${radius.cornerRadiusSm};
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.secondary};
  white-space: nowrap;
`;

const ChipRemove = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  line-height: 1;
  color: ${colors.text.neutral.secondary};
  &:hover {
    color: ${colors.text.neutral.primary};
  }
`;

const InlineSelect = styled.select`
  padding: 2px 4px;
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusSm};
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.primary};
  background: white;
  cursor: pointer;
  max-width: 100%;
`;

type OfferRow = Offer & Record<string, unknown>;

const PER_PAGE = 25;

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'sold_out', label: 'Sold Out' },
  { value: 'deleted', label: 'Deleted' },
];

const distributionOptions = [
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
];

export const AllOffersPage: React.FC = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [meta, setMeta] = useState<OffersMeta | null>(null);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [distributionFilter, setDistributionFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [collections, setCollections] = useState<Segment[]>([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ column: 'created_at', direction: 'desc' });

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        per_page: PER_PAGE,
        sort_by: sort.column,
        sort_dir: sort.direction,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;
      if (distributionFilter) params.distribution_enabled = distributionFilter;
      if (collectionFilter) params.segment_id = collectionFilter;

      const result = await getOffers(params as Parameters<typeof getOffers>[0]);
      setOffers(result.data);
      setMeta(result.meta);
    } catch {
      showError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, distributionFilter, collectionFilter, sort]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  useEffect(() => {
    getOfferStats()
      .then(setStats)
      .catch(() => {});
    getSegments()
      .then(setCollections)
      .catch(() => {});
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleDistributionChange = useCallback((value: string) => {
    setDistributionFilter(value);
    setPage(1);
  }, []);

  const handleCollectionChange = useCallback((value: string) => {
    setCollectionFilter(value);
    setPage(1);
  }, []);

  const collectionOptions = collections.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const handleInlineAdd = async (offerId: string, segmentId: string) => {
    try {
      await addOfferToSegment(segmentId, offerId);
      const seg = collections.find((s) => s.id === segmentId);
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, collections: [...(o.collections || []), { id: segmentId, name: seg?.name || '', slug: seg?.slug || '' }] }
            : o,
        ),
      );
      showSuccess('Added to collection');
    } catch {
      showError('Failed to add to collection');
    }
  };

  const handleInlineRemove = async (e: React.MouseEvent, offerId: string, segmentId: string) => {
    e.stopPropagation();
    try {
      await removeOfferFromSegment(segmentId, offerId);
      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, collections: (o.collections || []).filter((c) => c.id !== segmentId) }
            : o,
        ),
      );
      showSuccess('Removed from collection');
    } catch {
      showError('Failed to remove from collection');
    }
  };

  const handleSort = useCallback((newSort: SortState) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const columns: Column<OfferRow>[] = [
    {
      header: 'Title',
      accessor: 'title',
      sortable: true,
      render: (row) => <strong>{row.title}</strong>,
    },
    {
      header: 'Organization',
      accessor: 'organization_name',
      sortable: true,
    },
    {
      header: 'Collections',
      accessor: 'collections' as any,
      width: '200px',
      render: (row) => {
        const cols: { id: string; name: string }[] = row.collections || [];
        const available = collections.filter(
          (s) => !cols.some((c) => c.id === s.id),
        );
        return (
          <CollectionCell onClick={(e) => e.stopPropagation()}>
            {cols.map((c) => (
              <CollectionChip key={c.id}>
                {c.name}
                <ChipRemove
                  title={`Remove from ${c.name}`}
                  onClick={(e) => handleInlineRemove(e, row.id, c.id)}
                >
                  &times;
                </ChipRemove>
              </CollectionChip>
            ))}
            {available.length > 0 && (
              <InlineSelect
                value=""
                onChange={(e) => {
                  if (e.target.value) handleInlineAdd(row.id, e.target.value);
                }}
              >
                <option value="">+ Add...</option>
                {available.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </InlineSelect>
            )}
          </CollectionCell>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      width: '110px',
      sortable: true,
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
      sortable: true,
      render: (row) => (
        <Badge variant={row.distribution_enabled ? 'success' : 'neutral'}>
          {row.distribution_enabled ? 'Enabled' : 'Disabled'}
        </Badge>
      ),
    },
    {
      header: 'Source',
      accessor: 'source',
      width: '100px',
      sortable: true,
      render: (row) => (
        <Badge variant={row.source === 'fevo_sync' ? 'success' : 'neutral'}>
          {row.source === 'fevo_sync' ? 'Stage' : 'Seed'}
        </Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      width: '160px',
      sortable: true,
      render: (row) => formatDateTime(row.created_at),
    },
  ];

  return (
    <>
      <PageHeader
        title="All Offers"
        subtitle="Browse and manage all offers in the system"
      />

      {stats && (
        <StatsGrid>
          <StatCard label="Total Offers" value={stats.total} />
          <StatCard label="Active" value={stats.active} variant="success" />
          <StatCard
            label="Distribution Enabled"
            value={stats.distribution_enabled}
            variant="success"
          />
          <StatCard label="Sold Out" value={stats.sold_out} variant="warning" />
        </StatsGrid>
      )}

      <ToolbarRow>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search offers..."
        />
        <FilterGroup>
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={statusOptions}
            placeholder="All Statuses"
          />
          <Select
            value={distributionFilter}
            onChange={handleDistributionChange}
            options={distributionOptions}
            placeholder="All Distribution"
          />
          <Select
            value={collectionFilter}
            onChange={handleCollectionChange}
            options={collectionOptions}
            placeholder="All Collections"
          />
        </FilterGroup>
      </ToolbarRow>

      <Table<OfferRow>
        columns={columns}
        data={offers as OfferRow[]}
        onRowClick={(row) => navigate(`/offers/${row.id}`)}
        emptyMessage={loading ? 'Loading offers...' : 'No offers found'}
        sort={sort}
        onSort={handleSort}
      />

      {meta && meta.total_pages > 1 && (
        <Pagination
          page={page}
          totalPages={meta.total_pages}
          onPageChange={setPage}
        />
      )}
    </>
  );
};
