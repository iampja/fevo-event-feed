import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { colors, spacings, typography, radius, shadows } from '@/theme/tokens';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/Button';
import { FormLabel } from '@/components/ui/FormLabel';
import { apiClient } from '@/api/client';

const LoginWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${colors.surface.neutral.bgSubtle};
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${colors.surface.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  box-shadow: ${shadows.lg};
  padding: ${spacings['4xl']};
`;

const BrandSection = styled.div`
  text-align: center;
  margin-bottom: ${spacings['3xl']};
`;

const BrandName = styled.div`
  display: inline-block;
  font-size: ${typography.fontSize['3xl']};
  font-weight: 800;
  color: ${colors.brand.onBrand};
  background: ${colors.brand.primary};
  padding: 6px 16px;
  border-radius: 8px;
  letter-spacing: -0.5px;
`;

const BrandSubtitle = styled.div`
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.tertiary};
  margin-top: ${spacings.sm};
`;

const FormGroup = styled.div`
  margin-bottom: ${spacings['2xl']};
`;

const TextInput = styled.input`
  width: 100%;
  height: 40px;
  padding: ${spacings.md} ${spacings.lg};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusMd};
  font-size: ${typography.fontSize.md};
  color: ${colors.text.neutral.primary};
  background: ${colors.surface.neutral.primary};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${colors.brand.focus};
    box-shadow: 0 0 0 3px ${colors.brand.focusShadow};
  }

  &::placeholder {
    color: ${colors.text.neutral.tertiary};
  }
`;

const ErrorText = styled.p`
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.danger.primary};
  margin-top: ${spacings.md};
`;

export const LoginPage: React.FC = () => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Validate the token by making a test API call
      await apiClient.get('/admin/offers/stats', {
        headers: { 'x-internal-auth': token.trim() },
      });
      login(token.trim());
      navigate('/kills', { replace: true });
    } catch {
      setError('Invalid authentication token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginWrapper>
      <LoginCard>
        <BrandSection>
          <BrandName>FEVO</BrandName>
          <BrandSubtitle>Event Feed Admin</BrandSubtitle>
        </BrandSection>

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <FormLabel htmlFor="auth-token" required>
              Authentication Token
            </FormLabel>
            <TextInput
              id="auth-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your internal auth token"
              autoFocus
            />
            {error && <ErrorText>{error}</ErrorText>}
          </FormGroup>

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={!token.trim()}
          >
            Sign In
          </Button>
        </form>
      </LoginCard>
    </LoginWrapper>
  );
};
