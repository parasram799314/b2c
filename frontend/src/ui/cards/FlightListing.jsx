'use client';
import React, { useEffect, useState, Suspense, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch } from '../../context/SearchContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { FaTimes, FaChevronDown, FaChevronUp, FaThLarge, FaList } from 'react-icons/fa';
import FlightSearch from '../../components/FlightSearch';
import FlightCard from '../../components/FlightCard';
import { searchFlights } from '../../services/api';
import DateStrip from '../../components/DateStrip';
import DualSlider from '../../components/DualSlider';

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

// ─── Mock data (same as Doc 4) ────────────────────────────────────────────────
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
const FlightListingContent = () => {
    const {
        searchData: ctxData,
        selectedFlight, setSelectedFlight,
        selectedReturnFlight, setSelectedReturnFlight
    } = useSearch();
    const router = useRouter();

    const [flights,       setFlights]       = useState({ onward: [], return: [] });
    const [loading,       setLoading]       = useState(true);
    const [currentParams, setCurrentParams] = useState(ctxData);
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
    const observerTarget = useRef(null);

    // Infinite scroll
    useEffect(() => {
        const obs = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) setVisibleCount(p => p + 15);
        }, { threshold: 0.1 });
        if (observerTarget.current) obs.observe(observerTarget.current);
        return () => { if (observerTarget.current) obs.unobserve(observerTarget.current); };
    }, []);

    useEffect(() => { if (ctxData) setCurrentParams(ctxData); }, [ctxData]);

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

    const handleDateChange = (newDate) => {
        if (!currentParams) return;
        const y  = newDate.getFullYear();
        const mo = String(newDate.getMonth() + 1).padStart(2, '0');
        const d  = String(newDate.getDate()).padStart(2, '0');
        setCurrentParams(p => ({ ...p, date: `${y}-${mo}-${d}` }));
    };

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

    const searchDataProp = useMemo(() => {
        if (!currentParams) return null;
        return {
            from:        currentParams.from,
            to:          currentParams.to,
            date:        currentParams.date,
            returnDate:  currentParams.returnDate || '',
            tripType:    currentParams.tripType   || 'oneWay',
            travelClass: currentParams.travelClass || 'Economy',
            passengers:  { adult: currentParams.adults || 1, children: currentParams.children || 0, infant: currentParams.infants || 0 },
            isDirectFlight:    currentParams.isDirectFlight,
            isConnectingFlight: currentParams.isConnectingFlight,
        };
    }, [currentParams]);

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

    // ── Active filter tags (same as Doc 4 — full set) ──
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
        ...(filters.duration.stopover[0] !== 30  || filters.duration.stopover[1] !== 720) ? [{
            label: `Stopover: ${formatMins(filters.duration.stopover[0])}-${formatMins(filters.duration.stopover[1])}`,
            color: '#0d47a1', bg: '#e3f2fd', border: '#bbdefb',
            clear: () => setF(p => ({ ...p, duration: { ...p.duration, stopover: [30, 720] } }))
        }] : [],
        ...(filters.duration.total[0] !== 120 || filters.duration.total[1] !== 990) ? [{
            label: `Total: ${formatMins(filters.duration.total[0])}-${formatMins(filters.duration.total[1])}`,
            color: '#0d47a1', bg: '#e3f2fd', border: '#bbdefb',
            clear: () => setF(p => ({ ...p, duration: { ...p.duration, total: [120, 990] } }))
        }] : [],
        ...(filters.cabin !== 'Economy') ? [{
            label: filters.cabin,
            color: '#880e4f', bg: '#fce4ec', border: '#f8bbd9',
            clear: () => setF(p => ({ ...p, cabin: 'Economy' }))
        }] : [],
    ];

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <>
            <Header />

            {/* Top search bar */}
            <div style={{ background: 'linear-gradient(135deg, #F7BE39, #9e8240)', padding: '10px 0', marginBottom: '16px', boxShadow: '0 4px 20px rgba(191,160,90,0.3)' }}>
                <div className="container" style={{ padding: '0 10px' }}>
                    <FlightSearch
                        initialData={searchDataProp}
                        onSearch={() => {}}
                        customStyle={{ top: 0, marginTop: 0, boxShadow: 'none', padding: '20px', maxWidth: '100%', borderRadius: '8px' }}
                    />
                </div>
            </div>

            <div className="container flight-list-layout" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: canProceed ? '100px' : '60px' }}>

                {/* Mobile filter btn */}
                <div className="only-mobile" style={{ marginBottom: '16px', width: '100%' }}>
                    <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setShowMobileFilter(true)}>
                        Filter Results
                    </button>
                </div>

                {/* ══════════════════════ FILTER SIDEBAR ══════════════════════ */}
                <div className={`flight-list-sidebar ${showMobileFilter ? 'active' : ''}`}>
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
                            {/* "1 stop or fewer" combined checkbox (same as Doc 4) */}
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

                        {/* ─── 3. BAGGAGE (static) ─── */}
                        <FilterSection title="Baggage" onReset={() => {}}>
                            <CheckRow id="bag-cabin"   label="Cabin bag"    checked={false} onChange={() => {}} />
                            <CheckRow id="bag-checked" label="Checked bag"  checked={false} onChange={() => {}} />
                        </FilterSection>

                        {/* ─── 4. MAX PRICE ─── */}
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

                        {/* ─── 5. TIMES ─── */}
                        <FilterSection title="Times" onReset={() => setF(p => ({ ...p, departureTime: [0, 24], arrivalTime: [0, 24] }))}>
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>Departure time</span>
                                    <span style={{ color: '#F7BE39', fontWeight: 600 }}>
                                        {String(filters.departureTime[0]).padStart(2,'0')}:00 – {String(filters.departureTime[1]).padStart(2,'0')}:00
                                    </span>
                                </div>
                                <DualSlider min={0} max={24} initialValues={filters.departureTime} onChange={v => setF(p => ({ ...p, departureTime: v }))} />
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
                                <DualSlider min={0} max={24} initialValues={filters.arrivalTime} onChange={v => setF(p => ({ ...p, arrivalTime: v }))} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    <span>00:00</span><span>24:00</span>
                                </div>
                            </div>
                        </FilterSection>

                        {/* ─── 6. AIRLINES ─── */}
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

                        {/* ─── 7. AIRPORTS ─── */}
                        <FilterSection
                            title="Airports" onReset={() => setF(p => ({ ...p, airports: [] }))}
                            collapsible expanded={expandedSections.airports}
                            onToggle={() => toggleSection('airports')}
                        >
                            <div style={{ marginBottom: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Arrival Airport</span>
                            </div>
                            {airportStats.length > 0 ? airportStats.map(ap => (
                                <CheckRow
                                    key={ap.code} id={`ap-${ap.code}`} label={ap.name}
                                    checked={filters.airports.includes(ap.code)}
                                    onChange={() => toggleAirport(ap.code)}
                                    rightLabel={ap.minPrice !== Infinity ? fmt(ap.minPrice) : ''}
                                />
                            )) : <div style={{ fontSize: '12px', color: '#9ca3af' }}>No data</div>}
                        </FilterSection>

                        {/* ─── 8. DURATION ─── */}
                        <FilterSection
                            title="Duration"
                            onReset={() => setF(p => ({ ...p, duration: { stopover: [30, 720], total: [120, 990] } }))}
                            collapsible expanded={expandedSections.duration}
                            onToggle={() => toggleSection('duration')}
                            summary={`${formatMins(filters.duration.stopover[0])}–${formatMins(filters.duration.stopover[1])}, ...`}
                        >
                            {/* Stopover Duration */}
                            <div style={{ marginBottom: '18px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>Stopover Duration</span>
                                    <span style={{ color: '#F7BE39', fontWeight: 600 }}>
                                        {formatMins(filters.duration.stopover[0])}–{formatMins(filters.duration.stopover[1])}
                                    </span>
                                </div>
                                <DualSlider min={30} max={720} initialValues={filters.duration.stopover}
                                    onChange={v => setF(p => ({ ...p, duration: { ...p.duration, stopover: v } }))} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    <span>30m</span><span>12h</span>
                                </div>
                            </div>
                            {/* Total Duration */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 600 }}>Total Duration</span>
                                    <span style={{ color: '#F7BE39', fontWeight: 600 }}>
                                        {formatMins(filters.duration.total[0])}–{formatMins(filters.duration.total[1])}
                                    </span>
                                </div>
                                <DualSlider min={120} max={990} initialValues={filters.duration.total}
                                    onChange={v => setF(p => ({ ...p, duration: { ...p.duration, total: v } }))} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                    <span>2h</span><span>16h 30m</span>
                                </div>
                            </div>
                        </FilterSection>

                        {/* ─── 9. STOPOVER CITIES (mock — same as Doc 4) ─── */}
                        <FilterSection
                            title="Stopover Cities"
                            onReset={() => setF(p => ({ ...p, stopoverCities: [] }))}
                            collapsible expanded={expandedSections.stopoverCities}
                            onToggle={() => toggleSection('stopoverCities')}
                        >
                            {STOPOVER_CITIES.map(city => (
                                <label key={city.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={filters.stopoverCities.includes(city.name)} onChange={() => toggleStopoverCity(city.name)}
                                            style={{ width: '15px', height: '15px', accentColor: '#F7BE39', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{city.name}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>₹{city.price}</span>
                                </label>
                            ))}
                        </FilterSection>

                        {/* ─── 10. AIRCRAFTS (mock — same as Doc 4) ─── */}
                        <FilterSection
                            title="Aircrafts"
                            onReset={() => setF(p => ({ ...p, aircrafts: [] }))}
                            collapsible expanded={expandedSections.aircrafts}
                            onToggle={() => toggleSection('aircrafts')}
                        >
                            {AIRCRAFTS.map(ac => (
                                <label key={ac.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input type="checkbox" checked={filters.aircrafts.includes(ac.name)} onChange={() => toggleAircraft(ac.name)}
                                            style={{ width: '15px', height: '15px', accentColor: '#F7BE39', cursor: 'pointer' }} />
                                        <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{ac.name}</span>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>₹{ac.price}</span>
                                </label>
                            ))}
                        </FilterSection>

                        {/* ─── 11. CABIN CLASS ─── */}
                        <FilterSection
                            title="Cabin"
                            onReset={() => setF(p => ({ ...p, cabin: 'Economy' }))}
                            collapsible expanded={expandedSections.cabin}
                            onToggle={() => toggleSection('cabin')}
                        >
                            {CABIN_OPTIONS.map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer' }}>
                                    <input
                                        type="radio" name="cabin" value={opt} checked={filters.cabin === opt}
                                        onChange={() => setF(p => ({ ...p, cabin: opt }))}
                                        style={{ width: '15px', height: '15px', accentColor: '#F7BE39', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{opt}</span>
                                </label>
                            ))}
                        </FilterSection>

                    </div>
                </div>

                {/* ══════════════════════ MAIN FLIGHT LIST ══════════════════════ */}
                <div className="flight-list-content" style={{ flex: 1, minWidth: 0 }}>

                    {/* Date strip */}
                    {currentParams && (
                        <DateStrip
                            date={currentParams.date} returnDate={currentParams.returnDate}
                            onDateChange={handleDateChange}
                            from={currentParams.from} to={currentParams.to}
                            cabin={currentParams.travelClass || currentParams.cabin}
                        />
                    )}

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
                                            { label: 'Onward', date: searchDataProp?.date,       list: filteredOnward, sel: selectedFlight,       setSel: setSelectedFlight       },
                                            { label: 'Return', date: searchDataProp?.returnDate, list: filteredReturn, sel: selectedReturnFlight, setSel: setSelectedReturnFlight },
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

                {/* Ad sidebar */}
                <div className="ad-sidebar" style={{ width: '180px', minWidth: '180px', position: 'sticky', top: '20px', height: 'calc(100vh - 140px)' }}>
                    <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '8px', overflow: 'hidden', minHeight: '600px' }}>
                        <img src="/images/Pamphlet.jpg" alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                </div>
            </div>

            {/* Split view footer */}
            {isRoundTrip && isSplitView && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', boxShadow: '0 -2px 12px rgba(0,0,0,0.1)', padding: '14px 20px', zIndex: 1000 }}>
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#9ca3af' }}>Total Trip Cost</div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#F7BE39' }}>₹{totalPrice.toLocaleString('en-IN')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#374151', textAlign: 'right' }}>
                                {!selectedFlight       && <div style={{ color: '#ef4444' }}>Select Onward Flight</div>}
                                {!selectedReturnFlight && <div style={{ color: '#ef4444' }}>Select Return Flight</div>}
                            </div>
                            <button className="btn btn-primary" style={{ padding: '12px 36px', fontSize: '15px', opacity: canProceed ? 1 : 0.5, cursor: canProceed ? 'pointer' : 'not-allowed' }} disabled={!canProceed} onClick={proceedToBook}>
                                Book Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Round trip proceed footer */}
            {canProceed && isRoundTrip && !isSplitView && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#003366', padding: '14px 0', color: 'white', zIndex: 1000, boxShadow: '0 -2px 10px rgba(0,0,0,0.2)' }}>
                    <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '18px', fontWeight: 700 }}>Total: ₹{totalPrice.toLocaleString('en-IN')}</span>
                            <span style={{ fontSize: '12px', color: '#93c5fd', marginLeft: '10px' }}>(Onward + Return)</span>
                        </div>
                        <button className="btn btn-primary btn-large" onClick={proceedToBook}>Proceed to Book</button>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default function FlightListing() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '16px', color: '#9ca3af' }}>Loading flights...</div>}>
            <FlightListingContent />
        </Suspense>
    );
}