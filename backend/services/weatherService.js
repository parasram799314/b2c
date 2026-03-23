// services/weatherService.js
// OpenWeatherMap API — free tier (1000 calls/day)
// Gets forecast for trip dates + packing suggestions

import dotenv from 'dotenv';
dotenv.config();

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5';
const NOMINATIM = 'https://nominatim.openstreetmap.org';

function getKey() {
  return process.env.OPENWEATHER_API_KEY;
}

// ─── Geocode city using Nominatim (already used in hotelService) ──────────
async function geocodeCity(cityName) {
  try {
    const url = `${NOMINATIM}/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'TripPlannerApp/1.0' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name?.split(',')[0] || cityName,
    };
  } catch (err) {
    console.error('[weather] Geocode error:', err.message);
    return null;
  }
}

// ─── Get packing suggestions based on weather ────────────────────────────
function getPackingSuggestions(forecasts) {
  const suggestions = new Set();
  const temps = forecasts.map(f => f.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const hasRain = forecasts.some(f => f.condition.toLowerCase().includes('rain') || f.condition.toLowerCase().includes('drizzle'));
  const hasSnow = forecasts.some(f => f.condition.toLowerCase().includes('snow'));
  const hasSun = forecasts.some(f => f.condition.toLowerCase().includes('clear') || f.condition.toLowerCase().includes('sunny'));
  const hasCloud = forecasts.some(f => f.condition.toLowerCase().includes('cloud'));

  if (minTemp < 10) suggestions.add('🧥 Heavy jacket / coat');
  else if (minTemp < 18) suggestions.add('🧣 Light jacket or sweater');
  if (maxTemp > 28) suggestions.add('👕 Light/breathable clothes');
  if (hasRain) suggestions.add('☂️ Umbrella or raincoat');
  if (hasSnow) suggestions.add('🧤 Gloves, warm boots, snow gear');
  if (hasSun && maxTemp > 22) suggestions.add('🕶️ Sunglasses & sunscreen (SPF 50+)');
  if (hasSun) suggestions.add('🧴 Sunscreen');
  if (hasCloud && minTemp < 15) suggestions.add('🧤 Light gloves');

  suggestions.add('👟 Comfortable walking shoes');
  suggestions.add('💊 Basic medicines & first aid');
  suggestions.add('📱 Power bank');

  return [...suggestions].slice(0, 8);
}

// ─── Get weather icon emoji ───────────────────────────────────────────────
function getWeatherEmoji(condition = '') {
  const c = condition.toLowerCase();
  if (c.includes('thunder')) return '⛈️';
  if (c.includes('snow')) return '❄️';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧️';
  if (c.includes('cloud')) return '☁️';
  if (c.includes('mist') || c.includes('fog') || c.includes('haze')) return '🌫️';
  if (c.includes('clear') || c.includes('sunny')) return '☀️';
  return '🌤️';
}

// ─── Get day name from date string ───────────────────────────────────────
function getDayName(dateStr) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

// ─── Format date for display ─────────────────────────────────────────────
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

// ─── Main: Get weather forecast for trip dates ───────────────────────────
export async function getWeatherForecast({ destinationCity, checkInDate, numberOfNights = 3 }) {
  try {
    const WEATHER_KEY = getKey();
    if (!WEATHER_KEY) {
      console.warn('[weather] OPENWEATHER_API_KEY not set — returning placeholders');
      return buildPlaceholders(destinationCity, checkInDate, numberOfNights);
    }

    console.log(`[weather] Fetching forecast for "${destinationCity}" from ${checkInDate}`);

    // Step 1: Geocode city
    const coords = await geocodeCity(destinationCity);
    if (!coords) {
      console.warn(`[weather] Could not geocode "${destinationCity}"`);
      return buildPlaceholders(destinationCity, checkInDate, numberOfNights);
    }

    // Step 2: Fetch 5-day forecast (free tier gives 5 days / 3hr intervals)
    const url = `${OPENWEATHER_BASE}/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_KEY}&units=metric&cnt=40`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.text();
      console.warn('[weather] API error:', err.slice(0, 200));
      return buildPlaceholders(destinationCity, checkInDate, numberOfNights);
    }

    const data = await res.json();
    const list = data.list || [];

    if (!list.length) {
      return buildPlaceholders(destinationCity, checkInDate, numberOfNights);
    }

    // Step 3: Group by date and pick midday reading
    const byDate = {};
    list.forEach(item => {
      const date = item.dt_txt.slice(0, 10);
      const hour = parseInt(item.dt_txt.slice(11, 13));
      // Prefer 12:00 reading (midday), otherwise take any
      if (!byDate[date] || Math.abs(hour - 12) < Math.abs(parseInt(byDate[date].dt_txt?.slice(11, 13) || '0') - 12)) {
        byDate[date] = item;
      }
    });

    // Step 4: Build forecast for trip dates
    const tripDates = [];
    const startDate = new Date(checkInDate + 'T00:00:00');
    for (let i = 0; i <= numberOfNights; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      tripDates.push(d.toISOString().slice(0, 10));
    }

    const forecasts = tripDates.map((date, idx) => {
      const item = byDate[date];
      if (item) {
        const condition = item.weather?.[0]?.description || 'Clear';
        const temp = Math.round(item.main?.temp || 20);
        const tempMin = Math.round(item.main?.temp_min || temp - 3);
        const tempMax = Math.round(item.main?.temp_max || temp + 3);
        const humidity = item.main?.humidity || 60;
        const windSpeed = Math.round((item.wind?.speed || 0) * 3.6); // m/s to km/h
        return {
          date,
          dayName: getDayName(date),
          displayDate: formatDisplayDate(date),
          dayLabel: idx === 0 ? 'Arrival' : idx === numberOfNights ? 'Departure' : `Day ${idx + 1}`,
          condition: condition.charAt(0).toUpperCase() + condition.slice(1),
          emoji: getWeatherEmoji(condition),
          temp,
          tempMin,
          tempMax,
          humidity,
          windSpeed,
          isReal: true,
        };
      } else {
        // Date not in forecast range — use placeholder
        return buildSinglePlaceholder(date, idx, numberOfNights);
      }
    });

    const packingSuggestions = getPackingSuggestions(forecasts);

    console.log(`[weather] ✅ Got ${forecasts.length} day forecast for "${destinationCity}"`);

    return {
      city: coords.name || destinationCity,
      forecasts,
      packingSuggestions,
      summary: buildSummary(forecasts),
    };

  } catch (err) {
    console.error('[weatherService] Unexpected error:', err.message);
    return buildPlaceholders(destinationCity, checkInDate, numberOfNights);
  }
}

// ─── Build summary string ─────────────────────────────────────────────────
function buildSummary(forecasts) {
  if (!forecasts.length) return '';
  const temps = forecasts.map(f => f.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const hasRain = forecasts.some(f => f.condition.toLowerCase().includes('rain'));
  const hasSun = forecasts.some(f => f.condition.toLowerCase().includes('clear') || f.emoji === '☀️');

  let summary = `${min}°C – ${max}°C during your trip. `;
  if (hasRain && hasSun) summary += 'Expect mixed weather with some rain.';
  else if (hasRain) summary += 'Carry an umbrella — rainy days expected.';
  else if (hasSun) summary += 'Mostly sunny — great weather!';
  else summary += 'Mild conditions expected.';
  return summary;
}

// ─── Placeholder builder ──────────────────────────────────────────────────
function buildSinglePlaceholder(date, idx, totalNights) {
  const conditions = ['Partly Cloudy', 'Sunny', 'Cloudy', 'Light Rain', 'Clear'];
  const condition = conditions[idx % conditions.length];
  return {
    date,
    dayName: getDayName(date),
    displayDate: formatDisplayDate(date),
    dayLabel: idx === 0 ? 'Arrival' : idx === totalNights ? 'Departure' : `Day ${idx + 1}`,
    condition,
    emoji: getWeatherEmoji(condition),
    temp: 18 + (idx % 5),
    tempMin: 14 + (idx % 4),
    tempMax: 22 + (idx % 5),
    humidity: 65,
    windSpeed: 15,
    isReal: false,
  };
}

function buildPlaceholders(destinationCity, checkInDate, numberOfNights) {
  const tripDates = [];
  const startDate = new Date(checkInDate + 'T00:00:00');
  for (let i = 0; i <= numberOfNights; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    tripDates.push(d.toISOString().slice(0, 10));
  }

  const forecasts = tripDates.map((date, idx) => buildSinglePlaceholder(date, idx, numberOfNights));
  const packingSuggestions = getPackingSuggestions(forecasts);

  return {
    city: destinationCity,
    forecasts,
    packingSuggestions,
    summary: 'Weather data unavailable — showing estimates.',
    isPlaceholder: true,
  };
}