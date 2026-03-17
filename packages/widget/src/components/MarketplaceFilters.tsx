/** @jsxImportSource preact */

import { useMemo } from 'preact/hooks';
import type { Offer } from '../types';

type MarketplaceFiltersProps = {
  offers: Offer[];
  activeOrg: string | null;
  activeState: string | null;
  activeCity: string | null;
  onOrgChange: (org: string | null) => void;
  onStateChange: (state: string | null) => void;
  onCityChange: (city: string | null) => void;
};

export function MarketplaceFilters({
  offers,
  activeOrg,
  activeState,
  activeCity,
  onOrgChange,
  onStateChange,
  onCityChange,
}: MarketplaceFiltersProps) {
  // Derive unique orgs from loaded offers
  const orgs = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of offers) {
      const id = o.organization?.id;
      const name = o.organization?.name;
      if (id && name) map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [offers]);

  // Derive unique states
  const states = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      if (o.venue?.state) set.add(o.venue.state);
    }
    return Array.from(set).sort();
  }, [offers]);

  // Derive cities filtered by active state
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      if (o.venue?.city) {
        if (!activeState || o.venue.state === activeState) {
          set.add(o.venue.city);
        }
      }
    }
    return Array.from(set).sort();
  }, [offers, activeState]);

  const hasFilters = orgs.length > 1 || states.length > 0;
  if (!hasFilters) return null;

  return (
    <div class="fevo-ef-marketplace-filters">
      {orgs.length > 1 && (
        <div class="fevo-ef-marketplace-filter-group">
          <label class="fevo-ef-marketplace-filter-label">Organization</label>
          <select
            class="fevo-ef-geo-select"
            value={activeOrg || ''}
            onChange={(e: Event) => onOrgChange((e.target as HTMLSelectElement).value || null)}
          >
            <option value="">All Organizations</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      )}

      {states.length > 0 && (
        <div class="fevo-ef-marketplace-filter-group">
          <label class="fevo-ef-marketplace-filter-label">State</label>
          <select
            class="fevo-ef-geo-select"
            value={activeState || ''}
            onChange={(e: Event) => {
              const val = (e.target as HTMLSelectElement).value || null;
              onStateChange(val);
              // Clear city when state changes
              if (val !== activeState) onCityChange(null);
            }}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      {cities.length > 0 && (
        <div class="fevo-ef-marketplace-filter-group">
          <label class="fevo-ef-marketplace-filter-label">City</label>
          <select
            class="fevo-ef-geo-select"
            value={activeCity || ''}
            onChange={(e: Event) => onCityChange((e.target as HTMLSelectElement).value || null)}
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {(activeOrg || activeState || activeCity) && (
        <button
          class="fevo-ef-marketplace-filter-clear"
          onClick={() => { onOrgChange(null); onStateChange(null); onCityChange(null); }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
