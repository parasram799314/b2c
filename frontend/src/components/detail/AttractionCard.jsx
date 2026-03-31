// components/detail/AttractionCard.jsx
import { useState } from 'react';
const FALLBACK = 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80';

export default function AttractionCard({ attraction, inPlan, onAdd }) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [amount, setAmount] = useState(0);
   const [date, setDate] = useState('');
  const [time, setTime] = useState('');


  // ✅ FIX 1: Null guard — agar attraction undefined ho toh crash nahi hoga
  if (!attraction) return null;

  const mapUrl = attraction.lat && attraction.lng
    ? 'https://www.google.com/maps/search/?api=1&query=' + attraction.lat + ',' + attraction.lng
    : null;

  const handleAdd = () => {
  onAdd({ ...attraction, type: 'attraction', entryFee: `₹${amount}` , price: Number(amount),     // amount ko 'price' naam se bhejein
      date: date,          // Itinerary resolvedDate ke liye
      startTime: time,     // Itinerary 🕒 display ke liye
      id: `attraction_${attraction.attractionId || Date.now()}_${date}`
  
  });
  setIsSelecting(false);
};

  return (
 <div 
  draggable="true"
  onDragStart={(e) => {
    e.dataTransfer.setData("itemData", JSON.stringify({ ...attraction, type: 'attraction' }));
    e.dataTransfer.effectAllowed = "copy";
  }}
 
 
 className={`relative bg-white border rounded-xl overflow-hidden transition-all ${
  inPlan ? 'border-green-300 bg-green-50' : 'border-gray-100 hover:border-gold-200'
}`} style={isSelecting ? { minHeight: '200px' } : {}}>

    
       {isSelecting && (
      <div className="absolute inset-0 z-20 flex flex-col p-3 bg-white rounded-xl overflow-y-auto">
        <div className="text-[11px] font-bold text-gray-700 mb-1 uppercase tracking-wider">🎫 Attraction Details</div>
        
        <div className="space-y-2 flex-1">
          {/* Amount Field */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase">Spend Amount (₹)</label>
            <input type="number" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5"
              value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>

          {/* Date Field */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase">Visit Date</label>
            <input type="date" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5"
              value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {/* Time Field */}
          <div>
            <label className="text-[10px] text-gray-400 block mb-0.5 font-semibold uppercase">Visit Time</label>
            <input type="time" className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5"
              value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button onClick={() => setIsSelecting(false)} className="flex-1 py-1.5 text-[11px] font-bold text-gray-500 bg-gray-100 rounded-xl">Cancel</button>
          <button onClick={handleAdd} className="flex-[2] py-1.5 text-[11px] font-bold text-white bg-amber-500 rounded-xl">Add to Plan ✓</button>
        </div>
      </div>
    )}

      {/* Image */}
      <div className="relative h-28 overflow-hidden bg-amber-50">
        <img
          // ✅ FIX 2: fallback image agar attraction.image undefined ho
          src={attraction.image || FALLBACK}
          alt={attraction.name || 'Attraction'}
          className="w-full h-full object-cover"
          onError={function(e) { e.target.src = FALLBACK; }}
        />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold rounded-full px-2 py-0.5">
          {attraction.category || 'Attraction'}
        </div>
        <button
          onClick={() => !inPlan && setIsSelecting(true)}
          disabled={inPlan}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow transition-all ${
            inPlan ? 'bg-green-500 text-white cursor-default' : 'bg-white text-gold-600 hover:bg-gold-500 hover:text-white'
          }`}
        >
          {inPlan ? '✓' : '+'}
        </button>
        {attraction.isPlaceholder && (
          <div className="absolute bottom-2 left-2 bg-yellow-400/90 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
            Suggested
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="font-semibold text-xs text-gray-900 truncate mb-0.5">{attraction.name}</div>
        {attraction.description && (
          <div className="text-xs text-gray-400 truncate mb-1">{attraction.description}</div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-1">
          {attraction.rating && (
            <span className="text-xs text-gray-500">
              {'⭐ ' + attraction.rating}
              {attraction.ratingCount ? ' (' + Number(attraction.ratingCount).toLocaleString() + ')' : ''}
            </span>
          )}
          {attraction.openingHours && (
            <span className="text-xs text-gray-400 truncate max-w-[110px]">
              {'🕐 ' + attraction.openingHours}
            </span>
          )}
        </div>
        {attraction.entryFee && (
          <div className="text-xs text-gray-500 mt-0.5">{'🎫 ' + attraction.entryFee}</div>
        )}
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gold-600 hover:underline mt-1 block">
            📍 View on map
          </a>
        )}
        {attraction.website && (
          <a href={attraction.website} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:underline mt-0.5 block truncate">
            🌐 Website
          </a>
        )}
      </div>
    </div>
  );
}