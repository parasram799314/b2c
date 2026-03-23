'use client';
import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaChevronDown, FaChevronUp, FaThLarge, FaList } from 'react-icons/fa';
import FlightCard from './FlightCard';
import { searchFlights } from '../services/api';

// ─── Logo helper ──────────────────────────────────────────────────────────────
const getLogoPath = (n = '') => {
    n = n.toLowerCase();
    if (n.includes('indigo'))        return 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/6E.png';
    if (n.includes('air india exp')) return 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/IX.png';
    if (n.includes('air india'))     return 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/AI.png';
    if (n.includes('akasa'))         return 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/QP.png';
    if (n.includes('spicejet'))      return 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/SG.png';
    if (n.includes('sojourn'))       return '/logos/SojournAir.png';
    if (n.includes('hahn'))          return 'https://images.kiwi.com/airlines/64/HR.png';
    if (n.includes('alliance'))      return 'https://images.kiwi.com/airlines/64/9I.png';
    return null;
};

const fmt       = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const parseDuration = (s = '') => {
    let m = 0;
    const h = s.match(/(\d+)h/); const mi = s.match(/(\d+)m/);
    if (h)  m += parseInt(h[1])  * 60;
    if (mi) m += parseInt(mi[1]);
    return m;
};
const formatMins = (m) => {
    const h = Math.floor(m / 60), mn = m % 60;
    return h === 0 ? `${mn}m` : `${h}h${mn > 0 ? ` ${mn}m` : ''}`;
};
const formatDateHdr = (s = '') => {
    const p = s.split('-');
    if (p.length === 3) return new Date(+p[0], +p[1] - 1, +p[2]).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return s;
};

// ─── Filter defaults ──────────────────────────────────────────────────────────
const mkDefaults = (maxP = 300000) => ({
    stops:          [],
    stopOneOrFewer: false,
    airlines:       [],
    maxPrice:       maxP,
    searchQuery:    '',
    recommended:    { direct: false, baggage: false, hideBudget: false },
    departureTime:  [0, 24],
    arrivalTime:    [0, 24],
    duration:       { stopover: [30, 720], total: [120, 990] },
    stopoverCities: [],
    airports:       [],
    aircrafts:      [],
    cabin:          'Economy',
    sortBy:         'priceLow',
});

// ─── Mock data (same as flight-nextjs) ────────────────────────────────────────────────
const STOPOVER_CITIES = [
    { name: 'Hyderabad', price: 159 },
    { name: 'Ahmedabad', price: 169 },
    { name: 'Goa',       price: 181 },
    { name: 'Chennai',   price: 293 },
];
const AIRCRAFTS = [
    { name: 'Large aircraft',   price: 127 },
    { name: 'Midsize aircraft', price: 127 },
];
const CABIN_OPTIONS = ['Economy', 'Premium Economy', 'Business', 'First'];

