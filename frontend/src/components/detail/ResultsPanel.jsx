// components/detail/ResultsPanel.jsx
import { useMemo, useState } from 'react';
import { FaTimes, FaChevronDown, FaChevronUp, FaStar, FaPlane, FaHotel } from 'react-icons/fa';

// ─── Helpers ────────────────────────────────────────────────────────────────

function priceLabel(p, currency) {
  if (!p && !currency) return 'Price on request';
  if (p == null) return 'Price on request';
  const cur = currency || '';
  return `${cur} ${Number(p).toLocaleString()}`;
}

function parseDuration(durStr) {
  if (!durStr) return 0;
  let minutes = 0;
  const hMatch = durStr.match(/(\d+)h/);
  const mMatch = durStr.match(/(\d+)m/);
  if (hMatch) minutes += parseInt(hMatch[1]) * 60;
  if (mMatch) minutes += parseInt(mMatch[1]);
  return minutes;
}

// ─── Styles (matching FlightListing) ────────────────────────────────────────

const styles = {
  wrapper: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    height: '100%',
    fontFamily: "'Segoe UI', sans-serif",
    fontSize: '14px',
    color: '#333',
  },
  filterCard: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: 'transparent',
    padding: '0 0 0 4px',
    position: 'sticky',
    top: '20px',
    maxHeight: 'calc(100vh - 60px)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  filterHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  filterTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
    color: '#111',
  },
  resetAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-primary, #c8a84b)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },
  filterGroup: {
    marginBottom: '10px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  filterGroupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: 0,
  },
  filterResetBtn: {
    fontSize: '11px',
    color: 'var(--color-primary, #c8a84b)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontWeight: '500',
  },
  checkboxItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '5px',
    fontSize: '13px',
    color: '#444',
    cursor: 'pointer',
  },
  // Main content
  content: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  tabBar: {
    display: 'flex',
    gap: '8px',
    padding: '10px 0',
    borderBottom: '1px solid #eee',
    marginBottom: '10px',
  },
  tabBtn: (active) => ({
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    border: `1px solid ${active ? 'var(--color-primary, #c8a84b)' : '#ddd'}`,
    backgroundColor: active ? 'var(--color-primary, #c8a84b)' : 'white',
    color: active ? 'white' : '#555',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  }),
  sortBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: '13px',
    color: '#000',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  sortSelect: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '13px',
    color: '#000',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white',
  },
  badge: (color, bg, border) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '14px',
    backgroundColor: bg,
    color: color,
    fontSize: '12px',
    fontWeight: '500',
    border: `1px solid ${border}`,
    whiteSpace: 'nowrap',
  }),
  badgeX: {
    cursor: 'pointer',
    fontSize: '10px',
  },
  listArea: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#f8f8f8',
    padding: '12px',
    borderRadius: '8px',
  },
  // Hotel Card
  hotelCard: {
    backgroundColor: 'white',
    border: '1px solid #eee',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: '10px',
    display: 'flex',
    transition: 'box-shadow 0.2s',
  },
  hotelImg: {
    width: '120px',
    minWidth: '120px',
    height: '110px',
    objectFit: 'cover',
    backgroundColor: '#f5e9c8',
  },
  hotelBody: {
    flex: 1,
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  hotelName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  hotelLocation: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  hotelMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  hotelPrice: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#c8821a',
  },
  // Flight Card
  flightCard: {
    backgroundColor: 'white',
    border: '1px solid #eee',
    borderRadius: '10px',
    padding: '12px 16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    marginBottom: '8px',
  },
  flightRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '10px',
  },
  flightRoute: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111',
    marginBottom: '2px',
  },
  flightMeta: {
    fontSize: '12px',
    color: '#888',
    marginBottom: '3px',
  },
  flightTime: {
    fontSize: '12px',
    color: '#555',
  },
  flightPrice: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#c8821a',
    flexShrink: 0,
  },
  actionBtns: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px',
  },
  btnPrimary: {
    flex: 1,
    padding: '7px 0',
    backgroundColor: 'var(--color-primary, #c8a84b)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  btnOutline: {
    flex: 1,
    padding: '7px 0',
    backgroundColor: 'white',
    color: '#555',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  noResults: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
  // Modal
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalBox: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '520px',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  modalClose: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#f3f3f3',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#555',
  },
  modalBody: {
    padding: '16px',
    fontSize: '12px',
    color: '#444',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  rangeWrap: {
    padding: '0 4px',
  },
  rangeInput: {
    width: '100%',
    accentColor: 'var(--color-primary, #c8a84b)',
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#888',
    marginTop: '4px',
  },
};

