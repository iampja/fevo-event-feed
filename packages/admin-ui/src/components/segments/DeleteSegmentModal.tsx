import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface DeleteSegmentModalProps {
  isOpen: boolean;
  segmentName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteSegmentModal: React.FC<DeleteSegmentModalProps> = ({
  isOpen,
  segmentName,
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
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Delete Segment"
      message={`Are you sure you want to delete "${segmentName}"? This will remove all offer associations and cannot be undone.`}
      confirmLabel="Delete"
      onConfirm={handleConfirm}
      onCancel={onClose}
      variant="danger"
      loading={loading}
    />
  );
};
