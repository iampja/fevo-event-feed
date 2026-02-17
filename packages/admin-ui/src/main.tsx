import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { GlobalStyles } from './theme/GlobalStyles';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GlobalStyles />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: '14px',
          borderRadius: '8px',
          padding: '12px 16px',
        },
        success: {
          style: {
            background: '#DCFCE7',
            color: '#16A34A',
            border: '1px solid #16A34A',
          },
        },
        error: {
          style: {
            background: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #DC2626',
          },
        },
      }}
    />
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
