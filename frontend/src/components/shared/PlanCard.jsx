// src/components/shared/PlanCard.jsx
import { useState ,useEffect, useRef  } from 'react';
import { Icons } from '../../ui/icons';

// ─── Policy Shield Icons ───────────────────────────────────────────────────────
const ShieldCheck = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5.5V11C4 15.4 7.4 19.5 12 21C16.6 19.5 20 15.4 20 11V5.5L12 2Z"
      stroke="#16a34a" strokeWidth="1.6" fill="#dcfce7" strokeLinejoin="round"/>
    <polyline points="8.5,12 11,14.5 15.5,9.5" stroke="#16a34a" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShieldCross = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5.5V11C4 15.4 7.4 19.5 12 21C16.6 19.5 20 15.4 20 11V5.5L12 2Z"
      stroke="#dc2626" strokeWidth="1.6" fill="#fee2e2" strokeLinejoin="round"/>
    <line x1="9" y1="9" x2="15" y2="15" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round"/>
    <line x1="15" y1="9" x2="9" y2="15" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export const ShieldEmpty = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5.5V11C4 15.4 7.4 19.5 12 21C16.6 19.5 20 15.4 20 11V5.5L12 2Z"
      stroke="#1a6fd4" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const KIWI = 'https://images.kiwi.com/airlines/64/';

export const getLogoUrl = (name = '') => {
  const u = (name || '').trim().toUpperCase();
  const n = (name || '').trim().toLowerCase();
  const MAP = { AI:'AI', IX:'IX', '6E':'6E', SG:'SG', QP:'QP', UK:'UK', G8:'G8', EK:'EK', QR:'QR', EY:'EY', LH:'LH', BA:'BA', SQ:'SQ', TK:'TK' };
  if (MAP[u]) return `${WEGO}${MAP[u]}.png`;
  if (u === 'HR') return `${KIWI}HR.png`;
  if (u === '9I') return `${KIWI}9I.png`;
  if (n.includes('air india express')) return `${WEGO}IX.png`;
  if (n.includes('air india'))  return `${WEGO}AI.png`;
  if (n.includes('indigo'))     return `${WEGO}6E.png`;
  if (n.includes('spicejet'))   return `${WEGO}SG.png`;
  if (n.includes('akasa'))      return `${WEGO}QP.png`;
  if (n.includes('vistara'))    return `${WEGO}UK.png`;
  if (n.includes('emirates'))   return `${WEGO}EK.png`;
  if (n.includes('qatar'))      return `${WEGO}QR.png`;
  if (/^[A-Z0-9]{2,3}$/.test(u)) return `${WEGO}${u}.png`;
  return null;
};

export const fmt = (n) => `Rs.${Math.round(Number(n)).toLocaleString('en-IN')}`;

export const fmtDate = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
    return dt.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  } catch { return d; }
};

export const getResolvedDate = (item) => {
  let d = '';
  if (item.type === 'flight')     d = item.depDate    || item.date || '';
  if (item.type === 'hotel')      d = item.checkIn    || item.date || '';
  if (item.type === 'transfer')   d = item.pickupDate || item.date || '';
  if (item.type === 'restaurant') d = item.visitDate  || item.date || '';
  if (item.type === 'attraction') d = item.date || '';
  if (item.type === 'other')      d = item.date || '';
  if (!d && item.id) {
    const parts = item.id.split('_');
    const last  = parts[parts.length - 1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(last)) d = last;
  }
  return d;
};

// ─── PTag ─────────────────────────────────────────────────────────────────────
export function PTag({ bg, color, children }) {
  return (
    <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'6px', background:bg||'#f3f4f6', color:color||'#374151', display:'inline-block' }}>
      {children}
    </span>
  );
}

// ─── PolicyShieldIcon ──────────────────────────────────────────────────────────
export function PolicyShieldIcon({ underPolicy = true }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {underPolicy ? <ShieldCheck size={18} /> : <ShieldCross size={18} />}
      {hovered && (
        <div style={{
          position: 'absolute', top: '24px', right: '50%',
          transform: 'translateX(50%)',
          background: underPolicy ? '#15803d' : '#b91c1c',
          color: '#fff', fontSize: '11px', fontWeight: 600,
          padding: '4px 10px', borderRadius: '6px',
          whiteSpace: 'nowrap', zIndex: 9999, pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        }}>
          {underPolicy ? 'Item is under policy' : 'Item is not under policy'}
          <div style={{
            position: 'absolute', left: '50%',
            transform: 'translateX(-50%)', width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
            borderBottom: `5px solid ${underPolicy ? '#15803d' : '#b91c1c'}`,
            borderTop: 'none', bottom: 'auto', top: '-5px',
          }} />
        </div>
      )}
    </div>
  );
}

