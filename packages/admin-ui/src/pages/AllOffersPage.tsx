import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { spacings } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { showError } from '@/components/ui/Toast';
import {
  getOffers,
  getOfferStats,
  getSegments,
  Offer,
  OffersMeta,
  OfferStats,
  Segment,
} from '@/api/feedApi';
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeVariant,
  formatPriceRange,
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

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page,
        per_page: PER_PAGE,
        sort_by: 'created_at',
        sort_dir: 'desc' as const,
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
  }, [page, searchQuery, statusFilter, distributionFilter, collectionFilter]);

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

  const columns: Column<OfferRow>[] = [
    {
      header: 'Title',
      accessor: 'title',
      render: (row) => <strong>{row.title}</strong>,
    },
    {
      header: 'Organization',
      accessor: 'organization_name',
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
      header: 'Source',
      accessor: 'source',
      width: '100px',
      render: (row) => (
        <Badge variant={row.source === 'fevo' ? 'success' : 'warning'}>
          {row.source === 'fevo' ? 'Live' : 'Seed'}
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
