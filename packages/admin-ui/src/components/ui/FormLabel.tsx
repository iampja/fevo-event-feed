import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography } from '@/theme/tokens';

interface FormLabelProps {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}

const StyledLabel = styled.label`
  display: block;
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.primary};
  margin-bottom: ${spacings.sm};
  line-height: ${typography.lineHeight.normal};
`;

const RequiredIndicator = styled.span`
  color: ${colors.text.danger.primary};
  margin-left: ${spacings.xs};
`;

export const FormLabel: React.FC<FormLabelProps> = ({
  htmlFor,
  required = false,
  children,
}) => {
  return (
    <StyledLabel htmlFor={htmlFor}>
      {children}
      {required && <RequiredIndicator aria-hidden="true">*</RequiredIndicator>}
    </StyledLabel>
  );
};
