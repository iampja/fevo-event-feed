import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { apiClient } from '@/api/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  fevo_org_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FevoOrgSearchResult {
  fevo_org_id: string;
  name: string;
  logo_url: string | null;
  league: number;
  active_events: number;
  active_outings: number;
  already_added: boolean;
}

const Card = styled.div`
  background: white;
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  padding: ${spacings['2xl']};
  margin-bottom: ${spacings.xl};
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

const TableRow = styled.tr`
  cursor: pointer;
  transition: background 0.1s ease;

  &:hover {
    background: ${colors.surface.neutral.bgSubtle};
  }
`;

// ── Search styles ───────────────────────────────────────────────────────────

const SearchSection = styled.div`
  margin-bottom: ${spacings.xl};
`;

const SectionTitle = styled.h3`
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.primary};
  margin: 0 0 ${spacings.lg} 0;
`;

const SearchInputRow = styled.div`
  display: flex;
  gap: ${spacings.md};
  align-items: center;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  outline: none;

  &:focus {
    border-color: ${colors.brand.primary};
    box-shadow: 0 0 0 2px ${colors.brand.subtle};
  }
`;

const SearchResults = styled.div`
  margin-top: ${spacings.lg};
`;

const ResultRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacings.md} ${spacings.lg};
  border-bottom: 1px solid ${colors.border.neutral.subtle};

  &:last-child {
    border-bottom: none;
  }
`;

const ResultInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.md};
`;

const ResultName = styled.div`
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.primary};
`;

const ResultMeta = styled.div`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.tertiary};
`;

const SearchHint = styled.div`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.tertiary};
  margin-top: ${spacings.md};
`;

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FevoOrgSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await apiClient.get<{ data: FevoOrgSearchResult[] }>(
          `/admin/organizations/search/fevo?q=${encodeURIComponent(searchQuery.trim())}`
        );
        setSearchResults(res.data.data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  const handleAddOrg = async (result: FevoOrgSearchResult) => {
    setAddingId(result.fevo_org_id);
    try {
      await apiClient.post('/admin/organizations/add', {
        fevo_org_id: result.fevo_org_id,
        name: result.name,
        logo_url: result.logo_url,
      });
      setMessage({ type: 'success', text: `Added "${result.name}" successfully` });
      // Mark as added in search results
      setSearchResults((prev) =>
        prev.map((r) =>
          r.fevo_org_id === result.fevo_org_id ? { ...r, already_added: true } : r
        )
      );
      fetchOrgs();
    } catch {
      setMessage({ type: 'error', text: `Failed to add "${result.name}"` });
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return <div><PageHeader title="Organizations" /></div>;
  }

  return (
    <div>
      <PageHeader title="Organizations" />

      {message && <StatusMessage $type={message.type}>{message.text}</StatusMessage>}

      {/* ── Add Organization Search ── */}
      <Card>
        <SearchSection>
          <SectionTitle>Add FEVO Organization</SectionTitle>
          <SearchInputRow>
            <SearchInput
              type="text"
              placeholder="Search FEVO organizations by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searching && (
              <span style={{ fontSize: typography.fontSize.sm, color: colors.text.neutral.tertiary }}>
                Searching...
              </span>
            )}
          </SearchInputRow>

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <SearchHint>Type at least 2 characters to search</SearchHint>
          )}

          {searchResults.length > 0 && (
            <SearchResults>
              {searchResults.map((result) => (
                <ResultRow key={result.fevo_org_id}>
                  <ResultInfo>
                    {result.logo_url ? (
                      <Logo src={result.logo_url} alt={result.name} />
                    ) : (
                      <LogoPlaceholder>{result.name.charAt(0)}</LogoPlaceholder>
                    )}
                    <div>
                      <ResultName>{result.name}</ResultName>
                      <ResultMeta>
                        {result.active_events} events, {result.active_outings} outings
                      </ResultMeta>
                    </div>
                  </ResultInfo>
                  {result.already_added ? (
                    <Badge variant="success">Added</Badge>
                  ) : (
                    <Button
                      onClick={() => handleAddOrg(result)}
                      disabled={addingId === result.fevo_org_id}
                    >
                      {addingId === result.fevo_org_id ? 'Adding...' : 'Add'}
                    </Button>
                  )}
                </ResultRow>
              ))}
            </SearchResults>
          )}

          {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <SearchHint>No organizations found matching "{searchQuery}"</SearchHint>
          )}
        </SearchSection>
      </Card>

      {/* ── Existing Organizations ── */}
      <Card>
        <HeaderRow>
          <SectionTitle style={{ margin: 0 }}>Synced Organizations</SectionTitle>
          <span style={{ fontSize: typography.fontSize.sm, color: colors.text.neutral.tertiary }}>
            {orgs.length} organization{orgs.length !== 1 ? 's' : ''}
          </span>
        </HeaderRow>

        {orgs.length === 0 ? (
          <EmptyState>No organizations added yet. Search above to add one.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th></Th>
                <Th>Name</Th>
                <Th>FEVO Org ID</Th>
                <Th>Source</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <TableRow key={org.id} onClick={() => navigate(`/organizations/${org.id}`)}>
                  <Td>
                    {org.logo_url ? (
                      <Logo src={org.logo_url} alt={org.name} />
                    ) : (
                      <LogoPlaceholder>{org.name.charAt(0)}</LogoPlaceholder>
                    )}
                  </Td>
                  <Td style={{ fontWeight: 500 }}>{org.name}</Td>
                  <Td style={{ fontFamily: 'monospace', fontSize: typography.fontSize.xs }}>
                    {org.fevo_org_id ? `${org.fevo_org_id.substring(0, 12)}...` : '-'}
                  </Td>
                  <Td>
                    <Badge variant={org.fevo_org_id ? 'success' : 'warning'}>
                      {org.fevo_org_id ? 'FEVO' : 'Manual'}
                    </Badge>
                  </Td>
                  <Td>{new Date(org.created_at).toLocaleDateString()}</Td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
