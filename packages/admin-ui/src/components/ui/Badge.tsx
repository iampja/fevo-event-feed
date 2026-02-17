import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  success: {
    bg: colors.surface.success.subtle,
    color: colors.text.success.primary,
    border: colors.surface.success.primary,
  },
  warning: {
    bg: colors.surface.warning.subtle,
    color: colors.text.warning.primary,
    border: colors.surface.warning.primary,
  },
  danger: {
    bg: colors.surface.danger.subtle,
    color: colors.text.danger.primary,
    border: colors.surface.danger.primary,
  },
  neutral: {
    bg: colors.surface.neutral.bgSubtle,
    color: colors.text.neutral.secondary,
    border: colors.border.neutral.primary,
  },
};

const StyledBadge = styled.span<{ $variant: BadgeVariant }>`
  display: inline-flex;
  align-items: center;
  padding: ${spacings.xs} ${spacings.md};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.semibold};
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-radius: ${radius.cornerRadiusFull};
  white-space: nowrap;
  background: ${({ $variant }) => variantStyles[$variant].bg};
  color: ${({ $variant }) => variantStyles[$variant].color};
  border: 1px solid ${({ $variant }) => variantStyles[$variant].border};
`;

const Dot = styled.span<{ $variant: BadgeVariant }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $variant }) => variantStyles[$variant].color};
  margin-right: ${spacings.sm};
`;

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children }) => {
  return (
    <StyledBadge $variant={variant}>
      <Dot $variant={variant} />
      {children}
    </StyledBadge>
  );
};
