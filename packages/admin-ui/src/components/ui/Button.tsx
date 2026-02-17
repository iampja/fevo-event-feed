import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { colors, radius, spacings, typography, shadows } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Spinner = styled.span`
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
  margin-right: ${spacings.md};
`;

const sizeStyles = {
  sm: css`
    padding: ${spacings.sm} ${spacings.lg};
    font-size: ${typography.fontSize.sm};
    height: 32px;
  `,
  md: css`
    padding: ${spacings.md} ${spacings.xl};
    font-size: ${typography.fontSize.md};
    height: 40px;
  `,
  lg: css`
    padding: ${spacings.lg} ${spacings['2xl']};
    font-size: ${typography.fontSize.lg};
    height: 48px;
  `,
};

const variantStyles = {
  primary: css`
    background: #2563EB;
    color: ${colors.text.onColor.primary};
    border: 1px solid #2563EB;

    &:hover:not(:disabled) {
      background: #1D4ED8;
      border-color: #1D4ED8;
    }

    &:active:not(:disabled) {
      background: #1E40AF;
    }
  `,
  secondary: css`
    background: ${colors.surface.neutral.primary};
    color: ${colors.text.neutral.primary};
    border: 1px solid ${colors.border.neutral.primary};

    &:hover:not(:disabled) {
      background: ${colors.surface.neutral.bgSubtle};
    }

    &:active:not(:disabled) {
      background: ${colors.surface.neutral.bgMuted};
    }
  `,
  danger: css`
    background: ${colors.surface.danger.primary};
    color: ${colors.text.onColor.primary};
    border: 1px solid ${colors.surface.danger.primary};

    &:hover:not(:disabled) {
      background: #B91C1C;
      border-color: #B91C1C;
    }

    &:active:not(:disabled) {
      background: #991B1B;
    }
  `,
  ghost: css`
    background: transparent;
    color: ${colors.text.neutral.secondary};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: ${colors.surface.neutral.bgSubtle};
      color: ${colors.text.neutral.primary};
    }

    &:active:not(:disabled) {
      background: ${colors.surface.neutral.bgMuted};
    }
  `,
};

const StyledButton = styled.button<{
  $variant: ButtonVariant;
  $size: ButtonSize;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${typography.fontFamily};
  font-weight: ${typography.fontWeight.medium};
  border-radius: ${radius.cornerRadiusMd};
  cursor: pointer;
  transition: all 0.15s ease-in-out;
  white-space: nowrap;
  box-shadow: ${shadows.sm};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  ${({ $size }) => sizeStyles[$size]};
  ${({ $variant }) => variantStyles[$variant]};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  &:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
`;

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  ...props
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </StyledButton>
  );
};
