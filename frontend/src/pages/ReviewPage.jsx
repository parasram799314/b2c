// pages/ReviewPage.jsx
import { useMemo, useState } from 'react';

function fmtDate(d) {
  if (!d) return '';
  try {
    const dt = new Date(d + 'T00:00:00');
    if (!isNaN(dt)) return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    return d;
  } catch { return d; }
}

function ItemRow({ item, checked, onToggle }) {
  const date = (item.checkIn || item.depDate || item.pickupDate || item.visitDate || item.date || '').slice(0, 10);
  const price = item.price
    ? `${item.currency || ''} ${Number(item.price).toLocaleString()}`
    : '';

  const name =
    item.type === 'flight'
      ? `${item.fromAirport || item.from || '?'} → ${item.toAirport || item.to || '?'}`
      : item.name || item.item_name || 'Item';

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100">
      <input type="checkbox" checked={checked} onChange={onToggle} className="mt-1" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>
        <div className="text-xs text-gray-400 mt-0.5">{fmtDate(date)}</div>
      </div>
      {price && <div className="text-xs font-bold text-amber-700">{price}</div>}
    </div>
  );
}

export default function ReviewPage({ items = [], mode = 'selected', onBack }) {
  const [bookingMode, setBookingMode] = useState(mode); // 'selected' | 'partial'
  const [selectedIds, setSelectedIds] = useState(() => (
    mode === 'selected' ? items.map(i => i.id) : []
  ));

  const grouped = useMemo(() => {
    const g = { flight: [], hotel: [], attraction: [], restaurant: [], transport: [], other: [] };
    (items || []).forEach((it) => {
      const t = it.type || 'other';
      if (!g[t]) g[t] = [];
      g[t].push(it);
    });
    return g;
  }, [items]);

  const setSelectedAll = () => setSelectedIds(items.map(i => i.id));
  const clearSelected = () => setSelectedIds([]);

  const setModeSelected = () => { setBookingMode('selected'); setSelectedAll(); };
  const setModePartial = () => { setBookingMode('partial'); clearSelected(); };

  const toggle = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:border-amber-400">
          ←
        </button>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-900">Trip Review</div>
          <div className="text-xs text-gray-400">Review items before booking</div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setModeSelected}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${
              bookingMode === 'selected'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            Book Selected
          </button>
          <button
            type="button"
            onClick={setModePartial}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${
              bookingMode === 'partial'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600'
            }`}
          >
            Book Partially
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {[
          ['flight', 'Flights'],
          ['hotel', 'Hotels'],
          ['attraction', 'Activities'],
          ['restaurant', 'Restaurants'],
          ['transport', 'Transport'],
        ].map(([type, label]) => {
          const list = grouped[type] || [];
          if (!list.length) return null;
          return (
            <div key={type} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="text-xs font-black text-amber-800 uppercase tracking-wider">{label}</div>
                <div className="text-xs text-amber-700 font-semibold">{list.length}</div>
              </div>
              {list.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  checked={selectedIds.includes(item.id)}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          );
        })}

        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected items</div>
            <div className="text-sm font-black text-gray-900 mt-0.5">{selectedIds.length}</div>
          </div>
          <button
            type="button"
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black"
            onClick={() => alert('Dummy booking flow. Next: payment/confirmation.')}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

