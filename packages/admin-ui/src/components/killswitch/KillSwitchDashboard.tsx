import React, { useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import {
  getActiveKills,
  killOffer,
  killOrganization,
  restoreKill,
  Kill,
} from '@/api/feedApi';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { PageHeader } from '@/components/layout/PageHeader';
import { KillOfferModal } from './KillOfferModal';
import { KillOrgModal } from './KillOrgModal';
import { RestoreModal } from './RestoreModal';
import { showSuccess, showError } from '@/components/ui/Toast';

const ITEMS_PER_PAGE = 10;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacings.xl};
  margin-bottom: ${spacings['2xl']};
  flex-wrap: wrap;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${spacings.lg};
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${spacings['4xl']};
  background: ${colors.surface.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.md};
  box-shadow: ${shadows.sm};
`;

const ReasonCell = styled.span`
  max-width: 200px;
  display: inline-block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${colors.text.neutral.secondary};
  font-size: ${typography.fontSize.sm};
`;

const TimeCell = styled.span`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  white-space: nowrap;
`;

function formatDateTime(ts: string): string {
  const date = new Date(ts);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

type KillRow = Kill & Record<string, unknown>;

export const KillSwitchDashboard: React.FC = () => {
  const [kills, setKills] = useState<Kill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showKillOfferModal, setShowKillOfferModal] = useState(false);
  const [showKillOrgModal, setShowKillOrgModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<Kill | null>(null);

  const fetchKills = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getActiveKills();
      setKills(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load active kills';
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKills();
  }, [fetchKills]);

  const filteredKills = useMemo(() => {
    if (!searchQuery.trim()) return kills;
    const query = searchQuery.toLowerCase();
    return kills.filter(
      (kill) =>
        kill.targetName.toLowerCase().includes(query) ||
        kill.targetId.toLowerCase().includes(query) ||
        kill.killedBy.toLowerCase().includes(query) ||
        (kill.reason && kill.reason.toLowerCase().includes(query)),
    );
  }, [kills, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredKills.length / ITEMS_PER_PAGE));
  const paginatedKills = filteredKills.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleKillOffer = async (offerId: string, reason?: string) => {
    try {
      await killOffer({ offerId, reason });
      showSuccess(`Offer ${offerId} removed from Event Feed`);
      await fetchKills();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to kill offer';
      showError(message);
      throw err;
    }
  };

  const handleKillOrg = async (orgId: string, reason: string) => {
    try {
      await killOrganization({ organizationId: orgId, reason });
      showSuccess(`Organization ${orgId} removed from Event Feed`);
      await fetchKills();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to kill organization';
      showError(message);
      throw err;
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreKill(restoreTarget.id);
      showSuccess(`${restoreTarget.targetName} restored to Event Feed`);
      setRestoreTarget(null);
      await fetchKills();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to restore';
      showError(message);
      throw err;
    }
  };

  const columns: Column<KillRow>[] = [
    {
      header: 'Target Name',
      accessor: 'targetName',
      render: (row: KillRow) => (
        <strong>{row.targetName}</strong>
      ),
    },
    {
      header: 'Type',
      accessor: 'targetType',
      width: '120px',
      render: (row: KillRow) => (
        <Badge variant={row.targetType === 'offer' ? 'warning' : 'danger'}>
          {row.targetType === 'offer' ? 'Offer' : 'Organization'}
        </Badge>
      ),
    },
    {
      header: 'Killed By',
      accessor: 'killedBy',
      width: '150px',
    },
    {
      header: 'Killed At',
      accessor: 'killedAt',
      width: '180px',
      render: (row: KillRow) => (
        <TimeCell>{formatDateTime(row.killedAt)}</TimeCell>
      ),
    },
    {
      header: 'Reason',
      accessor: 'reason',
      render: (row: KillRow) => (
        <ReasonCell title={row.reason || ''}>
          {row.reason || '--'}
        </ReasonCell>
      ),
    },
    {
      header: 'Action',
      accessor: 'id',
      width: '120px',
      render: (row: KillRow) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setRestoreTarget(row as Kill);
          }}
        >
          Restore
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Kill Switch Dashboard"
        subtitle="Manage offers and organizations removed from the Event Feed"
      />

      <ToolbarRow>
        <SearchInput
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          placeholder="Search kills by name, ID, or reason..."
        />
        <ActionButtons>
          <Button
            variant="danger"
            onClick={() => setShowKillOfferModal(true)}
          >
            Kill Offer
          </Button>
          <Button
            variant="danger"
            onClick={() => setShowKillOrgModal(true)}
          >
            Kill Organization
          </Button>
        </ActionButtons>
      </ToolbarRow>

      {loading ? (
        <LoadingState>Loading active kills...</LoadingState>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedKills as KillRow[]}
            emptyMessage="No active kills. All offers and organizations are currently visible in the Event Feed."
          />
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <KillOfferModal
        isOpen={showKillOfferModal}
        onClose={() => setShowKillOfferModal(false)}
        onConfirm={handleKillOffer}
      />

      <KillOrgModal
        isOpen={showKillOrgModal}
        onClose={() => setShowKillOrgModal(false)}
        onConfirm={handleKillOrg}
      />

      {restoreTarget && (
        <RestoreModal
          isOpen={!!restoreTarget}
          targetName={restoreTarget.targetName}
          targetType={restoreTarget.targetType}
          onClose={() => setRestoreTarget(null)}
          onConfirm={handleRestore}
        />
      )}
    </div>
  );
};
