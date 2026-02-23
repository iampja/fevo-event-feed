import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { showSuccess, showError } from '@/components/ui/Toast';
import {
  getSegmentBySlug,
  updateSegment,
  deleteSegment,
  addOfferToSegment,
  removeOfferFromSegment,
  SegmentWithOffers,
  Offer,
  UpdateSegmentPayload,
} from '@/api/feedApi';
import {
  formatDateTime,
  formatStatusLabel,
  getStatusBadgeVariant,
} from '@/utils/formatters';
import { EditSegmentModal } from '@/components/segments/EditSegmentModal';
import { DeleteSegmentModal } from '@/components/segments/DeleteSegmentModal';

const Container = styled.div`
  max-width: 1000px;
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
  grid-template-columns: 1fr 1fr 1fr;
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
`;

const MonoValue = styled.span`
  font-family: monospace;
  font-size: 13px;
  color: ${colors.text.neutral.secondary};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacings.xl};
`;

const AddOfferRow = styled.div`
  display: flex;
  gap: ${spacings.md};
  margin-bottom: ${spacings.xl};
`;

const AddOfferInput = styled.input`
  flex: 1;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

type OfferRow = Offer & Record<string, unknown>;

export const SegmentDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [segment, setSegment] = useState<SegmentWithOffers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [addOfferId, setAddOfferId] = useState('');

  const fetchSegment = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getSegmentBySlug(slug);
      setSegment(data);
    } catch {
      setError('Failed to load segment');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchSegment();
  }, [fetchSegment]);

  const handleUpdate = async (payload: UpdateSegmentPayload) => {
    if (!segment) return;
    await updateSegment(segment.id, payload);
    showSuccess('Segment updated');
    fetchSegment();
  };

  const handleDelete = async () => {
    if (!segment) return;
    await deleteSegment(segment.id);
    showSuccess('Segment deleted');
    navigate('/segments');
  };

  const handleAddOffer = async () => {
    if (!segment || !addOfferId.trim()) return;
    try {
      await addOfferToSegment(segment.id, addOfferId.trim());
      showSuccess('Offer added to segment');
      setAddOfferId('');
      fetchSegment();
    } catch {
      showError('Failed to add offer');
    }
  };

  const handleRemoveOffer = async (offerId: string) => {
    if (!segment) return;
    try {
      await removeOfferFromSegment(segment.id, offerId);
      showSuccess('Offer removed from segment');
      fetchSegment();
    } catch {
      showError('Failed to remove offer');
    }
  };

  if (loading) {
    return (
      <Container>
        <PageHeader title="Loading..." />
      </Container>
    );
  }

  if (error || !segment) {
    return (
      <Container>
        <PageHeader title="Segment Not Found" />
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
      header: '',
      accessor: 'id',
      width: '100px',
      render: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveOffer(row.id)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <Breadcrumb
        items={[
          { label: 'Segments', to: '/segments' },
          { label: segment.name },
        ]}
      />
      <PageHeader
        title={segment.name}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={() => setShowDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      {/* Segment Info */}
      <Card>
        <SectionTitle>Segment Info</SectionTitle>
        <FieldGrid>
          <Field>
            <FieldLabel>Name</FieldLabel>
            <FieldValue>{segment.name}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Slug</FieldLabel>
            <FieldValue><MonoValue>{segment.slug}</MonoValue></FieldValue>
          </Field>
          <Field>
            <FieldLabel>Type</FieldLabel>
            <FieldValue><Badge variant="neutral">{segment.type}</Badge></FieldValue>
          </Field>
          <Field>
            <FieldLabel>Curated</FieldLabel>
            <FieldValue>
              <Badge variant={segment.is_curated ? 'success' : 'neutral'}>
                {segment.is_curated ? 'Yes' : 'No'}
              </Badge>
            </FieldValue>
          </Field>
          <Field>
            <FieldLabel>Created By</FieldLabel>
            <FieldValue>{segment.created_by || '-'}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Created</FieldLabel>
            <FieldValue>{formatDateTime(segment.created_at)}</FieldValue>
          </Field>
          <Field>
            <FieldLabel>Updated</FieldLabel>
            <FieldValue>{formatDateTime(segment.updated_at)}</FieldValue>
          </Field>
        </FieldGrid>
      </Card>

      {/* Linked Offers */}
      <Card>
        <SectionHeader>
          <SectionTitle style={{ margin: 0, paddingBottom: 0, borderBottom: 'none' }}>
            Linked Offers ({segment.offers.length})
          </SectionTitle>
        </SectionHeader>

        <AddOfferRow>
          <AddOfferInput
            value={addOfferId}
            onChange={(e) => setAddOfferId(e.target.value)}
            placeholder="Enter offer ID to add..."
          />
          <Button onClick={handleAddOffer} disabled={!addOfferId.trim()}>
            Add Offer
          </Button>
        </AddOfferRow>

        <Table<OfferRow>
          columns={offerColumns}
          data={segment.offers as OfferRow[]}
          onRowClick={(row) => navigate(`/offers/${row.id}`)}
          emptyMessage="No offers in this segment"
        />
      </Card>

      {showEdit && (
        <EditSegmentModal
          isOpen={showEdit}
          segment={segment}
          onClose={() => setShowEdit(false)}
          onConfirm={handleUpdate}
        />
      )}

      {showDelete && (
        <DeleteSegmentModal
          isOpen={showDelete}
          segmentName={segment.name}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </Container>
  );
};
