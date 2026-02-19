export type CityKey =
  | 'new-york'
  | 'boston'
  | 'chicago'
  | 'houston'
  | 'los-angeles'
  | 'san-francisco'
  | 'miami';

const STATE_TO_CITY: Record<string, CityKey> = {
  // new-york
  NY: 'new-york', NJ: 'new-york', CT: 'new-york', PA: 'new-york',
  DE: 'new-york', MD: 'new-york', VA: 'new-york', WV: 'new-york',
  // boston
  MA: 'boston', RI: 'boston', NH: 'boston', VT: 'boston', ME: 'boston',
  // chicago
  IL: 'chicago', WI: 'chicago', IN: 'chicago', IA: 'chicago',
  MN: 'chicago', MI: 'chicago', OH: 'chicago', KY: 'chicago',
  TN: 'chicago', MO: 'chicago', KS: 'chicago', NE: 'chicago',
  SD: 'chicago', ND: 'chicago',
  // houston
  TX: 'houston', OK: 'houston', AR: 'houston', LA: 'houston',
  MS: 'houston', AL: 'houston',
  // los-angeles
  CA: 'los-angeles', NV: 'los-angeles', AZ: 'los-angeles',
  NM: 'los-angeles', HI: 'los-angeles', WY: 'los-angeles',
  CO: 'los-angeles', UT: 'los-angeles', ID: 'los-angeles',
  // san-francisco
  OR: 'san-francisco', WA: 'san-francisco', MT: 'san-francisco',
  AK: 'san-francisco',
  // miami
  FL: 'miami', GA: 'miami', SC: 'miami', NC: 'miami',
};

let cachedResult: CityKey | null | undefined;
let inflightPromise: Promise<CityKey | null> | null = null;

export async function resolveGeo(): Promise<CityKey | null> {
  if (cachedResult !== undefined) return cachedResult;
  if (inflightPromise) return inflightPromise;

  inflightPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const res = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        cachedResult = null;
        return null;
      }

      const data = await res.json();
      const region: string | undefined = data?.region_code;

      if (!region || data?.country_code !== 'US') {
        cachedResult = null;
        return null;
      }

      const city = STATE_TO_CITY[region] ?? null;
      cachedResult = city;
      return city;
    } catch {
      cachedResult = null;
      return null;
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

/** Reset internal cache — for testing only. */
export function _resetGeoCache(): void {
  cachedResult = undefined;
  inflightPromise = null;
}
