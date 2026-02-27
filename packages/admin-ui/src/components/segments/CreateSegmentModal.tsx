import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { CreateSegmentPayload } from '@/api/feedApi';

interface CreateSegmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: CreateSegmentPayload) => Promise<void>;
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
    border-color: ${colors.brand.focus};
    box-shadow: 0 0 0 3px ${colors.brand.focusShadow};
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

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const CreateSegmentModal: React.FC<CreateSegmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('theme');
  const [isCurated, setIsCurated] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(toSlug(name));
    }
  }, [name, slugEdited]);

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
      resetForm();
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setType('theme');
    setIsCurated(false);
    setSlugEdited(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Create Collection"
      confirmLabel="Create"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
    >
      <FormGroup>
        <FormLabel htmlFor="segment-name" required>
          Name
        </FormLabel>
        <TextInput
          id="segment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. NYC Events"
          autoFocus
        />
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="segment-slug" required>
          Slug
        </FormLabel>
        <TextInput
          id="segment-slug"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugEdited(true);
          }}
          placeholder="e.g. nyc-events"
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
          label="Curated collection"
        />
      </FormGroup>
    </Modal>
  );
};
