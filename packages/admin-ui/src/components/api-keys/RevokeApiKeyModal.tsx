import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface RevokeApiKeyModalProps {
  isOpen: boolean;
  partnerName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const RevokeApiKeyModal: React.FC<RevokeApiKeyModalProps> = ({
  isOpen,
  partnerName,
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
      title="Revoke API Key"
      message={`Are you sure you want to revoke the API key for "${partnerName}"? This action cannot be undone. All requests using this key will be rejected.`}
      confirmLabel="Revoke"
      onConfirm={handleConfirm}
      onCancel={onClose}
      variant="danger"
      loading={loading}
    />
  );
};
