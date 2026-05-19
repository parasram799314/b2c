// components/detail/OverviewTab.jsx
import { parseAttractions, extractNotes } from '../../utils/itineraryHelpers';
import { Icons } from '../../ui/icons';

const DEST_IMAGES = {
  london:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
  paris:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  france:    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  rome:      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  italy:     'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&q=80',
  dubai:     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  tokyo:     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  japan:     'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
  bangkok:   'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80',
  bali:      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  spain:     'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&q=80',
  istanbul:  'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=800&q=80',
  delhi:     'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80',
  mumbai:    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80',
  india:     'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80',
  canada:    'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80',
  usa:       'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
  default:   'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
};

function getDestImage(name) {
  const key = (name || '').toLowerCase();
  for (const [city, url] of Object.entries(DEST_IMAGES)) {
    if (key.includes(city)) return url;
  }
  return DEST_IMAGES.default;
}

const DAY_ICONS = [
  <Icons.MapPin className="w-4 h-4" />,
  <Icons.Landmark className="w-4 h-4" />,
  <Icons.PalmTree className="w-4 h-4" />,
  <Icons.Music className="w-4 h-4" />,
  <Icons.Utensils className="w-4 h-4" />,
  <Icons.Sparkles className="w-4 h-4" />,
  <Icons.Map className="w-4 h-4" />,
  <Icons.Mountain className="w-4 h-4" />,
  <Icons.ShoppingBag className="w-4 h-4" />,
  <Icons.Ticket className="w-4 h-4" />,
];

