/** @jsxImportSource preact */

import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import type { Offer, WidgetConfig } from '../types';
import type { PromotedSection as PromotedSectionType } from '../api';
import { fetchPromoted } from '../api';
import { MarketplaceCard } from './MarketplaceCard';

type PromotedSectionProps = {
  config: WidgetConfig;
  onCardClick: (offer: Offer) => void;
};

export function PromotedSection({ config, onCardClick }: PromotedSectionProps) {
  const [sections, setSections] = useState<PromotedSectionType[]>([]);
  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    fetchPromoted(config)
      .then((res) => setSections(res.data))
      .catch(() => {});
  }, [config.apiUrl, config.apiKey]);

  const scroll = useCallback((slug: string, direction: 'left' | 'right') => {
    const el = scrollRefs.current.get(slug);
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }, []);

  if (sections.length === 0) return null;

  return (
    <div class="fevo-ef-promoted">
      {sections.map((section) => (
        <div key={section.slug} class="fevo-ef-promoted-section">
          <div class="fevo-ef-promoted-header">
            <div class="fevo-ef-promoted-header-left">
              <span class="fevo-ef-promoted-badge">Promoted</span>
              <h3 class="fevo-ef-promoted-title">{section.name}</h3>
            </div>
            <div class="fevo-ef-promoted-nav">
              <button
                class="fevo-ef-promoted-nav-btn"
                onClick={() => scroll(section.slug, 'left')}
                aria-label="Scroll left"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                class="fevo-ef-promoted-nav-btn"
                onClick={() => scroll(section.slug, 'right')}
                aria-label="Scroll right"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
          <div
            class="fevo-ef-promoted-scroll"
            ref={(el: HTMLDivElement | null) => { if (el) scrollRefs.current.set(section.slug, el); }}
          >
            {section.offers.map((offer) => (
              <div key={offer.offer_id} class="fevo-ef-promoted-card-wrap">
                <MarketplaceCard offer={offer} config={config} onCardClick={onCardClick} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
