// components/detail/HotelCard.jsx
import { useState } from 'react';

const FALLBACK_HOTEL = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

export default function HotelCard({ hotel, inPlan = false, onAdd }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [checkIn, setCheckIn]         = useState('');
  const [nights, setNights]           = useState(1);
  const [amount, setAmount]           = useState(Math.round((hotel.price || 0) * 83));

  if (!hotel) return null;

  const stars      = Math.min(Math.max(Number(hotel.stars) || 3, 1), 5);
  const hotelMapUrl = hotel.lat && hotel.lng
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.lat},${hotel.lng}`
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
    if (!checkIn) { alert('Please select a check-in date'); return; }
    onAdd({ ...hotel, checkIn, nights: Number(nights), price: Number(amount) });
    setIsSelecting(false);
  };

  return (
    <div className={`relative bg-white border rounded-xl transition-all ${
      inPlan ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gold-200'
    }`} style={isSelecting ? { minHeight: '280px' } : {}}>

      {/* Date Selection Overlay */}
      {isSelecting && (
        <div className="absolute inset-0 z-20 flex flex-col p-3 bg-white rounded-xl">
          <div className="text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">🏨 Plan Your Stay</div>
          <div className="text-[10px] text-gray-400 mb-2 truncate">{hotel.name}</div>

          <div className="space-y-2 flex-1">
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase tracking-wider">Check-in Date</label>
              <input type="date"
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)} />
              {checkIn && (
                <div className="text-[10px] text-gold-600 font-semibold mt-0.5">
                  📅 {formatDateLabel(checkIn)}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase tracking-wider">Total Nights</label>
              <input type="number" min="1"
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                value={nights}
                onChange={(e) => setNights(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase tracking-wider">Amount (₹/night)</label>
              <input type="number" min="0"
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)} />
            </div>
            {amount && (
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-100 text-[10px] text-gray-600">
                🌙 {nights} night{nights > 1 ? 's' : ''} ×{' '}
                <span className="font-bold">₹{parseFloat(amount).toLocaleString('en-IN')}</span>
                {' '}={' '}
                <span className="font-bold text-gray-800">
                  ₹{(parseFloat(amount) * Number(nights)).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setIsSelecting(false); }}
              className="flex-1 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-[2] py-1.5 text-[11px] font-bold text-white bg-gold-500 rounded-xl hover:bg-gold-600 transition-colors">
              Add to Plan ✓
            </button>
          </div>
        </div>
      )}

      {/* Card Image */}
      <div className="relative h-28 overflow-hidden bg-amber-50 rounded-t-xl">
        <img
          src={hotel.image || FALLBACK_HOTEL}
          alt={hotel.name || 'Hotel'}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.src = FALLBACK_HOTEL; }} // ✅ FIX: fallback on error
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
          {stars}⭐
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); !inPlan && setIsSelecting(true); }}
          disabled={inPlan}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow transition-all ${
            inPlan ? 'bg-green-500 text-white cursor-default' : 'bg-white text-gold-600 hover:bg-gold-500 hover:text-white'
          }`}>
          {inPlan ? '✓' : '+'}
        </button>
        {hotel.isPlaceholder && (
          <div className="absolute bottom-2 left-2 bg-yellow-400/90 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
            Suggested
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="p-2.5">
        <div className="font-semibold text-xs text-gray-900 truncate">{hotel.name || 'Hotel'}</div>
        <div className="text-xs text-gray-400 truncate mb-1">{hotel.address || hotel.cityName}</div>
        {hotel.rating && (
          <div className="text-xs text-gray-500">
            ⭐ {hotel.rating}
            {hotel.ratingCount ? ` (${Number(hotel.ratingCount).toLocaleString()})` : ''}
          </div>
        )}
        {hotel.price ? (
          <div className="text-xs font-bold text-gray-800 mt-1">
            ₹{Math.round(parseFloat(hotel.price) * 83).toLocaleString('en-IN')}/night
          </div>
        ) : (
          <div className="text-xs text-gray-400 mt-1">Price on request</div>
        )}
        {hotelMapUrl && ( // ✅ FIX: map link
          <a href={hotelMapUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gold-600 hover:underline mt-1 block">
            📍 View on map
          </a>
        )}
      </div>
    </div>
  );
}