// ─── Modal ───────────────────────────────────────────────────────────────────

function Modal({ title, children, onClose }) {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalBox}>
        <div style={styles.modalHeader}>
          <span style={styles.modalTitle}>{title}</span>
          <button style={styles.modalClose} onClick={onClose}>✕</button>
        </div>
        <div style={styles.modalBody}>{children}</div>
      </div>
    </div>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

function HotelCard({ hotel, onAdd, onView }) {
  return (
    <div style={styles.hotelCard}>
      <div style={styles.hotelImg}>
        {hotel.images?.[0]
          ? <img src={hotel.images[0]} alt={hotel.hotel_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8a84b' }}><FaHotel size={28} /></div>
        }
      </div>
      <div style={styles.hotelBody}>
        <div>
          <div style={styles.hotelName}>{hotel.hotel_name}</div>
          <div style={styles.hotelLocation}>{hotel.location}</div>
          <div style={styles.hotelMeta}>
            {hotel.rating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>
                <FaStar size={11} /> {hotel.rating}
              </span>
            )}
            <span style={styles.hotelPrice}>
              {priceLabel(hotel.price_per_night?.amount, hotel.price_per_night?.currency)}
              <span style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}>/night</span>
            </span>
          </div>
          {hotel.check_in_date && (
            <div style={{ fontSize: '11px', color: '#aaa' }}>
              Check-in: {hotel.check_in_date}
              {hotel.number_of_nights ? ` · ${hotel.number_of_nights} nights` : ''}
            </div>
          )}
        </div>
        <div style={styles.actionBtns}>
          <button style={styles.btnPrimary} onClick={() => onAdd(hotel)}>Add to Plan</button>
          <button style={styles.btnOutline} onClick={() => onView(hotel)}>View Details</button>
        </div>
      </div>
    </div>
  );
}

// ─── Flight Card ─────────────────────────────────────────────────────────────

function FlightCard({ flight, onAdd, onView }) {
  return (
    <div style={styles.flightCard}>
      <div style={styles.flightRow}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.flightRoute}>
            {flight.origin_label || flight.origin || '?'} → {flight.destination_label || flight.destination || '?'}
          </div>
          <div style={styles.flightMeta}>
            {[flight.airline, flight.flight_number].filter(Boolean).join(' · ')}
          </div>
          <div style={styles.flightTime}>
            🕐 {flight.departure_time || '?'} → {flight.arrival_time || '?'}
            {flight.duration ? ` · ⏱ ${flight.duration}` : ''}
            {flight.stops != null ? ` · ${flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}` : ''}
          </div>
        </div>
        <div style={styles.flightPrice}>
          {priceLabel(flight.price?.amount, flight.price?.currency)}
        </div>
      </div>
      <div style={styles.actionBtns}>
        <button style={styles.btnPrimary} onClick={() => onAdd(flight)}>Add to Plan</button>
        <button style={styles.btnOutline} onClick={() => onView(flight)}>View Details</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  sortBy: 'priceLow',
  maxPrice: null,
  stops: [],          // for flights
  minRating: null,    // for hotels
  airlines: [],
};

