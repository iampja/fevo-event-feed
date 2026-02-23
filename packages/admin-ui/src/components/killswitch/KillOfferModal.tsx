import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { getOffers, Offer } from '@/api/feedApi';

interface KillOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (offerId: string, reason?: string) => Promise<void>;
}

const FormGroup = styled.div`
  margin-bottom: ${spacings.xl};
`;

const TextInput = styled.input`
  width: 100%;
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

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.primary};
  resize: vertical;
  font-family: ${typography.fontFamily};
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

const ConfirmationText = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.secondary};
  line-height: ${typography.lineHeight.normal};
  padding: ${spacings.lg};
  background: ${colors.surface.danger.subtle};
  border-radius: ${radius.cornerRadiusMd};
  border-left: 3px solid ${colors.surface.danger.primary};
  margin-top: ${spacings.xl};
`;

const OfferList = styled.div`
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
`;

const OfferOption = styled.div<{ $selected: boolean }>`
  padding: ${spacings.md} ${spacings.lg};
  cursor: pointer;
  font-size: ${typography.fontSize.sm};
  background: ${(p) => (p.$selected ? '#EFF6FF' : 'transparent')};
  border-bottom: 1px solid ${colors.border.neutral.subtle};
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(p) => (p.$selected ? '#EFF6FF' : colors.surface.neutral.bgSubtle)};
  }
`;

const OfferTitle = styled.span`
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.primary};
`;

const OfferOrg = styled.span`
  color: ${colors.text.neutral.secondary};
  margin-left: ${spacings.md};
`;

export const KillOfferModal: React.FC<KillOfferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [offerId, setOfferId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      getOffers({ per_page: 100, status: 'active', sort_by: 'title', sort_dir: 'asc' })
        .then((res) => setOffers(res.data))
        .catch(() => {});
    }
  }, [isOpen]);

  const filteredOffers = useMemo(() => {
    if (!search.trim()) return offers;
    const q = search.toLowerCase();
    return offers.filter(
      (o) =>
        o.title.toLowerCase().includes(q) ||
        o.organization_name.toLowerCase().includes(q),
    );
  }, [offers, search]);

  const selectedOffer = offers.find((o) => o.id === offerId);

  const handleConfirm = async () => {
    if (!offerId) return;
    try {
      setLoading(true);
      await onConfirm(offerId, reason.trim() || undefined);
      setOfferId('');
      setReason('');
      setSearch('');
      onClose();
    } catch {
      // Error handling done by parent
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOfferId('');
    setReason('');
    setSearch('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Kill Offer"
      confirmLabel="Remove from Event Feed"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      variant="danger"
      loading={loading}
    >
      <FormGroup>
        <FormLabel htmlFor="kill-offer-search" required>
          Select Offer
        </FormLabel>
        <TextInput
          id="kill-offer-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search offers by title or organization..."
          autoFocus
        />
        <OfferList>
          {filteredOffers.map((offer) => (
            <OfferOption
              key={offer.id}
              $selected={offer.id === offerId}
              onClick={() => setOfferId(offer.id)}
            >
              <OfferTitle>{offer.title}</OfferTitle>
              <OfferOrg>— {offer.organization_name}</OfferOrg>
            </OfferOption>
          ))}
          {filteredOffers.length === 0 && (
            <OfferOption $selected={false} style={{ cursor: 'default', color: colors.text.neutral.tertiary }}>
              No offers found
            </OfferOption>
          )}
        </OfferList>
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="kill-offer-reason">Reason (optional)</FormLabel>
        <TextArea
          id="kill-offer-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why is this offer being removed?"
        />
      </FormGroup>

      {selectedOffer && (
        <ConfirmationText>
          Remove <strong>{selectedOffer.title}</strong> from the Event Feed? This
          takes effect immediately.
        </ConfirmationText>
      )}
    </Modal>
  );
};
