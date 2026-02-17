import React from 'react';
import styled from 'styled-components';
import { colors, radius, spacings, typography } from '@/theme/tokens';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
}

const SwitchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.lg};
`;

const SwitchTrack = styled.button<{ $checked: boolean; $disabled: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: ${radius.cornerRadiusFull};
  border: 2px solid transparent;
  padding: 0;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  background: ${({ $checked }) =>
    $checked ? colors.surface.success.primary : colors.surface.neutral.bgMuted};
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  transition: background 0.2s ease-in-out;

  &:hover:not(:disabled) {
    background: ${({ $checked }) =>
      $checked ? '#15803D' : '#D1D5DB'};
  }

  &:focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
`;

const SwitchThumb = styled.span<{ $checked: boolean }>`
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${colors.surface.neutral.primary};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease-in-out;
  transform: translateX(${({ $checked }) => ($checked ? '21px' : '1px')});
`;

const SwitchLabel = styled.label<{ $disabled: boolean }>`
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.medium};
  color: ${({ $disabled }) =>
    $disabled ? colors.text.neutral.tertiary : colors.text.neutral.primary};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
`;

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  id,
}) => {
  const switchId = id || `switch-${Math.random().toString(36).slice(2, 9)}`;

  const handleClick = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <SwitchWrapper>
      <SwitchTrack
        role="switch"
        aria-checked={checked}
        aria-label={label}
        id={switchId}
        $checked={checked}
        $disabled={disabled}
        disabled={disabled}
        onClick={handleClick}
        type="button"
      >
        <SwitchThumb $checked={checked} />
      </SwitchTrack>
      {label && (
        <SwitchLabel htmlFor={switchId} $disabled={disabled}>
          {label}
        </SwitchLabel>
      )}
    </SwitchWrapper>
  );
};
