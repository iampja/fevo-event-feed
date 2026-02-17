import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';

interface RestoreModalProps {
  isOpen: boolean;
  targetName: string;
  targetType: 'offer' | 'organization';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const RestoreInfo = styled.div`
  margin-bottom: ${spacings.xl};
`;

const RestoreTarget = styled.div`
  padding: ${spacings.lg} ${spacings.xl};
  background: ${colors.surface.success.subtle};
  border-radius: ${radius.cornerRadiusMd};
  border-left: 3px solid ${colors.surface.success.primary};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  margin-bottom: ${spacings.xl};
`;

const TargetLabel = styled.span`
  font-weight: ${typography.fontWeight.semibold};
`;

const Note = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacings.md};
  padding: ${spacings.lg};
  background: ${colors.surface.neutral.bgSubtle};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  line-height: ${typography.lineHeight.normal};
`;

const NoteIcon = styled.span`
  flex-shrink: 0;
  color: #3B82F6;
  font-size: ${typography.fontSize.lg};
`;

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  targetName,
  targetType,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      onClose();
    } catch {
      // Error handling done by parent
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = targetType === 'organization' ? 'organization' : 'offer';

  return (
    <Modal
      isOpen={isOpen}
      title="Restore to Event Feed"
      confirmLabel="Restore"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onCancel={onClose}
      variant="default"
      loading={loading}
    >
      <RestoreInfo>
        <RestoreTarget>
          Restore <TargetLabel>{targetName}</TargetLabel> ({typeLabel}) to the Event
          Feed?
        </RestoreTarget>

        <Note>
          <NoteIcon>i</NoteIcon>
          <span>
            {targetType === 'offer'
              ? 'This offer will return to the feed on the next refresh cycle (up to 15 minutes).'
              : 'All offers from this organization will return to the feed on the next refresh cycle (up to 15 minutes).'}
          </span>
        </Note>
      </RestoreInfo>
    </Modal>
  );
};
