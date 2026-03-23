// services/attractionService.js
// Google Places API (New) — same key as hotelService
// Fetches museums, landmarks, parks, tourist attractions

import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_BASE = 'https://places.googleapis.com/v1';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const REST_COUNTRIES = 'https://restcountries.com/v3.1';

function getKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

// ─── Geocode ───────────────────────────────────────────────────────────────
async function geocodeCity(cityName) {
  try {
    const url = `${NOMINATIM}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TripPlannerApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;

    const item = data[0];
    const addr = item.address || {};
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    const isCountry = item.addresstype === 'country' || item.type === 'country' ||
      (addr.country && !addr.city && !addr.town && !addr.village);

    if (isCountry) {
      const capital = await getCapital(addr.country_code?.toUpperCase(), addr.country || cityName);
      if (capital) return geocodeCity(capital);
    }

    return { lat, lng };
  } catch (err) {
    console.error('[attractions] Geocode error:', err.message);
    return null;
  }
}

async function getCapital(countryCode, countryName) {
  try {
    let entry = null;
    if (countryCode) {
      const res = await fetch(`${REST_COUNTRIES}/alpha/${countryCode}?fields=name,capital`);
      if (res.ok) { const d = await res.json(); entry = Array.isArray(d) ? d[0] : d; }
    }
    if (!entry?.capital?.[0] && countryName) {
      const res = await fetch(`${REST_COUNTRIES}/name/${encodeURIComponent(countryName)}?fields=name,capital&fullText=true`);
      if (res.ok) { const d = await res.json(); entry = Array.isArray(d) ? d[0] : d; }
    }
    return entry?.capital?.[0] || null;
  } catch { return null; }
}

// ─── Photo URL ────────────────────────────────────────────────────────────
function getPhotoUrl(photoName) {
  if (!photoName) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${getKey()}`;
}

// ─── Fallback images ──────────────────────────────────────────────────────
const CITY_ATTRACTION_IMAGES = {
  london: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  paris: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  rome: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80',
  dubai: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  tokyo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  bangkok: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  istanbul: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80',
};

function fallbackImage(cityName) {
  const key = (cityName || '').toLowerCase();
  for (const [city, url] of Object.entries(CITY_ATTRACTION_IMAGES)) {
    if (key.includes(city)) return url;
  }
  return CITY_ATTRACTION_IMAGES.default;
}

// ─── Category from types ──────────────────────────────────────────────────
function getCategoryFromTypes(types = []) {
  if (types.includes('museum')) return 'Museum';
  if (types.includes('art_gallery')) return 'Art Gallery';
  if (types.includes('amusement_park')) return 'Amusement Park';
  if (types.includes('aquarium')) return 'Aquarium';
  if (types.includes('zoo')) return 'Zoo';
  if (types.includes('park') || types.includes('national_park')) return 'Park';
  if (types.includes('church') || types.includes('place_of_worship')) return 'Religious Site';
  if (types.includes('stadium')) return 'Stadium';
  if (types.includes('shopping_mall')) return 'Shopping';
  if (types.includes('tourist_attraction')) return 'Attraction';
  if (types.includes('point_of_interest')) return 'Landmark';
  return 'Attraction';
}

// ─── Nearby Search ────────────────────────────────────────────────────────
async function searchNearbyAttractions(lat, lng, cityName) {
  try {
    const GOOGLE_KEY = getKey();
    if (!GOOGLE_KEY) {
      console.error('[attractions] ❌ GOOGLE_PLACES_API_KEY is undefined!');
      return [];
    }

    const body = {
      // ✅ FIX: 'landmark' removed — not supported in Google Places API (New)
      includedTypes: [
        'tourist_attraction',
        'museum',
        'art_gallery',
        'amusement_park',
        'aquarium',
        'zoo',
        'park',
        'national_park',
      ],
      maxResultCount: 12,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 20000,
        },
      },
      rankPreference: 'POPULARITY',
    };

    const res = await fetch(`${GOOGLE_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.rating',
          'places.userRatingCount',
          'places.photos',
          'places.location',
          'places.types',
          'places.regularOpeningHours',
          'places.websiteUri',
          'places.editorialSummary',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[attractions] Google Nearby Search error:', err.slice(0, 300));
      return [];
    }

    const data = await res.json();
    const places = (data.places || []).slice(0, 10);
    console.log(`[attractions] ✅ Found ${places.length} attractions near "${cityName}"`);

    return places.map(p => {
      const photoName = p.photos?.[0]?.name || null;
      const types = p.types || [];
      const category = getCategoryFromTypes(types);

      let openingHours = null;
      if (p.regularOpeningHours?.weekdayDescriptions?.length) {
        const today = new Date().getDay();
        const todayDesc = p.regularOpeningHours.weekdayDescriptions[today === 0 ? 6 : today - 1];
        openingHours = todayDesc?.split(': ')?.[1] || 'Check website';
      }

      return {
        attractionId: p.id,
        name: p.displayName?.text || 'Attraction',
        cityName,
        category,
        address: p.formattedAddress || cityName,
        lat: p.location?.latitude || lat,
        lng: p.location?.longitude || lng,
        image: photoName ? getPhotoUrl(photoName) : fallbackImage(cityName),
        rating: p.rating || null,
        ratingCount: p.userRatingCount || null,
        openingHours,
        website: p.websiteUri || null,
        description: p.editorialSummary?.text || null,
        entryFee: null,
        available: true,
      };
    });

  } catch (err) {
    console.error('[attractions] Google Nearby Search error:', err.message);
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────
export async function searchAttractions({ destinationCity }) {
  try {
    console.log(`[attractions] Searching attractions in "${destinationCity}"`);

    const coords = await geocodeCity(destinationCity);
    if (!coords) {
      console.warn(`[attractions] Could not geocode "${destinationCity}" — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    const attractions = await searchNearbyAttractions(coords.lat, coords.lng, destinationCity);
    if (attractions.length === 0) {
      console.warn(`[attractions] No attractions found — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    return attractions;

  } catch (err) {
    console.error('[attractionService] Unexpected error:', err.message);
    return buildPlaceholders(destinationCity);
  }
}

// ─── Placeholders ─────────────────────────────────────────────────────────
function buildPlaceholders(cityName, count = 8) {
  const city = cityName?.split(',')[0] || 'destination';
  const categories = ['Museum', 'Landmark', 'Park', 'Art Gallery', 'Attraction', 'Historic Site', 'Monument', 'Zoo'];
  const names = [
    `National Museum of ${city}`,
    `${city} Historic Center`,
    `${city} Central Park`,
    `${city} Art Gallery`,
    `${city} Old Town`,
    `${city} Cathedral`,
    `${city} Monument`,
    `${city} Cultural Center`,
  ];

  return Array.from({ length: count }, (_, i) => ({
    attractionId: `PLACEHOLDER_${i}`,
    name: names[i] || `Attraction ${i + 1}`,
    cityName: city,
    category: categories[i % categories.length],
    address: city,
    lat: null,
    lng: null,
    image: fallbackImage(city),
    rating: (4.0 + (i % 5) * 0.1).toFixed(1),
    ratingCount: 1000 + i * 250,
    openingHours: '9:00 AM – 6:00 PM',
    website: null,
    description: `A must-visit attraction in ${city}.`,
    entryFee: null,
    available: false,
    isPlaceholder: true,
  }));
}