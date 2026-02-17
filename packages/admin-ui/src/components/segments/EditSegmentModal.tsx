import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Segment, UpdateSegmentPayload } from '@/api/feedApi';

interface EditSegmentModalProps {
  isOpen: boolean;
  segment: Segment;
  onClose: () => void;
  onConfirm: (payload: UpdateSegmentPayload) => Promise<void>;
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

const typeOptions = [
  { value: 'theme', label: 'Theme' },
  { value: 'geography', label: 'Geography' },
  { value: 'partner', label: 'Partner' },
  { value: 'custom', label: 'Custom' },
];

export const EditSegmentModal: React.FC<EditSegmentModalProps> = ({
  isOpen,
  segment,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState(segment.name);
  const [slug, setSlug] = useState(segment.slug);
  const [type, setType] = useState(segment.type);
  const [isCurated, setIsCurated] = useState(segment.is_curated);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!name.trim() || !slug.trim()) return;
    try {
      setLoading(true);
      await onConfirm({
        name: name.trim(),
        slug: slug.trim(),
        type,
        is_curated: isCurated,
      });
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
      title="Edit Segment"
      confirmLabel="Save Changes"
      onConfirm={handleConfirm}
      onCancel={onClose}
      loading={loading}
    >
      <FormGroup>
        <FormLabel htmlFor="edit-segment-name" required>
          Name
        </FormLabel>
        <TextInput
          id="edit-segment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="edit-segment-slug" required>
          Slug
        </FormLabel>
        <TextInput
          id="edit-segment-slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </FormGroup>

      <FormGroup>
        <FormLabel required>Type</FormLabel>
        <Select value={type} onChange={setType} options={typeOptions} />
      </FormGroup>

      <FormGroup>
        <Switch
          checked={isCurated}
          onChange={setIsCurated}
          label="Curated segment"
        />
      </FormGroup>
    </Modal>
  );
};
