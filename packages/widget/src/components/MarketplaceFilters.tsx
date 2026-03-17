/** @jsxImportSource preact */

import { useMemo } from 'preact/hooks';
import type { Offer } from '../types';

type MarketplaceFiltersProps = {
  offers: Offer[];
  activeOrg: string | null;
  activeCategory: string | null;
  activeState: string | null;
  activeCity: string | null;
  onOrgChange: (org: string | null) => void;
  onCategoryChange: (cat: string | null) => void;
  onStateChange: (state: string | null) => void;
  onCityChange: (city: string | null) => void;
};

export function MarketplaceFilters({
  offers,
  activeOrg,
  activeCategory,
  activeState,
  activeCity,
  onOrgChange,
  onCategoryChange,
  onStateChange,
  onCityChange,
}: MarketplaceFiltersProps) {
  // Derive unique orgs
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

  // Derive unique categories from org category
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const o of offers) {
      const cat = o.organization?.category;
      if (cat) set.add(cat);
    }
    return Array.from(set).sort();
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

  const anyActive = !!(activeOrg || activeCategory || activeState || activeCity);

  return (
    <div class="fevo-ef-marketplace-filters">
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

      <div class="fevo-ef-marketplace-filter-group">
        <label class="fevo-ef-marketplace-filter-label">Category</label>
        <select
          class="fevo-ef-geo-select"
          value={activeCategory || ''}
          disabled={categories.length === 0}
          onChange={(e: Event) => onCategoryChange((e.target as HTMLSelectElement).value || null)}
        >
          <option value="">{categories.length === 0 ? 'No categories yet' : 'All Categories'}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div class="fevo-ef-marketplace-filter-group">
        <label class="fevo-ef-marketplace-filter-label">State</label>
        <select
          class="fevo-ef-geo-select"
          value={activeState || ''}
          disabled={states.length === 0}
          onChange={(e: Event) => {
            const val = (e.target as HTMLSelectElement).value || null;
            onStateChange(val);
            if (val !== activeState) onCityChange(null);
          }}
        >
          <option value="">{states.length === 0 ? 'No locations yet' : 'All States'}</option>
          {states.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div class="fevo-ef-marketplace-filter-group">
        <label class="fevo-ef-marketplace-filter-label">City</label>
        <select
          class="fevo-ef-geo-select"
          value={activeCity || ''}
          disabled={cities.length === 0}
          onChange={(e: Event) => onCityChange((e.target as HTMLSelectElement).value || null)}
        >
          <option value="">{cities.length === 0 ? (activeState ? 'No cities' : 'Select a state') : 'All Cities'}</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {anyActive && (
        <button
          class="fevo-ef-marketplace-filter-clear"
          onClick={() => { onOrgChange(null); onCategoryChange(null); onStateChange(null); onCityChange(null); }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
