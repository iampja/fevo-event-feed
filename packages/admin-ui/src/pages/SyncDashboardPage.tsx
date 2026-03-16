import React, { useEffect, useState, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
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

interface SyncStatus {
  autoSync: boolean;
  intervalSeconds: number;
  lastSync: {
    started_at: string;
    completed_at: string | null;
    status: string;
    offers_created: number;
    offers_updated: number;
    errors: string | null;
  } | null;
}

interface ProgressLine {
  time: string;
  message: string;
}

interface SyncProgress {
  syncId: string;
  lines: ProgressLine[];
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  summary?: { created: number; updated: number; errors: number; duration: string };
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

// ── Sync Status Card styles ──────────────────────────────────────────────────

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${spacings.lg};
  margin-bottom: ${spacings.xl};
`;

const StatBox = styled.div`
  padding: ${spacings.lg};
  background: ${colors.surface.neutral.bgSubtle};
  border-radius: ${radius.cornerRadiusMd};
`;

const StatLabel = styled.div`
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${spacings.xs};
`;

const StatValue = styled.div`
  font-size: ${typography.fontSize.xl};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.text.neutral.primary};
`;

const StatMeta = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.tertiary};
  margin-top: ${spacings.xs};
`;

const SyncStatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacings.lg};
  flex-wrap: wrap;
`;

const SyncIndicator = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacings.sm};
  font-size: ${typography.fontSize.sm};
  color: ${(p) => (p.$active ? '#166534' : colors.text.neutral.tertiary)};
  font-weight: ${typography.fontWeight.medium};
`;

const Dot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
`;

const SyncButton = styled.button<{ $syncing?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: ${(p) => (p.$syncing ? '#e5e7eb' : '#1a1a1a')};
  color: ${(p) => (p.$syncing ? '#6b7280' : '#fff')};
  border: none;
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.semibold};
  font-family: ${typography.fontFamily};
  cursor: ${(p) => (p.$syncing ? 'not-allowed' : 'pointer')};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: #333;
  }

  svg {
    animation: ${(p) => (p.$syncing ? 'spin 1s linear infinite' : 'none')};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ── Progress Dialog styles ──────────────────────────────────────────────────

const DialogBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DialogPanel = styled.div`
  background: #1a1a2e;
  border-radius: ${radius.cornerRadiusLg};
  width: 640px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #2a2a4a;
`;

const DialogTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #4a4a6a;
  border-top-color: #22c55e;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const DialogClose = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  &:hover { background: #2a2a4a; color: #e2e8f0; }
`;

const LogContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.7;
  min-height: 300px;
  max-height: 50vh;
`;

const LogLine = styled.div`
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-word;
`;

const LogTime = styled.span`
  color: #4a5568;
  margin-right: 8px;
  user-select: none;
`;

const LogStatus = styled.span<{ $type: 'info' | 'success' | 'error' | 'progress' }>`
  color: ${(p) => {
    switch (p.$type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'progress': return '#eab308';
      default: return '#60a5fa';
    }
  }};
`;

const DialogFooter = styled.div`
  padding: 12px 20px;
  border-top: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FooterStatus = styled.div<{ $status: string }>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => {
    switch (p.$status) {
      case 'completed': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#eab308';
    }
  }};