const Arrow = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0 opacity-40">
    <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function OverviewTab({ rfq, days, destNames, totalNights }) {
  const notes       = extractNotes(rfq.itinerary);
  const totalDays   = totalNights + 1;
  const mainDest    = destNames[0] || 'Destination';
  const heroImage   = getDestImage(mainDest);
  const travelType  = rfq.travelType || 'Leisure';
  const transfer  = rfq.modeOfTransport || 'Flight';

  return (
    <div className="overflow-y-auto">

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={heroImage}
          alt={mainDest}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = DEST_IMAGES.default; }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-gold-500/90 text-white text-xs font-bold rounded-full px-2.5 py-0.5">
                  {travelType}
                </span>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full px-2.5 py-0.5 flex items-center gap-1">
                  <Icons.Plane className="w-3 h-3"/> {transfer}
                </span>
              </div>
              <div className="text-white font-bold text-xl leading-tight">
                {destNames.join(' & ')}
              </div>
              <div className="text-white/70 text-xs mt-0.5">
                {rfq.guestCountry || 'India'} → {mainDest}
              </div>
            </div>

            {/* Stats pill */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-2xl px-3 py-2">
              <div className="text-center">
                <div className="text-white font-black text-lg leading-none">{totalDays}</div>
                <div className="text-white/60 text-xs">Days</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-lg leading-none">{totalNights}</div>
                <div className="text-white/60 text-xs">Nights</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center">
                <div className="text-white font-black text-lg leading-none">{destNames.length}</div>
                <div className="text-white/60 text-xs">{destNames.length === 1 ? 'City' : 'Cities'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK INFO STRIP ────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-5 py-3 flex items-center gap-6 overflow-x-auto">
        {[
          { icon: <Icons.User className="w-4 h-4"/>, label: rfq.requireHotels ? `${rfq.numberOfRooms || 1} Room${(rfq.numberOfRooms || 1) > 1 ? 's' : ''}` : `${rfq.numberOfAdults || 1} Adult${(rfq.numberOfAdults || 1) > 1 ? 's' : ''}` },
          { icon: <Icons.Globe className="w-4 h-4"/>, label: rfq.guestCountry || 'India' },
          { icon: <Icons.Hotel className="w-4 h-4"/>, label: rfq.requireHotels ? `Hotels Required` : 'No Hotel' },
          { icon: <Icons.Star className="w-4 h-4"/>, label: rfq.hotelRatings?.length ? `${rfq.hotelRatings.join(', ')}★` : 'Any Rating' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-500">
            <span className="text-gray-400">{item.icon}</span>
            <span className="font-medium text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── TRIP TIMELINE ───────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-gold-500 rounded-full" />
            <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Trip Timeline</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold-400 via-gold-200 to-transparent" />

            <div className="flex flex-col gap-0">
              {rfq.destinations?.map((dest, di) => {
                const dayStart = rfq.destinations.slice(0, di).reduce((s, d) => s + (d.numberOfNights || 0), 0) + 1;
                const dayEnd   = dayStart + (dest.numberOfNights || 0);
                const relDays  = days.filter((_, idx) => idx >= dayStart - 1 && idx < dayEnd);
                const image    = getDestImage(dest.destination);

                return (
                  <div key={di} className="relative pl-14 pb-5">
                    {/* Circle on timeline */}
                    <div className="absolute left-3 top-1 w-5 h-5 rounded-full border-2 border-gold-400 bg-white flex items-center justify-center z-10">
                      <div className="w-2 h-2 rounded-full bg-gold-400" />
                    </div>

                    {/* Destination card */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      {/* Dest image header */}
                      <div className="relative h-24 overflow-hidden">
                        <img
                          src={image}
                          alt={dest.destination}
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = DEST_IMAGES.default; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                        <div className="absolute inset-0 p-3 flex items-center">
                          <div>
                            <div className="text-white font-black text-base leading-tight">{dest.destination}</div>
                            <div className="text-white/70 text-xs mt-0.5 flex items-center gap-1.5">
                              <span className="bg-white/20 rounded-full px-2 py-0.5">
                                Day {dayStart === dayEnd ? dayStart : `${dayStart}–${dayEnd}`}
                              </span>
                              <span>{dest.numberOfNights} night{dest.numberOfNights !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrival date badge */}
                        {dest.dateOfArrival && (
                          <div className="absolute top-2 right-2 bg-gold-500 text-white text-xs font-bold rounded-lg px-2 py-1">
                            {new Date(dest.dateOfArrival + 'T00:00:00').toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>

                      {/* Day breakdown */}
                      <div className="p-3">
                        {relDays.slice(di === 0 ? 1 : 0).map((day, dj) => {
                          const attractions = parseAttractions(day.content).slice(0, 4);
                          const icon        = DAY_ICONS[(dayStart + dj - 1) % DAY_ICONS.length];

                          return (
                            <div key={dj} className={`flex items-start gap-3 py-2.5 ${dj > 0 ? 'border-t border-gray-50' : ''}`}>
                              <div className="w-8 h-8 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-sm">{icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-800 mb-1 truncate">
                                  {day.title?.replace(/^#+\s*Day\s*\d+\s*[·\-]?\s*/i, '') || `Day ${dayStart + dj}`}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  {attractions.length > 0 ? (
                                    attractions.map((a, ai) => (
                                      <span key={ai} className="flex items-center gap-1">
                                        <span className="text-xs text-gray-400 truncate max-w-[90px]">{a.name}</span>
                                        {ai < attractions.length - 1 && <Arrow />}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-300">Details in itinerary</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Day 1 journey row */}
                        {di === 0 && (
                          <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 mb-0.5 order-first">
                            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Icons.Plane className="w-4 h-4 text-blue-500"/>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-gray-800">Day 1 · Travel Day</div>
                              <div className="text-xs text-gray-400">{rfq.guestCountry || 'India'} → {dest.destination}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Return day */}
              <div className="relative pl-14 pb-2">
                <div className="absolute left-3 top-1 w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                </div>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Icons.ArrowLeft className="w-4 h-4 rotate-180"/>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-700">Return Journey</div>
                    <div className="text-xs text-gray-400">{destNames[destNames.length - 1]} → {rfq.guestCountry || 'India'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TO BE PLANNED ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-2xl p-4 border border-gold-100">
          <div className="flex items-center gap-2 mb-3">
            <Icons.MapPin className="w-4 h-4 text-gold-500" />
            <span className="font-bold text-sm text-gray-800">To be planned</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['+ Places', '+ Transportation', '+ Custom activities'].map(a => (
              <button key={a}
                className="text-gold-700 font-semibold text-xs border border-gold-300 bg-white rounded-full px-3 py-1.5 hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all">
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* ── NOTES ───────────────────────────────────────────────────── */}
        {notes && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-4 bg-gray-400 rounded-full" />
              <h2 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Travel Notes</h2>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-4 text-xs text-gray-500 leading-relaxed shadow-sm">
              <div className="flex gap-2">
                <Icons.FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>{notes.slice(0, 350)}{notes.length > 350 ? '…' : ''}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}