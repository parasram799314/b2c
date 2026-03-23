// ui/cards/HotelCard.jsx
import { useState } from 'react';
import BookingOverlay from '../overlays/BookingOverlay';

const FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

export default function HotelCard({ hotel, inPlan = false, onAdd, onBookNow }) {
  const [open, setOpen]     = useState(false);
  const [values, setValues] = useState({ checkIn: '', nights: 1 });

  if (!hotel) return null;

  const stars      = Math.min(Math.max(Number(hotel.stars) || 3, 1), 5);
  const mapUrl     = hotel.lat && hotel.lng
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`
    : null;
  const nightCount = Number(values.nights) || 1;
  const total      = hotel.price
    ? `${hotel.currency} ${(parseFloat(hotel.price) * nightCount).toLocaleString()}`
    : null;
  const summary    = hotel.price
    ? `🌙 ${nightCount} night${nightCount > 1 ? 's' : ''} × ${hotel.currency} ${parseFloat(hotel.price).toLocaleString()} = ${total}`
    : null;

  const handleConfirm = () => {
    if (!values.checkIn) { alert('Please select a check-in date'); return; }
    onAdd?.({ ...hotel, checkIn: values.checkIn, nights: nightCount });
    setOpen(false);
  };

  const handleBookNowClick = (e) => {
    e.stopPropagation();
    if (!values.checkIn) {
      // open overlay first to collect dates, then book
      setOpen(true);
      return;
    }
    onBookNow?.({ ...hotel, checkIn: values.checkIn, nights: nightCount });
  };

  return (
    <>
      {open && (
        <BookingOverlay
          title="🏨 Plan Your Stay"
          subtitle={hotel.name}
          fields={[
            { key: 'checkIn', label: '📅 Check-in Date', type: 'date' },
            { key: 'nights',  label: '🌙 Total Nights',  type: 'number', min: 1 },
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
        <div className="relative h-28 overflow-hidden bg-amber-50 rounded-t-xl">
          <img
            src={hotel.image || FALLBACK}
            alt={hotel.name || 'Hotel'}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = FALLBACK; }}
          />
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {stars}⭐
          </div>
          {hotel.price && (
            <div className="absolute bottom-2 left-2 bg-white/90 text-gray-900 text-xs font-bold rounded-full px-2.5 py-1 shadow-sm">
              {hotel.currency} {parseFloat(hotel.price).toLocaleString()}
              <span className="text-gray-400 font-normal">/night</span>
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
          <div className="font-bold text-sm text-gray-900 mb-0.5 truncate">{hotel.name}</div>
          <div className="text-xs text-gray-400 truncate mb-1">{hotel.address || hotel.cityName}</div>
          {hotel.rating && (
            <div className="text-xs text-gray-500">
              ⭐ {hotel.rating}
              {hotel.ratingCount ? ` (${Number(hotel.ratingCount).toLocaleString()})` : ''}
            </div>
          )}
          {!hotel.price && <div className="text-xs text-gray-400 mt-1">Price on request</div>}
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