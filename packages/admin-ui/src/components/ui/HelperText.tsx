import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography } from '@/theme/tokens';

type HelperTextVariant = 'default' | 'error' | 'success';

interface HelperTextProps {
  variant?: HelperTextVariant;
  children: React.ReactNode;
}

const variantColors: Record<HelperTextVariant, string> = {
  default: colors.text.neutral.secondary,
  error: colors.text.danger.primary,
  success: colors.text.success.primary,
};

const StyledHelperText = styled.p<{ $variant: HelperTextVariant }>`
  font-size: ${typography.fontSize.sm};
  color: ${({ $variant }) => variantColors[$variant]};
  margin-top: ${spacings.sm};
  line-height: ${typography.lineHeight.normal};
`;

export const HelperText: React.FC<HelperTextProps> = ({
  variant = 'default',
  children,
}) => {
  return (
    <StyledHelperText $variant={variant} role={variant === 'error' ? 'alert' : undefined}>
      {children}
    </StyledHelperText>
  );
};
