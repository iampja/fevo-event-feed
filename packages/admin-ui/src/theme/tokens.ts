export const colors = {
  surface: {
    neutral: {
      primary: '#FFFFFF',
      bgSubtle: '#F5F5F5',
      bgMuted: '#E8E8E8',
    },
    danger: {
      primary: '#DC2626',
      subtle: '#FEE2E2',
    },
    success: {
      primary: '#16A34A',
      subtle: '#DCFCE7',
    },
    warning: {
      primary: '#D97706',
      subtle: '#FEF3C7',
    },
  },
  text: {
    neutral: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
    },
    danger: { primary: '#DC2626' },
    success: { primary: '#16A34A' },
    warning: { primary: '#D97706' },
    onColor: { primary: '#FFFFFF' },
  },
  border: {
    neutral: { primary: '#E5E7EB', subtle: '#F3F4F6' },
    danger: { primary: '#DC2626' },
  },
};

export const spacings = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
};

export const radius = {
  cornerRadiusSm: '4px',
  cornerRadiusMd: '8px',
  cornerRadiusLg: '12px',
  cornerRadiusFull: '9999px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.05)',
  md: '0 4px 6px rgba(0,0,0,0.07)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
};

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontSize: {
    xs: '11px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};
