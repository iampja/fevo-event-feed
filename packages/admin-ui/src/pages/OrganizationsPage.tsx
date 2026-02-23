import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
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

const InfoBanner = styled.div`
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: #eff6ff;
  color: #1e40af;
  font-size: ${typography.fontSize.sm};
`;

export const OrganizationsPage: React.FC = () => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  if (loading) {
    return <div><PageHeader title="Organizations" /></div>;
  }

  return (
    <div>
      <PageHeader title="Organizations" />

      <InfoBanner>
        Organizations are synced from FEVO and are read-only.
      </InfoBanner>

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      <Card>
        <HeaderRow>
          <span style={{ fontSize: typography.fontSize.sm, color: colors.text.neutral.tertiary }}>
            {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
          </span>
        </HeaderRow>

        {orgs.length === 0 ? (
          <EmptyState>No organizations synced yet.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th></Th>
                <Th>Name</Th>
                <Th>FEVO Org ID</Th>
                <Th>Created</Th>
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
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
