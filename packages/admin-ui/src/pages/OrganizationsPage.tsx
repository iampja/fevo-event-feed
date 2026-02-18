import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  fevo_org_id: string | null;
  created_at: string;
  updated_at: string;
}

const Card = styled.div`
  background: white;
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  padding: ${spacings['2xl']};
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacings.xl};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${spacings.md} ${spacings.lg};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid ${colors.border.neutral.primary};
`;

const Td = styled.td`
  padding: ${spacings.md} ${spacings.lg};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  border-bottom: 1px solid ${colors.border.neutral.subtle};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${spacings.sm};
`;

const FormGroup = styled.div`
  margin-bottom: ${spacings.xl};
`;

const Label = styled.label`
  display: block;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.sm};
`;

const Input = styled.input`
  width: 100%;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const Logo = styled.img`
  width: 32px;
  height: 32px;
  border-radius: ${radius.cornerRadiusSm};
  object-fit: contain;
  background: ${colors.surface.neutral.bgSubtle};
`;

const LogoPlaceholder = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${radius.cornerRadiusSm};
  background: ${colors.surface.neutral.bgSubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.tertiary};
`;

const StatusMessage = styled.div<{ $type: 'success' | 'error' }>`
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: ${(p) => (p.$type === 'success' ? '#f0fdf4' : '#fef2f2')};
  color: ${(p) => (p.$type === 'success' ? '#166534' : '#991b1b')};
  font-size: ${typography.fontSize.sm};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${spacings['3xl']};
  color: ${colors.text.neutral.tertiary};
`;

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formName, setFormName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFevoOrgId, setFormFevoOrgId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Organization[] }>('/admin/organizations');
      setOrgs(res.data.data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load organizations' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const openCreate = () => {
    setEditingOrg(null);
    setFormName('');
    setFormLogoUrl('');
    setFormFevoOrgId('');
    setShowModal(true);
  };

  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormName(org.name);
    setFormLogoUrl(org.logo_url || '');
    setFormFevoOrgId(org.fevo_org_id || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        name: formName.trim(),
        logo_url: formLogoUrl.trim() || null,
        fevo_org_id: formFevoOrgId.trim() || null,
      };

      if (editingOrg) {
        await apiClient.put(`/admin/organizations/${editingOrg.id}`, payload);
        setMessage({ type: 'success', text: 'Organization updated' });
      } else {
        await apiClient.post('/admin/organizations', payload);
        setMessage({ type: 'success', text: 'Organization created' });
      }

      setShowModal(false);
      fetchOrgs();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save organization' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (orgId: string) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    try {
      await apiClient.delete(`/admin/organizations/${orgId}`);
      setMessage({ type: 'success', text: 'Organization deleted' });
      fetchOrgs();
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete organization' });
    }
  };

  if (loading) {
    return <div><PageHeader title="Organizations" /></div>;
  }

  return (
    <div>
      <PageHeader title="Organizations" />

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      <Card>
        <HeaderRow>
          <span style={{ fontSize: typography.fontSize.sm, color: colors.text.neutral.tertiary }}>
            {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
          </span>
          <Button onClick={openCreate}>Add Organization</Button>
        </HeaderRow>

        {orgs.length === 0 ? (
          <EmptyState>No organizations yet. Add one to get started.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th></Th>
                <Th>Name</Th>
                <Th>FEVO Org ID</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <Td>
                    {org.logo_url ? (
                      <Logo src={org.logo_url} alt={org.name} />
                    ) : (
                      <LogoPlaceholder>{org.name.charAt(0)}</LogoPlaceholder>
                    )}
                  </Td>
                  <Td style={{ fontWeight: 500 }}>{org.name}</Td>
                  <Td>{org.fevo_org_id || '-'}</Td>
                  <Td>{new Date(org.created_at).toLocaleDateString()}</Td>
                  <Td>
                    <ActionButtons>
                      <Button variant="secondary" size="sm" onClick={() => openEdit(org)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(org.id)}>Delete</Button>
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        confirmLabel={saving ? 'Saving...' : editingOrg ? 'Update' : 'Create'}
        onConfirm={handleSave}
        onCancel={() => setShowModal(false)}
        loading={saving}
      >
        <FormGroup>
          <Label>Name</Label>
          <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Organization name" />
        </FormGroup>
        <FormGroup>
          <Label>Logo URL</Label>
          <Input value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} placeholder="https://..." />
        </FormGroup>
        <FormGroup>
          <Label>FEVO Org ID</Label>
          <Input value={formFevoOrgId} onChange={(e) => setFormFevoOrgId(e.target.value)} placeholder="FEVO organization identifier" />
        </FormGroup>
      </Modal>
    </div>
  );
};
