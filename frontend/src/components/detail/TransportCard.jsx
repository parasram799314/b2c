// components/detail/TransportCard.jsx
import { useState } from 'react';

const TRANSPORT_ICONS = {
  cab: '🚕',
  metro: '🚇',
  bus: '🚌',
  rental: '🚗',
  train: '🚆',
  ferry: '⛴️',
  tuk_tuk: '🛺',
};

export default function TransportCard({ option, inPlan = false, onAdd }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [fromLoc, setFromLoc] = useState(option.from || '');
  const [toLoc, setToLoc] = useState(option.to || '');
  const [amount, setAmount] = useState(option.price?.replace(/[^\d]/g, '') || 0);

  const icon = TRANSPORT_ICONS[option.id] || '🚗';

  const label =
    typeof option.type === 'string'
      ? option.type.replace(/^[^\s]+\s*/, '')
      : option.id;

  const handleConfirm = (e) => {
    e.stopPropagation();

    if (!pickupDate) {
      alert('Please select a pickup date');
      return;
    }

    if (!pickupTime) {
      alert('Please select a pickup time');
      return;
    }

    onAdd({
      ...option,
      pickupDate,
      pickupTime,
      from: fromLoc,
      to: toLoc,
      price: `₹${amount}`,
    });

    setIsSelecting(false);
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`relative bg-white border rounded-2xl transition-all ${
        isSelecting
          ? 'p-0'                // overlay apna padding lega
          : 'p-4 flex items-start gap-4 min-h-[120px]'
      } ${
        option.recommended
          ? 'border-gold-300 bg-gold-50/30'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      style={isSelecting ? { minHeight: '320px' } : {}}
    >
      {/* ───────── Booking Overlay ───────── */}
      {isSelecting && (
        // ✅ FIX 3: bg-white (solid) — bg-white/97 transparent tha
        <div
          className="absolute inset-0 z-20 flex flex-col p-4 rounded-2xl overflow-hidden"
          style={{ backgroundColor: '#ffffff', minHeight: '320px' }}
        >
          <div className="text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">
            {icon} Book {label}
          </div>

          <div className="text-[10px] text-gray-400 mb-3">
            {option.provider}
          </div>

          <div className="space-y-2.5 flex-1">

            {/* Pickup + Drop */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  📍 Pickup From
                </label>
                <input
                  type="text"
                  placeholder={option.from || 'e.g. Airport'}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={fromLoc}
                  onChange={(e) => setFromLoc(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  🏁 Drop To
                </label>
                <input
                  type="text"
                  placeholder={option.to || 'e.g. Hotel'}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                />
              </div>
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  📅 Pickup Date
                </label>
                <input
                  type="date"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                  🕐 Pickup Time
                </label>
                <input
                  type="time"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                💰 Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Booking Summary */}
            {pickupDate && pickupTime && (
              <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                <div className="text-[10px] text-gray-500 font-semibold mb-1">
                  Booking Summary
                </div>
                <div className="text-[10px] text-gray-700">
                  📅 {formatDateLabel(pickupDate)} · 🕐 {pickupTime}
                </div>
                <div className="text-[10px] text-gray-700 mt-0.5">
                  📍 {fromLoc || option.from} → {toLoc || option.to}
                </div>
                {option.duration && (
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    ⏱ Est. {option.duration}
                  </div>
                )}
                {amount && (
                  <div className="text-[10px] font-bold text-gray-800 mt-0.5">
                    💰 ₹{Number(amount).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSelecting(false);
              }}
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
      )}

      {/* ───────── Main Card Content ───────── */}
      <div className="text-3xl flex-shrink-0 mt-0.5">{icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-bold text-sm text-gray-900">{label}</span>

          {option.recommended && (
            <span className="bg-green-50 text-green-600 text-xs font-semibold border border-green-200 rounded-full px-2 py-0.5">
              Recommended
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 mb-1">{option.provider}</div>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-1 flex-wrap">
          {option.from && option.to && (
            <span>📍 {option.from} → {option.to}</span>
          )}
          {option.duration && <span>⏱ {option.duration}</span>}
          {option.price && (
            <span className="font-semibold text-gray-600">{option.price}</span>
          )}
        </div>

        {option.note && (
          <div className="text-xs text-gray-400 italic">{option.note}</div>
        )}
      </div>

      <button
        onClick={() => !inPlan && setIsSelecting(true)}
        disabled={inPlan}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 self-center ${
          inPlan
            ? 'bg-green-100 text-green-600 border border-green-200 cursor-default'
            : 'bg-white border border-gray-200 hover:bg-gold-500 hover:text-white hover:border-gold-500 text-gold-600'
        }`}
      >
        {inPlan ? '✓' : '+'}
      </button>
    </div>
  );
}