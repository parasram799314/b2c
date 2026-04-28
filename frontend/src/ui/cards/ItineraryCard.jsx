// ui/cards/ItineraryCard.jsx
import { useState, useRef, useEffect } from 'react';
import { Icons } from '../icons';

const DEST_IMAGES = {
  london:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  paris:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  dubai:     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
  tokyo:     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  bali:      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  rome:      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  istanbul:  'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80',
  bangkok:   'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
  default:   'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80',
};

function getImg(rfq) {
  const d = (rfq.destinations?.[0]?.destination || '').toLowerCase();
  for (const k of Object.keys(DEST_IMAGES)) {
    if (d.includes(k)) return DEST_IMAGES[k];
  }
  return DEST_IMAGES.default;
}

function getTitle(rfq) {
  if (rfq.tripName) return rfq.tripName;
  const dest   = rfq.destinations?.map(d => d.destination).filter(Boolean).join(', ') || 'Trip';
  const nights = rfq.destinations?.reduce((s, d) => s + (d.numberOfNights || d.nights || 0), 0) || 0;
  return `${dest} ${nights + 1}-Day Tour`;
}

function getMeta(rfq) {
  const nights = rfq.destinations?.reduce((s, d) => s + (d.numberOfNights || d.nights || 0), 0) || 0;
  const cities = rfq.destinations?.length || 0;
  
  // Departure date prioritize rfq.depDate or first destination date
  // planItems se first aur last date nikalo
const itemDates = (rfq.planItems || [])
  .map(p => p.depDate || p.checkIn || p.pickupDate || p.date || '')
  .filter(Boolean)
  .sort();

const firstItemDate = itemDates[0] || null;
const lastItemDate  = itemDates[itemDates.length - 1] || null;

const dateStr = firstItemDate || rfq.depDate || rfq.destinations?.[0]?.dateOfArrival || rfq.createdAt;
  let displayDate = '—';
  if (dateStr) {
    try {
      displayDate = new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch (e) {
      displayDate = dateStr;
    }
  }

  // Count items by type
  const items = rfq.planItems || [];
  const counts = {
    hotels:      items.filter(p => p.type === 'hotel' && !p._isHotelContinuation).length,
    flights:     items.filter(p => p.type === 'flight').length,
    attractions: items.filter(p => p.type === 'attraction').length,
    transfers:   items.filter(p => (p.type === 'transfer' || p.type === 'transport')).length,
    others:      items.filter(p => (p.type === 'other' || p.type === 'restaurant')).length,
  };

  // Last item date format karo
let lastDate = '';
if (lastItemDate) {
  try {
    lastDate = new Date(lastItemDate).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch (e) { lastDate = lastItemDate; }
}

return { days: nights + 1, nights, cities, date: displayDate, lastDate, counts };
}

// ── Confirm Dialog ──────────────────────────────────────────────────────────
function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 mx-4 w-full max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mx-auto mb-4">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M8 3h6M3 6h16M5 6l1 13h10L17 6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 10v5M13 10v5" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="text-center text-gray-800 font-bold text-base mb-1">Delete Itinerary?</h3>
        <p className="text-center text-gray-400 text-sm mb-5">
          This action cannot be undone. Are you sure you want to delete this trip?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Three-Dot Menu ──────────────────────────────────────────────────────────
function ThreeDotMenu({ onDeleteRequest }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all"
        title="More options"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
          <circle cx="2.5" cy="7.5" r="1.4"/>
          <circle cx="7.5" cy="7.5" r="1.4"/>
          <circle cx="12.5" cy="7.5" r="1.4"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[130px] z-30">
          <button
            onClick={() => { setOpen(false); onDeleteRequest(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M5 2h4M2 4h10M3.5 4l.7 8h5.6l.7-8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Card ───────────────────────────────────────────────────────────────
export default function ItineraryCard({ rfq, onOpen, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const img   = getImg(rfq);
  const title = getTitle(rfq);
  const meta  = getMeta(rfq);
  const dest  = rfq.destinations?.[0]?.destination || 'Unknown';

  const planStatus = rfq.reviewStatus === 'approved'  ? 'approved'
    : rfq.reviewStatus === 'sent'      ? 'pending'
    : rfq.reviewStatus === 'paid'      ? 'paid'
    : rfq.reviewStatus === 'cancelled' ? 'cancelled'
    : rfq.reviewStatus === 'rejected'  ? 'rejected'
    : null;

  const isPersonal = rfq.tripType === 'personal';

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          onConfirm={() => { setShowConfirm(false); onDelete?.(rfq._id); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

<div
  className="relative group cursor-pointer"
  style={{ paddingTop: '5px' }}
  onClick={() => onOpen(rfq)}
>
        {/* ✅ TRIP TYPE TAG (Business vs Personal) */}
        <span style={{ 
          position: 'absolute', 
          top: '-9px', 
          left: '12px',
          zIndex: 10, 
          fontSize: '8px', 
          fontWeight: 900, 
          padding: '2px 10px', 
          borderRadius: '4px', 
          background: isPersonal ? '#dcfce7' : 'rgb(247,190,57)', 
          color: isPersonal ? '#166534' : '#1a1a1a', 
          border: `1.5px solid ${isPersonal ? '#86efac' : '#f59e0b'}`, 
          letterSpacing: '0.08em', 
          textTransform: 'uppercase', 
          boxShadow: `0 2px 6px ${isPersonal ? 'rgba(22,101,52,0.2)' : 'rgba(247,190,57,0.45)'}`, 
          whiteSpace: 'nowrap' 
        }}>
          {isPersonal ? '🏝️ Personal Travel' : '💼 Business Travel'}
        </span>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
          {/* ── Image Section ── */}
          <div className="relative overflow-hidden" style={{ height: '170px' }}>
            <img
              src={img}
              alt={dest}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.src = DEST_IMAGES.default; }}
            />

            {/* ✅ TOP ROW: Only 3-dot (right) */}
            <div className="absolute top-0 left-0 right-0 flex items-start justify-end px-2 pt-2">
              <ThreeDotMenu onDeleteRequest={() => setShowConfirm(true)} />
            </div>

            {/* ✅ BOTTOM ROW: Meta pills (left) + plan status (right) */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-2 pb-2">
              <div className="flex flex-wrap items-center gap-1 max-w-[70%]">
                {/* Nights Pill */}
                <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-2 h-5 leading-none">
                  <Icons.Calendar size={9} className="flex-shrink-0" />
                  {meta.nights} {meta.nights === 1 ? 'nt' : 'nts'}
                </span>
                
                {/* City Pill */}
                <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-2 h-5 leading-none">
                  <Icons.MapPin size={9} className="flex-shrink-0" />
                  {meta.cities} {meta.cities === 1 ? 'city' : 'cities'}
                </span>

                {/* Dynamic Category Pills */}
                {meta.counts.hotels > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-1.5 h-5 leading-none" title="Hotels">
                    <Icons.Hotel size={9} className="flex-shrink-0" />
                    {meta.counts.hotels}
                  </span>
                )}
                {meta.counts.flights > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-1.5 h-5 leading-none" title="Flights">
                    <Icons.Plane size={9} className="flex-shrink-0" />
                    {meta.counts.flights}
                  </span>
                )}
                {meta.counts.attractions > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-1.5 h-5 leading-none" title="Attractions">
                    <Icons.Star size={9} className="flex-shrink-0" />
                    {meta.counts.attractions}
                  </span>
                )}
                {meta.counts.transfers > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-1.5 h-5 leading-none" title="Transfers">
                    <Icons.Car size={9} className="flex-shrink-0" />
                    {meta.counts.transfers}
                  </span>
                )}
                {meta.counts.others > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-900/75 backdrop-blur-sm text-white text-[9px] font-bold rounded-full px-1.5 h-5 leading-none" title="Other items">
                    <Icons.Note size={9} className="flex-shrink-0" />
                    {meta.counts.others}
                  </span>
                )}
              </div>

              {planStatus && (
                <span style={{
                  fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px',
                  background: planStatus === 'approved' ? '#dcfce7' : planStatus === 'paid' ? '#dcfce7' : planStatus === 'cancelled' ? '#fee2e2' : planStatus === 'rejected' ? '#fee2e2' : '#fef3c7',
                  color:      planStatus === 'approved' ? '#166534' : planStatus === 'paid' ? '#16a34a' : planStatus === 'cancelled' ? '#dc2626' : planStatus === 'rejected' ? '#991b1b' : '#92400e',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  textTransform: 'uppercase'
                }}>
                  {planStatus === 'approved' ? '✓ Approved' : planStatus === 'paid' ? '✓ Paid' : planStatus === 'cancelled' ? 'Cancelled' : planStatus === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
              )}
            </div>
          </div>

          {/* ── White Details Section ── */}
          <div className="px-4 py-3">
            {/* Title */}
            <h3 className="text-gray-900 font-bold text-sm leading-tight truncate mb-1">
              {title}
            </h3>

            {/* Route & ID Row */}
            <div className="flex items-center gap-2 mb-3">
              {rfq.rfqId && (
                <span style={{ 
                  background: 'rgb(247, 190, 57)', 
                  color: '#1a1a1a', 
                  fontSize: '9px', 
                  fontWeight: 900, 
                  padding: '2px 6px', 
                  borderRadius: '4px',
                  flexShrink: 0
                }}>
                  {rfq.rfqId}
                </span>
              )}
              <div className="flex items-center gap-1 text-gray-400 text-[11px] truncate">
                <Icons.MapPin size={10} className="flex-shrink-0" />
                <span className="truncate">{rfq.guestCountry || rfq.from || 'India'}</span>
                <span className="mx-0.5 text-gray-300">→</span>
                <span className="truncate font-medium text-gray-500">{rfq.destinations?.map(d => d.destination).filter(Boolean).join(', ') || dest}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gray-100 mb-3" />

            {/* Date + View Plan */}
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
  <Icons.Calendar size={12} />
  {meta.lastDate && meta.date !== meta.lastDate ? (
    <span>{meta.date} → {meta.lastDate}</span>
  ) : (
    <span>{meta.date}</span>
  )}
</div>
              <button
                onClick={e => { e.stopPropagation(); onOpen(rfq); }}
                className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
              >
                View Plan
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
