// components/detail/DayTab.jsx
import { parseAttractions } from '../../utils/itineraryHelpers';
import AttractionCard from './AttractionCard';

const WALKING = [
  '9 minutes · 659m',
  '8 minutes · 541m',
  '12 minutes · 890m',
  '6 minutes · 420m',
  '15 minutes · 1.1km',
];

const ADD_BTNS = [
  '+ Find a place to stay tonight',
  '+ Places',
  '+ Transportation',
  '+ Custom activities',
];

// ─── Fuzzy destination match ──────────────────────────────────────────────
function findDestData(destinationData = [], destName = '') {
  if (!destName || !destinationData.length) return {};
  const needle = destName.toLowerCase().trim();

  return (
    destinationData.find(d => d.destination?.toLowerCase().trim() === needle) ||
    destinationData.find(d => {
      const hay = d.destination?.toLowerCase().trim() || '';
      return hay.includes(needle) || needle.includes(hay);
    }) ||
    destinationData.find(d => {
      const hay      = d.destination?.toLowerCase().trim() || '';
      const firstWord = needle.split(/[\s,]+/)[0];
      return hay.startsWith(firstWord) || firstWord.startsWith(hay.split(/[\s,]+/)[0]);
    }) ||
    destinationData[0] ||
    {}
  );
}

