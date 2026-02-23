import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';
import { Modal } from '@/components/ui/Modal';
import { FormLabel } from '@/components/ui/FormLabel';
import { getOrganizations, Organization } from '@/api/feedApi';

interface KillOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orgId: string, reason: string) => Promise<void>;
}

const FormGroup = styled.div`
  margin-bottom: ${spacings.xl};
`;

const SelectInput = styled.select`
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

const WarningBanner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacings.lg};
  padding: ${spacings.lg};
  background: ${colors.surface.danger.subtle};
  border: 1px solid ${colors.surface.danger.primary};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
`;

const WarningIconWrapper = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${colors.surface.danger.primary};
  color: ${colors.text.onColor.primary};
  border-radius: 50%;
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.bold};
`;

const WarningText = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.danger.primary};
  line-height: ${typography.lineHeight.normal};
  margin: 0;
`;

const SelectedInfo = styled.div`
  margin-top: ${spacings.md};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  font-family: monospace;
`;

export const KillOrgModal: React.FC<KillOrgModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [orgId, setOrgId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  useEffect(() => {
    if (isOpen) {
      getOrganizations()
        .then(setOrgs)
        .catch(() => {});
    }
  }, [isOpen]);

  const selectedOrg = orgs.find((o) => o.id === orgId);
  const canSubmit = orgId !== '' && reason.trim() !== '';

  const handleConfirm = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await onConfirm(orgId, reason.trim());
      setOrgId('');
      setReason('');
      onClose();
    } catch {
      // Error handling done by parent
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOrgId('');
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title="Kill Organization"
      confirmLabel="Remove All Offers"
      cancelLabel="Cancel"
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      variant="danger"
      loading={loading}
    >
      <WarningBanner>
        <WarningIconWrapper>!</WarningIconWrapper>
        <WarningText>
          This will remove <strong>ALL offers</strong> from this organization from
          the Event Feed. This action takes effect immediately.
        </WarningText>
      </WarningBanner>

      <FormGroup>
        <FormLabel htmlFor="kill-org-id" required>
          Organization
        </FormLabel>
        <SelectInput
          id="kill-org-id"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
          autoFocus
        >
          <option value="">Select an organization...</option>
          {orgs.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </SelectInput>
        {selectedOrg && (
          <SelectedInfo>ID: {selectedOrg.id}</SelectedInfo>
        )}
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="kill-org-reason" required>
          Reason
        </FormLabel>
        <TextArea
          id="kill-org-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="A reason is required for organization-level kills"
        />
      </FormGroup>
    </Modal>
  );
};
