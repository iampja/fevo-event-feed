import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';

type StatVariant = 'default' | 'success' | 'warning' | 'danger';

interface StatCardProps {
  label: string;
  value: number | string;
  variant?: StatVariant;
}

const variantBorderColors: Record<StatVariant, string> = {
  default: colors.border.neutral.primary,
  success: colors.surface.success.primary,
  warning: colors.surface.warning.primary,
  danger: colors.surface.danger.primary,
};

const Card = styled.div<{ $variant: StatVariant }>`
  background: ${colors.surface.neutral.primary};
  border: 1px solid ${colors.border.neutral.primary};
  border-left: 3px solid ${({ $variant }) => variantBorderColors[$variant]};
  border-radius: ${radius.cornerRadiusMd};
  padding: ${spacings.xl};
  box-shadow: ${shadows.sm};
`;

const Value = styled.div`
  font-size: ${typography.fontSize['2xl']};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.text.neutral.primary};
  line-height: 1;
`;

const Label = styled.div`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.secondary};
  margin-top: ${spacings.sm};
`;

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  variant = 'default',
}) => {
  return (
    <Card $variant={variant}>
      <Value>{typeof value === 'number' ? value.toLocaleString() : value}</Value>
      <Label>{label}</Label>
    </Card>
  );
};
