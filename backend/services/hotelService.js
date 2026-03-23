// services/hotelService.js
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_BASE    = 'https://places.googleapis.com/v1';
const NOMINATIM      = 'https://nominatim.openstreetmap.org';
const REST_COUNTRIES = 'https://restcountries.com/v3.1';

function getKey() {
  return process.env.GOOGLE_PLACES_API_KEY;
}

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
    const lat  = parseFloat(item.lat);
    const lng  = parseFloat(item.lon);

    const isCountry = item.addresstype === 'country' || item.type === 'country' ||
      (addr.country && !addr.city && !addr.town && !addr.village);

    if (isCountry) {
      console.log(`[hotels] "${cityName}" is a country — finding capital...`);
      const capital = await getCapital(addr.country_code?.toUpperCase(), addr.country || cityName);
      if (capital) {
        console.log(`[hotels] Using capital: "${capital}"`);
        return geocodeCity(capital);
      }
    }

    console.log(`[hotels] Geocoded "${cityName}" → (${lat}, ${lng})`);
    return { lat, lng };
  } catch (err) {
    console.error('[hotels] Geocode error:', err.message);
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
    const capital = entry?.capital?.[0] || null;
    console.log(`[hotels] Capital of "${countryName}": "${capital}"`);
    return capital;
  } catch { return null; }
}

function getPhotoUrl(photoName) {
  if (!photoName) return null;
  return `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&maxWidthPx=600&key=${getKey()}`;
}

const CITY_IMAGES = {
  paris:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  france:    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80',
  london:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80',
  rome:      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80',
  dubai:     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
  tokyo:     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
  bangkok:   'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=400&q=80',
  bali:      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80',
  istanbul:  'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&q=80',
  delhi:     'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&q=80',
  mumbai:    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&q=80',
  default:   'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80',
};

function fallbackImage(cityName) {
  const key = (cityName || '').toLowerCase();
  for (const [city, url] of Object.entries(CITY_IMAGES)) {
    if (key.includes(city)) return url;
  }
  return CITY_IMAGES.default;
}

async function searchNearbyHotels(lat, lng, cityName, hotelRatings = []) {
  try {
    const GOOGLE_KEY = getKey();

    if (!GOOGLE_KEY) {
      console.error('[hotels] ❌ GOOGLE_PLACES_API_KEY is not set in .env!');
      return [];
    }

    console.log(`[hotels] Using Google Key: ${GOOGLE_KEY.slice(0, 10)}...`);

    const body = {
      includedTypes:  ['hotel', 'lodging'],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 15000,
        },
      },
      rankPreference: 'POPULARITY',
    };

    const res = await fetch(`${GOOGLE_BASE}/places:searchNearby`, {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Goog-Api-Key':   GOOGLE_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.photos',
          'places.location',
          'places.websiteUri',
          'places.businessStatus',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[hotels] Google Nearby Search error:', err.slice(0, 500));
      return [];
    }

    const data   = await res.json();
    const places = (data.places || []).slice(0, 6);
    console.log(`[hotels] ✅ Google found ${places.length} hotels near "${cityName}"`);

    return places.map(p => {
      const photoName = p.photos?.[0]?.name || null;
      const stars     = p.rating ? Math.round(p.rating) : (p.priceLevel || 3);
      return {
        hotelId:       p.id,
        name:          p.displayName?.text || 'Hotel',
        cityName,
        stars:         Math.min(Math.max(stars, 1), 5),
        address:       p.formattedAddress || cityName,
        lat:           p.location?.latitude  || lat,
        lng:           p.location?.longitude || lng,
        image:         photoName ? getPhotoUrl(photoName) : fallbackImage(cityName),
        rating:        p.rating          || null,
        ratingCount:   p.userRatingCount || null,
        priceLevel:    p.priceLevel      || null,
        website:       p.websiteUri      || null,
        price:         null,
        currency:      'USD',
        available:     true,
        isPlaceholder: false, // ✅ FIX: explicitly false for real hotels
      };
    });

  } catch (err) {
    console.error('[hotels] Google Nearby Search error:', err.message);
    return [];
  }
}

export async function searchHotels({
  destinationCity,
  checkInDate,
  checkOutDate,
  adults = 1,
  hotelRatings = [],
}) {
  try {
    console.log(`[hotels] Searching hotels in "${destinationCity}" via Google Places`);

    const coords = await geocodeCity(destinationCity);
    if (!coords) {
      console.warn(`[hotels] Could not geocode "${destinationCity}" — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    const hotels = await searchNearbyHotels(coords.lat, coords.lng, destinationCity, hotelRatings);
    if (!hotels.length) {
      console.warn(`[hotels] No hotels found for "${destinationCity}" — using placeholders`);
      return buildPlaceholders(destinationCity);
    }

    return hotels;
  } catch (err) {
    console.error('[hotelService] Unexpected error:', err.message);
    return buildPlaceholders(destinationCity?.split(',')[0] || 'destination');
  }
}

function buildPlaceholders(cityName, count = 6) {
  const city  = cityName?.split(',')[0] || 'destination';
  const names = [
    `Grand Hotel ${city}`, `${city} Palace Hotel`, `The ${city} Inn`,
    `${city} Boutique Hotel`, `${city} Suites`, `Hotel Centrale ${city}`,
  ];
  return Array.from({ length: count }, (_, i) => ({
    hotelId:       `PLACEHOLDER_${i}`,
    name:          names[i] || `Hotel ${i + 1}`,
    cityName:      city,
    stars:         [3, 4, 5, 4, 3, 5][i] || 3,
    address:       city,
    lat:           null,
    lng:           null,
    image:         fallbackImage(city),
    price:         null,
    currency:      'USD',
    available:     false,
    isPlaceholder: true, // ✅ FIX: clearly marked
  }));
}