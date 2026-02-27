import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
}

const StyledSelect = styled.select`
  height: 40px;
  padding: ${spacings.md} ${spacings['2xl']} ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-family: ${typography.fontFamily};
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.primary};
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  min-width: 140px;

  &:focus {
    outline: none;
    border-color: ${colors.brand.focus};
    box-shadow: 0 0 0 3px ${colors.brand.focusShadow};
  }
`;

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  id,
}) => {
  return (
    <StyledSelect
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </StyledSelect>
  );
};
