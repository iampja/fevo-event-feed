import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

export interface Column<T> {
  header: React.ReactNode;
  accessor: keyof T | string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

const TableWrapper = styled.div`
  background: ${colors.surface.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  border: 1px solid ${colors.border.neutral.primary};
  box-shadow: ${shadows.sm};
  overflow: hidden;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: ${colors.surface.neutral.bgSubtle};
  border-bottom: 1px solid ${colors.border.neutral.primary};
`;

const TableHeaderCell = styled.th<{ $width?: string }>`
  padding: ${spacings.lg} ${spacings.xl};
  text-align: left;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  width: ${({ $width }) => $width || 'auto'};
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr<{ $clickable: boolean }>`
  border-bottom: 1px solid ${colors.border.neutral.subtle};
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  transition: background 0.1s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ $clickable }) =>
      $clickable ? colors.surface.neutral.bgSubtle : 'transparent'};
  }
`;

const TableCell = styled.td`
  padding: ${spacings.lg} ${spacings.xl};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  vertical-align: middle;
`;

const EmptyState = styled.div`
  padding: ${spacings['4xl']} ${spacings['2xl']};
  text-align: center;
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.md};
`;

function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No data to display',
}: TableProps<T>) {
  if (data.length === 0) {
    return (
      <TableWrapper>
        <EmptyState>{emptyMessage}</EmptyState>
      </TableWrapper>
    );
  }

  return (
    <TableWrapper>
      <StyledTable>
        <TableHead>
          <tr>
            {columns.map((col, idx) => (
              <TableHeaderCell key={idx} $width={col.width}>
                {col.header}
              </TableHeaderCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {data.map((row, rowIdx) => (
            <TableRow
              key={rowIdx}
              $clickable={!!onRowClick}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <TableCell key={colIdx}>
                  {col.render
                    ? col.render(row)
                    : String(getNestedValue(row, col.accessor as string) ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </StyledTable>
    </TableWrapper>
  );
}
