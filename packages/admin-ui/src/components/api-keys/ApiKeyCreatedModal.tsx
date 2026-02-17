import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { CopyField } from '@/components/ui/CopyField';

interface ApiKeyCreatedModalProps {
  isOpen: boolean;
  apiKey: string;
  partnerName: string;
  onClose: () => void;
}

const WarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacings.lg};
  padding: ${spacings.xl};
  background: ${colors.surface.warning.subtle};
  border: 1px solid ${colors.surface.warning.primary};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings['2xl']};
`;

const WarningIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${colors.surface.warning.primary};
  color: ${colors.text.onColor.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${typography.fontWeight.bold};
  font-size: ${typography.fontSize.sm};
  flex-shrink: 0;
`;

const WarningText = styled.div`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.warning.primary};
  font-weight: ${typography.fontWeight.medium};
  line-height: ${typography.lineHeight.normal};
`;

const InfoRow = styled.div`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.md};

  strong {
    color: ${colors.text.neutral.primary};
  }
`;

export const ApiKeyCreatedModal: React.FC<ApiKeyCreatedModalProps> = ({
  isOpen,
  apiKey,
  partnerName,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      title="API Key Created"
      confirmLabel="I've copied the key"
      onConfirm={onClose}
      onCancel={onClose}
    >
      <WarningBanner>
        <WarningIcon>!</WarningIcon>
        <WarningText>
          This API key will only be shown once. Copy it now and store it
          securely.
        </WarningText>
      </WarningBanner>

      <InfoRow>
        <strong>Partner:</strong> {partnerName}
      </InfoRow>

      <CopyField value={apiKey} label="API Key" />
    </Modal>
  );
};
