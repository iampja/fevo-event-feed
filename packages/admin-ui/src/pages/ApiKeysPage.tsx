import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { spacings } from '@/theme/tokens';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { showSuccess, showError } from '@/components/ui/Toast';
import {
  getApiKeys,
  createApiKey,
  revokeApiKey,
  updateApiKeyRateLimit,
  ApiKey,
  CreateApiKeyResponse,
} from '@/api/feedApi';
import { formatDateTime } from '@/utils/formatters';
import { CreateApiKeyModal } from '@/components/api-keys/CreateApiKeyModal';
import { ApiKeyCreatedModal } from '@/components/api-keys/ApiKeyCreatedModal';
import { RevokeApiKeyModal } from '@/components/api-keys/RevokeApiKeyModal';
import { EditRateLimitModal } from '@/components/api-keys/EditRateLimitModal';

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacings.xl};
  margin-bottom: ${spacings['2xl']};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${spacings.sm};
`;

type ApiKeyRow = ApiKey & Record<string, unknown>;

const ITEMS_PER_PAGE = 10;

export const ApiKeysPage: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdKeyData, setCreatedKeyData] =
    useState<CreateApiKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [rateLimitTarget, setRateLimitTarget] = useState<ApiKey | null>(null);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getApiKeys();
      setApiKeys(data);
    } catch {
      showError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const filteredKeys = useMemo(() => {
    if (!searchQuery) return apiKeys;
    const q = searchQuery.toLowerCase();
    return apiKeys.filter((k) =>
      k.partner_name.toLowerCase().includes(q),
    );
  }, [apiKeys, searchQuery]);

  const totalPages = Math.ceil(filteredKeys.length / ITEMS_PER_PAGE);
  const paginatedKeys = filteredKeys.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(1);
  }, []);

  const handleCreate = useCallback(
    async (partnerName: string, rateLimit?: number) => {
      const result = await createApiKey({
        partner_name: partnerName,
        rate_limit: rateLimit,
      });
      setCreatedKeyData(result);
      setShowCreateModal(false);
      fetchApiKeys();
    },
    [fetchApiKeys],
  );

  const handleRevoke = useCallback(
    async (keyId: string) => {
      await revokeApiKey(keyId);
      showSuccess('API key revoked successfully');
      fetchApiKeys();
    },
    [fetchApiKeys],
  );

  const handleUpdateRateLimit = useCallback(
    async (keyId: string, rateLimit: number) => {
      await updateApiKeyRateLimit(keyId, rateLimit);
      showSuccess('Rate limit updated successfully');
      fetchApiKeys();
    },
    [fetchApiKeys],
  );

  const columns: Column<ApiKeyRow>[] = [
    {
      header: 'Partner Name',
      accessor: 'partner_name',
      render: (row) => <strong>{row.partner_name}</strong>,
    },
    {
      header: 'Status',
      accessor: 'revoked_at',
      width: '100px',
      render: (row) => (
        <Badge variant={row.revoked_at ? 'danger' : 'success'}>
          {row.revoked_at ? 'Revoked' : 'Active'}
        </Badge>
      ),
    },
    {
      header: 'Rate Limit',
      accessor: 'rate_limit',
      width: '120px',
      render: (row) => `${row.rate_limit.toLocaleString()} req/min`,
    },
    {
      header: 'Created',
      accessor: 'created_at',
      width: '160px',
      render: (row) => formatDateTime(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      width: '200px',
      render: (row) =>
        !row.revoked_at ? (
          <ActionButtons onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRateLimitTarget(row as ApiKey)}
            >
              Rate Limit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRevokeTarget(row as ApiKey)}
            >
              Revoke
            </Button>
          </ActionButtons>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="API Keys"
        subtitle="Manage partner API keys for feed access"
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            Create API Key
          </Button>
        }
      />

      <ToolbarRow>
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by partner name..."
        />
      </ToolbarRow>

      <Table<ApiKeyRow>
        columns={columns}
        data={paginatedKeys as ApiKeyRow[]}
        emptyMessage={loading ? 'Loading API keys...' : 'No API keys found'}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <CreateApiKeyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={handleCreate}
      />

      {createdKeyData && (
        <ApiKeyCreatedModal
          isOpen={!!createdKeyData}
          apiKey={createdKeyData.key}
          partnerName={createdKeyData.data.partner_name}
          onClose={() => setCreatedKeyData(null)}
        />
      )}

      {revokeTarget && (
        <RevokeApiKeyModal
          isOpen={!!revokeTarget}
          partnerName={revokeTarget.partner_name}
          onClose={() => setRevokeTarget(null)}
          onConfirm={() => handleRevoke(revokeTarget.id)}
        />
      )}

      {rateLimitTarget && (
        <EditRateLimitModal
          isOpen={!!rateLimitTarget}
          currentLimit={rateLimitTarget.rate_limit}
          partnerName={rateLimitTarget.partner_name}
          onClose={() => setRateLimitTarget(null)}
          onConfirm={(limit) =>
            handleUpdateRateLimit(rateLimitTarget.id, limit)
          }
        />
      )}
    </>
  );
};
