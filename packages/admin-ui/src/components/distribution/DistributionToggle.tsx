import React from 'react';
import styled, { keyframes } from 'styled-components';
import { colors, spacings, radius, shadows, typography } from '@/theme/tokens';
import { Switch } from '@/components/ui/Switch';
import { FormLabel } from '@/components/ui/FormLabel';
import { HelperText } from '@/components/ui/HelperText';

type OfferStatus = 'active' | 'inactive' | 'sold_out' | 'deleted';

interface DistributionToggleProps {
  offerId: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  offerStatus: OfferStatus;
  loading?: boolean;
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Card = styled.div`
  background: ${colors.surface.neutral.primary};
  border: 1px solid ${colors.border.neutral.primary};
  border-radius: ${radius.cornerRadiusLg};
  padding: ${spacings['2xl']};
  box-shadow: ${shadows.sm};
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${spacings.xl};
`;

const LabelSection = styled.div`
  flex: 1;
`;

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.md};
  color: ${colors.text.neutral.tertiary};
  font-size: ${typography.fontSize.sm};
`;

const Spinner = styled.span`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid ${colors.border.neutral.primary};
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

const DisabledTooltip = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacings.md};
  padding: ${spacings.md} ${spacings.lg};
  background: ${colors.surface.warning.subtle};
  border: 1px solid ${colors.surface.warning.primary};
  border-radius: ${radius.cornerRadiusMd};
  margin-top: ${spacings.lg};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.warning.primary};
`;

const WarningIcon = styled.span`
  flex-shrink: 0;
  font-size: ${typography.fontSize.lg};
`;

function getDisabledReason(status: OfferStatus): string | null {
  switch (status) {
    case 'inactive':
      return 'Distribution cannot be enabled for inactive offers. Activate the offer first.';
    case 'sold_out':
      return 'Distribution cannot be enabled for sold out offers.';
    case 'deleted':
      return 'Distribution cannot be modified for deleted offers.';
    default:
      return null;
  }
}

export const DistributionToggle: React.FC<DistributionToggleProps> = ({
  offerId,
  enabled,
  onChange,
  offerStatus,
  loading = false,
}) => {
  const isDisabled = offerStatus !== 'active';
  const disabledReason = getDisabledReason(offerStatus);

  return (
    <Card>
      <ToggleRow>
        <LabelSection>
          <FormLabel htmlFor={`dist-toggle-${offerId}`}>
            Distribute this offer
          </FormLabel>
          <HelperText>
            When enabled, this offer will appear in the Event Feed for matching audiences.
          </HelperText>
        </LabelSection>

        {loading ? (
          <LoadingOverlay>
            <Spinner />
            Updating...
          </LoadingOverlay>
        ) : (
          <Switch
            id={`dist-toggle-${offerId}`}
            checked={enabled}
            onChange={onChange}
            disabled={isDisabled}
          />
        )}
      </ToggleRow>

      {isDisabled && disabledReason && (
        <DisabledTooltip>
          <WarningIcon>!</WarningIcon>
          {disabledReason}
        </DisabledTooltip>
      )}
    </Card>
  );
};
