// pages/DetailPage.jsx
import { useState, useRef, useEffect } from 'react';
import { parseDays } from '../utils/itineraryHelpers';
import AIChat         from '../components/detail/AIChat';
import FlightsTab     from '../components/FlightsTab';
import HotelCard      from '../components/detail/HotelCard';
import AttractionCard from '../components/detail/AttractionCard';
import TransportCard  from '../components/detail/TransportCard';


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

// ─── FilteredView ─────────────────────────────────────────────────────────────
function FilteredView({ filter, rfq, allDestData, onAddToPlan, planItems, planIds }) {
  if (filter === 'flights') return <FlightsTab rfq={rfq} planItems={planItems} onAddToPlan={onAddToPlan} />;

  if (filter === 'hotels') {
    const has = allDestData.some(dd => dd.hotels?.length > 0);
    return (
      <div className="p-4">
        <TabHeader title="Available Hotels" subtitle="Click + to add to your plan" />
        {!has ? <EmptyState icon="hotel" message="No hotel data." /> : allDestData.map((dd, di) => {
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
    const has = allDestData.some(dd => dd.attractions?.length > 0);
    return (
      <div className="p-4">
        <TabHeader title="Attractions" subtitle="Click + to add to your plan" />
        {!has ? <EmptyState icon="map" message="No attractions found." /> : allDestData.map((dd, di) => {
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
    const mainDest = rfq.destinations?.[0]?.destination || 'destination';
    const opts = [
      { id:'cab',    type:'Cab / Taxi',    provider:'Uber / Local Taxi',          from:'Airport',          to:'City Centre',   duration:'30-60 min', price:'Varies',          recommended:true  },
      { id:'metro',  type:'Metro / Subway',provider:'Local Metro',                from:'Airport Station',  to:'City Centre',   duration:'20-45 min', price:'Budget-friendly', recommended:false },
      { id:'bus',    type:'Airport Bus',   provider:'City Bus / Coach',           from:'Airport Terminal', to:'City Bus Stop', duration:'45-90 min', price:'Very cheap',      recommended:false },
      { id:'rental', type:'Car Rental',    provider:'Hertz / Enterprise / Local', from:'Airport',          to:'Self-drive',    duration:'Flexible',  price:'$30-80/day',      recommended:false },
    ];
    return (
      <div className="p-4">
        <TabHeader title="Transport Options" subtitle={`Local transport in ${mainDest}`} />
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

// ─── Main DetailPage ───────────────────────────────────────────────────────────
export default function DetailPage({ rfq: initialRfq, onBack, onUpdate, initialPlan = [] }) {
  const [rfq,           setRfq]           = useState(initialRfq);
  const [profile,       setProfile]       = useState({ fullName:'', phone:'', passport:'', budget:'', reviewer:'' });
  const [showTpForm,    setShowTpForm]    = useState(false);
  const [showDetails,   setShowDetails]   = useState(false);
  const [showBookView,  setShowBookView]  = useState(false);
  const [showBudgetToast, setShowBudgetToast] = useState(true);
  const [viewMode,      setViewMode]      = useState('daywise');
  const [activeFilter,  setActiveFilter]  = useState('flights');

  const handleSaveProfile = (p) => { localStorage.setItem('tp_profile', JSON.stringify(p)); setProfile(p); };

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

  const totalNights = rfq.destinations?.reduce((s, d) => s + (d.numberOfNights || 0), 0) || 1;
  const destNames   = rfq.destinations?.map(d => d.destination).filter(Boolean) || [];
  const title       = destNames.join(' · ') + ' ' + (totalNights + 1) + '-Day Tour';

  // Use real destinationData from rfq — no fake fallback
  const allDestData = rfq.destinationData || [];

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

  const handleRfqUpdate = (u) => { setRfq(u); if (onUpdate) onUpdate(u); };

  const flightTotal  = planItems.filter(p => p.type === 'flight' && p.status !== 'cancelled').reduce((s, f) => s + (parseFloat(f.price) || 0), 0);
  const hotelTotal   = planItems.filter(p => p.type === 'hotel'  && p.status !== 'cancelled').reduce((s, h) => s + (parseFloat(h.price || 0) * (Number(h.nights) || 1)), 0);
  const grandTotal   = flightTotal + hotelTotal;
  const pendingCount = planItems.filter(p => p.status !== 'paid' && p.status !== 'cancelled').length;

  // budget from rfq or profile
  const activeBudget = rfq.budget || rfq.tripBudget || profile.budget || 0;

  const dayGroups = {};
  planItems.forEach(item => {
    const d  = getResolvedDate(item);
    const dk = d ? fmtDate(d) : 'No Date';
    if (!dayGroups[dk]) dayGroups[dk] = [];
    dayGroups[dk].push(item);
  });

  const typeGroups = { flight:[], hotel:[], transport:[], restaurant:[], attraction:[], other:[] };
  planItems.forEach(item => { (typeGroups[item.type] || typeGroups.other).push(item); });
  const typeLabels = { flight:'Flights', hotel:'Hotels', transport:'Transport', restaurant:'Restaurants', attraction:'Attractions', other:'Other' };

  const startDate = rfq?.destinations?.[0]?.dateOfArrival || rfq?.startDate || '';
  const endDate   = rfq?.destinations?.[rfq?.destinations?.length - 1]?.dateOfDeparture || rfq?.endDate || '';

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
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">{title}</h1>
              <p className="text-[11px] text-gray-400">Trip details and planning</p>
            </div>
          </div>
          <button onClick={() => setShowDetails(v => !v)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Details</button>
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

      {/* Three panels */}
      <div className="flex flex-1 overflow-hidden">

        {/* Panel 1: AI Chat */}
        <div className="flex flex-col h-full overflow-hidden border-r border-gray-200" style={{ width:'25%' }}>
          <AIChat rfq={rfq} onRfqUpdate={handleRfqUpdate} onTabSwitch={tab => setActiveFilter(tab)} />
        </div>

        {/* Panel 2: Plan Summary OR BookView */}
        <div className="flex flex-col h-full border-r border-gray-200 overflow-hidden" style={{ width:'50%' }}>
          {showBookView ? (
            <BookView planItems={planItems} onClose={() => setShowBookView(false)} onPay={handlePay} viewMode={viewMode} setViewMode={setViewMode} />
          ) : (
            <div className="flex flex-col h-full bg-white">
              <div style={{ padding:'10px 16px', borderBottom:'1px solid #f3f4f6', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'13px', fontWeight:800, color:'#111827', textTransform:'uppercase', letterSpacing:'0.05em' }}>Plan Summary</span>
                  {planItems.length > 0 && <span style={{ fontSize:'10px', fontWeight:700, background:'rgb(247,190,57)', color:'#1a1a1a', borderRadius:'20px', padding:'1px 8px' }}>{planItems.length}</span>}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {[{ v:'daywise', l:'Day-wise' }, { v:'itemwise', l:'Item-wise' }].map(opt => (
                    <button key={opt.v} onClick={() => setViewMode(opt.v)} style={{ padding:'4px 12px', borderRadius:'20px', fontSize:'11px', fontWeight:600, cursor:'pointer', border: viewMode === opt.v ? '2px solid #F7BE39' : '1px solid #e5e7eb', background: viewMode === opt.v ? '#fef9c3' : '#fff', color: viewMode === opt.v ? '#92400e' : '#6b7280' }}>{opt.l}</button>
                  ))}
                </div>
              </div>

              <div style={{ flex:1, overflowY:'auto', padding:'12px' }}>
                {planItems.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'40px 0' }}>
                    <div style={{ fontSize:'32px', marginBottom:'8px' }}>plan</div>
                    <p style={{ fontSize:'12px', color:'#9ca3af', fontWeight:500 }}>Your plan is empty.</p>
                    <p style={{ fontSize:'11px', color:'#d1d5db' }}>Add flights, hotels and more.</p>
                  </div>
                ) : viewMode === 'daywise' ? (
                  Object.entries(dayGroups).map(([dk, items]) => (
                    <div key={dk} style={{ marginBottom:'16px' }}>
                      <SectionDivider label={`${dk} (${items.length})`} />
                      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                        {items.map(item => <PlanCard key={item.id} item={item} onRemove={removeFromPlan} />)}
                      </div>
                    </div>
                  ))
                ) : (
                  Object.entries(typeGroups).map(([type, items]) =>
                    items.length === 0 ? null : (
                      <div key={type} style={{ marginBottom:'16px' }}>
                        <SectionDivider label={typeLabels[type] || type} />
                        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                          {items.map(item => <PlanCard key={item.id} item={item} onRemove={removeFromPlan} />)}
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              {planItems.length > 0 && (
                <div style={{ flexShrink:0, borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
                  <div style={{ padding:'10px 16px', display:'flex', flexDirection:'column', gap:'4px' }}>
                    {flightTotal > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#6b7280' }}><span>Flights</span><span style={{ fontWeight:600, color:'#374151' }}>{fmt(flightTotal)}</span></div>}
                    {hotelTotal  > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#6b7280' }}><span>Hotels</span><span style={{ fontWeight:600, color:'#374151' }}>{fmt(hotelTotal)}</span></div>}
                    {grandTotal  > 0 && <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:'6px', borderTop:'1px solid #e5e7eb', marginTop:'4px' }}><span style={{ fontSize:'13px', fontWeight:800, color:'#111827', textTransform:'uppercase' }}>Total</span><span style={{ fontSize:'15px', fontWeight:800, color:'rgb(247,190,57)' }}>{fmt(grandTotal)}</span></div>}
                    {/* ── Budget Warning ── */}
                    {(() => {
                      const budgetNum = parseFloat(rfq.budget || rfq.tripBudget || 0);
                      if (budgetNum > 0 && grandTotal > budgetNum) {
                        const over = grandTotal - budgetNum;
                        return (
                          <div style={{ marginTop:'8px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'10px', padding:'10px 12px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                            <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:700, color:'#dc2626', marginBottom:'2px' }}>Budget Exceeded!</div>
                              <div style={{ fontSize:'11px', color:'#ef4444' }}>
                                You are <strong>{fmt(over)}</strong> over your budget of <strong>{fmt(budgetNum)}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      if (budgetNum > 0 && grandTotal > 0 && grandTotal <= budgetNum) {
                        const remaining = budgetNum - grandTotal;
                        return (
                          <div style={{ marginTop:'8px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'10px', padding:'10px 12px', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                            <span style={{ fontSize:'16px', flexShrink:0 }}>✅</span>
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:700, color:'#16a34a', marginBottom:'2px' }}>Within Budget</div>
                              <div style={{ fontSize:'11px', color:'#22c55e' }}>
                                <strong>{fmt(remaining)}</strong> remaining from your budget
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:'8px' }}>
                    <button onClick={() => pendingCount > 0 && setShowBookView(true)} disabled={pendingCount === 0}
                      style={{ width:'100%', padding:'12px', background: pendingCount > 0 ? 'rgb(247,190,57)' : '#e5e7eb', color: pendingCount > 0 ? '#1a1a1a' : '#9ca3af', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:800, cursor: pendingCount > 0 ? 'pointer' : 'not-allowed' }}>
                      Book now
                    </button>
                    <div style={{ display:'flex', gap:'8px' }}>
                      <button style={{ flex:1, padding:'9px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'12px', fontWeight:600, color:'#9ca3af', cursor:'pointer' }}>Send to review</button>
                      <button style={{ flex:1, padding:'9px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:'10px', fontSize:'12px', fontWeight:600, color:'#9ca3af', cursor:'pointer' }}>Manual send</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel 3: Filter tabs + content */}
        <div className="flex flex-col h-full overflow-hidden" style={{ width:'25%' }}>
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