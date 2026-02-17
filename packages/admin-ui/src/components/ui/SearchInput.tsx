import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 360px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${spacings.lg};
  top: 50%;
  transform: translateY(-50%);
  color: ${colors.text.neutral.tertiary};
  pointer-events: none;
  display: flex;
  align-items: center;

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  height: 40px;
  padding: ${spacings.md} ${spacings.xl} ${spacings.md} 40px;
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.primary};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${colors.text.neutral.tertiary};
  }

  &:hover {
    border-color: #D1D5DB;
  }

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: ${spacings.md};
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${colors.surface.neutral.bgMuted};
  color: ${colors.text.neutral.secondary};
  cursor: pointer;
  padding: 0;
  border: none;
  font-size: 12px;
  line-height: 1;
  transition: background 0.15s ease;

  &:hover {
    background: #D1D5DB;
  }
`;

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (val: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => onChange(val), debounceMs);
      };
    })(),
    [onChange, debounceMs],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <SearchWrapper>
      <SearchIcon>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </SearchIcon>
      <StyledInput
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {localValue && <ClearButton onClick={handleClear} aria-label="Clear search">x</ClearButton>}
    </SearchWrapper>
  );
};