export default function ResultsPanel({ results, onAddToPlan }) {
  const [active, setActive] = useState('hotels');
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expandedSections, setExpandedSections] = useState({
    stops: true,
    price: true,
    rating: true,
    airlines: true,
  });

  const hotels = results?.hotels || [];
  const flights = results?.flights || [];
  const hasHotels = hotels.length > 0;
  const hasFlights = flights.length > 0;

  // ── Price limits ────────────────────────────────────────────────────────────
  const hotelPriceLimits = useMemo(() => {
    const prices = hotels.map(h => h.price_per_night?.amount).filter(Boolean);
    return { min: Math.min(...prices, 0), max: Math.max(...prices, 10000) };
  }, [hotels]);

  const flightPriceLimits = useMemo(() => {
    const prices = flights.map(f => f.price?.amount).filter(Boolean);
    return { min: Math.min(...prices, 0), max: Math.max(...prices, 100000) };
  }, [flights]);

  const priceLimits = active === 'hotels' ? hotelPriceLimits : flightPriceLimits;
  const maxPriceValue = filters.maxPrice ?? priceLimits.max;

  // ── Airline stats ───────────────────────────────────────────────────────────
  const airlineStats = useMemo(() => {
    const stats = {};
    flights.forEach(f => {
      if (!f.airline) return;
      if (!stats[f.airline]) stats[f.airline] = { count: 0, minPrice: Infinity };
      stats[f.airline].count++;
      const p = f.price?.amount;
      if (p != null) stats[f.airline].minPrice = Math.min(stats[f.airline].minPrice, p);
    });
    return Object.entries(stats).map(([name, s]) => ({ name, ...s }));
  }, [flights]);

  // ── Stop stats ──────────────────────────────────────────────────────────────
  const stopStats = useMemo(() => {
    const stats = {};
    flights.forEach(f => {
      const s = Number(f.stops ?? 0);
      if (!stats[s]) stats[s] = { count: 0, minPrice: Infinity };
      stats[s].count++;
      const p = f.price?.amount;
      if (p != null) stats[s].minPrice = Math.min(stats[s].minPrice, p);
    });
    return stats;
  }, [flights]);

  // ── Filtering & Sorting ─────────────────────────────────────────────────────
  const filteredHotels = useMemo(() => {
    let list = [...hotels];
    if (filters.maxPrice != null) list = list.filter(h => (h.price_per_night?.amount ?? 0) <= filters.maxPrice);
    if (filters.minRating) list = list.filter(h => (h.rating ?? 0) >= filters.minRating);
    switch (filters.sortBy) {
      case 'priceLow': list.sort((a, b) => (a.price_per_night?.amount ?? 0) - (b.price_per_night?.amount ?? 0)); break;
      case 'priceHigh': list.sort((a, b) => (b.price_per_night?.amount ?? 0) - (a.price_per_night?.amount ?? 0)); break;
      case 'ratingHigh': list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      default: break;
    }
    return list;
  }, [hotels, filters]);

  const filteredFlights = useMemo(() => {
    let list = [...flights];
    if (filters.stops.length > 0) list = list.filter(f => filters.stops.includes(Number(f.stops ?? 0)));
    if (filters.airlines.length > 0) list = list.filter(f => filters.airlines.includes(f.airline));
    if (filters.maxPrice != null) list = list.filter(f => (f.price?.amount ?? 0) <= filters.maxPrice);
    switch (filters.sortBy) {
      case 'priceLow': list.sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0)); break;
      case 'priceHigh': list.sort((a, b) => (b.price?.amount ?? 0) - (a.price?.amount ?? 0)); break;
      case 'durationShort': list.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration)); break;
      case 'departEarly': list.sort((a, b) => (a.departure_time || '').localeCompare(b.departure_time || '')); break;
      default: break;
    }
    return list;
  }, [flights, filters]);

  // ── Reset ───────────────────────────────────────────────────────────────────
  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  const toggleSection = (s) => setExpandedSections(p => ({ ...p, [s]: !p[s] }));

  // ── Active badge count ──────────────────────────────────────────────────────
  const activeBadges = [
    filters.stops.length > 0 && 'stops',
    filters.airlines.length > 0 && 'airlines',
    filters.maxPrice != null && filters.maxPrice < priceLimits.max && 'price',
    filters.minRating && 'rating',
  ].filter(Boolean);

  if (!results || (!hasHotels && !hasFlights)) {
    return (
      <div style={styles.noResults}>
        <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
        <div>Ask the AI to <strong>"show cheap hotels"</strong> or <strong>"find flights"</strong> to see results here.</div>
      </div>
    );
  }

  const isHotelTab = active === 'hotels';
  const displayList = isHotelTab ? filteredHotels : filteredFlights;

  return (
    <div style={{ ...styles.wrapper, height: '100%' }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div style={styles.filterCard}>
        <div style={styles.filterHeader}>
          <h4 style={styles.filterTitle}>Filters</h4>
          <button style={styles.resetAllBtn} onClick={resetFilters}>Reset All</button>
        </div>

        {/* Stops — flights only */}
        {(hasFlights && active === 'flights') && (
          <div style={styles.filterGroup}>
            <div style={styles.filterGroupHeader}>
              <span style={styles.filterLabel}>Stops</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button style={styles.filterResetBtn} onClick={() => setFilters(p => ({ ...p, stops: [] }))}>Reset</button>
                <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => toggleSection('stops')}>
                  {expandedSections.stops ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                </span>
              </div>
            </div>
            {expandedSections.stops && Object.entries(stopStats).map(([stop, stat]) => (
              <label key={stop} style={styles.checkboxItem}>
                <input
                  type="checkbox"
                  style={{ accentColor: 'var(--color-primary, #c8a84b)', cursor: 'pointer' }}
                  checked={filters.stops.includes(Number(stop))}
                  onChange={() => setFilters(p => {
                    const s = Number(stop);
                    return { ...p, stops: p.stops.includes(s) ? p.stops.filter(x => x !== s) : [...p.stops, s] };
                  })}
                />
                <span style={{ flex: 1 }}>{stop === '0' ? 'Non-stop' : `${stop} Stop${stop > 1 ? 's' : ''}`} <span style={{ color: '#aaa' }}>({stat.count})</span></span>
                {stat.minPrice !== Infinity && <span style={{ color: '#888', fontSize: '12px' }}>{stat.minPrice.toLocaleString()}</span>}
              </label>
            ))}
          </div>
        )}

        {/* Airlines — flights only */}
        {(hasFlights && active === 'flights') && airlineStats.length > 0 && (
          <div style={styles.filterGroup}>
            <div style={styles.filterGroupHeader}>
              <span style={styles.filterLabel}>Airlines</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button style={styles.filterResetBtn} onClick={() => setFilters(p => ({ ...p, airlines: [] }))}>Reset</button>
                <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => toggleSection('airlines')}>
                  {expandedSections.airlines ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                </span>
              </div>
            </div>
            {expandedSections.airlines && (
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {airlineStats.map(a => (
                  <label key={a.name} style={{ ...styles.checkboxItem, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        style={{ accentColor: 'var(--color-primary, #c8a84b)', cursor: 'pointer' }}
                        checked={filters.airlines.includes(a.name)}
                        onChange={() => setFilters(p => ({
                          ...p,
                          airlines: p.airlines.includes(a.name)
                            ? p.airlines.filter(x => x !== a.name)
                            : [...p.airlines, a.name]
                        }))}
                      />
                      <span>{a.name} <span style={{ color: '#aaa' }}>({a.count})</span></span>
                    </div>
                    {a.minPrice !== Infinity && <span style={{ fontSize: '12px', color: '#888' }}>{a.minPrice.toLocaleString()}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Rating — hotels only */}
        {(hasHotels && active === 'hotels') && (
          <div style={styles.filterGroup}>
            <div style={styles.filterGroupHeader}>
              <span style={styles.filterLabel}>Min. Rating</span>
              <button style={styles.filterResetBtn} onClick={() => setFilters(p => ({ ...p, minRating: null }))}>Reset</button>
            </div>
            {[5, 4, 3].map(r => (
              <label key={r} style={styles.checkboxItem}>
                <input
                  type="radio"
                  name="minRating"
                  style={{ accentColor: 'var(--color-primary, #c8a84b)', cursor: 'pointer' }}
                  checked={filters.minRating === r}
                  onChange={() => setFilters(p => ({ ...p, minRating: p.minRating === r ? null : r }))}
                />
                {'⭐'.repeat(r)} & up
              </label>
            ))}
          </div>
        )}

        {/* Max Price */}
        <div style={styles.filterGroup}>
          <div style={styles.filterGroupHeader}>
            <span style={styles.filterLabel}>Max Price</span>
            <button style={styles.filterResetBtn} onClick={() => setFilters(p => ({ ...p, maxPrice: null }))}>Reset</button>
          </div>
          <div style={styles.rangeWrap}>
            <input
              type="range"
              min={priceLimits.min}
              max={priceLimits.max}
              value={maxPriceValue}
              style={styles.rangeInput}
              onChange={e => setFilters(p => ({ ...p, maxPrice: Number(e.target.value) }))}
            />
            <div style={styles.rangeLabels}>
              <span>{priceLimits.min.toLocaleString()}</span>
              <span style={{ fontWeight: '600', color: '#333' }}>{maxPriceValue.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div style={styles.content}>

        {/* Tabs */}
        <div style={styles.tabBar}>
          {hasHotels && (
            <button style={styles.tabBtn(active === 'hotels')} onClick={() => setActive('hotels')}>
              <FaHotel size={12} /> Hotels <span style={{ opacity: 0.7 }}>({hotels.length})</span>
            </button>
          )}
          {hasFlights && (
            <button style={styles.tabBtn(active === 'flights')} onClick={() => setActive('flights')}>
              <FaPlane size={12} /> Flights <span style={{ opacity: 0.7 }}>({flights.length})</span>
            </button>
          )}
        </div>

        {/* Sort Bar + Active Badges */}
        <div style={styles.sortBar}>
          <span style={styles.sortLabel}>Sort by:</span>
          <select
            style={styles.sortSelect}
            value={filters.sortBy}
            onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value }))}
          >
            <option value="priceLow">Cheapest First</option>
            <option value="priceHigh">Price: High to Low</option>
            {active === 'hotels' && <option value="ratingHigh">Rating: High to Low</option>}
            {active === 'flights' && <option value="durationShort">Fastest First</option>}
            {active === 'flights' && <option value="departEarly">Departure: Earliest</option>}
          </select>

          {/* Active filter badges */}
          {filters.stops.map(s => (
            <div key={s} style={styles.badge('#b06000', '#feefe3', '#f9dcc4')}>
              {s === 0 ? 'Non-stop' : `${s} Stop${s > 1 ? 's' : ''}`}
              <FaTimes style={styles.badgeX} onClick={() => setFilters(p => ({ ...p, stops: p.stops.filter(x => x !== s) }))} />
            </div>
          ))}
          {filters.airlines.map(a => (
            <div key={a} style={styles.badge('#137333', '#e6f4ea', '#c6efce')}>
              {a}
              <FaTimes style={styles.badgeX} onClick={() => setFilters(p => ({ ...p, airlines: p.airlines.filter(x => x !== a) }))} />
            </div>
          ))}
          {filters.minRating && (
            <div style={styles.badge('#7b1fa2', '#f3e5f5', '#e1bee7')}>
              {'⭐'.repeat(filters.minRating)}+
              <FaTimes style={styles.badgeX} onClick={() => setFilters(p => ({ ...p, minRating: null }))} />
            </div>
          )}
          {filters.maxPrice != null && filters.maxPrice < priceLimits.max && (
            <div style={styles.badge('#f57f17', '#fff8e1', '#ffecb3')}>
              Max: {filters.maxPrice.toLocaleString()}
              <FaTimes style={styles.badgeX} onClick={() => setFilters(p => ({ ...p, maxPrice: null }))} />
            </div>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888' }}>
            {displayList.length} result{displayList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        <div style={styles.listArea}>
          {displayList.length === 0 ? (
            <div style={styles.noResults}>
              <div style={{ fontSize: '28px', marginBottom: '8px', color: '#ccc' }}><FaTimes /></div>
              <div style={{ fontSize: '15px', color: '#555', fontWeight: '600', marginBottom: '5px' }}>No results match your filters</div>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>Try adjusting or resetting your filters.</div>
              <button
                style={{ ...styles.btnPrimary, flex: 'none', padding: '8px 20px', borderRadius: '6px' }}
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          ) : active === 'hotels' ? (
            filteredHotels.map(h => (
              <HotelCard
                key={h.hotel_id}
                hotel={h}
                onView={(hotel) => setModal({ title: hotel.hotel_name, body: JSON.stringify(hotel, null, 2) })}
                onAdd={(hotel) => onAddToPlan?.({
                  type: 'hotel',
                  id: `hotel_${hotel.hotel_id}_${Date.now()}`,
                  name: hotel.hotel_name,
                  address: hotel.location,
                  image: hotel.images?.[0] || '',
                  rating: hotel.rating || null,
                  price: hotel.price_per_night?.amount || null,
                  currency: hotel.price_per_night?.currency || 'USD',
                  checkIn: hotel.check_in_date,
                  nights: hotel.number_of_nights,
                  hotel,
                })}
              />
            ))
          ) : (
            filteredFlights.map(f => (
              <FlightCard
                key={`${f.flight_id}_${f.departure_date || ''}`}
                flight={f}
                onView={(flight) => setModal({
                  title: `${flight.origin_label || flight.origin} → ${flight.destination_label || flight.destination}`,
                  body: JSON.stringify(flight, null, 2),
                })}
                onAdd={(flight) => onAddToPlan?.({
                  type: 'flight',
                  id: `flight_${flight.flight_id}_${Date.now()}`,
                  airline: flight.airline,
                  flightNumber: flight.flight_number,
                  from: flight.origin,
                  fromAirport: flight.origin_label,
                  to: flight.destination,
                  toAirport: flight.destination_label,
                  depDate: flight.departure_date,
                  depTime: flight.departure_time,
                  arrTime: flight.arrival_time,
                  duration: flight.duration,
                  stops: flight.stops,
                  price: flight.price?.amount || null,
                  currency: flight.price?.currency || 'USD',
                  flight,
                })}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────────────── */}
      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{modal.body}</pre>
        </Modal>
      )}
    </div>
  );
}