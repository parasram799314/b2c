// components/detail/FlightCard.jsx
// Standalone version — can be used independently outside DetailPage
import { Icons } from '../../ui/icons';

export default function FlightCard({ flight, recommended = false, inPlan = false, onAdd }) {
  return (
    <div className={`bg-white border rounded-2xl p-4 flex items-center gap-4 transition-all ${
      recommended ? 'border-gold-300 shadow-sm' : 'border-gray-200'
    } ${inPlan ? 'bg-gold-50 border-gold-200' : ''}`}>

      {/* Left — times + route */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl font-black text-gray-900">{flight.depTime}</span>
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 flex items-center gap-1">
              <Icons.Clock className="w-3 h-3" /> {flight.duration}
            </span>
            <div className="h-px bg-gray-200 flex-1" />
            <Icons.ChevronRight className="text-gray-300 w-3 h-3 flex-shrink-0" />
          </div>
          <span className="text-xl font-black text-gray-900">
            {flight.arrTime}
            {flight.nextDay && <sup className="text-xs text-gold-500 ml-0.5">+1</sup>}
          </span>
        </div>

        {/* From label */}
        <div className="text-xs text-gold-600 font-semibold truncate flex items-center gap-1">
           <Icons.Plane className="w-3 h-3 text-amber-500" /> {flight.fromAirport}
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Icons.Plane className="w-3 h-3" />
            {flight.stops === 0
              ? 'Direct'
              : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}${flight.stopCodes ? ` · ${flight.stopCodes}` : ''}`}
          </span>
          {flight.airline && (
            <span className="text-xs text-gray-400">· {flight.airline}</span>
          )}
          {recommended && (
            <span className="bg-green-50 text-green-600 text-xs font-semibold rounded-full px-2 py-0.5 border border-green-200">
              Recommended
            </span>
          )}
        </div>
      </div>

      {/* Right — price + button */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {flight.price && (
          <div className="text-sm font-bold text-gray-900">
            {flight.currency} {parseFloat(flight.price).toLocaleString()}
          </div>
        )}
        <button
          onClick={onAdd}
          disabled={inPlan}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            inPlan
              ? 'bg-green-100 text-green-600 border border-green-200 cursor-default'
              : 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm'
          }`}
        >
          {inPlan ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
}