// ─── ItemDetailModal ──────────────────────────────────────────────────────────
function ItemDetailModal({ item, onClose }) {
  const [imgErr, setImgErr] = useState(false);
  const logoSrc    = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;
  const hotelImg   = item.type === 'hotel'  ? (item.image || item.imageUrl || item.photo || null) : null;
  const resolvedDate = getResolvedDate(item);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'18px', width:'100%', maxWidth:'420px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'rgb(247,190,57)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:'14px', color:'#1a1a1a' }}>
            {item.type === 'flight' ? 'Flight Details' : item.type === 'hotel' ? 'Hotel Details' : item.type === 'attraction' ? 'Attraction' : item.type === 'other' ? 'Activity' : 'Transfer'}
          </span>
          <button onClick={onClose} style={{ width:'26px', height:'26px', borderRadius:'50%', background:'rgba(0,0,0,0.12)', border:'none', cursor:'pointer', fontSize:'13px', color:'#1a1a1a' }}>x</button>
        </div>

        <div style={{ padding:'18px', overflowY:'auto', flex:1 }}>
          <div style={{ marginBottom:'12px' }}>
            {item.status === 'paid'      && <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:'#dcfce7', color:'#16a34a' }}>Paid</span>}
            {item.status === 'cancelled' && <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:'#fee2e2', color:'#dc2626' }}>Cancelled</span>}
            {(!item.status || item.status === 'pending') && <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'20px', background:'#fef3c7', color:'#92400e' }}>Pending</span>}
          </div>

          {item.type === 'flight' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                <div style={{ width:'48px', height:'48px', borderRadius:'12px', background:'#fff5f0', border:'1px solid #ffe4d6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {logoSrc && !imgErr ? <img src={logoSrc} alt={item.airline} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={() => setImgErr(true)} /> : <span style={{ fontSize:'22px' }}>✈️</span>}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'15px', color:'#111827' }}>{item.airline}</div>
                  <div style={{ fontSize:'12px', color:'#9ca3af' }}>{item.flightNumber}</div>
                </div>
              </div>
              <div style={{ background:'#f9fafb', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                <div>
                  <div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Departure</div>
                  <div style={{ fontSize:'22px', fontWeight:800, color:'#111' }}>{item.depTime || item.departureTime || '-'}</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>{item.fromAirport || item.from || '-'}</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'11px', color:'#6b7280' }}>{item.duration}</div>
                  <div style={{ fontSize:'10px', fontWeight:700, color:'#16a34a', marginTop:'4px' }}>
                    {Number(item.stops) === 0 ? 'Non-stop' : `${item.stops} Stop${item.stops > 1 ? 's' : ''}`}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:'10px', color:'#9ca3af', marginBottom:'2px' }}>Arrival</div>
                  <div style={{ fontSize:'22px', fontWeight:800, color:'#111' }}>
                    {item.arrTime || item.arrivalTime || '-'}
                    {item.nextDay && <sup style={{ fontSize:'10px', color:'rgb(247,190,57)' }}>+1</sup>}
                  </div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#374151' }}>{item.toAirport || item.to || '-'}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {resolvedDate && <PTag bg="#fef3c7" color="#92400e">{fmtDate(resolvedDate)}</PTag>}
                {item.price   && <PTag bg="#fef9c3" color="#713f12">{fmt(item.price)}</PTag>}
                <PTag bg="#f3f4f6" color="#374151">{item.baggage?.iB || '15 Kg'} / {item.baggage?.cB || '7 Kg'}</PTag>
              </div>
            </div>
          )}

          {item.type === 'hotel' && (
            <div>
              {hotelImg && <img src={hotelImg} alt={item.hotelName || item.name} style={{ width:'100%', height:'160px', objectFit:'cover', borderRadius:'10px', marginBottom:'14px' }} onError={e => { e.target.style.display = 'none'; }} />}
              <div style={{ fontWeight:700, fontSize:'15px', color:'#111827', marginBottom:'4px' }}>{item.hotelName || item.name || 'Hotel'}</div>
              {item.stars && <div style={{ marginBottom:'6px' }}>{'*'.repeat(Math.min(Number(item.stars), 5))}</div>}
              {(item.address || item.cityName) && <div style={{ fontSize:'12px', color:'#6b7280', marginBottom:'12px' }}>{item.address || item.cityName}</div>}
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {item.checkIn && <PTag bg="#fef3c7" color="#92400e">Check-in: {fmtDate(item.checkIn)}</PTag>}
                {item.nights  && <PTag bg="#dbeafe" color="#1e40af">{item.nights} Night{Number(item.nights) > 1 ? 's' : ''}</PTag>}
                {item.rating  && <PTag bg="#dcfce7" color="#166534">{item.rating}</PTag>}
                {item.price   && <PTag bg="#fef9c3" color="#713f12">{fmt(parseFloat(item.price) * (Number(item.nights) || 1))}</PTag>}
              </div>
            </div>
          )}

          {item.type === 'attraction' && (
            <div>
              <div style={{ fontWeight:700, fontSize:'15px', color:'#111827', marginBottom:'8px' }}>{item.name || 'Attraction'}</div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {item.category && <PTag bg="#f3f4f6" color="#374151">{item.category}</PTag>}
                {item.rating   && <PTag bg="#dcfce7" color="#166534">{item.rating}</PTag>}
                {item.duration && <PTag bg="#dbeafe" color="#1e40af">{item.duration}</PTag>}
              </div>
            </div>
          )}

          {item.type === 'transfer' && (
            <div>
              <div style={{ fontWeight:700, fontSize:'15px', color:'#111827', marginBottom:'4px' }}>{item.provider || item.id || 'Transfer'}</div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'8px' }}>
                {item.from && item.to && <PTag bg="#f3f4f6" color="#374151">{item.from} to {item.to}</PTag>}
                {item.duration && <PTag bg="#dbeafe" color="#1e40af">{item.duration}</PTag>}
                {item.price    && <PTag bg="#fef9c3" color="#713f12">{item.price}</PTag>}
              </div>
            </div>
          )}

          {item.type === 'other' && (
            <div>
              <div style={{ fontWeight:700, fontSize:'15px', color:'#111827', marginBottom:'8px' }}>{item.name || item.activity || 'Activity'}</div>
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {item.date     && <PTag bg="#fef3c7" color="#92400e">{fmtDate(item.date)}</PTag>}
                {item.duration && <PTag bg="#dbeafe" color="#1e40af">{item.duration}</PTag>}
                {item.price    && <PTag bg="#fef9c3" color="#713f12">{fmt(item.price)}</PTag>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 1. Accept currentTripId as a prop
function MoveToTripBody({ itemName, onMove, currentTripId }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null); // Add error state

  useEffect(() => {
    // Use axios instead of fetch (it carries interceptors/auth headers)
    import('axios').then(({ default: axios }) => {
      axios.get('/api/rfqs')
        .then(res => {
          const all = res.data?.data || [];
          // Filter out the current trip
          setTrips(all.filter(t => t._id !== currentTripId));
          setLoading(false);
        })
        .catch(err => {
          console.error('Failed to load trips:', err);
          setError('Could not load trips. Please try again.');
          setLoading(false);
        });
    });
  }, [currentTripId]);

  const DEST_IMAGES = {
    dubai:   'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=300&q=80',
    london:  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=80',
    paris:   'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=80',
    default: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=300&q=80',
  };

  const getImg = (rfq) => {
    const dest = (rfq.destinations?.[0]?.destination || '').toLowerCase();
    for (const [k, v] of Object.entries(DEST_IMAGES)) {
      if (dest.includes(k)) return v;
    }
    return DEST_IMAGES.default;
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        Select a trip to move into
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>Loading trips…</div>
      ) : trips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af' }}>No other trips found.</div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {trips.map(t => (
            <div
              key={t._id}
              onClick={() => setSelected(prev => prev === t._id ? null : t._id)}
              style={{
                flexShrink: 0, width: '170px', borderRadius: '14px', overflow: 'hidden', cursor: 'pointer',
                border: selected === t._id ? '2.5px solid rgb(247,190,57)' : '2px solid #e5e7eb',
                boxShadow: selected === t._id ? '0 4px 16px rgba(247,190,57,0.3)' : '0 2px 6px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              {/* Check badge */}
              {selected === t._id && (
                <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, width: '20px', height: '20px', borderRadius: '50%', background: 'rgb(247,190,57)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
              <img src={getImg(t)} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }} onError={e => e.target.src = DEST_IMAGES.default} />
              <div style={{ padding: '10px 10px 12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.tripName || 'Untitled Trip'}</div>
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {t.destinations?.[0]?.destination || 'Unknown'}</div>
                <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '6px', padding: '2px 6px', borderRadius: '4px', background: '#f3f4f6', color: '#6b7280', display: 'inline-block' }}>
                  {t.planItems?.length || 0} items
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={() => { if (selected) onMove(trips.find(t => t._id === selected)); }}
        disabled={!selected}
        style={{
          marginTop: '16px', width: '100%', padding: '11px',
          background: selected ? 'rgb(247,190,57)' : '#f3f4f6',
          color: selected ? '#1a1a1a' : '#9ca3af',
          border: 'none', borderRadius: '12px',
          fontSize: '13px', fontWeight: 900,
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        {selected ? `Move to "${trips.find(t => t._id === selected)?.tripName || 'Selected Trip'}" →` : 'Select a trip above'}
      </button>
    </div>
  );
}
function ThreeDotMenu({ onRemove,onMoveToTrip, itemName , currentTripId ,item ,status}) {
  const [open, setOpen] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.right + window.scrollX - 180, // right-align
      });
    }
    setOpen(v => !v);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* 3-dot button — HORIZONTAL */}
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          border: 'none', background: open ? '#f3f4f6' : 'transparent',
          width: '26px', height: '26px', borderRadius: '50%',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#6b7280',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="More options"
      >
        {/* HORIZONTAL 3 dots */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="19" cy="12" r="2"/>
        </svg>
      </button>

      {/* Dropdown — fixed positioning to avoid overflow */}
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 99999,
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '6px',
            minWidth: '180px',
          }}
        >
          {/* Move to another trip */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
             setShowMoveModal(true);
            }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '8px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: '12px', fontWeight: 600, color: '#374151',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
            Move to another trip
          </button>

          {/* Divider & Delete - Only show if not paid */}
          {status !== 'paid' && (
            <>
              <div style={{ height: '1px', background: '#f3f4f6', margin: '4px 0' }} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onRemove();
                }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', borderRadius: '8px', border: 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, color: '#dc2626',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Delete item
              </button>
            </>
          )}
        </div>
      )}
      {showMoveModal && (
  <div
    onClick={() => setShowMoveModal(false)}
    style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: '#fff', borderRadius: '20px',
        width: '100%', maxWidth: '640px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ background: 'rgb(247,190,57)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a1a' }}>Move to Another Trip</div>
          <div style={{ fontSize: '11px', color: 'rgba(26,26,26,0.65)', marginTop: '2px' }}>{itemName}</div>
        </div>
        <button onClick={() => setShowMoveModal(false)} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>×</button>
      </div>

      {/* Body */}
      <MoveToTripBody itemName={itemName} onMove={(targetTrip) => { setShowMoveModal(false); onMoveToTrip && onMoveToTrip(item,targetTrip); }} />
    </div>
  </div>
)}
    </div>
  );
}

