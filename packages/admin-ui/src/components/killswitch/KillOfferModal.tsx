import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';

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

export const KillOfferModal: React.FC<KillOfferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [offerId, setOfferId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!offerId.trim()) return;
    try {
      setLoading(true);
      await onConfirm(offerId.trim(), reason.trim() || undefined);
      setOfferId('');
      setReason('');
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
        <FormLabel htmlFor="kill-offer-id" required>
          Offer ID
        </FormLabel>
        <TextInput
          id="kill-offer-id"
          value={offerId}
          onChange={(e) => setOfferId(e.target.value)}
          placeholder="Enter the Offer ID to remove"
          autoFocus
        />
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

      {offerId.trim() && (
        <ConfirmationText>
          Remove offer <strong>{offerId.trim()}</strong> from the Event Feed? This
          takes effect immediately.
        </ConfirmationText>
      )}
    </Modal>
  );
};
