import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { HelperText } from '@/components/ui/HelperText';

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (partnerName: string, rateLimit?: number) => Promise<void>;
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

export const CreateApiKeyModal: React.FC<CreateApiKeyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [partnerName, setPartnerName] = useState('');
  const [rateLimit, setRateLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!partnerName.trim()) return;
    try {
      setLoading(true);
      const limit = rateLimit ? parseInt(rateLimit, 10) : undefined;
      await onConfirm(partnerName.trim(), limit);
      setPartnerName('');
      setRateLimit('');
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPartnerName('');
    setRateLimit('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create API Key"
      confirmLabel="Create"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
    >
      <FormGroup>
        <FormLabel htmlFor="partner-name" required>
          Partner Name
        </FormLabel>
        <TextInput
          id="partner-name"
          value={partnerName}
          onChange={(e) => setPartnerName(e.target.value)}
          placeholder="e.g. Acme Sports"
          autoFocus
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="rate-limit">Rate Limit (req/min)</FormLabel>
        <TextInput
          id="rate-limit"
          type="number"
          value={rateLimit}
          onChange={(e) => setRateLimit(e.target.value)}
          placeholder="Default: 100"
          min={1}
          max={10000}
        />
        <HelperText>Between 1 and 10,000 requests per minute</HelperText>
      </FormGroup>
    </Modal>
  );
};