// ─── Reusable filter checkbox row ─────────────────────────────────────────────
function CheckRow({ id, label, checked, onChange, rightLabel }) {
    return (
        <label htmlFor={id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 0', cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id={id} checked={checked} onChange={onChange}
                    style={{ width: '15px', height: '15px', accentColor: '#F7BE39', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{label}</span>
            </div>
            {rightLabel && <span style={{ fontSize: '12px', color: '#6b7280' }}>{rightLabel}</span>}
        </label>
    );
}

// ─── Filter section wrapper ───────────────────────────────────────────────────
function FilterSection({ title, onReset, collapsible, expanded, onToggle, children, summary }) {
    return (
        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: collapsible && !expanded ? '4px' : '10px',
                cursor: collapsible ? 'pointer' : 'default'
            }} onClick={collapsible ? onToggle : undefined}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                    {title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={e => { e.stopPropagation(); onReset(); }} style={{
                        fontSize: '11px', color: '#F7BE39', background: 'none', border: 'none',
                        cursor: 'pointer', fontWeight: 600, padding: 0
                    }}>Reset</button>
                    {collapsible && (expanded
                        ? <FaChevronUp size={10} color="#9ca3af" />
                        : <FaChevronDown size={10} color="#9ca3af" />
                    )}
                </div>
            </div>
            {/* summary when collapsed */}
            {collapsible && !expanded && summary && (
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>{summary}</div>
            )}
            {(!collapsible || expanded) && children}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
const FlightListingContent = ({ searchData }) => {
    const router = useRouter();

    const [flights,       setFlights]       = useState({ onward: [], return: [] });
    const [loading,       setLoading]       = useState(true);
    const [currentParams, setCurrentParams] = useState(searchData);
    const [filters,       setFilters]       = useState(mkDefaults());
    const [minPrice,      setMinPrice]      = useState(0);
    const [maxPriceLimit, setMaxPriceLimit] = useState(300000);
    const [visibleCount,  setVisibleCount]  = useState(15);
    const [isSplitView,   setIsSplitView]   = useState(false);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        airports:       true,
        duration:       false,
        stopoverCities: true,
        aircrafts:      true,
        cabin:          true,
    });
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
    const observerTarget = useRef(null);

    // Infinite scroll
    useEffect(() => {
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) setVisibleCount(p => p + 15);
        }, { threshold: 0.1 });
        if (observerTarget.current) obs.observe(observerTarget.current);
        return () => { if (observerTarget.current) obs.unobserve(observerTarget.current); };
    }, []);

    useEffect(() => { if (searchData) setCurrentParams(searchData); }, [searchData]);

    // Fetch flights
    useEffect(() => {
        if (!currentParams) return;
        const fetch_ = async () => {
            setLoading(true);
            try {
                const data     = await searchFlights(currentParams);
                const fetched  = Array.isArray(data) ? { onward: data, return: [] } : (data || { onward: [], return: [] });
                setFlights(fetched);
                setVisibleCount(15);
                const all = [...(fetched.onward || []), ...(fetched.return || [])];
                if (all.length) {
                    const prices = all.map(f => f.price);
                    const minP = Math.min(...prices), maxP = Math.max(...prices);
                    setMinPrice(minP);
                    setMaxPriceLimit(maxP);
                    setFilters(p => ({ ...p, maxPrice: maxP }));
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch_();
    }, [currentParams]);

    // ── Filter helpers ──
    const setF = fn => setFilters(p => fn(p));
    const toggleStop    = n  => setF(p => ({ ...p, stops:    p.stops.includes(n)    ? p.stops.filter(s => s !== n)    : [...p.stops, n]    }));
    const toggleAirline = a  => setF(p => ({ ...p, airlines: p.airlines.includes(a) ? p.airlines.filter(x => x !== a) : [...p.airlines, a] }));
    const toggleAirport = c  => setF(p => ({ ...p, airports: p.airports.includes(c) ? p.airports.filter(x => x !== c) : [...p.airports, c] }));
    const toggleStopoverCity = name => setF(p => ({ ...p, stopoverCities: p.stopoverCities.includes(name) ? p.stopoverCities.filter(x => x !== name) : [...p.stopoverCities, name] }));
    const toggleAircraft     = name => setF(p => ({ ...p, aircrafts:      p.aircrafts.includes(name)      ? p.aircrafts.filter(x => x !== name)      : [...p.aircrafts, name]      }));
    const toggleRec     = field => setF(p => ({ ...p, recommended: { ...p.recommended, [field]: !p.recommended[field] } }));
    const toggleSection = key   => setExpandedSections(p => ({ ...p, [key]: !p[key] }));

    // ── Toggle "1 stop or fewer" (0 + 1 combined) ──
    const toggleOneOrFewer = () => {
        setFilters(p => {
            const isOn = p.stopOneOrFewer;
            return {
                ...p,
                stopOneOrFewer: !isOn,
                stops: !isOn ? [] : p.stops, // clear individual stops when enabling
            };
        });
    };

    // ── Filter + sort ──
    const filterFlights = (list) => {
        if (!list) return [];
        return list.filter(f => {
            // Stops — "1 stop or fewer" overrides individual stop filters
            if (filters.stopOneOrFewer) {
                if (Number(f.stops) > 1) return false;
            } else if (filters.stops.length > 0) {
                if (!filters.stops.includes(Number(f.stops))) return false;
            }
            // Airlines
            if (filters.airlines.length > 0 && !filters.airlines.some(a => (f.airline || '').toLowerCase().includes(a.toLowerCase()))) return false;
            // Price
            if (f.price > filters.maxPrice) return false;
            // Search query
            if (filters.searchQuery) {
                const q = filters.searchQuery.toLowerCase();
                if (!(f.airline || '').toLowerCase().includes(q) && !(f.flightNumber || '').toLowerCase().includes(q)) return false;
            }
            // Recommended
            if (filters.recommended.direct && Number(f.stops) !== 0) return false;
            if (filters.recommended.hideBudget) {
                const budgets = ['indigo', 'spicejet', 'akasa', 'go first', 'airasia'];
                if (budgets.some(b => (f.airline || '').toLowerCase().includes(b))) return false;
            }
            // Time
            const getH = (t = '') => parseInt((t || '').split(':')[0]) || 0;
            const dep = getH(f.departureTime), arr = getH(f.arrivalTime);
            if (dep < filters.departureTime[0] || dep >= filters.departureTime[1]) return false;
            if (arr < filters.arrivalTime[0]   || arr >= filters.arrivalTime[1])   return false;
            // Airports
            if (filters.airports.length > 0 && !filters.airports.includes(f.to)) return false;
            return true;
        }).sort((a, b) => {
            switch (filters.sortBy) {
                case 'priceLow':      return a.price - b.price;
                case 'priceHigh':     return b.price - a.price;
                case 'durationShort': return parseDuration(a.duration) - parseDuration(b.duration);
                case 'departEarly':   return (a.departureTime || '').localeCompare(b.departureTime || '');
                case 'departLate':    return (b.departureTime || '').localeCompare(a.departureTime || '');
                case 'arriveEarly':   return (a.arrivalTime   || '').localeCompare(b.arrivalTime   || '');
                case 'arriveLate':    return (b.arrivalTime   || '').localeCompare(a.arrivalTime   || '');
                default: return 0;
            }
        });
    };

    // ── Stats ──
    const airlineStats = useMemo(() => {
        const s = {};
        flights.onward.forEach(f => {
            if (!s[f.airline]) s[f.airline] = { count: 0, minPrice: Infinity, logo: f.logo, name: f.airline };
            s[f.airline].count++;
            s[f.airline].minPrice = Math.min(s[f.airline].minPrice, f.price);
        });
        return Object.values(s);
    }, [flights.onward]);

    const stopStats = useMemo(() => {
        const s = {
            0: { label: 'Non-stop', count: 0, minPrice: Infinity },
            1: { label: '1 Stop',   count: 0, minPrice: Infinity },
            2: { label: '2+ Stops', count: 0, minPrice: Infinity },
        };
        flights.onward.forEach(f => {
            const k = Number(f.stops) > 1 ? 2 : Number(f.stops);
            s[k].count++;
            s[k].minPrice = Math.min(s[k].minPrice, f.price);
        });
        return s;
    }, [flights.onward]);

    const airportStats = useMemo(() => {
        const airportNames = {
            BOM: 'Chhatrapati Shivaji Maharaj Intl',
            DEL: 'Indira Gandhi International',
            BLR: 'Kempegowda International',
            DXB: 'Dubai International',
            JFK: 'John F. Kennedy Intl',
        };
        const s = {};
        flights.onward.forEach(f => {
            const c = f.to || 'Unknown';
            if (!s[c]) s[c] = { code: c, count: 0, minPrice: Infinity };
            s[c].count++;
            s[c].minPrice = Math.min(s[c].minPrice, f.price);
        });
        return Object.values(s).map(ap => ({
            ...ap,
            name: airportNames[ap.code] ? `${ap.code} — ${airportNames[ap.code]}` : ap.code,
        }));
    }, [flights.onward]);

    const filteredOnward = useMemo(() => filterFlights(flights.onward), [flights.onward, filters]);
    const filteredReturn = useMemo(() => filterFlights(flights.return), [flights.return, filters]);

    const isRoundTrip  = currentParams?.tripType === 'roundTrip';
    const canProceed   = isRoundTrip ? (selectedFlight && selectedReturnFlight) : selectedFlight;
    const totalPrice   = (selectedFlight?.price || 0) + (selectedReturnFlight?.price || 0);

    const handleOnwardSelect = (flight) => {
        setSelectedFlight(flight);
        if (!isRoundTrip) router.push(`/book-flight?id=${flight.id}`);
    };

    const proceedToBook = () => {
        if (!selectedFlight) return;
        router.push(selectedReturnFlight
            ? `/book-flight?id=${selectedFlight.id}&returnId=${selectedReturnFlight.id}`
            : `/book-flight?id=${selectedFlight.id}`
        );
    };

    // ── Active filter tags (same as flight-nextjs) ──
    const activeTags = [
        ...filters.stopOneOrFewer ? [{ label: '1 Stop or fewer', color: '#b06000', bg: '#feefe3', border: '#f9dcc4', clear: toggleOneOrFewer }] : [],
        ...filters.recommended.direct    ? [{ label: 'Direct',       color: '#1967d2', bg: '#e8f0fe', border: '#d2e3fc', clear: () => toggleRec('direct')    }] : [],
        ...filters.recommended.baggage   ? [{ label: 'Baggage',      color: '#1967d2', bg: '#e8f0fe', border: '#d2e3fc', clear: () => toggleRec('baggage')   }] : [],
        ...filters.recommended.hideBudget? [{ label: 'No Budget',    color: '#c5221f', bg: '#fce8e6', border: '#fad2cf', clear: () => toggleRec('hideBudget')}] : [],
        ...filters.airlines.map(a        =>  ({ label: a,            color: '#137333', bg: '#e6f4ea', border: '#c6efce', clear: () => toggleAirline(a)       })),
        ...filters.stops.map(s           =>  ({ label: s === 0 ? 'Non-stop' : `${s} Stop${s > 1 ? 's' : ''}`, color: '#b06000', bg: '#feefe3', border: '#f9dcc4', clear: () => toggleStop(s) })),
        ...(filters.departureTime[0] !== 0 || filters.departureTime[1] !== 24) ? [{
            label: `Dep: ${String(filters.departureTime[0]).padStart(2,'0')}-${String(filters.departureTime[1]).padStart(2,'0')}`,
            color: '#7b1fa2', bg: '#f3e5f5', border: '#e1bee7',
            clear: () => setF(p => ({ ...p, departureTime: [0, 24] }))
        }] : [],
        ...(filters.arrivalTime[0] !== 0 || filters.arrivalTime[1] !== 24) ? [{
            label: `Arr: ${String(filters.arrivalTime[0]).padStart(2,'0')}-${String(filters.arrivalTime[1]).padStart(2,'0')}`,
            color: '#7b1fa2', bg: '#f3e5f5', border: '#e1bee7',
            clear: () => setF(p => ({ ...p, arrivalTime: [0, 24] }))
        }] : [],
        ...filters.airports.map(c        => ({ label: `Arrive: ${c}`, color: '#006064', bg: '#e0f7fa', border: '#b2ebf2', clear: () => toggleAirport(c)      })),
        ...filters.stopoverCities.map(n  => ({ label: `Via: ${n}`,    color: '#0d47a1', bg: '#e3f2fd', border: '#bbdefb', clear: () => toggleStopoverCity(n) })),
        ...filters.aircrafts.map(n       => ({ label: n,              color: '#4a148c', bg: '#f3e5f5', border: '#ce93d8', clear: () => toggleAircraft(n)      })),
        ...(filters.maxPrice < maxPriceLimit) ? [{
            label: `Max: ${fmt(filters.maxPrice)}`,
            color: '#f57f17', bg: '#fff8e1', border: '#ffecb3',
            clear: () => setF(p => ({ ...p, maxPrice: maxPriceLimit }))
        }] : [],
        ...(filters.cabin !== 'Economy') ? [{
            label: filters.cabin,
            color: '#880e4f', bg: '#fce4ec', border: '#f8bbd9',
            clear: () => setF(p => ({ ...p, cabin: 'Economy' }))
        }] : [],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">

            {/* Top search bar - same as flight-nextjs */}
            <div style={{ background: 'linear-gradient(135deg, #F7BE39, #9e8240)', padding: '10px 0', marginBottom: '16px', boxShadow: '0 4px 20px rgba(191,160,90,0.3)' }}>
                <div className="container mx-auto px-4" style={{ padding: '0 10px' }}>
                    {/* Flight Search Component */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{currentParams?.from || 'Delhi'}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{currentParams?.to || 'Mumbai'}</span>
                                </div>
                            </div>
                            <div style={{ minWidth: '120px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{formatDateHdr(currentParams?.date) || 'Today'}</span>
                                </div>
                            </div>
                            <div style={{ minWidth: '100px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>{currentParams?.travelClass || 'Economy'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: canProceed ? '100px' : '60px' }}>

                {/* Mobile filter btn */}
                <div className="md:hidden" style={{ marginBottom: '16px', width: '100%' }}>
                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowMobileFilter(true)}>
                        Filter Results
                    </button>
                </div>

                {/* ══════════════════════ FILTER SIDEBAR ══════════════════════ */}
                <div className={`hidden lg:block ${showMobileFilter ? 'active' : ''}`} style={{ width: '280px', minWidth: '280px' }}>
                    <div style={{ position: 'sticky', top: '16px', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', paddingRight: '4px' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '16px' }}>⚙</span>
                                <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>Sort &amp; Filter</span>
                            </div>
                            <button onClick={() => setFilters(mkDefaults(maxPriceLimit))} style={{ fontSize: '12px', color: '#F7BE39', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                                Reset All
                            </button>
                        </div>

                        {/* ─── 1. RECOMMENDED ─── */}
                        <FilterSection title="Recommended" onReset={() => setF(p => ({ ...p, recommended: { direct: false, baggage: false, hideBudget: false } }))}>
                            <CheckRow id="rec-nonstop"  label="Direct"                   checked={filters.recommended.direct}     onChange={() => toggleRec('direct')}     />
                            <CheckRow id="rec-hide"     label="Hide budget airlines"      checked={filters.recommended.hideBudget} onChange={() => toggleRec('hideBudget')} />
                            <CheckRow id="rec-baggage"  label="Checked baggage included"  checked={filters.recommended.baggage}    onChange={() => toggleRec('baggage')}    />
                        </FilterSection>

                        {/* ─── 2. STOPS ─── */}
                        <FilterSection title="Stops" onReset={() => setF(p => ({ ...p, stops: [], stopOneOrFewer: false }))}>
                            {/* "1 stop or fewer" combined checkbox */}
                            <CheckRow
                                id="stop-one-or-fewer"
                                label="1 stop or fewer"
                                checked={filters.stopOneOrFewer}
                                onChange={toggleOneOrFewer}
                            />
                            {/* Individual stops */}
                            {[
                                { key: 0, label: 'Non-stop' },
                                { key: 1, label: '1 Stop'   },
                                { key: 2, label: '2+ Stops' },
                            ].map(({ key, label }) => (
                                <CheckRow
                                    key={key}
                                    id={`stop-${key}`}
                                    label={`${label} (${stopStats[key]?.count || 0})`}
                                    checked={filters.stops.includes(key)}
                                    onChange={() => toggleStop(key)}
                                    rightLabel={stopStats[key]?.minPrice !== Infinity ? fmt(stopStats[key].minPrice) : ''}
                                />
                            ))}
                        </FilterSection>

                        {/* ─── 3. MAX PRICE ─── */}
                        <FilterSection title="Max Price" onReset={() => setF(p => ({ ...p, maxPrice: maxPriceLimit }))}>
                            <input
                                type="range" min={minPrice} max={maxPriceLimit} value={filters.maxPrice}
                                onChange={e => setF(p => ({ ...p, maxPrice: Number(e.target.value) }))}
                                style={{ width: '100%', accentColor: '#F7BE39', marginBottom: '4px' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
                                <span>{fmt(minPrice)}</span>
                                <span style={{ fontWeight: 600, color: '#F7BE39' }}>{fmt(filters.maxPrice)}</span>
                            </div>
                        </FilterSection>

                        {/* ─── 4. AIRLINES ─── */}
                        <FilterSection title="Airlines" onReset={() => setF(p => ({ ...p, airlines: [] }))}>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {airlineStats.map(a => (
                                    <label key={a.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input type="checkbox" checked={filters.airlines.includes(a.name)} onChange={() => toggleAirline(a.name)}
                                                style={{ width: '15px', height: '15px', accentColor: '#F7BE39', cursor: 'pointer', flexShrink: 0 }} />
                                            <img
                                                src={a.logo || getLogoPath(a.name)} alt={a.name}
                                                style={{ width: '30px', height: '30px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #f3f4f6' }}
                                                onError={e => e.target.style.display = 'none'}
                                            />
                                            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                                                {a.name} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({a.count})</span>
                                            </span>
                                        </div>
                                        {a.minPrice !== Infinity && <span style={{ fontSize: '12px', color: '#6b7280' }}>{fmt(a.minPrice)}</span>}
                                    </label>
                                ))}
                            </div>
                        </FilterSection>

                        {/* ─── 5. TIMES ─── */}
                        <FilterSection title="Times" onReset={() => setF(p => ({ ...p, departureTime: [0, 24], arrivalTime: [0, 24] }))}>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>Departure time</span>
                                    <span style={{ color: '#F7BE39', fontWeight: 600 }}>
                                        {String(filters.departureTime[0]).padStart(2,'0')}:00 – {String(filters.departureTime[1]).padStart(2,'0')}:00
                                    </span>
                                </div>
                                <input
                                    type="range" min={0} max={24} value={filters.departureTime[1]}
                                    onChange={e => setF(p => ({ ...p, departureTime: [0, Number(e.target.value)] }))}
                                    style={{ width: '100%', accentColor: '#F7BE39', marginBottom: '4px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    <span>00:00</span><span>24:00</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>Arrival time</span>
                                    <span style={{ color: '#F7BE39', fontWeight: 600 }}>
                                        {String(filters.arrivalTime[0]).padStart(2,'0')}:00 – {String(filters.arrivalTime[1]).padStart(2,'0')}:00
                                    </span>
                                </div>
                                <input
                                    type="range" min={0} max={24} value={filters.arrivalTime[1]}
                                    onChange={e => setF(p => ({ ...p, arrivalTime: [0, Number(e.target.value)] }))}
                                    style={{ width: '100%', accentColor: '#F7BE39', marginBottom: '4px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    <span>00:00</span><span>24:00</span>
                                </div>
                            </div>
                        </FilterSection>

                    </div>
                </div>

                {/* ══════════════════════ MAIN FLIGHT LIST ══════════════════════ */}
                <div className="flex-1 min-w-0">

                    {/* Sort + active tags + view toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>Sort by:</span>
                            <select
                                value={filters.sortBy}
                                onChange={e => setF(p => ({ ...p, sortBy: e.target.value }))}
                                style={{ padding: '5px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#374151', outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 500 }}
                            >
                                <option value="priceLow">Cheapest First</option>
                                <option value="priceHigh">Price: High to Low</option>
                                <option value="durationShort">Fastest First</option>
                                <option value="departEarly">Departure: Earliest</option>
                                <option value="departLate">Departure: Latest</option>
                                <option value="arriveEarly">Arrival: Earliest</option>
                                <option value="arriveLate">Arrival: Latest</option>
                            </select>

                            {/* Active filter tags */}
                            {activeTags.map((tag, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '5px',
                                    padding: '3px 10px', borderRadius: '16px',
                                    background: tag.bg, color: tag.color,
                                    border: `1px solid ${tag.border}`,
                                    fontSize: '12px', fontWeight: 500
                                }}>
                                    {tag.label}
                                    <FaTimes size={9} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={tag.clear} />
                                </div>
                            ))}
                        </div>

                        {/* Round trip split/combo toggle */}
                        {isRoundTrip && (
                            <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '8px', padding: '2px', border: '1px solid #e5e7eb' }}>
                                {[{ val: false, icon: <FaThLarge />, label: 'Combo' }, { val: true, icon: <FaList />, label: 'Split' }].map(opt => (
                                    <button key={String(opt.val)} onClick={() => setIsSplitView(opt.val)} style={{
                                        display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px',
                                        background: isSplitView === opt.val ? 'white' : 'transparent',
                                        border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px',
                                        fontWeight: isSplitView === opt.val ? 700 : 400,
                                        color: isSplitView === opt.val ? '#F7BE39' : '#6b7280',
                                        boxShadow: isSplitView === opt.val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}>{opt.icon} {opt.label}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Flight results ── */}
                    {!currentParams ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                            <h3>No search criteria found</h3>
                            <button className="btn btn-primary mt-2" onClick={() => router.push('/')}>Go Back to Search</button>
                        </div>
                    ) : loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', fontSize: '16px', color: '#9ca3af' }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✈</div>
                            Searching best flights...
                        </div>
                    ) : (
                        <div style={{ width: '100%' }}>
                            {isRoundTrip ? (
                                isSplitView ? (
                                    // Split view
                                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                        {[
                                            { label: 'Onward', date: currentParams?.date,       list: filteredOnward, sel: selectedFlight,       setSel: setSelectedFlight       },
                                            { label: 'Return', date: currentParams?.returnDate, list: filteredReturn, sel: selectedReturnFlight, setSel: setSelectedReturnFlight },
                                        ].map(col => (
                                            <div key={col.label} style={{ flex: 1, minWidth: '300px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #F7BE39', paddingBottom: '8px', marginBottom: '12px' }}>
                                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{col.label}</span>
                                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDateHdr(col.date)}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {col.list.length > 0 ? col.list.slice(0, visibleCount).map(f => (
                                                        <FlightCard key={f.id} flight={f} isSelected={col.sel?.id === f.id} onSelect={col.setSel} isRoundTrip />
                                                    )) : <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '13px' }}>No flights found</div>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Combo view
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {filteredOnward.length > 0 && filteredReturn.length > 0 ? (
                                            filteredOnward.slice(0, visibleCount).map(f => {
                                                const ret = selectedReturnFlight || filteredReturn[0];
                                                return (
                                                    <FlightCard key={f.id} flight={f} returnFlight={ret}
                                                        isSelected={selectedFlight?.id === f.id} isRoundTrip
                                                        onSelect={() => {
                                                            setSelectedFlight(f); setSelectedReturnFlight(ret);
                                                            router.push(`/book-flight?id=${f.id}&returnId=${ret.id}`);
                                                        }} />
                                                );
                                            })
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                                <h3>No flights found</h3>
                                                <p style={{ color: '#9ca3af' }}>Try adjusting your filters.</p>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                // One-way
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {filteredOnward.length > 0 ? (
                                        filteredOnward.slice(0, visibleCount).map(f => (
                                            <FlightCard key={f.id} flight={f} isSelected={selectedFlight?.id === f.id} onSelect={() => handleOnwardSelect(f)} isRoundTrip={false} />
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                            <FaTimes size={36} color="#d1d5db" style={{ marginBottom: '12px' }} />
                                            {flights.onward.length > 0 ? (
                                                <>
                                                    <h3 style={{ color: '#374151', marginBottom: '6px' }}>No flights match your filters</h3>
                                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>Try adjusting your filters.</p>
                                                    <button onClick={() => setFilters(mkDefaults(maxPriceLimit))} style={{ marginTop: '12px', padding: '8px 20px', background: '#F7BE39', color: '#1a1a1a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                                        Reset Filters
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <h3 style={{ color: '#374151', marginBottom: '6px' }}>No flights available</h3>
                                                    <p style={{ color: '#9ca3af', fontSize: '13px' }}>We couldn't find flights for this route/date.</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Infinite scroll sentinel */}
                    <div ref={observerTarget} style={{ height: '20px', margin: '20px 0', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                        {(filteredOnward?.length > visibleCount || filteredReturn?.length > visibleCount) && 'Loading more...'}
                    </div>
                </div>

            </div>

            {/* Round trip proceed footer */}
            {canProceed && isRoundTrip && !isSplitView && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#003366', padding: '14px 0', color: 'white', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }}>
                    <div className="container mx-auto px-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '18px', fontWeight: 700 }}>Total: ₹{totalPrice.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '12px', color: '#93c5fd', marginLeft: '10px' }}>(Onward + Return)</span>
                        </div>
                        <button className="btn btn-primary btn-large" onClick={proceedToBook}>Proceed to Book</button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default function FlightListingPage({ searchData }) {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '16px', color: '#9ca3af' }}>Loading flights...</div>}>
            <FlightListingContent searchData={searchData} />
        </Suspense>
    );
}
