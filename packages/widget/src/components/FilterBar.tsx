/** @jsxImportSource preact */

import { useState, useEffect, useCallback } from 'preact/hooks';
import type { WidgetConfig } from '../types';
import { fetchSegments, fetchGeographies } from '../api';

type Segment = { id: string; name: string; slug: string; type: string };
type Geography = { venue_city: string; venue_state: string };

type FilterBarProps = {
  config: WidgetConfig;
  activeSegment: string | null;
  activeGeo: string | null;
  onSegmentChange: (slug: string | null) => void;
  onGeoChange: (geo: string | null) => void;
  hideGeo?: boolean;
};

export function FilterBar({ config, activeSegment, activeGeo, onSegmentChange, onGeoChange, hideGeo }: FilterBarProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [geos, setGeos] = useState<Geography[]>([]);

  useEffect(() => {
    fetchSegments(config).then((res) => setSegments(res.data)).catch(() => {});
    if (!hideGeo) {
      fetchGeographies(config).then((res) => setGeos(res.data)).catch(() => {});
    }
  }, [config.apiUrl, config.apiKey, hideGeo]);

  const handleSegmentClick = useCallback((slug: string) => {
    onSegmentChange(activeSegment === slug ? null : slug);
  }, [activeSegment, onSegmentChange]);

  const handleGeoChange = useCallback((e: Event) => {
    const val = (e.target as HTMLSelectElement).value;
    onGeoChange(val || null);
  }, [onGeoChange]);

  return (
    <div class="fevo-ef-filter-bar">
      {segments.length > 0 && (
        <div class="fevo-ef-filter-pills">
          <button
            class={`fevo-ef-filter-pill ${!activeSegment ? 'fevo-ef-filter-pill--active' : ''}`}
            onClick={() => onSegmentChange(null)}
          >
            All
          </button>
          {segments.map((seg) => (
            <button
              key={seg.slug}
              class={`fevo-ef-filter-pill ${activeSegment === seg.slug ? 'fevo-ef-filter-pill--active' : ''}`}
              onClick={() => handleSegmentClick(seg.slug)}
            >
              {seg.name}
            </button>
          ))}
        </div>
      )}
      {!hideGeo && geos.length > 0 && (
        <div class="fevo-ef-filter-geo">
          <select class="fevo-ef-geo-select" value={activeGeo || ''} onChange={handleGeoChange}>
            <option value="">All Locations</option>
            {geos.map((g) => (
              <option key={`${g.venue_city}-${g.venue_state}`} value={g.venue_city}>
                {g.venue_city}, {g.venue_state}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
