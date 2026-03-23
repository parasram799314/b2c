import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaChartBar, FaSpinner } from 'react-icons/fa';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');

// ─── helpers ──────────────────────────────────────────────────────────────────
const parseLocalDate = (str) => {
  if (!str) return new Date();
  const parts = str.split('-');
  if (parts.length === 3)
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return new Date(str);
};

const toYMD = (d) => {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const formatLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

// ─── DateStrip ────────────────────────────────────────────────────────────────
const DateStrip = ({ date, returnDate, onDateChange, from, to, cabin }) => {
  const [showGraph,    setShowGraph]    = useState(false);
  const [priceMap,     setPriceMap]     = useState({});   // { 'YYYY-MM-DD': number | null }
  const [loadingDates, setLoadingDates] = useState(false);
  const [currency,     setCurrency]     = useState('USD');
  const scrollRef = useRef(null);

  // ── Build 7 dates around selected date ──
  const baseDate = parseLocalDate(date);
  baseDate.setHours(0, 0, 0, 0);

  const returnDateObj = returnDate ? parseLocalDate(returnDate) : null;
  if (returnDateObj) returnDateObj.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let startDate = addDays(baseDate, -3);
  if (startDate < today) startDate = new Date(today);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(startDate, i);
    dates.push({
      dateObj:    d,
      ymd:        toYMD(d),
      label:      formatLabel(d),
      isCurrent:  d.toDateString() === baseDate.toDateString(),
      isDisabled: d < today,
    });
  }

  // ── Fetch prices from API ──
  const fetchPrices = useCallback(async () => {
    if (!from || !to || !date) return;

    setLoadingDates(true);
    try {
      const params = new URLSearchParams({ from, to, date, adults: 1 });
      const res = await fetch(`${API_BASE_URL}/api/flights/prices?${params}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const map = {};
        json.data.forEach(({ date: d, price, currency: cur }) => {
          map[d] = price;
          if (cur) setCurrency(cur);
        });
        setPriceMap(map);
      }
    } catch (err) {
      console.warn('[DateStrip] price fetch failed:', err.message);
    } finally {
      setLoadingDates(false);
    }
  }, [from, to, date]);

  // Fetch on mount and when route/date changes
  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // ── Format price display ──
  const formatPrice = (ymd) => {
    if (loadingDates) return '...';
    const p = priceMap[ymd];
    if (p == null) return '–';
    // If currency is INR show ₹, else show $
    const sym = currency === 'INR' ? '₹' : '$';
    return `${sym}${Math.round(p).toLocaleString('en-IN')}`;
  };

  // ── Find cheapest date for graph highlight ──
  const prices = Object.values(priceMap).filter(p => p != null);
  const minPrice = prices.length ? Math.min(...prices) : null;

  // ── Scroll controls ──
  const scrollLeft  = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left:  200, behavior: 'smooth' });

  // ── 15-day graph data ──
  const graphDates = Array.from({ length: 15 }, (_, i) => {
    const d   = addDays(today, i);
    const ymd = toYMD(d);
    return {
      label: formatLabel(d),
      price: priceMap[ymd] ?? null,
    };
  });
  const graphPrices = graphDates.map(g => g.price).filter(Boolean);
  const graphMax    = graphPrices.length ? Math.max(...graphPrices) : 1;
  const graphMin    = graphPrices.length ? Math.min(...graphPrices) : 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Left nav */}
      <button style={styles.navBtn} onClick={scrollLeft} aria-label="Previous dates">
        <FaChevronLeft />
      </button>

      <div style={styles.separator} />

      {/* Scrollable date list */}
      <div style={styles.scrollArea} ref={scrollRef}>
        {dates.map((item, index) => {
          const price      = formatPrice(item.ymd);
          const isCheapest = minPrice != null && priceMap[item.ymd] === minPrice;

          return (
            <div key={item.ymd} style={styles.itemWrapper}>
              <div
                style={{
                  ...styles.dateItem,
                  ...(item.isCurrent  ? styles.activeItem   : {}),
                  ...(item.isDisabled ? styles.disabledItem : {}),
                }}
                onClick={() => {
                  if (item.isDisabled) return;
                  const d = new Date(item.dateObj);
                  d.setHours(0, 0, 0, 0);
                  onDateChange?.(d);
                }}
              >
                {/* Date label */}
                <div style={{
                  ...styles.dateText,
                  ...(item.isCurrent  ? styles.activeText   : {}),
                  ...(item.isDisabled ? styles.disabledText : {}),
                }}>
                  {item.label}
                  {returnDateObj && ` – ${formatLabel(returnDateObj)}`}
                </div>

                {/* Price */}
                <div style={{
                  ...styles.priceText,
                  ...(item.isCurrent  ? styles.activeText   : {}),
                  ...(item.isDisabled ? styles.disabledText : {}),
                  ...(isCheapest && !item.isCurrent ? styles.cheapestText : {}),
                }}>
                  {loadingDates
                    ? <span style={{ opacity: 0.5, fontSize: '10px' }}>loading…</span>
                    : price
                  }
                </div>

                {/* Cheapest badge */}
                {isCheapest && !item.isDisabled && (
                  <div style={styles.cheapBadge}>Cheapest</div>
                )}
              </div>

              {index < dates.length - 1 && <div style={styles.itemSep} />}
            </div>
          );
        })}
      </div>

      {/* Right nav */}
      <button style={styles.navBtn} onClick={scrollRight} aria-label="Next dates">
        <FaChevronRight />
      </button>

      <div style={styles.separator} />

      {/* Price graph button */}
      <button style={styles.graphBtn} onClick={() => setShowGraph(true)}>
        <FaChartBar style={{ fontSize: '14px', color: '#1a73e8' }} />
        Price graph
      </button>

      {/* ── Price Graph Modal ── */}
      {showGraph && (
        <div
          style={styles.modalOverlay}
          onClick={() => setShowGraph(false)}
        >
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Price Trend</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666' }}>
                  {from} → {to} · Lowest fares for next 15 days
                </p>
              </div>
              <button onClick={() => setShowGraph(false)} style={styles.closeBtn}>✕</button>
            </div>

            {loadingDates ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <FaSpinner style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }} />
                <div style={{ marginTop: '10px', fontSize: '14px' }}>Fetching prices…</div>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'flex-end',
                height: '240px', gap: '6px',
                padding: '20px 0 30px',
                borderBottom: '1px solid #eee',
                marginTop: '20px',
              }}>
                {graphDates.map((g, i) => {
                  const hasPrice   = g.price != null;
                  const heightPct  = hasPrice
                    ? Math.max(10, ((g.price - graphMin) / (graphMax - graphMin || 1)) * 80 + 10)
                    : 5;
                  const isCheapest = hasPrice && g.price === graphMin;

                  return (
                    <div key={i} style={{
                      flex: 1, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '4px',
                    }}>
                      {hasPrice && (
                        <div style={{ fontSize: '9px', fontWeight: 'bold', color: isCheapest ? '#1a73e8' : '#333' }}>
                          {currency === 'INR' ? '₹' : '$'}{(g.price / 1000).toFixed(1)}k
                        </div>
                      )}
                      <div
                        title={hasPrice ? `${currency === 'INR' ? '₹' : '$'}${Math.round(g.price).toLocaleString()}` : 'No data'}
                        style={{
                          width: '100%',
                          height: `${heightPct}%`,
                          backgroundColor: isCheapest ? '#1a73e8' : hasPrice ? '#e8f0fe' : '#f0f0f0',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.3s',
                        }}
                      />
                      <div style={{
                        fontSize: '9px', color: '#666',
                        transform: 'rotate(-45deg)', marginTop: '4px',
                        whiteSpace: 'nowrap',
                      }}>
                        {g.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {!loadingDates && graphMin > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#1a73e8' }} />
                  <span>Cheapest — {currency === 'INR' ? '₹' : '$'}{Math.round(graphMin).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#e8f0fe' }} />
                  <span>Available</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: '#f0f0f0' }} />
                  <span>No data</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-white, #fff)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    marginBottom: '20px',
    width: '100%',
    overflow: 'hidden',
    border: '1px solid #ddd',
    height: '62px',
  },
  navBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 10px',
    color: '#5f6368',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    transition: 'background 0.15s',
    outline: 'none',
    flexShrink: 0,
  },
  separator: {
    width: '1px',
    height: '40px',
    backgroundColor: '#dadce0',
    flexShrink: 0,
  },
  scrollArea: {
    display: 'flex',
    flex: 1,
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    alignItems: 'center',
    height: '100%',
  },
  itemWrapper: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    minWidth: '90px',
    position: 'relative',
  },
  dateItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '0 8px',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
    transition: 'all 0.2s',
    height: '100%',
    position: 'relative',
  },
  activeItem: {
    borderBottomColor: '#1a73e8',
    backgroundColor: '#e8f0fe',
  },
  disabledItem: {
    opacity: 0.45,
    cursor: 'not-allowed',
    backgroundColor: '#f8f9fa',
  },
  dateText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: '2px',
    whiteSpace: 'nowrap',
  },
  priceText: {
    fontSize: '11px',
    color: '#5f6368',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  activeText: {
    color: '#1a73e8',
    fontWeight: '700',
  },
  disabledText: {
    color: '#bdc1c6',
  },
  cheapestText: {
    color: '#0d8a00',
    fontWeight: '700',
  },
  cheapBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    fontSize: '8px',
    fontWeight: '700',
    color: '#0d8a00',
    backgroundColor: '#e6f4ea',
    borderRadius: '4px',
    padding: '1px 4px',
    whiteSpace: 'nowrap',
  },
  itemSep: {
    width: '1px',
    height: '32px',
    backgroundColor: '#dadce0',
    flexShrink: 0,
  },
  graphBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    background: 'none',
    padding: '0 14px',
    cursor: 'pointer',
    fontSize: '11px',
    color: '#1a73e8',
    fontWeight: '600',
    height: '100%',
    minWidth: '72px',
    gap: '3px',
    flexShrink: 0,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '14px',
    width: '720px',
    maxWidth: '95%',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666',
    padding: '4px',
    lineHeight: 1,
  },
};

export default DateStrip;