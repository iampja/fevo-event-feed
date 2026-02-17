import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { spacings } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { showSuccess, showError } from '@/components/ui/Toast';
import {
  getSegments,
  getSegmentBySlug,
  createSegment,
  updateSegment,
  deleteSegment,
  addOfferToSegment,
  removeOfferFromSegment,
  Segment,
  SegmentWithOffers,
  CreateSegmentPayload,
  UpdateSegmentPayload,
} from '@/api/feedApi';
import { formatDateTime } from '@/utils/formatters';
import { CreateSegmentModal } from '@/components/segments/CreateSegmentModal';
import { EditSegmentModal } from '@/components/segments/EditSegmentModal';
import { DeleteSegmentModal } from '@/components/segments/DeleteSegmentModal';
import { SegmentOffersPanel } from '@/components/segments/SegmentOffersPanel';

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacings.xl};
  margin-bottom: ${spacings['2xl']};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${spacings.sm};
`;

type SegmentRow = Segment & Record<string, unknown>;

const ITEMS_PER_PAGE = 10;

export const SegmentsPage: React.FC = () => {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Segment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Segment | null>(null);
  const [offersTarget, setOffersTarget] = useState<Segment | null>(null);
  const [segmentWithOffers, setSegmentWithOffers] =
    useState<SegmentWithOffers | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);

  const fetchSegments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSegments();
      setSegments(data);
    } catch {
      showError('Failed to load segments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const filteredSegments = useMemo(() => {
    if (!searchQuery) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q),
    );
  }, [segments, searchQuery]);

  const totalPages = Math.ceil(filteredSegments.length / ITEMS_PER_PAGE);
  const paginatedSegments = filteredSegments.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleCreate = useCallback(
    async (payload: CreateSegmentPayload) => {
      await createSegment(payload);
      showSuccess('Segment created successfully');
      fetchSegments();
    },
    [fetchSegments],
  );

  const handleUpdate = useCallback(
    async (segmentId: string, payload: UpdateSegmentPayload) => {
      await updateSegment(segmentId, payload);
      showSuccess('Segment updated successfully');
      fetchSegments();
    },
    [fetchSegments],
  );

  const handleDelete = useCallback(
    async (segmentId: string) => {
      await deleteSegment(segmentId);
      showSuccess('Segment deleted successfully');
      fetchSegments();
    },
    [fetchSegments],
  );

  const handleViewOffers = useCallback(async (segment: Segment) => {
    setOffersTarget(segment);
    setOffersLoading(true);
    try {
      const data = await getSegmentBySlug(segment.slug);
      setSegmentWithOffers(data);
    } catch {
      showError('Failed to load segment offers');
      setOffersTarget(null);
    } finally {
      setOffersLoading(false);
    }
  }, []);

  const handleAddOffer = useCallback(
    async (offerId: string) => {
      if (!offersTarget) return;
      await addOfferToSegment(offersTarget.id, offerId);
      showSuccess('Offer added to segment');
      const data = await getSegmentBySlug(offersTarget.slug);
      setSegmentWithOffers(data);
    },
    [offersTarget],
  );

  const handleRemoveOffer = useCallback(
    async (offerId: string) => {
      if (!offersTarget) return;
      await removeOfferFromSegment(offersTarget.id, offerId);
      showSuccess('Offer removed from segment');
      const data = await getSegmentBySlug(offersTarget.slug);
      setSegmentWithOffers(data);
    },
    [offersTarget],
  );

  const columns: Column<SegmentRow>[] = [
    {
      header: 'Name',
      accessor: 'name',
      render: (row) => <strong>{row.name}</strong>,
    },
    {
      header: 'Slug',
      accessor: 'slug',
      render: (row) => (
        <code style={{ fontSize: '12px', color: '#6B7280' }}>{row.slug}</code>
      ),
    },
    {
      header: 'Type',
      accessor: 'type',
      width: '120px',
      render: (row) => <Badge variant="neutral">{row.type}</Badge>,
    },
    {
      header: 'Curated',
      accessor: 'is_curated',
      width: '100px',
      render: (row) => (
        <Badge variant={row.is_curated ? 'success' : 'neutral'}>
          {row.is_curated ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      header: 'Created',
      accessor: 'created_at',
      width: '160px',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      width: '220px',
      render: (row) => (
        <ActionButtons onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewOffers(row as Segment)}
          >
            Offers
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditTarget(row as Segment)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(row as Segment)}
          >
            Delete
          </Button>
        </ActionButtons>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Segments"
        subtitle="Manage curated collections of offers"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            Create Segment
          </Button>
        }
      />

      <ToolbarRow>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search segments..."
        />
      </ToolbarRow>

      <Table<SegmentRow>
        columns={columns}
        data={paginatedSegments as SegmentRow[]}
        emptyMessage={loading ? 'Loading segments...' : 'No segments found'}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <CreateSegmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreate}
      />

      {editTarget && (
        <EditSegmentModal
          isOpen={!!editTarget}
          segment={editTarget}
          onClose={() => setEditTarget(null)}
          onConfirm={(payload) => handleUpdate(editTarget.id, payload)}
        />
      )}

      {deleteTarget && (
        <DeleteSegmentModal
          isOpen={!!deleteTarget}
          segmentName={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}

      {offersTarget && (
        <SegmentOffersPanel
          isOpen={!!offersTarget}
          segmentName={offersTarget.name}
          offers={segmentWithOffers?.offers || []}
          loading={offersLoading}
          onClose={() => {
            setOffersTarget(null);
            setSegmentWithOffers(null);
          }}
          onAddOffer={handleAddOffer}
          onRemoveOffer={handleRemoveOffer}
        />
      )}
    </>
  );
};
