import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { showError } from '@/components/ui/Toast';
import { Offer } from '@/api/feedApi';
import { formatStatusLabel, getStatusBadgeVariant } from '@/utils/formatters';

interface SegmentOffersPanelProps {
  isOpen: boolean;
  segmentName: string;
  offers: Offer[];
  loading: boolean;
  onClose: () => void;
  onAddOffer: (offerId: string) => Promise<void>;
  onRemoveOffer: (offerId: string) => Promise<void>;
}

const OfferList = styled.div`
  margin-top: ${spacings.xl};
`;

const OfferItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacings.lg};
  border: 1px solid ${colors.border.neutral.subtle};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.md};

  &:last-child {
    margin-bottom: 0;
  }
`;

const OfferInfo = styled.div`
  flex: 1;
`;

const OfferTitle = styled.div`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.primary};
`;

const OfferId = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.tertiary};
  font-family: 'SF Mono', monospace;
  margin-top: ${spacings.xs};
`;

const AddOfferRow = styled.div`
  display: flex;
  gap: ${spacings.md};
  margin-top: ${spacings.xl};
  padding-top: ${spacings.xl};
  border-top: 1px solid ${colors.border.neutral.subtle};
`;

const TextInput = styled.input`
  flex: 1;
  height: 40px;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.primary};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  &::placeholder {
    color: ${colors.text.neutral.tertiary};
  }
`;

const EmptyText = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.tertiary};
  text-align: center;
  padding: ${spacings['2xl']};
`;

const LoadingText = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.tertiary};
  text-align: center;
  padding: ${spacings['2xl']};
`;

export const SegmentOffersPanel: React.FC<SegmentOffersPanelProps> = ({
  isOpen,
  segmentName,
  offers,
  loading: offersLoading,
  onClose,
  onAddOffer,
  onRemoveOffer,
}) => {
  const [newOfferId, setNewOfferId] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newOfferId.trim()) return;
    try {
      setAdding(true);
      await onAddOffer(newOfferId.trim());
      setNewOfferId('');
    } catch {
      showError('Failed to add offer to segment');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (offerId: string) => {
    try {
      setRemovingId(offerId);
      await onRemoveOffer(offerId);
    } catch {
      showError('Failed to remove offer from segment');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`Offers in "${segmentName}"`}
      confirmLabel="Done"
      onConfirm={onClose}
      onCancel={onClose}
    >
      {offersLoading ? (
        <LoadingText>Loading offers...</LoadingText>
      ) : offers.length === 0 ? (
        <EmptyText>No offers in this segment yet.</EmptyText>
      ) : (
        <OfferList>
          {offers.map((offer) => (
            <OfferItem key={offer.id}>
              <OfferInfo>
                <OfferTitle>{offer.title}</OfferTitle>
                <OfferId>{offer.id}</OfferId>
              </OfferInfo>
              <Badge variant={getStatusBadgeVariant(offer.status)}>
                {formatStatusLabel(offer.status)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(offer.id)}
                loading={removingId === offer.id}
                style={{ marginLeft: '8px' }}
              >
                Remove
              </Button>
            </OfferItem>
          ))}
        </OfferList>
      )}

      <AddOfferRow>
        <TextInput
          id="add-offer-input"
          value={newOfferId}
          onChange={(e) => setNewOfferId(e.target.value)}
          placeholder="Enter Offer ID to add"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button
          onClick={handleAdd}
          loading={adding}
          disabled={!newOfferId.trim()}
          size="md"
        >
          Add
        </Button>
      </AddOfferRow>
    </Modal>
  );
};
