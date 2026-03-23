// ui/cards/RestaurantCard.jsx
import { useState } from 'react';
import BookingOverlay from '../overlays/BookingOverlay';

const FALLBACK = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80';

export default function RestaurantCard({ restaurant, inPlan = false, onAdd, onBookNow }) {
  const [open, setOpen]     = useState(false);
  const [values, setValues] = useState({ visitDate: '', visitTime: '' });

  if (!restaurant) return null;

  const mapUrl = restaurant.lat && restaurant.lng
    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`
    : null;

  const summary = values.visitDate && values.visitTime
    ? `📅 ${values.visitDate} · 🕐 ${values.visitTime}${restaurant.cuisine ? `\n${restaurant.cuisine}` : ''}`
    : null;

  const handleConfirm = () => {
    if (!values.visitDate) { alert('Please select a visit date'); return; }
    if (!values.visitTime) { alert('Please select a visit time'); return; }
    onAdd?.({ ...restaurant, visitDate: values.visitDate, visitTime: values.visitTime });
    setOpen(false);
  };

  const handleBookNowClick = (e) => {
    e.stopPropagation();
    if (!values.visitDate || !values.visitTime) {
      setOpen(true);
      return;
    }
    onBookNow?.({ ...restaurant, visitDate: values.visitDate, visitTime: values.visitTime });
  };

  return (
    <>
      {open && (
        <BookingOverlay
          title="🍽️ Plan Your Visit"
          subtitle={restaurant.name}
          fields={[
            { key: 'visitDate', label: '📅 Visit Date', type: 'date' },
            { key: 'visitTime', label: '🕐 Visit Time', type: 'time' },
          ]}
          values={values}
          onChange={(key, val) => setValues(p => ({ ...p, [key]: val }))}
          summary={summary}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}

      <div className={`relative bg-white border rounded-xl transition-all ${
        inPlan ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gold-200'
      }`}>
        {/* Image */}
        <div className="relative h-28 overflow-hidden bg-orange-50 rounded-t-xl">
          <img
            src={restaurant.image || FALLBACK}
            alt={restaurant.name || 'Restaurant'}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = FALLBACK; }}
          />
          {restaurant.cuisine && (
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
              {restaurant.cuisine}
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); !inPlan && setOpen(true); }}
            disabled={inPlan}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow transition-all ${
              inPlan ? 'bg-green-500 text-white cursor-default' : 'bg-white text-gold-600 hover:bg-gold-500 hover:text-white'
            }`}
          >
            {inPlan ? '✓' : '+'}
          </button>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <div className="font-semibold text-xs text-gray-900 truncate mb-0.5">{restaurant.name}</div>
          {restaurant.address && <div className="text-xs text-gray-400 truncate mb-1">{restaurant.address}</div>}
          <div className="flex items-center justify-between flex-wrap gap-1">
            {restaurant.rating && (
              <span className="text-xs text-gray-500">
                ⭐ {restaurant.rating}
                {restaurant.ratingCount ? ` (${Number(restaurant.ratingCount).toLocaleString()})` : ''}
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
          {/* Book Now button */}
          {onBookNow && !inPlan && (
            <button
              onClick={handleBookNowClick}
              className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold bg-gold-500 text-white hover:bg-gold-600 transition-colors"
            >
              Book Now
            </button>
          )}
        </div>
      </div>
    </>
  );
}