// ─── Flight Card ──────────────────────────────────────────────────────────
function FlightCard({ flight, recommended }) {
  return (
    <div className={`border rounded-2xl p-3.5 min-w-[240px] flex-shrink-0 bg-white ${
      recommended ? 'border-gold-300' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{flight.depTime}</span>
          <span className="text-gray-300 text-xs">──</span>
          <span className="text-xs text-gray-400">{flight.duration}</span>
          <span className="text-gray-300 text-xs">──▶</span>
          <span className="text-lg font-bold text-gray-900">
            {flight.arrTime}
            {flight.nextDay && <sup className="text-xs text-gold-500 ml-0.5">+1</sup>}
          </span>
        </div>
        <button className="w-6 h-6 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:border-gold-400 text-sm ml-2 flex-shrink-0">+</button>
      </div>

      <div className="text-xs text-gold-600 font-semibold truncate mb-1">{flight.fromAirport}</div>

      <div className="text-xs text-gray-400">
        {flight.stops === 0
          ? '✈ Direct'
          : `✈ ${flight.stops} stop${flight.stops > 1 ? 's' : ''}${flight.stopCodes ? ` · Transfer in ${flight.stopCodes}` : ''}`}
      </div>

      {recommended && (
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-green-50 text-green-600 text-xs font-semibold rounded-full px-2 py-0.5">Recommended</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">{flight.airline}</span>
        </div>
      )}

      {flight.price && (
        <div className="mt-2 text-xs font-bold text-gray-800">
          {flight.currency} {parseFloat(flight.price).toLocaleString()}
        </div>
      )}
    </div>
  );
}

// ─── Hotel Card — horizontal card matching flight style ───────────────────
function HotelCard({ hotel }) {
  const stars = Math.min(Math.max(Number(hotel.stars) || 3, 1), 5);

  return (
    <div className="border border-gray-200 rounded-2xl min-w-[240px] flex-shrink-0 bg-white overflow-hidden">
      {/* Image */}
      <div className="relative h-32 bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
          }}
        />
        {/* Stars badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5 flex items-center gap-0.5">
          {stars}⭐
        </div>
        {/* Price badge */}
        {hotel.price && (
          <div className="absolute bottom-2 left-2 bg-white/90 text-gray-900 text-xs font-bold rounded-full px-2.5 py-1 shadow-sm">
            {hotel.currency} {parseFloat(hotel.price).toLocaleString()}
            <span className="text-gray-400 font-normal">/night</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="font-bold text-sm text-gray-900 mb-0.5 truncate">{hotel.name}</div>
        <div className="text-xs text-gray-400 truncate mb-2">{hotel.address || hotel.cityName}</div>

        {!hotel.price && (
          <div className="text-xs text-gray-400 mb-2">Price on request</div>
        )}

        <div className="flex items-center gap-2">
          {hotel.lat && hotel.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gold-600 hover:underline flex items-center gap-0.5"
            >
              📍 Map
            </a>
          )}
          <button className="flex-1 bg-gold-500 text-white text-xs font-semibold rounded-full py-1.5 hover:bg-gold-600 transition-colors">
            View Hotel
          </button>
          <button className="w-7 h-7 border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:border-gold-400 text-sm flex-shrink-0">
            +
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main DayTab ──────────────────────────────────────────────────────────
export default function DayTab({
  day,
  dayNum,
  destName,
  requireHotels,
  hotelRatings,
  destinationData = [],
}) {
  if (!day) return (
    <div className="p-5 text-sm text-gray-400">No content for this day.</div>
  );

  const attractions = parseAttractions(day.content);
  const isFirstDay  = dayNum === 1;

  const destData = findDestData(destinationData, destName);
  const flights  = destData.flights || [];
  const hotels   = destData.hotels  || [];

  return (
    <div className="p-4">

      {/* Day heading */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-bold text-base text-gray-900 mb-0.5">
            {day.title?.replace(/^#+\s*/, '')}
          </div>
          <button className="text-xs text-gray-400 hover:text-gray-600">+ Add notes</button>
        </div>
        <button className="text-gray-400 text-sm">···</button>
      </div>

      {/* HOW TO GET THERE — Day 1 only */}
      {isFirstDay && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-600 text-sm">✈️</span>
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">
                How to get to {destName}?
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Convenient transportation options. Schedules may vary.{' '}
                <span className="text-gold-600 cursor-pointer hover:underline">Select a departure date.</span>
              </div>
            </div>
          </div>

          <button className="border border-gray-200 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3 hover:border-gray-300">
            📍 Nearby options
          </button>

          {/* Flights — horizontal scroll */}
          {flights.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {flights.map((flight, i) => (
                <FlightCard key={i} flight={flight} recommended={i === 0} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 mb-2">
              ✈ Flight data unavailable. Please search manually or add a departure date.
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {ADD_BTNS.map(a => (
              <button key={a}
                className="text-gold-600 font-semibold text-xs border border-gold-200 rounded-full px-3 py-1.5 hover:bg-gold-50 transition-colors">
                {a}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ATTRACTIONS */}
      {attractions.map((item, i) => (
        <AttractionCard
          key={i}
          num={i + 1}
          name={item.name}
          details={item.notes || item.details}
          walking={i < WALKING.length ? WALKING[i] : null}
        />
      ))}

      {/* HOTELS — horizontal scroll matching flight style */}
      {requireHotels && (
        <div className="mt-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gold-600 text-sm">🛏️</span>
            </div>
            <div>
              <div className="font-bold text-sm text-gray-900">
                Where to stay in {destName}?
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Best available options near your destination.
              </div>
            </div>
          </div>

          {/* Rating filter chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {(hotelRatings?.length > 0 ? hotelRatings : [3, 4, 5]).map(star => (
              <span key={star}
                className="bg-gold-50 text-gold-700 border border-gold-200 rounded-full px-3 py-1 text-xs font-semibold">
                {star}⭐ Hotels
              </span>
            ))}
          </div>

          {/* Hotels — horizontal scroll same as flights */}
          {hotels.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {hotels.map((hotel, i) => (
                <HotelCard key={i} hotel={hotel} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3">
              🏨 Hotel data unavailable. Please search manually.
            </div>
          )}
        </div>
      )}

      {/* HOW TO RETURN */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-gold-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-gold-600 text-sm">🚌</span>
          </div>
          <div className="font-bold text-sm text-gray-900">
            How to return from {destName}?
          </div>
        </div>
        <button className="text-gold-600 font-semibold text-xs border border-gold-200 rounded-full px-3 py-1.5 hover:bg-gold-50 mb-3">
          + Transportation
        </button>
        <div className="flex flex-wrap gap-2">
          {ADD_BTNS.map(a => (
            <button key={a}
              className="text-gold-600 font-semibold text-xs border border-gold-200 rounded-full px-3 py-1.5 hover:bg-gold-50 transition-colors">
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}