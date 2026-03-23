// ui/cards/AttractionCard.jsx
const FALLBACK = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80';

export default function AttractionCard({ attraction, inPlan = false, onAdd }) {
  if (!attraction) return null;

  const mapUrl = attraction.lat && attraction.lng
    ? `https://www.google.com/maps/search/?api=1&query=${attraction.lat},${attraction.lng}`
    : null;

  return (
    <div className={`relative bg-white border rounded-xl transition-all ${
      inPlan ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gold-200'
    }`}>
      {/* Image */}
      <div className="relative h-28 overflow-hidden bg-teal-50 rounded-t-xl">
        <img
          src={attraction.image || FALLBACK}
          alt={attraction.name || 'Attraction'}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = FALLBACK; }}
        />
        {attraction.category && (
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
            {attraction.category}
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); !inPlan && onAdd?.(); }}
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
        <div className="font-semibold text-xs text-gray-900 truncate">{attraction.name}</div>
        {attraction.address && (
          <div className="text-xs text-gray-400 truncate mb-1">{attraction.address}</div>
        )}
        {attraction.rating && (
          <div className="text-xs text-gray-500">
            ⭐ {attraction.rating}
            {attraction.ratingCount ? ` (${Number(attraction.ratingCount).toLocaleString()})` : ''}
          </div>
        )}
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gold-600 hover:underline mt-1 block">
            📍 View on map
          </a>
        )}
      </div>
    </div>
  );
}