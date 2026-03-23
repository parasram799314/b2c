// ui/overlays/BookingOverlay.jsx
// ─────────────────────────────────────────────────────────────────────────
// Shared booking/planning overlay used by HotelCard, RestaurantCard,
// TransportCard. Each card passes its own fields via the `fields` prop.
//
// Usage:
//   <BookingOverlay
//     title="🏨 Plan Your Stay"
//     subtitle={hotel.name}
//     fields={[
//       { key: 'checkIn', label: 'Check-in Date', type: 'date' },
//       { key: 'nights',  label: 'Total Nights',  type: 'number', min: 1 },
//     ]}
//     values={{ checkIn: '', nights: 1 }}
//     onChange={(key, val) => ...}
//     summary="3 nights × ₹4,500 = ₹13,500"
//     onConfirm={() => ...}
//     onCancel={() => ...}
//   />
// ─────────────────────────────────────────────────────────────────────────
import { ModalWrapper } from './ModalWrapper';

export default function BookingOverlay({
  title,
  subtitle,
  fields = [],
  values = {},
  onChange,
  summary,
  onConfirm,
  onCancel,
}) {
  return (
    <ModalWrapper onClose={onCancel}>
      <div className="flex flex-col p-4 gap-3">
        {/* Header */}
        <div>
          <div className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">{title}</div>
          {subtitle && <div className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</div>}
        </div>

        {/* Dynamic fields */}
        <div className="space-y-2.5">
          {fields.map(field => (
            <div key={field.key}>
              <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                {field.label}
              </label>

              {field.type === 'date' && (
                <>
                  <input
                    type="date"
                    className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                    value={values[field.key] || ''}
                    onChange={e => onChange(field.key, e.target.value)}
                  />
                  {values[field.key] && (
                    <div className="text-[10px] text-gold-600 font-semibold mt-0.5">
                      📅 {formatDate(values[field.key])}
                    </div>
                  )}
                </>
              )}

              {field.type === 'time' && (
                <input
                  type="time"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={values[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  min={field.min ?? 1}
                  max={field.max ?? 99}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={values[field.key] ?? 1}
                  onChange={e => onChange(field.key, e.target.value)}
                />
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder || ''}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  value={values[field.key] || ''}
                  onChange={e => onChange(field.key, e.target.value)}
                />
              )}

              {/* Grid fields side by side */}
              {field.type === 'grid' && (
                <div className={`grid grid-cols-${field.cols || 2} gap-2`}>
                  {field.children?.map(child => (
                    <div key={child.key}>
                      <label className="text-[10px] text-gray-400 block mb-1 font-semibold uppercase tracking-wider">
                        {child.label}
                      </label>
                      <input
                        type={child.type || 'text'}
                        placeholder={child.placeholder || ''}
                        className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400"
                        value={values[child.key] || ''}
                        onChange={e => onChange(child.key, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary strip */}
        {summary && (
          <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-[10px] text-gray-700 leading-relaxed">
            {summary}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-[2] py-2 text-[11px] font-bold text-white bg-gold-500 rounded-xl hover:bg-gold-600 transition-colors"
          >
            Add to Plan ✓
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}

// Helper
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}