// ─── PlanCard (Main Component) ────────────────────────────────────────────────
export default function PlanCard({ item, onRemove, itemIndex, onReorder, readOnlyPlan = false, onUpdateItem, showCheckOut = false, onMoveToTrip, currentTripId }) {
  const [imgErr,      setImgErr]      = useState(false);
  const [showDetail,  setShowDetail]  = useState(false);
  const [showNotes,   setShowNotes]   = useState(false);
  const [isDragging,  setIsDragging]  = useState(false);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [noteText,    setNoteText]    = useState(item.userNote || item.note || '');
  const [attachments, setAttachments] = useState(item.attachments || []);

  const status       = item.status || 'pending';
  const resolvedDate = getResolvedDate(item);
  const titleText    = item.type === 'flight'
    ? `${item.fromAirport || item.from || ''} to ${item.toAirport || item.to || ''}`
    : item.hotelName || item.name || item.type;
  const logoSrc = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;

  const borderStyle = readOnlyPlan
    ? { borderColor: '#86efac', background: '#f0fdf4' }
    : status === 'paid'
    ? { borderColor: '#86efac', background: '#f0fdf4' }
    : (item.type === 'other' && status === 'pending')
      ? { borderColor: '#fde68a', background: '#fffdf5' }
      : { borderColor: '#e5e7eb', background: '#fff' };

  const TrashIcon = () => (
    <svg width="14" height="15" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 3H10M4 3V2H7V3M2 3L2.5 10.5C2.5 10.8 2.7 11 3 11H8C8.3 11 8.5 10.8 8.5 10.5L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 5.5V8.5M6.5 5.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );

  const renderFlightContent = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f5f9', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {logoSrc && !imgErr
            ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setImgErr(true)} />
            : <Icons.Plane className="w-6 h-6 text-blue-500" />}
        </div>
        <div style={{ minWidth: '80px' }}>
          <div style={{ fontSize: '15px', color: '#1a1a1a', fontWeight: 800 }}>{item.airline || 'AI'}</div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{item.flightNumber || 'AI2592'}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{item.depTime || '16:40'}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{item.from || 'IDR'}</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', minWidth: '80px', position: 'relative' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
               <Icons.Clock className="w-2.5 h-2.5" /> {item.duration || '10h 10m'}
            </div>
            <div style={{ height: '1.5px', background: '#e2e8f0', width: '100%' }} />
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
               <Icons.Plane className="w-2.5 h-2.5 text-amber-500" /> {item.stops === 0 ? 'Non-stop' : `${item.stops || 2} Stops`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{item.arrTime || '01:20'}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{item.to || 'DXB'}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px' }}>
            {readOnlyPlan && (
              <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', background: '#166534', color: '#fff', textTransform: 'uppercase' }}>
                Approved
              </span>
            )}
            <PolicyShieldIcon underPolicy={item.id?.charCodeAt(0) % 2 === 0} />
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: status === 'paid' ? '#dcfce7' : '#fef3c7', color: status === 'paid' ? '#16a34a' : '#92400e', textTransform: 'uppercase' }}>
              {item.type === 'other' ? (status === 'paid' ? 'PAID' : 'UNPAID') : status}
            </span>
          {!readOnlyPlan && (
 <ThreeDotMenu onRemove={() => onRemove(item.id)} itemName={titleText} onMoveToTrip={onMoveToTrip}  currentTripId={currentTripId}    item={item} status={status}/>
)}

          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>{fmt(item.price || 0)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      draggable={!readOnlyPlan && status !== 'paid'}
      onDragStart={(e) => {
        setIsDragging(true);
        e.dataTransfer.setData('planReorderIdx', String(itemIndex));
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setIsDragging(false)}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
        const fromIdx = parseInt(e.dataTransfer.getData('planReorderIdx'));
        if (!isNaN(fromIdx) && fromIdx !== itemIndex) onReorder(fromIdx, itemIndex);
      }}
      style={{ position: 'relative', marginBottom: '16px', opacity: isDragging ? 0.5 : 1, outline: isDragOver ? '2px dashed #F5A623' : 'none', borderRadius: '16px', cursor: readOnlyPlan || status === 'paid' ? 'default' : 'grab' }}
    >
      {item.type === 'other' && (
        <span style={{ position: 'absolute', top: '-9px', right: '12px', zIndex: 5, fontSize: '8px', fontWeight: 900, padding: '2px 10px', borderRadius: '4px', background: 'rgb(247,190,57)', color: '#1a1a1a', border: '1.5px solid #f59e0b', letterSpacing: '0.08em', textTransform: 'uppercase', boxShadow: '0 2px 6px rgba(247,190,57,0.45)', whiteSpace: 'nowrap' }}>⚡ External</span>
      )}

      {showDetail && <ItemDetailModal item={item} onClose={() => setShowDetail(false)} />}

      <div style={{ border: '1.5px solid', borderRadius: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', ...borderStyle, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px' }} onClick={() => setShowDetail(true)}>
          {item.type === 'flight' ? renderFlightContent() : (
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '12px' }}>
              {/* Left: Icon Box */}
              <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                {item.type === 'hotel' ? '🏨' : item.type === 'attraction' ? '🗺️' : item.type === 'transfer' ? '🚗' : '📌'}
              </div>

              {/* Center: Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {titleText}
                </span>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.address || item.cityName || item.destination}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', alignItems: 'center' }}>
                  {/* Default/Day-wise: Single Date Badge */}
                  {!showCheckOut && resolvedDate && (
                    <PTag bg="#f1f5f9" color="#475569">{fmtDate(resolvedDate)}</PTag>
                  )}

                  {/* Item-wise Hotel view: Check-in → Check-out Row */}
                  {showCheckOut && item.type === 'hotel' ? (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                      <PTag bg="#f1f5f9" color="#475569">{fmtDate(item.checkIn || resolvedDate)}</PTag>
                      <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                        CHECK-IN
                      </span>

                      <span style={{ color: '#9ca3af', fontSize: '11px', margin: '0 6px' }}>→</span>

                      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '2px 8px', fontSize: '11px', fontWeight: 600, color: '#374151' }}>
                        {fmtDate(item.checkOut)}
                      </div>
                      <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                        CHECK-OUT
                      </span>

                      {item.nights && (
                        <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, marginLeft: '8px' }}>
                          {item.nights} Night{item.nights > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  ) : (
                    /* Regular Status Tags (used for day-wise or non-hotel items) */
                    item.type === 'hotel' && !showCheckOut && (
                      <>
                        {item._isCheckIn ? (
                          <>
                            <span style={{ background: '#dcfce7', color: '#166534', border: '1px solid #86efac', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                              CHECK-IN
                            </span>
                            <span style={{ 
                              background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe',
                              fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px'
                            }}>
                              1/{item._totalNights || 1}N
                            </span>
                          </>
                        ) : item._isCheckOut ? (
                          <>
                            <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px' }}>
                              CHECK-OUT
                            </span>
                          </>
                        ) : (
                          <>
                            <span style={{ 
                              background: '#eff6ff', color: '#1e40af', border: '1px solid #dbeafe',
                              fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', marginLeft: '6px'
                            }}>
                              {item._nightNumber}/{item._totalNights || 1}N
                            </span>
                          </>
                        )}
                      </>
                    )
                  )}

                  {(item.startTime || item.endTime) && <PTag bg="#f0f9ff" color="#0369a1">🕒 {item.startTime || ''} {item.endTime ? `- ${item.endTime}` : ''}</PTag>}
                  {item.referenceId && <PTag bg="#f3f4f6" color="#6b7280">Ref: {item.referenceId}</PTag>}
                </div>
              </div>

              {/* Right: Status + Price */}
              <div style={{ textAlign: 'right', minWidth: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                  {readOnlyPlan && (
                    <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', background: '#166534', color: '#fff', textTransform: 'uppercase' }}>Approved</span>
                  )}
                  <PolicyShieldIcon underPolicy={item.id?.charCodeAt(0) % 2 === 0} />
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: status === 'paid' ? '#dcfce7' : '#fef3c7', color: status === 'paid' ? '#16a34a' : '#92400e', textTransform: 'uppercase' }}>
                    {status === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
             {!readOnlyPlan && (
 <ThreeDotMenu onRemove={() => onRemove(item.id)} itemName={titleText} onMoveToTrip={onMoveToTrip}  currentTripId={currentTripId} item={item} status={status} />
)}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>
                  {item.price ? fmt(item.price) : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes Bar */}
        <div onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }} style={{ background: '#f8fafc', padding: '5px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: noteText ? '#334155' : '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {noteText || "Add notes"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#e2e8f0' }}>|</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attachment({attachments.length})
          </div>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', zIndex: 10, position: 'relative' }}>
          {/* Close Icon */}
          <button 
            onClick={() => setShowNotes(false)}
            style={{ 
              position: 'absolute', top: '10px', right: '10px', 
              background: 'none', border: 'none', cursor: 'pointer', 
              padding: '4px', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Type notes here..."
            rows={3}
            style={{ width: '100%', fontSize: '13px', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: '#fff', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📎 Attach File
              <input type="file" multiple style={{ display: 'none' }} onChange={e => {
                const files = Array.from(e.target.files).map(f => ({ name: f.name }));
                setAttachments(prev => [...prev, ...files]);
              }} />
            </label>
            <button
              onClick={() => {
                setShowNotes(false);
                if (onUpdateItem) onUpdateItem(item.id, { userNote: noteText, attachments });
              }}
              style={{ flex: 1, background: 'rgb(247,190,57)', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#1a1a1a' }}
            >
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}