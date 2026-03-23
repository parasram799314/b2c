// components/detail/RestaurantCard.jsx
import { useState } from 'react';

const FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80';

export default function RestaurantCard({ restaurant, inPlan, onAdd }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');

  if (!restaurant) return null;

  const mapUrl = restaurant.lat && restaurant.lng
    ? 'https://www.google.com/maps/search/?api=1&query=' + restaurant.lat + ',' + restaurant.lng
    : null;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const handleConfirm = (e) => {
    e.stopPropagation();
    if (!visitDate) { alert('Please select a visit date'); return; }
    if (!visitTime) { alert('Please select a visit time'); return; }
    onAdd({ visitDate, visitTime });
    setIsSelecting(false);
  };

  return (
    <div
      className={`relative bg-white border rounded-xl transition-all ${
        inPlan ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gold-200'
      }`}
    >

      {/* ── Booking Overlay — fixed center screen ── */}
      {isSelecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsSelecting(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col p-4">
            <div className="text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
              🍽️ Plan Your Visit
            </div>
            <div className="text-[10px] text-gray-400 mb-3 truncate">{restaurant.name}</div>

            <div className="space-y-2.5">
              {/* Date */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  📅 Visit Date
                </label>
                <input
                  type="date"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
                {visitDate && (
                  <div className="text-[10px] text-gold-600 font-semibold mt-0.5">
                    📅 {formatDateLabel(visitDate)}
                  </div>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  🕐 Visit Time
                </label>
                <input
                  type="time"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                />
              </div>

              {/* Summary */}
              {visitDate && visitTime && (
                <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-[10px] text-gray-600">
                  📅 {formatDateLabel(visitDate)} · 🕐 {visitTime}
                  {restaurant.cuisine && <div className="mt-0.5 text-gray-400">{restaurant.cuisine}</div>}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => { e.stopPropagation(); setIsSelecting(false); }}
                className="flex-1 py-2 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-2 text-[11px] font-bold text-white bg-gold-500 rounded-xl hover:bg-gold-600 transition-colors"
              >
                Add to Plan ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image ── */}
      <div className="relative h-28 overflow-hidden bg-orange-50 rounded-t-xl">
        <img
          src={restaurant.image || FALLBACK}
          alt={restaurant.name || 'Restaurant'}
          className="w-full h-full object-cover"
          onError={function(e) { e.target.src = FALLBACK; }}
        />
        {restaurant.cuisine && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {restaurant.cuisine}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); !inPlan && setIsSelecting(true); }}
          disabled={inPlan}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow transition-all ${
            inPlan ? 'bg-green-500 text-white cursor-default' : 'bg-white text-gold-600 hover:bg-gold-500 hover:text-white'
          }`}
        >
          {inPlan ? '✓' : '+'}
        </button>
      </div>

      {/* ── Info ── */}
      <div className="p-2.5">
        <div className="font-semibold text-xs text-gray-900 truncate mb-0.5">{restaurant.name}</div>
        {restaurant.address && (
          <div className="text-xs text-gray-400 truncate mb-1">{restaurant.address}</div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-1">
          {restaurant.rating && (
            <span className="text-xs text-gray-500">
              {'⭐ ' + restaurant.rating}
              {restaurant.ratingCount ? ' (' + Number(restaurant.ratingCount).toLocaleString() + ')' : ''}
            </span>
          )}
          {restaurant.priceLevel && (
            <span className="text-xs text-gray-400">{'💰'.repeat(Math.min(restaurant.priceLevel, 4))}</span>
          )}
        </div>
        {restaurant.openingHours && (
          <div className="text-xs text-gray-400 mt-0.5 truncate">🕐 {restaurant.openingHours}</div>
        )}
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gold-600 hover:underline mt-1 block">
            📍 View on map
          </a>
        )}
        {restaurant.website && (
          <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
            🌐 Website
          </a>
        )}
      </div>
    </div>
  );
}