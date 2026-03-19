/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          DEFAULT: '#FCD205',
          dark: '#e3bc04',
          light: '#fffef5',
        },
        black: '#0A0A0A',
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          600: '#666666',
          900: '#1a1a1a',
        },
        warning: '#ff9800',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      borderRadius: {
        bubble: '16px',
        card: '12px',
        btn: '8px',
        pill: '20px',
        input: '24px',
      },
      maxWidth: {
        container: '640px',
      },
      animation: {
        slideIn: 'slideIn 0.3s ease forwards',
        bounce: 'dotBounce 1.4s infinite ease-in-out',
        successBounce: 'successBounce 0.5s ease forwards',
      },
      keyframes: {
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dotBounce: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.7' },
          '30%': { transform: 'translateY(-10px)', opacity: '1' },
        },
        successBounce: {
          '0%': { transform: 'scale(0)' },
          '60%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
