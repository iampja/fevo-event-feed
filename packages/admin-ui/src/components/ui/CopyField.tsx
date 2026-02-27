import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, spacings, typography, radius } from '@/theme/tokens';

interface CopyFieldProps {
  value: string;
  label?: string;
}

const Wrapper = styled.div`
  margin-bottom: ${spacings.xl};
`;

const FieldLabel = styled.div`
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  margin-bottom: ${spacings.sm};
`;

const InputRow = styled.div`
  display: flex;
  gap: ${spacings.md};
`;

const ReadOnlyInput = styled.input`
  flex: 1;
  height: 40px;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.bgSubtle};
`;

const CopyButton = styled.button<{ $copied: boolean }>`
  height: 40px;
  padding: ${spacings.md} ${spacings.xl};
  border: 1px solid ${({ $copied }) =>
    $copied ? colors.surface.success.primary : colors.brand.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.sm};
  font-family: ${typography.fontFamily};
  font-weight: ${typography.fontWeight.medium};
  color: ${({ $copied }) =>
    $copied ? colors.text.onColor.primary : colors.brand.onBrand};
  background: ${({ $copied }) =>
    $copied ? colors.surface.success.primary : colors.brand.primary};
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`;

export const CopyField: React.FC<CopyFieldProps> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Wrapper>
      {label && <FieldLabel>{label}</FieldLabel>}
      <InputRow>
        <ReadOnlyInput value={value} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
        <CopyButton $copied={copied} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </CopyButton>
      </InputRow>
    </Wrapper>
  );
};
