// ui/cards/TransportCard.jsx
import { useState } from 'react';
import BookingOverlay from '../overlays/BookingOverlay';

const TRANSPORT_ICONS = {
  cab: '🚕', metro: '🚇', bus: '🚌',
  rental: '🚗', train: '🚆', ferry: '⛴️', tuk_tuk: '🛺',
};

export default function TransportCard({ option, inPlan = false, onAdd }) {
  const [open, setOpen]     = useState(false);
  const [values, setValues] = useState({
    from:       option.from || '',
    to:         option.to   || '',
    pickupDate: '',
    pickupTime: '',
  });

  const icon  = TRANSPORT_ICONS[option.id] || '🚗';
  const label = typeof option.type === 'string'
    ? option.type.replace(/^[^\s]+\s*/, '')
    : option.id;

  const summary = values.pickupDate && values.pickupTime
    ? `📅 ${values.pickupDate} · 🕐 ${values.pickupTime}\n📍 ${values.from || option.from} → ${values.to || option.to}${option.duration ? `\n⏱ Est. ${option.duration}` : ''}${option.price ? `\n${option.price}` : ''}`
    : null;

  const handleConfirm = () => {
    if (!values.pickupDate) { alert('Please select a pickup date'); return; }
    if (!values.pickupTime) { alert('Please select a pickup time'); return; }
    onAdd?.({ ...option, ...values });
    setOpen(false);
  };

  return (
    <>
      {open && (
        <BookingOverlay
          title={`${icon} Book ${label}`}
          subtitle={option.provider}
          fields={[
            {
              key: 'locations', type: 'grid', cols: 2,
              children: [
                { key: 'from', label: '📍 Pickup From', type: 'text', placeholder: option.from || 'e.g. Airport' },
                { key: 'to',   label: '🏁 Drop To',     type: 'text', placeholder: option.to   || 'e.g. Hotel'  },
              ],
            },
            {
              key: 'datetime', type: 'grid', cols: 2,
              children: [
                { key: 'pickupDate', label: '📅 Pickup Date', type: 'date' },
                { key: 'pickupTime', label: '🕐 Pickup Time', type: 'time' },
              ],
            },
          ]}
          values={values}
          onChange={(key, val) => setValues(p => ({ ...p, [key]: val }))}
          summary={summary}
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      )}

      <div className={`bg-white border rounded-2xl p-4 flex items-start gap-4 min-h-[120px] transition-all ${
        option.recommended ? 'border-gold-300 bg-gold-50/30' : 'border-gray-200 hover:border-gray-300'
      }`}>
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
          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
            {option.from && option.to && <span>📍 {option.from} → {option.to}</span>}
            {option.duration && <span>⏱ {option.duration}</span>}
            {option.price && <span className="font-semibold text-gray-600">{option.price}</span>}
          </div>
          {option.note && <div className="text-xs text-gray-400 italic mt-1">{option.note}</div>}
        </div>

        <button
          onClick={() => !inPlan && setOpen(true)}
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
    </>
  );
}