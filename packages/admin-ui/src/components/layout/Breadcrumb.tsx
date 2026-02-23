import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography } from '@/theme/tokens';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: ${spacings.md};
  margin-bottom: ${spacings.xl};
  font-size: ${typography.fontSize.sm};
`;

const BreadcrumbLink = styled(Link)`
  color: ${colors.text.neutral.secondary};
  text-decoration: none;

  &:hover {
    color: ${colors.text.neutral.primary};
    text-decoration: underline;
  }
`;

const CurrentPage = styled.span`
  color: ${colors.text.neutral.primary};
  font-weight: ${typography.fontWeight.medium};
`;

const Separator = styled.span`
  color: ${colors.text.neutral.tertiary};
`;

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <Nav>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <Separator>&gt;</Separator>}
            {isLast || !item.to ? (
              <CurrentPage>{item.label}</CurrentPage>
            ) : (
              <BreadcrumbLink to={item.to}>{item.label}</BreadcrumbLink>
            )}
          </React.Fragment>
        );
      })}
    </Nav>
  );
};
