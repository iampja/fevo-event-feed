import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

interface SyncLogEntry {
  id: string;
  sync_type: string;
  organization_id: string | null;
  started_at: string;
  completed_at: string | null;
  offers_created: number;
  offers_updated: number;
  errors: string | null;
  status: string;
}

interface Organization {
  id: string;
  name: string;
  fevo_org_id: string | null;
}

const Card = styled.div`
  background: white;
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  padding: ${spacings['2xl']};
  margin-bottom: ${spacings.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.primary};
  margin: 0 0 ${spacings.xl} 0;
`;

const SyncActions = styled.div`
  display: flex;
  gap: ${spacings.md};
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${spacings.xl};
`;

const OrgSelect = styled.select`
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  background: white;
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

const StatusMessage = styled.div<{ $type: 'success' | 'error' | 'info' }>`
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: ${(p) =>
    p.$type === 'success' ? '#f0fdf4' : p.$type === 'error' ? '#fef2f2' : colors.brand.subtle};
  color: ${(p) =>
    p.$type === 'success' ? '#166534' : p.$type === 'error' ? '#991b1b' : colors.brand.text};
  font-size: ${typography.fontSize.sm};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${spacings['3xl']};
  color: ${colors.text.neutral.tertiary};
`;

const AutoSyncBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.md};
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  margin-bottom: ${spacings.xl};
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
`;

const StatusDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
`;

export const SyncDashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [autoSyncStatus, setAutoSyncStatus] = useState<{ autoSync: boolean; intervalSeconds: number } | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: SyncLogEntry[] }>('/admin/sync/log');
      setLogs(res.data.data);
    } catch {
      // Silently fail on log fetch
    }
  }, []);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Organization[] }>('/admin/organizations');
      setOrgs(res.data.data);
    } catch {
      // Silently fail
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<{ autoSync: boolean; intervalSeconds: number }>('/admin/sync/status');
      setAutoSyncStatus(res.data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchOrgs();
    fetchSyncStatus();
  }, [fetchLogs, fetchOrgs, fetchSyncStatus]);

  const handleSyncOrg = async () => {
    if (!selectedOrgId) return;
    setSyncing(true);
    setMessage(null);
    try {
      const res = await apiClient.post(`/admin/sync/organization/${selectedOrgId}`);
      const result = res.data.data;
      setMessage({
        type: result.status === 'completed' ? 'success' : 'error',
        text: `Sync ${result.status}: ${result.offers_created} created, ${result.offers_updated} updated`,
      });
      fetchLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await apiClient.post('/admin/sync/all');
      const meta = res.data.meta;
      setMessage({
        type: 'success',
        text: `Synced ${meta.organizations_synced} organizations: ${meta.total_created} created, ${meta.total_updated} updated`,
      });
      fetchLogs();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync all failed' });
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'info';
      case 'failed': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div>
      <PageHeader title="FEVO Sync Dashboard" />

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      {autoSyncStatus?.autoSync && (
        <AutoSyncBanner>
          <StatusDot />
          Auto-sync active &mdash; every {autoSyncStatus.intervalSeconds} seconds
        </AutoSyncBanner>
      )}

      <Card>
        <SectionTitle>Trigger Sync</SectionTitle>
        <SyncActions>
          <OrgSelect value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
            <option value="">Select organization...</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} {org.fevo_org_id ? `(FEVO: ${org.fevo_org_id})` : ''}
              </option>
            ))}
          </OrgSelect>
          <Button onClick={handleSyncOrg} disabled={!selectedOrgId || syncing}>
            {syncing ? 'Syncing...' : 'Sync Organization'}
          </Button>
          <Button variant="secondary" onClick={handleSyncAll} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync All'}
          </Button>
        </SyncActions>
      </Card>

      <Card>
        <SectionTitle>Sync History</SectionTitle>
        {logs.length === 0 ? (
          <EmptyState>No sync operations yet. Trigger a sync above to get started.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Started</Th>
                <Th>Type</Th>
                <Th>Organization</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Updated</Th>
                <Th>Duration</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const orgName = orgs.find((o) => o.id === log.organization_id)?.name || log.organization_id || '-';
                const duration = log.completed_at && log.started_at
                  ? `${((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1)}s`
                  : '-';
                return (
                  <tr key={log.id}>
                    <Td>{formatDate(log.started_at)}</Td>
                    <Td>{log.sync_type}</Td>
                    <Td>{orgName}</Td>
                    <Td><Badge variant={getStatusColor(log.status) as any}>{log.status}</Badge></Td>
                    <Td>{log.offers_created}</Td>
                    <Td>{log.offers_updated}</Td>
                    <Td>{duration}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
