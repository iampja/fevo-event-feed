import React from 'react';
import styled from 'styled-components';
import { colors, spacings, typography } from '@/theme/tokens';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const HeaderWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${spacings['2xl']};
  margin-bottom: ${spacings['3xl']};
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: ${typography.fontSize['2xl']};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.text.neutral.primary};
  margin: 0;
  line-height: ${typography.lineHeight.tight};
`;

const Subtitle = styled.p`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.secondary};
  margin: ${spacings.sm} 0 0;
  line-height: ${typography.lineHeight.normal};
`;

const ActionsSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.lg};
  flex-shrink: 0;
`;

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
}) => {
  return (
    <HeaderWrapper>
      <TitleSection>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
      </TitleSection>
      {actions && <ActionsSection>{actions}</ActionsSection>}
    </HeaderWrapper>
  );
};
