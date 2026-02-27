import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { useAuth } from '@/auth/AuthContext';

const SidebarWrapper = styled.aside`
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  background: ${colors.surface.neutral.primary};
  border-right: 1px solid ${colors.border.neutral.primary};
  display: flex;
  flex-direction: column;
  z-index: 100;
  box-shadow: ${shadows.sm};
`;

const BrandSection = styled.div`
  padding: ${spacings['2xl']} ${spacings['2xl']} ${spacings.xl};
  border-bottom: 1px solid ${colors.border.neutral.subtle};
`;

const BrandName = styled.div`
  font-size: ${typography.fontSize['2xl']};
  font-weight: ${typography.fontWeight.bold};
  color: ${colors.text.neutral.primary};
  letter-spacing: -0.02em;
`;

const BrandSubtitle = styled.div`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.neutral.tertiary};
  margin-top: ${spacings.xs};
`;

const NavSection = styled.nav`
  flex: 1;
  padding: ${spacings.xl} ${spacings.lg};
  overflow-y: auto;
`;

const SectionHeader = styled.div`
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.neutral.tertiary};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: ${spacings.md} ${spacings.lg};
  margin-top: ${spacings.xl};

  &:first-child {
    margin-top: 0;
  }
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${spacings.lg};
  padding: ${spacings.md} ${spacings.lg};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.neutral.secondary};
  text-decoration: none;
  transition: all 0.15s ease;
  margin-bottom: ${spacings.xs};

  &:hover {
    background: ${colors.surface.neutral.bgSubtle};
    color: ${colors.text.neutral.primary};
  }

  &.active {
    background: #EFF6FF;
    color: #2563EB;
    font-weight: ${typography.fontWeight.semibold};
  }
`;

const NavIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Footer = styled.div`
  padding: ${spacings.xl} ${spacings['2xl']};
  border-top: 1px solid ${colors.border.neutral.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const VersionText = styled.span`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.neutral.tertiary};
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacings.sm};
  padding: ${spacings.sm} ${spacings.md};
  border: none;
  background: transparent;
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.xs};
  font-family: ${typography.fontFamily};
  cursor: pointer;
  border-radius: ${radius.cornerRadiusSm};
  transition: all 0.15s ease;

  &:hover {
    color: ${colors.text.danger.primary};
    background: ${colors.surface.danger.subtle};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  return (
    <SidebarWrapper>
      <BrandSection>
        <BrandName>FEVO</BrandName>
        <BrandSubtitle>Event Feed Admin</BrandSubtitle>
      </BrandSection>

      <NavSection>
        <SectionHeader>Manage Offers</SectionHeader>
        <StyledNavLink to="/offers" end>
          <NavIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </NavIcon>
          All Offers
        </StyledNavLink>

        <SectionHeader>Content</SectionHeader>
        <StyledNavLink to="/collections">
          <NavIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </NavIcon>
          Collections
        </StyledNavLink>
        <StyledNavLink to="/organizations">
          <NavIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </NavIcon>
          Organizations
        </StyledNavLink>

        <SectionHeader>Integration</SectionHeader>
        <StyledNavLink to="/sync">
          <NavIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </NavIcon>
          FEVO Sync
        </StyledNavLink>

        <SectionHeader>Settings</SectionHeader>
        <StyledNavLink to="/api-keys">
          <NavIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
          </NavIcon>
          API Keys
        </StyledNavLink>
      </NavSection>

      <Footer>
        <VersionText>FEVO Event Feed v1.0</VersionText>
        <LogoutButton onClick={logout}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </LogoutButton>
      </Footer>
    </SidebarWrapper>
  );
};
