/** @jsxImportSource preact */

import { useEffect, useCallback, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import type { WidgetConfig } from '../types';

/**
 * Convert /event/ checkout URLs to /embed/ path which FEVO
 * explicitly exposes for iframe embedding.
 */
function toEmbedUrl(url: string): string {
  return url.replace(/\/event\//, '/embed/');
}

type CheckoutDrawerProps = {
  checkoutUrl: string;
  config: WidgetConfig;
  onClose: () => void;
};

export function CheckoutDrawer({ checkoutUrl, config, onClose }: CheckoutDrawerProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);
  const [iframeFailed, setIframeFailed] = useState(false);
  const embedUrl = toEmbedUrl(checkoutUrl);

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

  // Detect iframe load failure via a timeout — if the iframe
  // hasn't signalled load after 5s, the embed was likely blocked.
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadedRef = useRef(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loadedRef.current) setIframeFailed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = useCallback(() => {
    loadedRef.current = true;
  }, []);

  const handleOpenExternal = useCallback((e: Event) => {
    e.preventDefault();
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  }, [checkoutUrl]);

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
        {iframeFailed ? (
          <div class="fevo-ef-drawer-fallback">
            <p>Checkout couldn't be loaded inline.</p>
            <button class="fevo-ef-cta" onClick={handleOpenExternal}>
              Open Checkout
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            class="fevo-ef-drawer-iframe"
            src={embedUrl}
            title="FEVO Checkout"
            allow="payment"
            onLoad={handleIframeLoad}
          />
        )}
      </div>
    </div>,
    portalRef.current!,
  );
}
