// ui/cards/ItineraryCard.jsx

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
  const dest   = rfq.destinations?.map(d => d.destination).filter(Boolean).join(', ') || 'Trip';
  const nights = rfq.destinations?.reduce((s, d) => s + (d.numberOfNights || 0), 0) || 1;
  
  // Handle both RFQ- and trip_ formats
  let displayId = '';
  if (rfq._id) {
    if (rfq._id.startsWith('RFQ-')) {
      displayId = rfq._id;
    } else if (rfq._id.startsWith('trip_')) {
      // Convert trip_ to RFQ format for display
      const timestamp = rfq._id.replace('trip_', '');
      displayId = 'RFQ-' + timestamp.toString(36).toUpperCase().slice(-6);
    } else {
      displayId = rfq._id;
    }
  }
  
  return `${displayId ? `${displayId} · ` : ''}${dest} ${nights + 1}-Day Tour`;
}

function getMeta(rfq) {
  const nights = rfq.destinations?.reduce((s, d) => s + (d.numberOfNights || 0), 0) || 1;
  const cities = rfq.destinations?.length || 1;
  const date   = new Date(rfq.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  return { days: nights + 1, cities, date };
}

export default function ItineraryCard({ rfq, onOpen, onDelete }) {
  const img   = getImg(rfq);
  const title = getTitle(rfq);
  const meta  = getMeta(rfq);
  const dest  = rfq.destinations?.[0]?.destination || 'Unknown';

  const stats = rfq.checklistStats;
  const progressPct = stats?.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Read plan status from localStorage
  let planStatus = null;
  try {
    const saved = JSON.parse(localStorage.getItem('plan_' + rfq._id) || '[]');
    if (saved.length) {
      const hasPaid      = saved.some(p => p.status === 'paid');
      const hasPending   = saved.some(p => p.status === 'pending');
      const hasCancelled = saved.some(p => p.status === 'cancelled');
      
      // Priority: cancelled > pending > paid
      if (hasCancelled)                         planStatus = 'cancelled';
      else if (hasPending)                      planStatus = 'pending';
      else if (hasPaid)                         planStatus = 'paid';
    }
  } catch {}

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onOpen(rfq)}
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={img}
          alt={dest}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = DEST_IMAGES.default; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {rfq.travelType && (
          <div className="absolute top-2 left-2 bg-gold-500/90 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
            {rfq.travelType}
          </div>
        )}

        {/* Plan status badge */}
        {planStatus && (
          <div className="absolute top-2 right-9" style={{
            fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
            background: planStatus === 'paid' ? '#dcfce7' : planStatus === 'cancelled' ? '#fee2e2' : '#fef3c7',
            color:      planStatus === 'paid' ? '#16a34a' : planStatus === 'cancelled' ? '#dc2626' : '#92400e',
          }}>
            {planStatus === 'paid' ? '✓ Paid' : planStatus === 'cancelled' ? 'Cancelled' : 'Pending'}
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); onDelete?.(rfq._id); }}
          className="absolute top-2 right-2 w-6 h-6 bg-black/40 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs transition-colors opacity-0 group-hover:opacity-100"
        >
          ✕
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="text-white font-bold text-sm leading-tight truncate">{title}</div>
          <div className="text-white/70 text-xs mt-0.5">
            {rfq.guestCountry || 'India'} → {rfq.destinations?.map(d => d.destination).filter(Boolean).join(', ') || dest}
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>📅</span>
            <span className="font-semibold">{meta.days} days</span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>🏙️</span>
            <span className="font-semibold">
              {meta.cities} {meta.cities === 1 ? 'city' : 'cities'}
            </span>
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>🏨</span>
            <span className="font-semibold">
              {rfq.requireHotels ? 'Hotels' : 'No hotel'}
            </span>
          </div>
        </div>

        {stats?.total > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">Checklist</span>
              <span className="text-xs font-semibold text-gray-600">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-gold-500 rounded-full transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{meta.date}</span>
          <button
            onClick={e => { e.stopPropagation(); onOpen(rfq); }}
            className="text-xs font-semibold text-gold-600 hover:text-gold-700 flex items-center gap-1"
          >
            View Plan
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}