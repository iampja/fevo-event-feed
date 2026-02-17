import { createGlobalStyle } from 'styled-components';
import { colors, typography } from './tokens';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${typography.fontFamily};
    font-size: ${typography.fontSize.md};
    line-height: ${typography.lineHeight.normal};
    color: ${colors.text.neutral.primary};
    background-color: ${colors.surface.neutral.bgSubtle};
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${typography.fontWeight.semibold};
    line-height: ${typography.lineHeight.tight};
  }

  h1 { font-size: ${typography.fontSize['3xl']}; }
  h2 { font-size: ${typography.fontSize['2xl']}; }
  h3 { font-size: ${typography.fontSize.xl}; }
  h4 { font-size: ${typography.fontSize.lg}; }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    background: none;
  }

  input, textarea, select {
    font-family: inherit;
    font-size: inherit;
  }

  ul, ol {
    list-style: none;
  }

  img {
    max-width: 100%;
    display: block;
  }

  ::selection {
    background-color: #3B82F6;
    color: #FFFFFF;
  }

  :focus-visible {
    outline: 2px solid #3B82F6;
    outline-offset: 2px;
  }
`;
