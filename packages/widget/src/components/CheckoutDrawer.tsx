/** @jsxImportSource preact */

import { useEffect, useCallback, useRef } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { WidgetConfig } from '../types';

type CheckoutDrawerProps = {
  checkoutUrl: string;
  config: WidgetConfig;
  onClose: () => void;
};

export function CheckoutDrawer({ checkoutUrl, config, onClose }: CheckoutDrawerProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);
  if (!portalRef.current) {
    portalRef.current = document.createElement('div');
    portalRef.current.className = 'fevo-ef-root';
    portalRef.current.setAttribute('data-theme', config.theme || 'light');
  }

  useEffect(() => {
    const el = portalRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDrawerClick = useCallback((e: Event) => {
    e.stopPropagation();
  }, []);

  return createPortal(
    <div class="fevo-ef-drawer-backdrop" onClick={handleBackdropClick}>
      <div
        class="fevo-ef-drawer"
        onClick={handleDrawerClick}
        role="dialog"
        aria-modal="true"
        aria-label="Checkout"
      >
        <div class="fevo-ef-drawer-header">
          <span class="fevo-ef-drawer-title">Get Tickets</span>
          <button class="fevo-ef-drawer-close" onClick={onClose} aria-label="Close">
            &#x2715;
          </button>
        </div>
        <iframe
          class="fevo-ef-drawer-iframe"
          src={checkoutUrl}
          title="FEVO Checkout"
          allow="payment"
        />
      </div>
    </div>,
    portalRef.current!,
  );
}
