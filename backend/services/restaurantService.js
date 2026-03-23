// services/restaurantService.js
// Google Places API (New) — same key as hotelService + attractionService
// Fetches top restaurants near destination

import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_BASE = 'https://places.googleapis.com/v1';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const REST_COUNTRIES = 'https://restcountries.com/v3.1';

function getKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

// ─── Geocode (same pattern) ───────────────────────────────────────────────
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
    console.error('[restaurants] Geocode error:', err.message);
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

// ─── Get photo URL ────────────────────────────────────────────────────────
function getPhotoUrl(photoName) {
  if (!photoName) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${getKey()}`;
}

// ─── Fallback images ──────────────────────────────────────────────────────
const FOOD_IMAGES = {
  london: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  paris: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  tokyo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  dubai: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
  default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
};

function fallbackImage(cityName) {
  const key = (cityName || '').toLowerCase();
  for (const [city, url] of Object.entries(FOOD_IMAGES)) {
    if (key.includes(city)) return url;
  }
  return FOOD_IMAGES.default;
}

// ─── Price level to display string ───────────────────────────────────────
function getPriceDisplay(priceLevel) {
  const map = {
    'PRICE_LEVEL_FREE': 'Free',
    'PRICE_LEVEL_INEXPENSIVE': '£',
    'PRICE_LEVEL_MODERATE': '££',
    'PRICE_LEVEL_EXPENSIVE': '£££',
    'PRICE_LEVEL_VERY_EXPENSIVE': '££££',
  };
  return map[priceLevel] || '££';
}

// ─── Get cuisine from types ───────────────────────────────────────────────
function getCuisineFromTypes(types = [], displayName = '') {
  const typeMap = {
    'indian_restaurant': 'Indian',
    'chinese_restaurant': 'Chinese',
    'japanese_restaurant': 'Japanese',
    'italian_restaurant': 'Italian',
    'french_restaurant': 'French',
    'mexican_restaurant': 'Mexican',
    'thai_restaurant': 'Thai',
    'mediterranean_restaurant': 'Mediterranean',
    'middle_eastern_restaurant': 'Middle Eastern',
    'american_restaurant': 'American',
    'seafood_restaurant': 'Seafood',
    'steak_house': 'Steakhouse',
    'pizza_restaurant': 'Pizza',
    'sushi_restaurant': 'Sushi',
    'cafe': 'Café',
    'bakery': 'Bakery',
    'bar': 'Bar & Grill',
    'fast_food_restaurant': 'Fast Food',
    'fine_dining_restaurant': 'Fine Dining',
    'buffet_restaurant': 'Buffet',
  };

  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }

  // Try to guess from name
  const name = displayName.toLowerCase();
  if (name.includes('indian') || name.includes('curry')) return 'Indian';
  if (name.includes('chinese')) return 'Chinese';
  if (name.includes('italian') || name.includes('pizza') || name.includes('pasta')) return 'Italian';
  if (name.includes('japanese') || name.includes('sushi')) return 'Japanese';
  if (name.includes('thai')) return 'Thai';
  if (name.includes('french') || name.includes('brasserie') || name.includes('bistro')) return 'French';
  if (name.includes('mexican') || name.includes('taco')) return 'Mexican';
  if (name.includes('café') || name.includes('cafe') || name.includes('coffee')) return 'Café';
  if (name.includes('steak') || name.includes('grill')) return 'Grill';
  if (name.includes('seafood') || name.includes('fish')) return 'Seafood';
  if (name.includes('burger')) return 'Burgers';

  return 'Restaurant';
}

// ─── Search restaurants via Google Places ────────────────────────────────
async function searchNearbyRestaurants(lat, lng, cityName) {
  try {
    const GOOGLE_KEY = getKey();
    if (!GOOGLE_KEY) {
      console.error('[restaurants] ❌ GOOGLE_PLACES_API_KEY is undefined!');
      return [];
    }

    const body = {
      includedTypes: ['restaurant', 'cafe', 'fine_dining_restaurant'],
      maxResultCount: 12,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 15000,
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
          'places.priceLevel',
          'places.photos',
          'places.location',
          'places.types',
          'places.regularOpeningHours',
          'places.websiteUri',
          'places.editorialSummary',
          'places.internationalPhoneNumber',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[restaurants] Google Nearby Search error:', err.slice(0, 300));
      return [];
    }

    const data = await res.json();
    const places = (data.places || []).slice(0, 10);
    console.log(`[restaurants] ✅ Found ${places.length} restaurants near "${cityName}"`);

    return places.map(p => {
      const photoName = p.photos?.[0]?.name || null;
      const types = p.types || [];
      const name = p.displayName?.text || 'Restaurant';

      let openingHours = null;
      if (p.regularOpeningHours?.weekdayDescriptions?.length) {
        const today = new Date().getDay();
        const todayDesc = p.regularOpeningHours.weekdayDescriptions[today === 0 ? 6 : today - 1];
        openingHours = todayDesc?.split(': ')?.[1] || 'Check website';
      }

      return {
        restaurantId: p.id,
        name,
        cityName,
        cuisine: getCuisineFromTypes(types, name),
        address: p.formattedAddress || cityName,
        lat: p.location?.latitude || lat,
        lng: p.location?.longitude || lng,
        image: photoName ? getPhotoUrl(photoName) : fallbackImage(cityName),
        rating: p.rating || null,
        ratingCount: p.userRatingCount || null,
        priceLevel: getPriceDisplay(p.priceLevel),
        openingHours,
        website: p.websiteUri || null,
        phone: p.internationalPhoneNumber || null,
        description: p.editorialSummary?.text || null,
        available: true,
      };
    });

  } catch (err) {
    console.error('[restaurants] Google Nearby Search error:', err.message);
    return [];
  }
}

// ─── Main export ──────────────────────────────────────────────────────────
export async function searchRestaurants({ destinationCity }) {
  try {
    console.log(`[restaurants] Searching restaurants in "${destinationCity}"`);

    const coords = await geocodeCity(destinationCity);
    if (!coords) {
      console.warn(`[restaurants] Could not geocode "${destinationCity}" — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    const restaurants = await searchNearbyRestaurants(coords.lat, coords.lng, destinationCity);
    if (restaurants.length === 0) {
      console.warn(`[restaurants] No restaurants found — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    return restaurants;

  } catch (err) {
    console.error('[restaurantService] Unexpected error:', err.message);
    return buildPlaceholders(destinationCity);
  }
}

// ─── Placeholder builder ──────────────────────────────────────────────────
function buildPlaceholders(cityName, count = 8) {
  const city = cityName?.split(',')[0] || 'destination';
  const cuisines = ['Local Cuisine', 'Indian', 'Italian', 'Chinese', 'Mediterranean', 'Seafood', 'French', 'Grill'];
  const priceLevels = ['£', '££', '£££', '££', '£', '£££', '££', '£££'];
  const names = [
    `The ${city} Kitchen`,
    `Spice Route ${city}`,
    `Bella ${city}`,
    `${city} Dragon Palace`,
    `Mediterranean ${city}`,
    `${city} Seafood House`,
    `Café de ${city}`,
    `${city} Grill & Bar`,
  ];

  return Array.from({ length: count }, (_, i) => ({
    restaurantId: `PLACEHOLDER_${i}`,
    name: names[i] || `Restaurant ${i + 1}`,
    cityName: city,
    cuisine: cuisines[i % cuisines.length],
    address: city,
    lat: null,
    lng: null,
    image: fallbackImage(city),
    rating: (4.0 + (i % 5) * 0.1).toFixed(1),
    ratingCount: 500 + i * 150,
    priceLevel: priceLevels[i % priceLevels.length],
    openingHours: '12:00 PM – 10:00 PM',
    website: null,
    phone: null,
    description: `Popular restaurant in ${city}.`,
    available: false,
    isPlaceholder: true,
  }));
}