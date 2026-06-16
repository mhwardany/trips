/**
 * Destination imagery — resilient, no API key, static-export friendly.
 *
 * Strategy:
 *  1) Resolve a real photo URL from Wikipedia REST (CORS-enabled, keyless) for the
 *     city (then country). Cache the resolved URL in IndexedDB so we hit the network once.
 *  2) If anything fails, fall back to a locally-generated SVG gradient cover (never breaks).
 */
import { cacheGet, cacheSet } from '@/lib/db';

const WIKI = (title: string) =>
  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

// Wikipedia article titles that reliably carry a strong lead image.
const CITY_TITLE: Record<string, string> = {
  'Kuwait City': 'Kuwait City', 'Dubai': 'Dubai', 'Abu Dhabi': 'Abu Dhabi',
  'Riyadh': 'Riyadh', 'Jeddah': 'Jeddah', 'Madinah': 'Medina', 'Dammam': 'Dammam',
  'Doha': 'Doha', 'Istanbul': 'Istanbul', 'London': 'London', 'Paris': 'Paris',
  'Rome': 'Rome', 'New York': 'New York City', 'Manama': 'Manama', 'Muscat': 'Muscat',
  'Amman': 'Amman', 'Beirut': 'Beirut', 'Cairo': 'Cairo', 'Alexandria': 'Alexandria',
  'Sharm El Sheikh': 'Sharm El Sheikh', 'Hurghada': 'Hurghada', 'Frankfurt': 'Frankfurt',
  'Washington': 'Washington, D.C.'
};
const COUNTRY_TITLE: Record<string, string> = {
  'Kuwait': 'Kuwait', 'UAE': 'Dubai', 'Saudi Arabia': 'Riyadh', 'Qatar': 'Doha',
  'Bahrain': 'Manama', 'Oman': 'Muscat', 'Egypt': 'Cairo', 'Jordan': 'Petra',
  'Turkey': 'Istanbul', 'UK': 'London', 'United Kingdom': 'London', 'France': 'Paris',
  'Germany': 'Berlin', 'Italy': 'Rome', 'Spain': 'Barcelona', 'USA': 'New York City',
  'Morocco': 'Marrakesh', 'Tunisia': 'Tunis', 'Lebanon': 'Beirut', 'Switzerland': 'Zermatt',
  'Japan': 'Tokyo', 'Malaysia': 'Kuala Lumpur', 'Thailand': 'Bangkok'
};

function titleFor(country?: string, city?: string): string | null {
  if (city && CITY_TITLE[city]) return CITY_TITLE[city];
  if (country && COUNTRY_TITLE[country]) return COUNTRY_TITLE[country];
  if (city) return city;
  if (country) return country;
  return null;
}

async function fetchWikiImage(title: string): Promise<string | null> {
  try {
    const res = await fetch(WIKI(title), { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const j = await res.json();
    return j.originalimage?.source || j.thumbnail?.source || null;
  } catch {
    return null;
  }
}

/**
 * Resolve a destination photo URL (cached). Returns null if unavailable —
 * callers should then render the SVG gradient fallback.
 */
export async function resolveDestinationImage(country?: string, city?: string): Promise<string | null> {
  const title = titleFor(country, city);
  if (!title) return null;
  const key = 'destimg_' + title.toLowerCase();

  const cached = await cacheGet<{ url: string | null; at: number }>(key);
  // cache for 30 days; also cache "null" misses for 1 day to avoid hammering
  const now = Date.now();
  if (cached) {
    const ttl = cached.url ? 30 * 864e5 : 1 * 864e5;
    if (now - cached.at < ttl) return cached.url;
  }

  const url = await fetchWikiImage(title);
  await cacheSet(key, { url, at: now });
  return url;
}

/** Deterministic local SVG gradient cover — always renders, no network. */
export function gradientCover(seed: string, flag = ''): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  const h2 = (h + 40) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${h},42%,16%)"/>
      <stop offset="1" stop-color="hsl(${h2},38%,9%)"/>
    </linearGradient>
    <radialGradient id="r" cx="0.8" cy="0.15" r="0.9">
      <stop offset="0" stop-color="rgba(37, 99, 235,0.22)"/>
      <stop offset="1" stop-color="rgba(37, 99, 235,0)"/>
    </radialGradient></defs>
    <rect width="800" height="500" fill="url(#g)"/>
    <rect width="800" height="500" fill="url(#r)"/>
    <text x="40" y="430" font-size="180" opacity="0.9">${flag}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}
