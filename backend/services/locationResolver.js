// services/locationResolver.js
// Pure API chain — any input → always returns nearest IATA
//   1. Nominatim       → structured address + coordinates
//   2. RestCountries   → capital (country-only input) — FIXED
//   3. Amadeus         → IATA (city → county → state → GPS fallback)
//   4. Token mutex     → prevents race condition in parallel calls

const NOMINATIM      = 'https://nominatim.openstreetmap.org';
const REST_COUNTRIES = 'https://restcountries.com/v3.1';
const AMADEUS_BASE   = 'https://test.api.amadeus.com';

// ─── Token cache + mutex ──────────────────────────────────────────────────
let _token        = null;
let _tokenExpiry  = 0;
let _tokenPromise = null;

export async function getAmadeusToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  if (_tokenPromise) return _tokenPromise;

  _tokenPromise = fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
  })
    .then(async res => {
      if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`);
      const data    = await res.json();
      _token        = data.access_token;
      _tokenExpiry  = Date.now() + (data.expires_in - 60) * 1000;
      _tokenPromise = null;
      return _token;
    })
    .catch(err => {
      _tokenPromise = null;
      throw err;
    });

  return _tokenPromise;
}

// ─── Nominatim lookup ─────────────────────────────────────────────────────
async function nominatimLookup(rawInput) {
  try {
    const url = `${NOMINATIM}/search?q=${encodeURIComponent(rawInput)}&format=json&addressdetails=1&limit=1`;
    const res  = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TripPlannerApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;

    const item = data[0];
    const addr = item.address || {};
    const type = item.addresstype || item.type || item.class || '';

    const city        = addr.city || addr.town || addr.village || addr.city_district || addr.suburb || null;
    const county      = addr.county  || null;
    const state       = addr.state   || null;
    const country     = addr.country || null;
    const countryCode = addr.country_code?.toUpperCase() || null;
    const lat         = parseFloat(item.lat) || null;
    const lon         = parseFloat(item.lon) || null;

    const isCountryOnly = (
      type === 'country' ||
      (addr.country && !addr.city && !addr.town && !addr.village &&
       !addr.city_district && !addr.suburb && !addr.county)
    );

    return { city, county, state, country, countryCode, isCountryOnly, lat, lon, rawAddr: addr };
  } catch (err) {
    console.warn('[nominatim] error:', err.message);
    return null;
  }
}

// ─── RestCountries: capital — FIXED with countryCode priority ────────────
// Bug was: searching by name "India" returned Bhutan sometimes
// Fix: use 2-letter country code (IN, FR etc.) which is always accurate
async function getCapital(countryName, countryCode) {
  try {
    let entry = null;

    // Try by 2-letter code first (most accurate)
    if (countryCode) {
      const res = await fetch(
        `${REST_COUNTRIES}/alpha/${countryCode}?fields=name,capital`
      );
      if (res.ok) {
        const data = await res.json();
        entry = Array.isArray(data) ? data[0] : data;
      }
    }

    // Fallback to name search
    if (!entry?.capital?.[0]) {
      const res = await fetch(
        `${REST_COUNTRIES}/name/${encodeURIComponent(countryName)}?fields=name,capital&fullText=true`
      );
      if (res.ok) {
        const data = await res.json();
        entry = Array.isArray(data) ? data[0] : data;
      }
    }

    const capital = entry?.capital?.[0] || null;
    console.log(`[resolveIata] Capital of "${countryName}" (${countryCode}): "${capital}"`);
    return capital;
  } catch {
    return null;
  }
}

// ─── Amadeus IATA lookup ──────────────────────────────────────────────────
async function amadeusIata(query) {
  if (!query?.trim()) return null;
  try {
    const token = await getAmadeusToken();
    const res = await fetch(
      `${AMADEUS_BASE}/v1/reference-data/locations?subType=CITY,AIRPORT&keyword=${encodeURIComponent(query.trim())}&page[limit]=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const locs = data.data || [];
    const best = locs.find(l => l.subType === 'CITY') || locs[0];
    return best ? { iataCode: best.iataCode, name: best.name } : null;
  } catch {
    return null;
  }
}

