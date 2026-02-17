import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { HelperText } from '@/components/ui/HelperText';

interface EditRateLimitModalProps {
  isOpen: boolean;
  currentLimit: number;
  partnerName: string;
  onClose: () => void;
  onConfirm: (rateLimit: number) => Promise<void>;
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

const CurrentValue = styled.p`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.xl};
`;

export const EditRateLimitModal: React.FC<EditRateLimitModalProps> = ({
  isOpen,
  currentLimit,
  partnerName,
  onClose,
  onConfirm,
}) => {
  const [rateLimit, setRateLimit] = useState(String(currentLimit));
  const [loading, setLoading] = useState(false);

  const parsedLimit = parseInt(rateLimit, 10);
  const isValid = !isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 10000;

  const handleConfirm = async () => {
    if (!isValid) return;
    try {
      setLoading(true);
      await onConfirm(parsedLimit);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Edit Rate Limit"
      confirmLabel="Update"
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={loading}
    >
      <CurrentValue>
        Current rate limit for <strong>{partnerName}</strong>:{' '}
        {currentLimit.toLocaleString()} req/min
      </CurrentValue>

      <FormGroup>
        <FormLabel htmlFor="new-rate-limit" required>
          New Rate Limit (req/min)
        </FormLabel>
        <TextInput
          id="new-rate-limit"
          type="number"
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
          min={1}
          max={10000}
          autoFocus
        />
        {rateLimit && !isValid && (
          <HelperText variant="error">
            Must be between 1 and 10,000
          </HelperText>
        )}
      </FormGroup>
    </Modal>
  );
};
