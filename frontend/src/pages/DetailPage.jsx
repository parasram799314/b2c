// pages/DetailPage.jsx
import { useState, useRef, useEffect, useCallback,useMemo  } from 'react';
import { parseDays } from '../utils/itineraryHelpers';
import AIChat         from '../components/detail/AIChat';
import FlightsTab     from '../components/FlightsTab';
import HotelCard      from '../components/detail/HotelCard';
import AttractionCard from '../components/detail/AttractionCard';
import TransportCard  from '../components/detail/TransportCard';
import GenieChatButton from '../components/detail/GenieChatButton';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const KIWI = 'https://images.kiwi.com/airlines/64/';

const getLogoUrl = (name = '') => {
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

const fmt     = (n) => `Rs.${Math.round(Number(n)).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '';
  try {
    const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
    return dt.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  } catch { return d; }
};

const getResolvedDate = (item) => {
  let d = '';
  if (item.type === 'flight')     d = item.depDate    || item.date || '';
  if (item.type === 'hotel')      d = item.checkIn    || item.date || '';
  if (item.type === 'transport')  d = item.pickupDate || item.date || '';
  if (item.type === 'restaurant') d = item.visitDate  || item.date || '';
  if (item.type === 'other')      d = item.date || '';
  if (!d && item.id) {
    const parts = item.id.split('_');
    const last  = parts[parts.length - 1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(last)) d = last;
  }
  return d;
};

// ─── getItemDestination ───────────────────────────────────────────────────────
function getItemDestination(item, destNames) {
  const candidates = [
    item.cityName,
    item.destination,
    item.toAirport,
    item.to,
    item.address,
    item.name,
  ].filter(Boolean).map(s => String(s).toLowerCase());

  for (const dest of destNames) {
    const dl = dest.toLowerCase();
    if (candidates.some(c => c.includes(dl) || dl.includes(c))) return dest;
  }

  if (item.id) {
    for (const dest of destNames) {
      if (item.id.toLowerCase().includes(dest.toLowerCase())) return dest;
    }
  }

  return null;
}

// ─── PermissionAvatars ────────────────────────────────────────────────────────
const DUMMY_USERS = [
  { initial: 'T', name: 'Trushant Shah', permission: 'Admin',    permBg: '#ede9fe', permColor: '#5b21b6', avatarBg: '#8b5cf6' },
  { initial: 'R', name: 'Rahul Mehta',   permission: 'Can Edit', permBg: '#dbeafe', permColor: '#1e40af', avatarBg: '#0ea5e9' },
  { initial: 'P', name: 'Priya Nair',    permission: 'View Only',permBg: '#d1fae5', permColor: '#065f46', avatarBg: '#f59e0b' },
];

function PermissionAvatars() {
  const [openIdx, setOpenIdx] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ display:'flex', alignItems:'center' }}>
      {DUMMY_USERS.map((u, i) => (
        <div
          key={i}
          style={{ position:'relative', zIndex: DUMMY_USERS.length - i }}
          onMouseEnter={() => setOpenIdx(i)}
          onMouseLeave={() => setOpenIdx(null)}
          onClick={() => setOpenIdx(openIdx === i ? null : i)}
        >
          <div style={{
            width:'26px', height:'26px', borderRadius:'50%',
            background: u.avatarBg, color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'10px', fontWeight:700,
            border:'2px solid #fff',
            marginRight: i < DUMMY_USERS.length - 1 ? '-6px' : '0',
            cursor:'pointer',
            transition:'transform 0.15s',
            transform: openIdx === i ? 'scale(1.18)' : 'scale(1)',
            boxShadow: openIdx === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            userSelect: 'none',
          }}>
            {u.initial}
          </div>
          {openIdx === i && (
            <div style={{
              position:'absolute', top:'32px', left:'50%', transform:'translateX(-50%)',
              background:'#1f2937', color:'#fff',
              borderRadius:'9px', padding:'8px 11px',
              fontSize:'11px', whiteSpace:'nowrap',
              zIndex:9999, pointerEvents:'none',
              boxShadow:'0 4px 16px rgba(0,0,0,0.22)',
            }}>
              <div style={{
                position:'absolute', top:'-5px', left:'50%', transform:'translateX(-50%)',
                width:0, height:0,
                borderLeft:'5px solid transparent', borderRight:'5px solid transparent',
                borderBottom:'5px solid #1f2937',
              }} />
              <div style={{ fontWeight:700, fontSize:'11px', marginBottom:'5px', color:'#f9fafb' }}>{u.name}</div>
              <span style={{
                fontSize:'10px', fontWeight:600,
                background: u.permBg, color: u.permColor,
                padding:'2px 8px', borderRadius:'4px',
                display:'inline-block',
              }}>
                {u.permission}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PTag ─────────────────────────────────────────────────────────────────────
function PTag({ bg, color, children }) {
  return (
    <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'6px', background:bg||'#f3f4f6', color:color||'#374151', display:'inline-block' }}>
      {children}
    </span>
  );
}

// ─── SectionDivider ───────────────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'8px 0 6px' }}>
      <div style={{ flex:1, height:'1px', background:'#f3f4f6' }} />
      <span style={{ fontSize:'10px', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:'1px', background:'#f3f4f6' }} />
    </div>
  );
}

// ─── BudgetToast ──────────────────────────────────────────────────────────────
function BudgetToast({ grandTotal, budget, onClose }) {
  const budgetNum = parseFloat(budget || 0);
  if (!budgetNum || grandTotal <= budgetNum) return null;
  const over = grandTotal - budgetNum;
  return (
    <div style={{
      position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px',
      background: '#dc2626', color: '#fff', borderRadius: '12px',
      padding: '12px 18px', boxShadow: '0 8px 32px rgba(220,38,38,0.35)',
      fontSize: '13px', fontWeight: 600, minWidth: '280px', maxWidth: '420px',
      animation: 'budgetSlide 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <span style={{ fontSize: '18px', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, marginBottom: '2px' }}>Budget Exceeded!</div>
        <div style={{ fontSize: '11px', opacity: 0.9 }}>
          {fmt(over)} over your budget of {fmt(budgetNum)}
        </div>
      </div>
      <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        ✕
      </button>
      <style>{`@keyframes budgetSlide{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── TpProfilePopup ───────────────────────────────────────────────────────────
function TpProfilePopup({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const renderField = (label, key, type, placeholder) => (
    <div style={{ marginBottom:'10px' }} key={key}>
      <label style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:'4px' }}>{label}</label>
      <input
        type={type} value={form[key] || ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width:'100%', fontSize:'12px', border:'1px solid #e5e7eb', borderRadius:'8px', padding:'7px 10px', outline:'none', boxSizing:'border-box', color:'#111827', background:'#fafafa' }}
        onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; }}
      />
    </div>
  );

  return (
    <div ref={ref} style={{ position:'absolute', top:'44px', right:'0', zIndex:1000, background:'#fff', borderRadius:'14px', padding:'16px', width:'260px', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', border:'1px solid #f3f4f6' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ fontSize:'13px', fontWeight:800, color:'#111827' }}>My Profile</div>
        <button onClick={onClose} style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', fontSize:'11px', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>x</button>
      </div>
      {renderField('Full Name',    'fullName', 'text',   'Trushant Shah')}
      {renderField('Phone',        'phone',    'tel',    '+91 98765 43210')}
      {renderField('Passport No.', 'passport', 'text',   'A1234567')}
      {renderField('Budget',       'budget',   'number', '50000')}
      {renderField('Reviewer',     'reviewer', 'text',   'tushar')}
      <button
        onClick={() => { onSave(form); onClose(); }}
        style={{ width:'100%', padding:'9px', background:'rgb(247,190,57)', color:'#1a1a1a', border:'none', borderRadius:'9px', fontSize:'12px', fontWeight:800, cursor:'pointer', marginTop:'4px' }}
      >
        Save Profile
      </button>
    </div>
  );
}

// ─── ItemDetailModal ──────────────────────────────────────────────────────────
function ItemDetailModal({ item, onClose }) {
  const [imgErr,     setImgErr]     = useState(false);
  const logoSrc      = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;
  const hotelImg     = item.type === 'hotel'  ? (item.image || item.imageUrl || item.photo || null) : null;
  const resolvedDate = getResolvedDate(item);

  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'18px', width:'100%', maxWidth:'420px', overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.2)', maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div style={{ background:'rgb(247,190,57)', padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <span style={{ fontWeight:700, fontSize:'14px', color:'#1a1a1a' }}>
            {item.type === 'flight' ? 'Flight Details' : item.type === 'hotel' ? 'Hotel Details' : item.type === 'attraction' ? 'Attraction' : item.type === 'other' ? 'Activity' : 'Transport'}
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
                  {logoSrc && !imgErr ? <img src={logoSrc} alt={item.airline} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={() => setImgErr(true)} /> : <span style={{ fontSize:'22px' }}>plane</span>}
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

          {item.type === 'transport' && (
            <div>
              <div style={{ fontWeight:700, fontSize:'15px', color:'#111827', marginBottom:'4px' }}>{item.provider || item.id || 'Transport'}</div>
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

// ─── PlanCard ──────────────────────────────────────────────────────────────────
function PlanCard({ item, onRemove }) {
  const [imgErr,     setImgErr]     = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const status       = item.status || 'pending';
  const logoSrc      = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;
  const hotelImg     = item.type === 'hotel'  ? (item.image || item.imageUrl || item.photo || null) : null;
  const resolvedDate = getResolvedDate(item);
  const titleText    = item.type === 'flight' ? `${item.fromAirport || item.from || ''} to ${item.toAirport || item.to || ''}` : item.hotelName || item.name || item.type;

  const borderStyle =
    status === 'paid'      ? { borderColor:'#86efac', background:'#f0fdf4' }
    : status === 'cancelled' ? { borderColor:'#fca5a5', background:'#fff5f5', opacity:0.75 }
    :                          { borderColor:'#e5e7eb', background:'#fff' };

  return (
    <div>
      {showDetail && <ItemDetailModal item={item} onClose={() => setShowDetail(false)} />}
      <div
        style={{ border:'1px solid', borderRadius:'12px', padding:'12px', cursor:'pointer', display:'flex', alignItems:'flex-start', gap:'10px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', transition:'box-shadow 0.15s', ...borderStyle }}
        onClick={() => setShowDetail(true)}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
      >
        <div style={{ width:'44px', height:'44px', borderRadius:'10px', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'#f9fafb', border:'1px solid #e5e7eb' }}>
          {item.type === 'flight' && logoSrc && !imgErr && <img src={logoSrc} alt={item.airline} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={() => setImgErr(true)} />}
          {item.type === 'flight' && (!logoSrc || imgErr) && <span style={{ fontSize:'20px' }}>plane</span>}
          {item.type === 'hotel'      && hotelImg && <img src={hotelImg} alt={item.hotelName || item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display = 'none'; }} />}
          {item.type === 'hotel'      && !hotelImg    && <span style={{ fontSize:'20px' }}>hotel</span>}
          {item.type === 'attraction' && <span style={{ fontSize:'20px' }}>map</span>}
          {item.type === 'other'      && <span style={{ fontSize:'20px' }}>note</span>}
          {item.type === 'transport'  && <span style={{ fontSize:'20px' }}>car</span>}
          {item.type === 'restaurant' && <span style={{ fontSize:'20px' }}>food</span>}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'8px', marginBottom:'3px' }}>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{titleText}</span>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexShrink:0 }}>
              {status === 'paid'      && <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:'#dcfce7', color:'#16a34a' }}>Paid</span>}
              {status === 'cancelled' && <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:'#fee2e2', color:'#dc2626' }}>Cancelled</span>}
              {status === 'pending'   && <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'20px', background:'#fef3c7', color:'#92400e' }}>Pending</span>}
              {status !== 'paid' && (
                <button onClick={e => { e.stopPropagation(); onRemove(item.id); }} style={{ width:'18px', height:'18px', borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', fontSize:'10px', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>x</button>
              )}
            </div>
          </div>
          {item.type === 'flight' && <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'5px' }}>{item.airline} {item.flightNumber}</div>}
          {item.type === 'hotel' && item.stars && <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'5px' }}>{'*'.repeat(Math.min(Number(item.stars), 5))} {item.address || item.cityName || ''}</div>}
          {item.type === 'hotel' && !item.stars && (item.address || item.cityName) && <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.address || item.cityName}</div>}

          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
            {item.type === 'flight' && resolvedDate && <PTag bg="#fef3c7" color="#92400e">{fmtDate(resolvedDate)}</PTag>}
            {item.type === 'flight' && (item.depTime || item.arrTime) && <PTag bg="#dbeafe" color="#1e40af">{item.depTime || '?'} - {item.arrTime || '?'}</PTag>}
            {item.type === 'flight' && item.duration && <PTag bg="#f3f4f6" color="#374151">{item.duration}</PTag>}
            {item.type === 'flight' && item.stops != null && <PTag bg="#f3f4f6" color="#374151">{Number(item.stops) === 0 ? 'Non-stop' : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}</PTag>}
            {item.type === 'flight' && item.price && <PTag bg="#fef9c3" color="#713f12">{fmt(item.price)}</PTag>}
            {item.type === 'hotel'  && item.checkIn && <PTag bg="#fef3c7" color="#92400e">{fmtDate(item.checkIn)}</PTag>}
            {item.type === 'hotel'  && item.nights  && <PTag bg="#dbeafe" color="#1e40af">{item.nights}N</PTag>}
            {item.type === 'hotel'  && item.rating  && <PTag bg="#dcfce7" color="#166534">{item.rating}</PTag>}
            {item.type === 'hotel'  && item.price   && <PTag bg="#fef9c3" color="#713f12">{fmt(parseFloat(item.price) * (Number(item.nights) || 1))}</PTag>}
            {item.type === 'attraction' && item.category && <PTag bg="#f3f4f6" color="#374151">{item.category}</PTag>}
            {item.type === 'attraction' && item.rating   && <PTag bg="#dcfce7" color="#166534">{item.rating}</PTag>}
            {item.type === 'transport'  && item.from && item.to && <PTag bg="#f3f4f6" color="#374151">{item.from} to {item.to}</PTag>}
            {item.type === 'transport'  && item.duration && <PTag bg="#dbeafe" color="#1e40af">{item.duration}</PTag>}
            {item.type === 'other' && item.date     && <PTag bg="#fef3c7" color="#92400e">{fmtDate(item.date)}</PTag>}
            {item.type === 'other' && item.duration && <PTag bg="#dbeafe" color="#1e40af">{item.duration}</PTag>}
            {item.type === 'other' && item.price    && <PTag bg="#fef9c3" color="#713f12">{fmt(item.price)}</PTag>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BookView ──────────────────────────────────────────────────────────────────
function BookView({ planItems, onClose, onPay, viewMode, setViewMode }) {
  const [tab,        setTab]        = useState('selected');
  const [partialSel, setPartialSel] = useState(
    planItems.filter(p => p.status !== 'paid' && p.status !== 'cancelled').map(p => p.id)
  );
  const pendingItems  = planItems.filter(p => p.status !== 'paid' && p.status !== 'cancelled');
  const selectedItems = tab === 'selected' ? pendingItems : pendingItems.filter(p => partialSel.includes(p.id));
  const togglePartial = (id) => setPartialSel(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handlePay     = () => { onPay(selectedItems.map(p => p.id)); onClose(); };

  const byType = { flight:[], hotel:[], transport:[], restaurant:[], attraction:[], other:[] };
  pendingItems.forEach(item => { (byType[item.type] || byType.other).push(item); });
  const byDate = {};
  pendingItems.forEach(item => {
    const d  = getResolvedDate(item);
    const dk = d ? fmtDate(d) : 'No Date';
    if (!byDate[dk]) byDate[dk] = [];
    byDate[dk].push(item);
  });
  const typeLabels = { flight:'Flights', hotel:'Hotels', transport:'Transport', restaurant:'Restaurants', attraction:'Attractions', other:'Other' };

  const renderItem = (item) => {
    const isChecked = tab === 'selected' ? true : partialSel.includes(item.id);
    const logoSrc   = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;
    const hotelImg  = item.type === 'hotel'  ? (item.image || item.imageUrl || item.photo || null) : null;
    const rd        = getResolvedDate(item);
    const title     = item.type === 'flight' ? `${item.fromAirport || item.from || ''} to ${item.toAirport || item.to || ''}` : item.hotelName || item.name || item.type;
    return (
      <div key={item.id} style={{ border:'1px solid', borderRadius:'12px', padding:'12px', marginBottom:'8px', display:'flex', alignItems:'flex-start', gap:'10px', borderColor: isChecked ? '#F7BE39' : '#e5e7eb', background: isChecked ? '#fffdf5' : '#f9fafb' }}>
        {tab === 'selected'
          ? <div style={{ width:'20px', height:'20px', borderRadius:'6px', background:'rgb(247,190,57)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'2px' }}><span style={{ color:'#fff', fontSize:'11px', fontWeight:900 }}>ok</span></div>
          : <input type="checkbox" checked={isChecked} onChange={() => togglePartial(item.id)} style={{ width:'17px', height:'17px', accentColor:'rgb(247,190,57)', cursor:'pointer', flexShrink:0, marginTop:'3px' }} />
        }
        <div style={{ width:'34px', height:'34px', borderRadius:'8px', background:'#f9fafb', border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
          {item.type === 'flight' && logoSrc ? <img src={logoSrc} alt={item.airline} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => { e.target.style.display = 'none'; }} /> : item.type === 'hotel' && hotelImg ? <img src={hotelImg} alt={item.hotelName} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : <span style={{ fontSize:'16px' }}>{item.type === 'hotel' ? 'H' : item.type === 'attraction' ? 'A' : item.type === 'transport' ? 'T' : item.type === 'other' ? 'O' : 'F'}</span>}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'6px', marginBottom:'4px' }}>
            <span style={{ fontSize:'12px', fontWeight:700, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</span>
            <span style={{ fontSize:'10px', fontWeight:700, padding:'2px 7px', borderRadius:'20px', background:'#fef3c7', color:'#92400e', flexShrink:0 }}>Pending</span>
          </div>
          {item.type === 'flight' && <div style={{ fontSize:'11px', color:'#9ca3af', marginBottom:'5px' }}>{item.airline} {item.flightNumber}</div>}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
            {item.type === 'flight' && rd && <PTag bg="#ede9fe" color="#5b21b6">{fmtDate(rd)}</PTag>}
            {item.type === 'flight' && (item.depTime || item.arrTime) && <PTag bg="#dbeafe" color="#1e40af">{item.depTime || '?'} - {item.arrTime || '?'}{item.nextDay ? ' (+1)' : ''}</PTag>}
            {item.duration && <PTag bg="#f3f4f6" color="#374151">{item.duration}</PTag>}
            {item.price    && <PTag bg="#fef9c3" color="#713f12">{item.type === 'flight' ? fmt(item.price) : fmt(parseFloat(item.price) * (Number(item.nights) || 1))}</PTag>}
            {item.type === 'hotel' && item.checkIn && <PTag bg="#fef3c7" color="#92400e">{fmtDate(item.checkIn)}</PTag>}
            {item.type === 'hotel' && item.nights  && <PTag bg="#dbeafe" color="#1e40af">{item.nights}N</PTag>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <button onClick={onClose} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#f3f4f6', border:'none', cursor:'pointer', fontSize:'13px', color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'center' }}>back</button>
          <span style={{ fontSize:'13px', fontWeight:800, color:'#111827' }}>BOOK ALL ITEMS</span>
          <span style={{ fontSize:'10px', fontWeight:700, background:'rgb(247,190,57)', color:'#1a1a1a', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center' }}>{pendingItems.length}</span>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {[{ v:'daywise', l:'Day-wise' }, { v:'itemwise', l:'Item-wise' }].map(opt => (
            <button key={opt.v} onClick={() => setViewMode(opt.v)} style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', border: viewMode === opt.v ? '2px solid #F7BE39' : '1px solid #e5e7eb', background: viewMode === opt.v ? '#fef9c3' : '#fff', color: viewMode === opt.v ? '#92400e' : '#6b7280' }}>{opt.l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0, display:'flex', gap:'8px' }}>
        <button onClick={() => setTab('selected')} style={{ padding:'8px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:700, cursor:'pointer', border:'none', background: tab === 'selected' ? 'rgb(247,190,57)' : '#f3f4f6', color: tab === 'selected' ? '#1a1a1a' : '#6b7280' }}>Book Selected ({pendingItems.length})</button>
        <button onClick={() => setTab('partial')}  style={{ padding:'8px 16px', borderRadius:'20px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:'1px solid #e5e7eb', background:'#fff', color:'#374151' }}>Book Partially</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
        {viewMode === 'daywise'
          ? Object.entries(byDate).map(([dk, items]) => (
              <div key={dk}><SectionDivider label={`${dk} (${items.length})`} />{items.map(renderItem)}</div>
            ))
          : Object.entries(byType).map(([type, items]) =>
              items.length === 0 ? null : (
                <div key={type}><SectionDivider label={typeLabels[type] || type} />{items.map(renderItem)}</div>
              )
            )
        }
      </div>
      <div style={{ padding:'12px 16px 16px', borderTop:'1px solid #f3f4f6', flexShrink:0, display:'flex', flexDirection:'column', gap:'8px' }}>
        <button onClick={handlePay} disabled={selectedItems.length === 0}
          style={{ width:'100%', padding:'14px', background: selectedItems.length > 0 ? 'rgb(247,190,57)' : '#e5e7eb', color: selectedItems.length > 0 ? '#1a1a1a' : '#9ca3af', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:800, cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed' }}>
          Pay for {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
        </button>
        <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'none', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'12px', color:'#6b7280', cursor:'pointer' }}>Back to plan</button>
      </div>
    </div>
  );
}

// ─── OtherTab ──────────────────────────────────────────────────────────────────
function OtherTab({ onAddToPlan }) {
  const [form, setForm] = useState({ activity:'', moneySpent:'', time:'', date:'' });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.activity.trim()) return;
    onAddToPlan({ id:'other_' + Date.now(), type:'other', name:form.activity, price:form.moneySpent, duration:form.time, date:form.date });
    setForm({ activity:'', moneySpent:'', time:'', date:'' });
  };
  const inp = (label, key, type, placeholder) => (
    <div style={{ marginBottom:'12px' }} key={key}>
      <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'5px' }}>{label}</label>
      <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder}
        style={{ width:'100%', fontSize:'13px', border:'1px solid #e5e7eb', borderRadius:'9px', padding:'8px 11px', outline:'none', boxSizing:'border-box', color:'#111827' }}
        onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; }}
        onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; }}
      />
    </div>
  );
  return (
    <div style={{ padding:'16px' }}>
      <div style={{ marginBottom:'16px' }}>
        <div style={{ fontSize:'15px', fontWeight:800, color:'#111827', marginBottom:'2px' }}>Add Activity</div>
        <div style={{ fontSize:'11px', color:'#9ca3af' }}>Add custom activities with details</div>
      </div>
      <div style={{ background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', padding:'16px' }}>
        <form onSubmit={handleSubmit}>
          {inp('Activity', 'activity',   'text',   'Enter activity name')}
          {inp('Money Spent', 'moneySpent', 'number', 'Enter amount')}
          {inp('Time',      'time',       'text',   'e.g. 2 hours')}
          {inp('Date',      'date',       'date',   '')}
          <button type="submit" style={{ width:'100%', padding:'11px', background:'rgb(247,190,57)', color:'#1a1a1a', border:'none', borderRadius:'10px', fontSize:'13px', fontWeight:800, cursor:'pointer', marginTop:'4px' }}>Add to Plan</button>
        </form>
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function TabHeader({ title, subtitle }) {
  return (
    <div className="mb-4">
      <div className="font-bold text-base text-gray-900 mb-0.5">{title}</div>
      <div className="text-xs text-gray-400">{subtitle}</div>
    </div>
  );
}
function DestSection({ index, name, children }) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ backgroundColor:'rgb(247,190,57)' }}>{index + 1}</span>
        {name}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
function EmptyState({ icon, message }) {
  return (
    <div className="text-sm text-gray-400 bg-gray-50 rounded-xl p-6 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      {message}
    </div>
  );
}

// ─── Destination Dropdown Filter ──────────────────────────────────────────────
function DestDropdown({ destinations, selected, onChange }) {
  if (!destinations || destinations.length <= 1) return null;
  return (
    <select
      value={selected}
      onChange={e => onChange(e.target.value)}
      style={{ padding:'6px 10px', border:'1px solid #e5e7eb', borderRadius:'8px', fontSize:'11px', fontWeight:600, color:'#374151', background:'#fff', cursor:'pointer', outline:'none', maxWidth:'160px' }}
    >
      <option value="">All Destinations</option>
      {destinations.map((d, i) => <option key={i} value={d}>{d}</option>)}
    </select>
  );
}

// ─── FilteredView ─────────────────────────────────────────────────────────────
function FilteredView({ filter, rfq, allDestData, onAddToPlan, planItems, planIds }) {
  const [selectedDest, setSelectedDest] = useState('');

  const allDestNames = rfq.destinations?.map(d => d.destination).filter(Boolean) || [];

  const filteredDestData = selectedDest
    ? allDestData.filter(dd => dd.destination === selectedDest)
    : allDestData;

  if (filter === 'flights') return <FlightsTab rfq={rfq} planItems={planItems} onAddToPlan={onAddToPlan} selectedDest={selectedDest} />;

  if (filter === 'hotels') {
    const has = filteredDestData.some(dd => dd.hotels?.length > 0);
    return (
      <div className="p-4">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <TabHeader title="Available Hotels" subtitle="Click + to add to your plan" />
          <DestDropdown destinations={allDestNames} selected={selectedDest} onChange={setSelectedDest} />
        </div>
        {!has ? <EmptyState icon="hotel" message="No hotel data." /> : filteredDestData.map((dd, di) => {
          const hotels = (dd.hotels || []).filter(Boolean);
          if (!hotels.length) return null;
          return (
            <DestSection key={di} index={di} name={dd.destination}>
              {hotels.map((hotel, hi) => {
                const id = 'hotel_' + (hotel.hotelId || hi) + '_' + di;
                return <HotelCard key={hi} hotel={hotel} inPlan={planIds.includes(id)} onAdd={h => onAddToPlan({ ...h, type:'hotel', id })} />;
              })}
            </DestSection>
          );
        })}
      </div>
    );
  }

  if (filter === 'attractions') {
    const has = filteredDestData.some(dd => dd.attractions?.length > 0);
    return (
      <div className="p-4">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <TabHeader title="Attractions" subtitle="Click + to add to your plan" />
          <DestDropdown destinations={allDestNames} selected={selectedDest} onChange={setSelectedDest} />
        </div>
        {!has ? <EmptyState icon="map" message="No attractions found." /> : filteredDestData.map((dd, di) => {
          const atts = (dd.attractions || []).filter(Boolean);
          if (!atts.length) return null;
          return (
            <DestSection key={di} index={di} name={dd.destination}>
              {atts.map((a, ai) => {
                const id = 'attraction_' + (a.attractionId || ai) + '_' + di;
                return <AttractionCard key={ai} attraction={a} inPlan={planIds.includes(id)} onAdd={() => onAddToPlan({ ...a, type:'attraction', id })} />;
              })}
            </DestSection>
          );
        })}
      </div>
    );
  }

  if (filter === 'transport') {
    const mainDest = selectedDest || rfq.destinations?.[0]?.destination || 'destination';
    const opts = [
      { id:'cab',    type:'Cab / Taxi',    provider:'Uber / Local Taxi',          from:'Airport',          to:'City Centre',   duration:'30-60 min', price:'Varies',          recommended:true  },
      { id:'metro',  type:'Metro / Subway',provider:'Local Metro',                from:'Airport Station',  to:'City Centre',   duration:'20-45 min', price:'Budget-friendly', recommended:false },
      { id:'bus',    type:'Airport Bus',   provider:'City Bus / Coach',           from:'Airport Terminal', to:'City Bus Stop', duration:'45-90 min', price:'Very cheap',      recommended:false },
      { id:'rental', type:'Car Rental',    provider:'Hertz / Enterprise / Local', from:'Airport',          to:'Self-drive',    duration:'Flexible',  price:'$30-80/day',      recommended:false },
    ];
    return (
      <div className="p-4">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
          <TabHeader title="Transport Options" subtitle={`Local transport in ${mainDest}`} />
          <DestDropdown destinations={allDestNames} selected={selectedDest} onChange={setSelectedDest} />
        </div>
        <div className="flex flex-col gap-3">
          {opts.map(opt => {
            const id = 'transport_' + opt.id;
            return <TransportCard key={opt.id} option={opt} inPlan={planIds.includes(id)} onAdd={o => onAddToPlan({ ...o, type:'transport', id })} />;
          })}
        </div>
      </div>
    );
  }

  if (filter === 'other') return <OtherTab onAddToPlan={onAddToPlan} />;
  return null;
}

// ─── DestinationTimeline (Panel 2 — Premium Travel Timeline) ─────────────────
function DestinationTimeline({ planItems, destNames, grandTotal, removeFromPlan, viewMode, setViewMode, setShowBookView, setActiveFilter, startDate }) {
  const getSortedItemsForDest = (dest) => {
    const items = planItems.filter(item => getItemDestination(item, destNames) === dest);
    return items.sort((a, b) => {
      const da = getResolvedDate(a);
      const db = getResolvedDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return new Date(da) - new Date(db);
    });
  };

  const unmatchedItems = planItems.filter(item => !getItemDestination(item, destNames));
  // ─── Fixed Day Calculation Logic ───
  const dayGroupsMap = {};
  planItems.forEach(item => {
    const d = getResolvedDate(item); // ISO Date format: "2026-03-25"
    const dk = d ? d : 'No Date';   // Keep ISO as key for math, not formatted string
    if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];
    dayGroupsMap[dk].push(item);
  });

  const sortedDayEntries = Object.entries(dayGroupsMap).sort(([a], [b]) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a) - new Date(b);
  });

  // Calculate baseline using the trip's official start date
  const tripBaseline = startDate ? new Date(startDate + (startDate.includes('T') ? '' : 'T00:00:00')) : null;
 

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Sticky Header ── */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #f3f4f6',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 1px 0 #f3f4f6',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#111827', letterSpacing: '0.03em' }}>PLAN SUMMARY</span>
          {planItems.length > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 800,
              background: 'rgb(247,190,57)', color: '#1a1a1a',
              borderRadius: '20px', padding: '2px 10px',
              letterSpacing: '0.04em',
            }}>
              {planItems.length} {planItems.length === 1 ? 'PLAN' : 'PLANS'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '12px' }}>
          {[{ label: 'Day-wise', value: 'daywise' }, { label: 'Item-wise', value: 'itemwise' }].map(opt => {
            const active = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                style={{
                  padding: '6px 15px', borderRadius: '9px',
                  fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', border: 'none',
                  background: active ? '#fff' : 'transparent',
                  color: active ? '#111827' : '#6b7280',
                  boxShadow: active ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable Timeline Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 16px', background: '#fafafa' }}>

       {planItems.length === 0 ? (
          /* Empty State */
          <div style={{ textAlign: 'center', padding: '64px 20px' }}>
            <div style={{ fontSize: '52px', marginBottom: '18px' }}>🗺️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: '#374151', marginBottom: '8px' }}>Build Your Travel Story</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', maxWidth: '220px', margin: '0 auto', lineHeight: '1.6' }}>
              Select flights, hotels, and attractions from the right panel to craft your perfect journey.
            </p>
          </div>
        ) : viewMode === 'daywise' ? (

          /* ══ DAY-WISE VIEW (Fixed Day Logic) ══ */
          <div style={{ position: 'relative' }}>
            {/* Global vertical line */}
            <div style={{
              position: 'absolute', left: '15px', top: '20px', bottom: '0',
              width: '2px',
              background: 'linear-gradient(to bottom, #F7BE39 0%, #e5e7eb 30%, #e5e7eb 100%)',
              zIndex: 0,
            }} />

            {sortedDayEntries.map(([rawDate, items], gi) => {
              // Logic: Day number = difference between current date and start date + 1
              let currentDayNum = gi + 1; 
              let displayHeaderDate = rawDate === 'No Date' ? 'Unscheduled' : fmtDate(rawDate);

              if (rawDate !== 'No Date' && tripBaseline) {
                const groupDate = new Date(rawDate + (rawDate.includes('T') ? '' : 'T00:00:00'));
                const diffTime = groupDate - tripBaseline;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                currentDayNum = diffDays + 1;
              }

              return (
                <div key={rawDate} style={{ marginBottom: '28px', position: 'relative' }}>
                  {/* Date Header with Circle Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <div style={{
                      width: '32px', height: '32px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #F7BE39, #f59e0b)',
                      borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '11px', fontWeight: 900,
                      boxShadow: '0 4px 10px rgba(247,190,57,0.35)',
                      zIndex: 1, position: 'relative',
                    }}>
                      {rawDate === 'No Date' ? '?' : currentDayNum}
                    </div>

                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgb(247,190,57)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        {rawDate === 'No Date' ? 'No Date' : 'Day ' + currentDayNum}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 900, color: '#111827' }}>{displayHeaderDate}</div>
                    </div>

                    <div style={{ marginLeft: 'auto', fontSize: '10px', fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', padding: '3px 10px', borderRadius: '20px' }}>
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Cards under this day */}
                  <div style={{ marginLeft: '44px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {items.map(item => (
                      <div key={item.id} style={{ position: 'relative' }}>
                        <div style={{
                          position: 'absolute', left: '-29px', top: '22px',
                          width: '10px', height: '10px', borderRadius: '50%',
                          background: '#fff', border: '3px solid rgb(247,190,57)',
                          zIndex: 2, flexShrink: 0,
                        }} />
                        <PlanCard item={item} onRemove={removeFromPlan} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

        ) : (
          /* ══ ITEM-WISE / DESTINATION-WISE VIEW (Yahan se aapka code as it is rahega) ══ */

          <div>
            {destNames.map((dest, dIdx) => {
              const sortedItems = getSortedItemsForDest(dest);
              const hasHotel    = sortedItems.some(i => i.type === 'hotel');
              const isLast      = dIdx === destNames.length - 1;

              return (
                <div key={dest} style={{ marginBottom: isLast ? '8px' : '0', position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '17px',
                    top: '52px',
                    bottom: isLast ? '0' : '-32px',
                    width: '2px',
                    background: isLast
                      ? 'linear-gradient(to bottom, #e5e7eb 60%, transparent 100%)'
                      : '#e5e7eb',
                    zIndex: 0,
                  }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div style={{
                      width: '36px', height: '36px', flexShrink: 0,
                      background: 'linear-gradient(135deg, #F7BE39, #f59e0b)',
                      borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '16px', fontWeight: 900,
                      boxShadow: '0 4px 14px rgba(247,190,57,0.38)',
                      zIndex: 1, position: 'relative',
                    }}>
                      {dIdx + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '9px', fontWeight: 800, color: 'rgb(247,190,57)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '2px' }}>
                        Stage {dIdx + 1}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1.1 }}>{dest}</div>
                    </div>
                    {sortedItems.length > 0 && (
                      <div style={{
                        fontSize: '10px', fontWeight: 700, color: '#6b7280',
                        background: '#f3f4f6', padding: '3px 10px', borderRadius: '20px',
                      }}>
                        {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: '50px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', marginBottom: '16px' }}>
                    {sortedItems.length > 0 ? (
                      sortedItems.map(item => (
                        <div key={item.id} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute',
                            left: '-33px', top: '22px',
                            width: '10px', height: '10px', borderRadius: '50%',
                            background: '#fff', border: '3px solid rgb(247,190,57)',
                            zIndex: 2,
                          }} />
                          <PlanCard item={item} onRemove={removeFromPlan} />
                        </div>
                      ))
                    ) : (
                      <div style={{
                        padding: '20px 16px',
                        border: '2px dashed #e5e7eb',
                        borderRadius: '14px',
                        textAlign: 'center',
                        background: '#fff',
                      }}>
                        <div style={{ fontSize: '22px', marginBottom: '6px' }}>📍</div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '10px' }}>
                          No activities added for {dest} yet.
                        </p>
                        <button
                          onClick={() => setActiveFilter('hotels')}
                          style={{
                            fontSize: '11px', fontWeight: 800, color: 'rgb(247,190,57)',
                            background: '#fffbeb', border: '1px solid #fef3c7',
                            borderRadius: '8px', padding: '5px 14px',
                            cursor: 'pointer',
                          }}
                        >
                          Explore Hotels +
                        </button>
                      </div>
                    )}
                    {!hasHotel && sortedItems.length > 0 && (
                      <div style={{
                        padding: '10px 14px',
                        background: '#fffbeb',
                        border: '1px solid #fef3c7',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                      }}>
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>💡</span>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', marginBottom: '2px' }}>Suggestion</div>
                          <div style={{ fontSize: '11px', color: '#92400e', opacity: 0.85 }}>
                            You haven't added a hotel for your stay in <strong>{dest}</strong>.
                          </div>
                          <button
                            onClick={() => setActiveFilter('hotels')}
                            style={{
                              marginTop: '6px', fontSize: '10px', fontWeight: 700,
                              color: '#92400e', background: 'none', border: 'none',
                              cursor: 'pointer', padding: '0', textDecoration: 'underline',
                            }}
                          >
                            Add hotel →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {dIdx < destNames.length - 1 && (
                    <div style={{
                      marginLeft: '50px',
                      marginBottom: '28px',
                      padding: '10px 14px',
                      background: '#f3f4f6',
                      borderRadius: '10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: '1px solid #e5e7eb',
                    }}>
                      <span style={{ fontSize: '14px' }}>✈️</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>
                        Moving from <strong style={{ color: '#374151' }}>{dest}</strong> to <strong style={{ color: '#374151' }}>{destNames[dIdx + 1]}</strong>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            {unmatchedItems.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <SectionDivider label="Other Items" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {unmatchedItems.map(item => (
                    <PlanCard key={item.id} item={item} onRemove={removeFromPlan} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sticky Footer ── */}
      {planItems.length > 0 && (
        <div style={{
          padding: '16px 20px 20px',
          borderTop: '1px solid #f3f4f6',
          background: '#fff',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                Estimated Total
              </div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#111827', letterSpacing: '-0.01em' }}>
                {fmt(grandTotal)}
              </div>
            </div>
            <button
              onClick={() => setShowBookView(true)}
              style={{
                padding: '14px 32px',
                background: 'rgb(247,190,57)',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(247,190,57,0.38)',
                transition: 'transform 0.18s, box-shadow 0.18s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.03)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(247,190,57,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(247,190,57,0.38)';
              }}
            >
              <span>BOOK NOW</span>
              
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{
              flex: 1, padding: '10px',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '12px', fontSize: '12px', fontWeight: 700,
              color: '#6b7280', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              Send to review
            </button>
            <button style={{
              flex: 1, padding: '10px',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: '12px', fontSize: '12px', fontWeight: 700,
              color: '#6b7280', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              Manual send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ResizerHandle ────────────────────────────────────────────────────────────
function ResizerHandle({ onMouseDown, visible = true }) {
  const [hovered, setHovered] = useState(false);
  if (!visible) return null;
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '5px',
        flexShrink: 0,
        cursor: 'col-resize',
        background: hovered ? 'rgb(247,190,57)' : 'transparent',
        borderLeft: `1px solid ${hovered ? 'rgb(247,190,57)' : '#e5e7eb'}`,
        borderRight: `1px solid ${hovered ? 'rgb(247,190,57)' : '#e5e7eb'}`,
        transition: 'background 0.15s, border-color 0.15s',
        position: 'relative',
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {hovered && (
        <div style={{
          width: '3px', height: '32px', borderRadius: '2px',
          background: 'rgb(247,190,57)',
          boxShadow: '0 0 6px rgba(247,190,57,0.6)',
        }} />
      )}
    </div>
  );
}

// ─── Main DetailPage ───────────────────────────────────────────────────────────
export default function DetailPage({ rfq: initialRfq, onBack, onUpdate, initialPlan = [] }) {
  const [rfq,           setRfq]           = useState(() => {
    try {
      const savedRfq = localStorage.getItem('current_rfq_' + (initialRfq?._id || 'default'));
      if (savedRfq) return JSON.parse(savedRfq);
    } catch {}
    return initialRfq;
  });
  const [profile,       setProfile]       = useState({ fullName:'', phone:'', passport:'', budget:'', reviewer:'' });
  const [showTpForm,    setShowTpForm]    = useState(false);
  const [showDetails,   setShowDetails]   = useState(false);
  const [showBookView,  setShowBookView]  = useState(false);
  const [showBudgetToast, setShowBudgetToast] = useState(true);
  const [viewMode,      setViewMode]      = useState('itemwise');
  const [activeFilter,  setActiveFilter]  = useState('flights');
  // ── Homepage se profile name load karne ke liye ──
  useEffect(() => {
    const savedProfile = localStorage.getItem('tp_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Error parsing profile", e);
      }
    }
  }, []);

  // ── Genie / Chat panel state ──
  const [chatOpen, setChatOpen] = useState(true);

  // ── Resizable panel widths ──
  const MIN_WIDTH = 250;
  const MAX_WIDTH = 500;
  const [leftWidth,  setLeftWidth]  = useState(320);
  const [rightWidth, setRightWidth] = useState(360);

  const resizingRef  = useRef(null); // 'left' | 'right' | null
  const startXRef    = useRef(0);
  const startWRef    = useRef(0);

  const startResizing = useCallback((side, e) => {
    e.preventDefault();
    resizingRef.current = side;
    startXRef.current   = e.clientX;
    startWRef.current   = side === 'left' ? leftWidth : rightWidth;

    const onMouseMove = (ev) => {
      const delta = ev.clientX - startXRef.current;
      const newW  = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH,
        resizingRef.current === 'left'
          ? startWRef.current + delta
          : startWRef.current - delta
      ));
      if (resizingRef.current === 'left')  setLeftWidth(newW);
      if (resizingRef.current === 'right') setRightWidth(newW);
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
      document.body.style.cursor    = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor    = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }, [leftWidth, rightWidth]);

  const handleSaveProfile = (p) => { localStorage.setItem('tp_profile', JSON.stringify(p)); setProfile(p); };

  useEffect(() => {
    try {
      localStorage.setItem('current_rfq_' + (rfq?._id || 'default'), JSON.stringify(rfq));
    } catch {}
  }, [rfq]);

  const planKeyRef = useRef('plan_' + (initialRfq?._id || 'default'));

  const [planItems, setPlanItems] = useState(() => {
    try {
      const saved = localStorage.getItem('plan_' + (initialRfq?._id || 'default'));
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const saveItems = (items) => {
    try { localStorage.setItem(planKeyRef.current, JSON.stringify(items)); } catch {}
  };

  // 1. Extract Base Data & Dates (Defined at the top to fix ReferenceError)
  const startDate = rfq?.destinations?.[0]?.dateOfArrival || rfq?.startDate || '';
  const endDate   = rfq?.destinations?.[rfq?.destinations?.length - 1]?.dateOfDeparture || rfq?.endDate || '';
  const destNames = rfq.destinations?.map(d => d.destination).filter(Boolean) || [];

  // 2. Journey Path: Source City + Unique Destinations + New Flight Cities (➔ Arrows)

const journeyCities = useMemo(() => {
  const cities = new Set();
  const clean = (str) => (str || "").split(',')[0].trim().toUpperCase();

  // Airport code → City name mapping
  const AIRPORT_TO_CITY = {
    'IDR':'INDORE','BOM':'MUMBAI','DEL':'DELHI','BLR':'BANGALORE',
    'HYD':'HYDERABAD','MAA':'CHENNAI','CCU':'KOLKATA','AMD':'AHMEDABAD',
    'LHR':'LONDON','LGW':'LONDON','STN':'LONDON',
    'DXB':'DUBAI','AUH':'ABU DHABI','DOH':'DOHA',
    'NRT':'TOKYO','HND':'TOKYO',
    'JFK':'NEW YORK','LAX':'LOS ANGELES','SFO':'SAN FRANCISCO',
    'CDG':'PARIS','ORY':'PARIS',
    'FRA':'FRANKFURT','MUC':'MUNICH',
    'AMS':'AMSTERDAM','BRU':'BRUSSELS',
    'SIN':'SINGAPORE','KUL':'KUALA LUMPUR','BKK':'BANGKOK',
    'HKG':'HONG KONG','ICN':'SEOUL','PEK':'BEIJING','PVG':'SHANGHAI',
    'SYD':'SYDNEY','MEL':'MELBOURNE',
    'DEN':'DENVER','ORD':'CHICAGO','MIA':'MIAMI',
    'IST':'ISTANBUL','CAI':'CAIRO','JNB':'JOHANNESBURG',
    'GRU':'SAO PAULO','EZE':'BUENOS AIRES','MEX':'MEXICO CITY',
    'YYZ':'TORONTO','YVR':'VANCOUVER',
    'FCO':'ROME','BCN':'BARCELONA','MAD':'MADRID',
    'ZRH':'ZURICH','VIE':'VIENNA','CPH':'COPENHAGEN',
    'OSL':'OSLO','ARN':'STOCKHOLM','HEL':'HELSINKI',
    'ATH':'ATHENS','LIS':'LISBON','DUB':'DUBLIN',
    'MXP':'MILAN','VCE':'VENICE','NAP':'NAPLES',
    'PRG':'PRAGUE','BUD':'BUDAPEST','WAW':'WARSAW',
  };

  const isAirportCode = (str) => /^[A-Z]{3}$/.test((str || '').trim().toUpperCase());

  const resolveCity = (str) => {
    if (!str) return null;
    const upper = str.trim().toUpperCase();
    // Agar airport code hai toh city map se lo
    if (isAirportCode(upper) && AIRPORT_TO_CITY[upper]) return AIRPORT_TO_CITY[upper];
    // Agar pure 3-letter code hai aur map mein nahi toh skip
    if (isAirportCode(upper)) return null;
    // Otherwise city name as-is
    return clean(str);
  };

  if (rfq.from) {
    const c = resolveCity(rfq.from);
    if (c) cities.add(c);
  }

  destNames.forEach(d => {
    const c = resolveCity(d);
    if (c) cities.add(c);
  });

  planItems.forEach(item => {
    if (item.type === 'flight') {
      // cityName sabse reliable, phir to, phir toAirport
      const raw = item.cityName || item.to || item.toAirport;
      const c = resolveCity(raw);
      if (c) cities.add(c);
    }
  });

  return Array.from(cities);
}, [planItems, destNames, rfq.from]);
  const journeyPath = journeyCities.join(' ➔ ');

  // 3. Calculation for Date Range & Form-based Days
  const tripDateRange = startDate && endDate ? `${fmtDate(startDate)} - ${fmtDate(endDate)}` : "";
  const rfqTotalNights = rfq.destinations?.reduce((sum, d) => sum + (Number(d.nights || d.numberOfNights) || 0), 0) || 0;
  const totalDaysFromForm = rfqTotalNights > 0 ? rfqTotalNights + 1 : 1;

  // 4. Main Title Construction
  const tripTitle = (rfq.tripName || "MY TRIP").toUpperCase();
  const dynamicMainHeading = `${tripTitle} · ${totalDaysFromForm} Day Tour`;
  const allDestData = rfq.destinationData?.length > 0
    ? rfq.destinationData
    : (rfq.destinations || []).map(dest => ({
        destination: dest.destination,
        hotels: Array.from({ length: 6 }, (_, i) => ({
          hotelId: `PLACEHOLDER_${i}`,
          name: `${['Grand Hotel ', '', ' Palace Hotel', ' Boutique Hotel', ' Suites', 'Hotel Centrale '][i] || 'Hotel '}${dest.destination}`,
          cityName: dest.destination,
          stars: [3, 4, 5, 4, 3, 5][i] || 3,
          address: dest.destination,
          rating: 4.0 + Math.random() * 0.9,
          price: Math.floor(2000 + Math.random() * 8000),
          currency: 'INR',
          available: true,
        })),
        attractions: Array.from({ length: 8 }, (_, i) => ({
          attractionId: `PLACEHOLDER_${i}`,
          name: `${['National Museum of ', '', ' Historic Center', ' Central Park', ' Art Gallery', ' Old Town', ' Cathedral', ' Monument'][i] || 'Attraction '}${dest.destination}`,
          cityName: dest.destination,
          category: ['Museum', 'Landmark', 'Park', 'Art Gallery', 'Attraction', 'Historic Site', 'Monument', 'Zoo'][i],
          address: dest.destination,
          rating: 4.0 + Math.random() * 0.9,
          available: true,
        })),
      }));

  const filterTabs = [
    { id:'flights',     label:'Flights'     },
    { id:'hotels',      label:'Hotels'      },
    { id:'attractions', label:'Attractions' },
    { id:'transport',   label:'Transport'   },
    { id:'other',       label:'Other'       },
  ];

  const addToPlan = (item) => {
    const id = item.id || (item.type + '_' + Date.now());
    setPlanItems(prev => {
      if (prev.find(p => p.id === id)) return prev;
      const next = [...prev, { ...item, id, status:'pending' }];
      saveItems(next);
      return next;
    });
    setShowBudgetToast(true);
  };

  const removeFromPlan = (id) => setPlanItems(prev => {
    const next = prev.filter(p => p.id !== id);
    saveItems(next);
    return next;
  });

  const planIds = planItems.map(p => p.id);

  const handlePay = (paidIds) => {
    setPlanItems(prev => {
      const next = prev.map(item => {
        if (item.status === 'paid') return item;
        if (paidIds.includes(item.id)) return { ...item, status:'paid' };
        if (item.status !== 'cancelled') return { ...item, status:'cancelled' };
        return item;
      });
      saveItems(next);
      return next;
    });
  };

  const handleRfqUpdate = (u) => {
    setRfq(u);
    try {
      localStorage.setItem('current_rfq_' + (u._id || 'default'), JSON.stringify(u));
    } catch {}
    if (onUpdate) onUpdate(u);
  };

  const flightTotal    = planItems.filter(p => p.type === 'flight'    && p.status !== 'cancelled').reduce((s, f) => s + (parseFloat(f.price) || 0), 0);
  const hotelTotal     = planItems.filter(p => p.type === 'hotel'     && p.status !== 'cancelled').reduce((s, h) => s + (parseFloat(h.price || 0) * (Number(h.nights) || 1)), 0);
  const transportTotal = planItems.filter(p => p.type === 'transport' && p.status !== 'cancelled').reduce((s, t) => s + (parseFloat(t.price?.replace(/[^\d]/g, '') || 0) || 0), 0);
  const grandTotal     = flightTotal + hotelTotal + transportTotal;

  const activeBudget = rfq.budget || rfq.tripBudget || profile.budget || 0;

 
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">

      {/* Budget Exceeded Toast */}
      {showBudgetToast && (
        <BudgetToast
          grandTotal={grandTotal}
          budget={activeBudget}
          onClose={() => setShowBudgetToast(false)}
        />
      )}

      {/* Genie Floating Chat Button — shown when chat is closed */}
      <GenieChatButton
        open={chatOpen}
        onToggle={() => setChatOpen(true)}
        unreadCount={0}
      />

      {/* Navbar */}
      <header className="w-full z-30 flex-shrink-0" style={{ backgroundColor:'rgb(247,190,57)' }}>
        <div className="px-4 py-1.5 flex items-center justify-between">
          <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height:'28px', objectFit:'contain' }} />
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowTpForm(v => !v)} style={{ width:'28px', height:'28px', borderRadius:'50%', background:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:700, color:'#374151' }}>TP</button>
            {showTpForm && <TpProfilePopup profile={profile} onSave={handleSaveProfile} onClose={() => setShowTpForm(false)} />}
          </div>
        </div>
      </header>

      {/* Sub-bar */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-4 py-2 flex items-center justify-between">
       <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-8 h-8 bg-gray-50 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-700 transition-all border border-gray-100">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>
            </button>
         <div style={{ minWidth: 0 }}>
              {/* Trip Title + Days + Date Range on the right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h1 className="text-[16px] font-black text-gray-900 tracking-tight leading-none">
                  {dynamicMainHeading}
                </h1>
                {tripDateRange && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', borderLeft: '1.5px solid #e5e7eb', paddingLeft: '12px' }}>
                    {tripDateRange}
                  </span>
                )}
              </div>

              {/* ID Badge + Visual Journey Route (Arrows ➔) */}
              <div className="flex items-center gap-2">
                {rfq._id && (
                  <span className="text-[9px] font-extrabold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-widest">
                    ID: {rfq._id.replace(': ', '').replace(':', '')}
                  </span>
                )}
                <span className="text-gray-300 text-xs">|</span>
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {journeyPath}
                   </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <PermissionAvatars />
            <button onClick={() => setShowDetails(v => !v)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Details</button>
          </div>
        </div>
      </div>

      {/* Details dropdown */}
      {showDetails && (
        <div style={{ background:'#e5e7eb', borderBottom:'1px solid #d1d5db', flexShrink:0, padding:'12px 16px' }}>
          <div style={{ fontSize:'13px', fontWeight:700, color:'#111827', marginBottom:'10px' }}>Trip Details</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 24px', marginBottom:'12px' }}>
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'2px' }}>TRIP</div>
              <div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{destNames.join(', ') || '-'}</div>
            </div>
            {startDate && <div><div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', marginBottom:'2px' }}>START</div><div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{startDate}</div></div>}
            {endDate   && <div><div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', marginBottom:'2px' }}>END</div><div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{endDate}</div></div>}
            {profile.budget   && <div><div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', marginBottom:'2px' }}>BUDGET</div><div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{profile.budget}</div></div>}
            {profile.reviewer && <div><div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', marginBottom:'2px' }}>REVIEWER</div><div style={{ fontSize:'13px', fontWeight:700, color:'#111827' }}>{profile.reviewer}</div></div>}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'10px', borderTop:'1px solid #d1d5db' }}>
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase' }}>TOTAL PRICE</div>
              <div style={{ fontSize:'18px', fontWeight:800, color: grandTotal > 0 ? '#16a34a' : '#9ca3af' }}>{grandTotal > 0 ? fmt(grandTotal) : '-'}</div>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button style={{ padding:'8px 18px', background:'rgb(247,190,57)', color:'#1a1a1a', border:'none', borderRadius:'10px', fontSize:'12px', fontWeight:700, cursor:'pointer' }}>Send to review</button>
              <button style={{ padding:'8px 18px', background:'#fff', color:'#374151', border:'1px solid #d1d5db', borderRadius:'10px', fontSize:'12px', fontWeight:600, cursor:'pointer' }}>Manual send</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Three-Panel Resizable Layout
      ══════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row' }}>

        {/* ── Panel 1: AI Chat (collapsible via Genie button) ── */}
        <div
          style={{
            width: chatOpen ? leftWidth : 0,
            flexShrink: 0,
            overflow: 'hidden',
            transition: chatOpen ? 'none' : 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            display: 'flex',
            flexDirection: 'column',
            borderRight: chatOpen ? 'none' : '0',
            position: 'relative',
          }}
        >
          {chatOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              {/* Hide button injected into the panel header area */}
              <div style={{
                position: 'absolute', top: '8px', right: '8px', zIndex: 50,
              }}>
                <button
                  onClick={() => setChatOpen(false)}
                  title="Hide AI Chat"
                  style={{
                    width: '26px', height: '26px',
                    borderRadius: '50%',
                    background: 'rgba(247,190,57,0.15)',
                    border: '1px solid rgba(247,190,57,0.4)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: '#92400e', fontWeight: 800,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(247,190,57,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(247,190,57,0.15)'; }}
                >
                  ‹
                </button>
              </div>
              <AIChat rfq={rfq} onRfqUpdate={handleRfqUpdate} onTabSwitch={tab => setActiveFilter(tab)} />
            </div>
          )}
        </div>

        {/* ── Left Resizer Handle (only when chat is open) ── */}
        <ResizerHandle
          visible={chatOpen}
          onMouseDown={(e) => startResizing('left', e)}
        />

        {/* ── Panel 2: TRAVEL TIMELINE (flex-1, fills remaining space) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {showBookView ? (
            <BookView
              planItems={planItems}
              onClose={() => setShowBookView(false)}
              onPay={handlePay}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />
          ) : (
            <DestinationTimeline
              planItems={planItems}
              destNames={destNames}
              grandTotal={grandTotal}
              removeFromPlan={removeFromPlan}
              viewMode={viewMode}
              setViewMode={setViewMode}
              setShowBookView={setShowBookView}
              setActiveFilter={setActiveFilter}
              startDate={startDate} 
            />
          )}
        </div>

        {/* ── Right Resizer Handle ── */}
        <ResizerHandle
          visible={true}
          onMouseDown={(e) => startResizing('right', e)}
        />

        {/* ── Panel 3: Filter tabs + content ── */}
        <div
          style={{
            width: rightWidth,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="bg-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 px-3 py-2 min-w-max">
              {filterTabs.map(f => (
                <button key={f.id} onClick={() => setActiveFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${activeFilter === f.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <FilteredView filter={activeFilter} rfq={rfq} allDestData={allDestData} onAddToPlan={addToPlan} planItems={planItems} planIds={planIds} />
          </div>
        </div>

      </div>
    </div>
  );
}