// ─── Amadeus nearest airport by GPS ──────────────────────────────────────
async function amadeusNearestAirport(lat, lon) {
  if (!lat || !lon) return null;
  try {
    const token = await getAmadeusToken();
    const res = await fetch(
      `${AMADEUS_BASE}/v1/reference-data/locations/airports?latitude=${lat}&longitude=${lon}&radius=500&page[limit]=3&sort=relevance`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const best = data.data?.[0];
    return best ? { iataCode: best.iataCode, name: best.name } : null;
  } catch {
    return null;
  }
}

// ─── Clean region name ────────────────────────────────────────────────────
function cleanRegionName(raw) {
  if (!raw) return null;
  return raw
    .replace(/provincia\s+di\s+/gi,  '')
    .replace(/province\s+of\s+/gi,   '')
    .replace(/region\s+of\s+/gi,     '')
    .replace(/prefecture\s+of\s+/gi, '')
    .replace(/district\s+of\s+/gi,   '')
    .replace(/\s*[\/–—-].*$/,        '')
    .replace(/\(.*?\)/g,             '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');
}

// ─── Build progressively simpler queries ─────────────────────────────────
function buildFallbackQueries(name) {
  if (!name?.trim()) return [];
  const queries = [name];
  const words   = name.trim().split(/\s+/);
  if (words.length >= 2) queries.push(words.slice(1).join(' '));
  if (words.length >= 3) queries.push(words.slice(0, -1).join(' '));
  if (words.length >= 2) queries.push(words[words.length - 1]);
  return [...new Set(queries)].filter(Boolean);
}

// ─── Try queries against Amadeus ─────────────────────────────────────────
async function tryQueries(queries, label) {
  for (const query of queries) {
    const result = await amadeusIata(query);
    if (result?.iataCode) {
      console.log(`[resolveIata] ✅ ${label} "${query}" → ${result.iataCode}`);
      return result;
    }
  }
  return null;
}

// ─── Main resolver ────────────────────────────────────────────────────────
export async function resolveIata(rawInput) {
  if (!rawInput) return null;
  console.log(`[resolveIata] Input: "${rawInput}"`);

  // Step 1 — Nominatim
  const nom = await nominatimLookup(rawInput);
  console.log(`[resolveIata] Nominatim:`, JSON.stringify(nom));

  let cityToSearch = null;
  let displayName  = null;

  if (nom) {
    if (nom.isCountryOnly || !nom.city) {
      // ── FIXED: pass countryCode (IN, FR) for accurate capital lookup ──
      const capital = await getCapital(
        nom.country || rawInput.split(',')[0].trim(),
        nom.countryCode   // e.g. "IN" for India → New Delhi ✅
      );
      cityToSearch = capital || nom.country || rawInput.split(',')[0].trim();
      displayName  = cityToSearch;
    } else {
      cityToSearch = nom.city;
      displayName  = nom.city;
    }
  } else {
    cityToSearch = rawInput.split(',')[0].trim();
    displayName  = cityToSearch;
  }

  // Step 2 — Try city directly
  let result = await tryQueries(buildFallbackQueries(cityToSearch), 'city');
  if (result) return { iataCode: result.iataCode, resolvedCity: result.name || cityToSearch };

  // Step 3 — Try county/state as proxy for small towns
  if (nom) {
    const regions = [
      cleanRegionName(nom.county),
      cleanRegionName(nom.state),
    ].filter(Boolean);

    if (regions.length) {
      console.log(`[resolveIata] Trying region fallbacks:`, regions);
      for (const region of regions) {
        result = await tryQueries(buildFallbackQueries(region), 'region');
        if (result) {
          return {
            iataCode:     result.iataCode,
            resolvedCity: `${displayName} (via ${result.name || region})`,
          };
        }
      }
    }
  }

  // Step 4 — Nearest airport by GPS
  if (nom?.lat && nom?.lon) {
    console.log(`[resolveIata] Trying nearest airport at (${nom.lat}, ${nom.lon})`);
    result = await amadeusNearestAirport(nom.lat, nom.lon);
    if (result) {
      console.log(`[resolveIata] ✅ Nearest airport: ${result.iataCode} (${result.name})`);
      return {
        iataCode:     result.iataCode,
        resolvedCity: `${displayName} (via ${result.name})`,
      };
    }
  }

  // Step 5 — Raw input words last resort
  console.log(`[resolveIata] Last resort: raw words`);
  const rawWords = rawInput.split(/[\s,]+/).filter(w => w.length > 2).reverse();
  result = await tryQueries(rawWords, 'raw-words');
  if (result) {
    return {
      iataCode:     result.iataCode,
      resolvedCity: `${displayName} (via ${result.name})`,
    };
  }

  console.warn(`[resolveIata] ❌ All strategies exhausted for: "${rawInput}"`);
  return null;
}