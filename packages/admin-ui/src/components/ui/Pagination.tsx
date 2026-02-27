import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacings.sm};
  padding: ${spacings.xl} 0;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  height: 36px;
  padding: ${spacings.sm} ${spacings.md};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-weight: ${({ $active }) =>
    $active ? typography.fontWeight.semibold : typography.fontWeight.regular};
  color: ${({ $active }) =>
    $active ? colors.brand.onBrand : colors.text.neutral.primary};
  background: ${({ $active }) =>
    $active ? colors.brand.primary : 'transparent'};
  border: 1px solid ${({ $active }) =>
    $active ? colors.brand.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: ${({ $active }) =>
      $active ? colors.brand.hover : colors.surface.neutral.bgSubtle};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const NavButton = styled(PageButton)`
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
`;

const Ellipsis = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.md};
`;

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  pages.push(total);

  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <PaginationWrapper>
      <NavButton
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        Previous
      </NavButton>

      {pageNumbers.map((p, idx) =>
        p === 'ellipsis' ? (
          <Ellipsis key={`ellipsis-${idx}`}>...</Ellipsis>
        ) : (
          <PageButton
            key={p}
            $active={p === page}
            onClick={() => onPageChange(p)}
            aria-label={`Go to page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </PageButton>
        ),
      )}

      <NavButton
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        Next
      </NavButton>
    </PaginationWrapper>
  );
};