`;

function classifyLine(msg: string): 'info' | 'success' | 'error' | 'progress' {
  if (msg.startsWith('Sync completed') || msg.startsWith('Details complete')) return 'success';
  if (msg.includes('Error') || msg.includes('error') || msg.includes('Fatal') || msg.startsWith('Sync failed')) return 'error';
  if (msg.includes('progress:') || msg.startsWith('[')) return 'progress';
  return 'info';
}

function formatLogTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Component ────────────────────────────────────────────────────────────────

export const SyncDashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const res = await apiClient.get<SyncStatus>('/admin/sync/status');
      setSyncStatus(res.data);
    } catch {
      // Silently fail
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchOrgs();
    fetchSyncStatus();
  }, [fetchLogs, fetchOrgs, fetchSyncStatus]);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progress?.lines.length]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

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
      fetchSyncStatus();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync failed' });
    } finally {
      setSyncing(false);
    }
  };

  const startPollingProgress = () => {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const res = await apiClient.get<{ data: SyncProgress | null }>('/admin/sync/progress');
        const p = res.data.data;
        if (p) {
          setProgress(p);
          if (p.status !== 'running') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setSyncing(false);
            fetchLogs();
            fetchSyncStatus();
          }
        }
      } catch {
        // keep polling
      }
    }, 1000);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setMessage(null);
    setProgress(null);
    setShowProgressDialog(true);

    try {
      await apiClient.post('/admin/sync/all');
      startPollingProgress();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Sync all failed' });
      setSyncing(false);
      setShowProgressDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setShowProgressDialog(false);
    if (progress?.status !== 'running') {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString();
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'failed': return 'danger';
      default: return 'neutral';
    }
  };

  const lastSync = syncStatus?.lastSync;
  const lastSyncTime = lastSync?.completed_at || lastSync?.started_at || null;

  return (
    <div>
      <PageHeader title="FEVO Sync Dashboard" />

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      {/* ── Sync Status Card ── */}
      <Card>
        <SyncStatusRow>
          <div>
            <SectionTitle style={{ marginBottom: spacings.sm }}>Sync Status</SectionTitle>
            <SyncIndicator $active={!!syncStatus?.autoSync}>
              <Dot $color={syncStatus?.autoSync ? '#22c55e' : '#d1d5db'} />
              {syncStatus?.autoSync
                ? `Auto-sync active \u2014 every ${Math.floor((syncStatus?.intervalSeconds || 900) / 60)} minutes`
                : 'Auto-sync disabled'}
            </SyncIndicator>
          </div>
          <SyncButton onClick={handleSyncAll} $syncing={syncing} disabled={syncing}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.65 2.35a8 8 0 0 0-12.73 1.3L0 2.5V6h3.5L2.17 4.67a6 6 0 0 1 10.24-.08L13.65 2.35z" fill="currentColor"/>
              <path d="M16 10v3.5l-.92-1.15a8 8 0 0 1-12.73 1.3l1.24-2.24a6 6 0 0 0 10.24-.08L12.5 10H16z" fill="currentColor"/>
            </svg>
            {syncing ? 'Syncing...' : 'Sync Now'}
          </SyncButton>
        </SyncStatusRow>

        <StatusGrid style={{ marginTop: spacings.xl }}>
          <StatBox>
            <StatLabel>Last Sync</StatLabel>
            <StatValue>{formatRelativeTime(lastSyncTime)}</StatValue>
            <StatMeta>{lastSyncTime ? formatDate(lastSyncTime) : 'No syncs yet'}</StatMeta>
          </StatBox>
          <StatBox>
            <StatLabel>Status</StatLabel>
            <StatValue>
              {lastSync ? (
                <Badge variant={getStatusColor(lastSync.status) as any}>{lastSync.status}</Badge>
              ) : (
                '-'
              )}
            </StatValue>
            <StatMeta>{lastSync?.errors ? 'Has errors' : lastSync ? 'No errors' : ''}</StatMeta>
          </StatBox>
          <StatBox>
            <StatLabel>Offers Created</StatLabel>
            <StatValue>{lastSync?.offers_created ?? '-'}</StatValue>
            <StatMeta>Last sync run</StatMeta>
          </StatBox>
          <StatBox>
            <StatLabel>Offers Updated</StatLabel>
            <StatValue>{lastSync?.offers_updated ?? '-'}</StatValue>
            <StatMeta>Last sync run</StatMeta>
          </StatBox>
        </StatusGrid>
      </Card>

      {/* ── Trigger Org Sync ── */}
      <Card>
        <SectionTitle>Sync by Organization</SectionTitle>
        <SyncActions>
          <OrgSelect value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
            <option value="">Select organization...</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} {org.fevo_org_id ? `(FEVO: ${org.fevo_org_id.substring(0, 8)}...)` : ''}
              </option>
            ))}
          </OrgSelect>
          <Button onClick={handleSyncOrg} disabled={!selectedOrgId || syncing}>
            {syncing ? 'Syncing...' : 'Sync Organization'}
          </Button>
        </SyncActions>
      </Card>

      {/* ── Sync History ── */}
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

      {/* ── Progress Dialog ── */}
      {showProgressDialog && (
        <DialogBackdrop onClick={progress?.status !== 'running' ? handleCloseDialog : undefined}>
          <DialogPanel onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>
                {progress?.status === 'running' && <Spinner />}
                {progress?.status === 'completed' && <span style={{ color: '#22c55e' }}>&#10003;</span>}
                {progress?.status === 'failed' && <span style={{ color: '#ef4444' }}>&#10007;</span>}
                FEVO Sync
              </DialogTitle>
              <DialogClose onClick={handleCloseDialog}>&#x2715;</DialogClose>
            </DialogHeader>

            <LogContainer>
              {progress?.lines.map((line, i) => (
                <LogLine key={i}>
                  <LogTime>{formatLogTime(line.time)}</LogTime>
                  <LogStatus $type={classifyLine(line.message)}>{line.message}</LogStatus>
                </LogLine>
              ))}
              {!progress && (
                <LogLine>
                  <LogStatus $type="info">Connecting...</LogStatus>
                </LogLine>
              )}
              <div ref={logEndRef} />
            </LogContainer>

            <DialogFooter>
              <FooterStatus $status={progress?.status || 'running'}>
                <Dot $color={
                  progress?.status === 'completed' ? '#22c55e'
                    : progress?.status === 'failed' ? '#ef4444'
                    : '#eab308'
                } />
                {progress?.status === 'running' ? 'Running...' : progress?.status === 'completed' ? 'Completed' : progress?.status === 'failed' ? 'Failed' : 'Starting...'}
                {progress?.summary && ` \u2014 ${progress.summary.duration}`}
              </FooterStatus>
              {progress?.status !== 'running' && (
                <DialogClose onClick={handleCloseDialog} style={{ fontSize: 13, padding: '6px 16px', background: '#2a2a4a', borderRadius: 6, color: '#e2e8f0' }}>
                  Close
                </DialogClose>
              )}
            </DialogFooter>
          </DialogPanel>
        </DialogBackdrop>
      )}
    </div>
  );
};
