// pages/DetailPage.jsx
import React, { useState, useRef, useEffect, useCallback, useMemo, Fragment } from 'react';
import { parseDays } from '../utils/itineraryHelpers';
import AIChat         from '../components/detail/AIChat';
import FlightsTab     from '../components/FlightsTab';
import HotelCard      from '../components/detail/HotelCard';
import AttractionCard from '../components/detail/AttractionCard';
import TransportCard  from '../components/detail/TransportCard';
import GenieChatButton from '../components/detail/GenieChatButton';
import GroupChatBox from '../components/detail/headings/GroupChatBox';
import OtherTab from '../components/detail/rightside/OtherTab';
import ViewAttachmentsModal from '../components/detail/ViewAttachmentsModal';
import { Icons } from '../ui/icons';

import axios from 'axios'; // ✅ Ye line add karo



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
const ShieldEmpty = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L4 5.5V11C4 15.4 7.4 19.5 12 21C16.6 19.5 20 15.4 20 11V5.5L12 2Z"
      stroke="#1a6fd4" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
  </svg>
);
// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const KIWI = 'https://images.kiwi.com/airlines/64/';


// ─── CITIES (RFQForm se same) ────────────────────────────────
const CITIES = [
  'Indore, India','Mumbai, India','Delhi, India','Bangalore, India',
  'Hyderabad, India','Chennai, India','Kolkata, India','Pune, India',
  'Ahmedabad, India','Jaipur, India','Surat, India','Lucknow, India',
  'London, UK','Dubai, UAE','Singapore','New York, USA',
  'Paris, France','Tokyo, Japan',
];

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
  if (item.type === 'transfer')  d = item.pickupDate || item.date || '';
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
// ─── PolicyShieldIcon ──────────────────────────────────────────────────────────
function PolicyShieldIcon({ underPolicy = true }) {
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
            position: 'absolute', bottom: '-4px', left: '50%',
            transform: 'translateX(-50%)', width: 0, height: 0,
            borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
         borderBottom: `5px solid ${underPolicy ? '#15803d' : '#b91c1c'}`,
borderTop: 'none',
bottom: 'auto',
top: '-5px',
          }} />
        </div>
      )}
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
        🗑
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

// ─── PlanCard ──────────────────────────────────────────────────────────────────
function PlanCard({ item, onRemove, itemIndex, onReorder, readOnlyPlan = false, onUpdateItem }) {
  const [imgErr, setImgErr] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [noteText, setNoteText] = useState(item.userNote || item.note || '');
  const [attachments, setAttachments] = useState(item.attachments || []);

  const status = item.status || 'pending';
  const resolvedDate = getResolvedDate(item);
  const titleText = item.type === 'flight' ? `${item.fromAirport || item.from || ''} to ${item.toAirport || item.to || ''}` : item.hotelName || item.name || item.type;
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
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid #f1f5f9', background: '#fff' }}>
          {logoSrc && !imgErr ? <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setImgErr(true)} /> : <span style={{ fontSize: '24px' }}>✈️</span>}
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
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>{item.duration || '10h 10m'}</div>
            <div style={{ height: '1.5px', background: '#e2e8f0', width: '100%', position: 'relative' }}>
              
            </div>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 800 }}>{item.stops === 0 ? 'Non-stop' : `${item.stops || 2} Stops`}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900 }}>{item.arrTime || '01:20'}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>{item.to || 'DXB'}</div>
          </div>
        </div>
       <div style={{ textAlign: 'right', minWidth: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
  {/* 1. Status aur Delete Icon ab upar aayenge */}
  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px' }}>
    {readOnlyPlan && (
      <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', background: '#166534', color: '#fff', textTransform: 'uppercase' }}>
        Approved
      </span>
    )}
     {/* ✅ POLICY SHIELD — Pending badge ke bilkul left me */}
    <PolicyShieldIcon underPolicy={item.id?.charCodeAt(0) % 2 === 0} />
    <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: status === 'paid' ? '#dcfce7' : '#fef3c7', color: status === 'paid' ? '#16a34a' : '#92400e', textTransform: 'uppercase' }}>
      {item.type === 'other' ? (status === 'paid' ? 'PAID' : 'UNPAID') : status}
    </span>
    
    {!readOnlyPlan && status !== 'paid' && (
      <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TrashIcon />
      </button>
    )}
  </div>

  {/* 2. Price ab niche aayega */}
  <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>
  {fmt(item.price || 0)}
</div>
</div>
      </div>
    </div>
  );

  return (
    <div
      draggable={!readOnlyPlan && status !== 'paid'} // Paid item move nahi hona chahiye (Optional)
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
      
      {/* 1. Left: Icon Box — SAME SIZE as flight logo box (48x48) */}
      <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
       {item.type === 'hotel' ? '🏨' : item.type === 'attraction' ? '🗺️' : item.type === 'transfer' ? '🚗' : '📌'}
      </div>

      {/* 2. Center: Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {titleText}
        </span>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.address || item.cityName || item.destination}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {resolvedDate && <PTag bg="#f1f5f9" color="#475569">{fmtDate(resolvedDate)}</PTag>}
          {(item.startTime || item.endTime) && <PTag bg="#f0f9ff" color="#0369a1">🕒 {item.startTime || ''} {item.endTime ? `- ${item.endTime}` : ''}</PTag>}
          {item.referenceId && <PTag bg="#f3f4f6" color="#6b7280">Ref: {item.referenceId}</PTag>}
        </div>
      </div>

      {/* 3. Right: Status + Price — SAME as flight */}
      <div style={{ textAlign: 'right', minWidth: '100px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
          {readOnlyPlan && (
            <span style={{ fontSize: '8px', fontWeight: 900, padding: '2px 8px', borderRadius: '20px', background: '#166534', color: '#fff', textTransform: 'uppercase' }}>Approved</span>
          )}
            <PolicyShieldIcon underPolicy={item.id?.charCodeAt(0) % 2 === 0} />
          <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: status === 'paid' ? '#dcfce7' : '#fef3c7', color: status === 'paid' ? '#16a34a' : '#92400e', textTransform: 'uppercase' }}>
            {status === 'paid' ? 'PAID' : 'PENDING'}
          </span>
          {!readOnlyPlan && status !== 'paid' && (
            <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', width: '26px', height: '26px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrashIcon />
            </button>
          )}
        </div>
   <div style={{ fontSize: '15px', fontWeight: 900, color: '#111827' }}>
  {item.price ? fmt(item.price) : ''}
</div>
      </div>
    </div>
  )}
</div>

        <div onClick={(e) => { e.stopPropagation(); setShowNotes(!showNotes); }} style={{ background: '#f8fafc', padding: '5px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '13px', color: noteText ? '#334155' : '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{noteText || "Add notes"}</div>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#e2e8f0' }}>|</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>Attachment({attachments.length})</div>
        </div>
      </div>

      {showNotes && (
        <div onClick={e => e.stopPropagation()} style={{ marginTop: '8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px', zIndex: 10, position: 'relative' }}>
          <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Type notes here..." rows={3} style={{ width: '100%', fontSize: '13px', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, cursor: 'pointer', background: '#fff', border: '1px solid #e5e7eb', padding: '8px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>📎 Attach File <input type="file" multiple style={{ display: 'none' }} onChange={e => { const files = Array.from(e.target.files).map(f => ({ name: f.name })); setAttachments(prev => [...prev, ...files]); }} /></label>
            <button onClick={() => {
  setShowNotes(false);
  // ✅ Parent ko updated note aur attachments bhejo
  if (onUpdateItem) onUpdateItem(item.id, { userNote: noteText, attachments });
}} style={{ flex: 1, background: 'rgb(247,190,57)', border: 'none', borderRadius: '10px', fontWeight: 900, color: '#1a1a1a' }}>
  Save Notes
</button>
               </div>
        </div>
      )}
    </div>
  );
}
// ─── BookView ──────────────────────────────────────────────────────────────────
function BookView({ planItems, onClose, onPay, viewMode, setViewMode }) {
  // Sirf pending items filter karein
  const pendingItems = planItems.filter(p => p.status !== 'paid' && p.status !== 'cancelled');
  
  // Selection state: Shuruat mein sab selected honge
  const [selectedIds, setSelectedIds] = useState(pendingItems.map(p => p.id));

  const toggleItem = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isAllSelected = selectedIds.length === pendingItems.length && pendingItems.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]); // Sab uncheck kar do
    } else {
      setSelectedIds(pendingItems.map(p => p.id)); // Sab check kar do
    }
  };

  const handlePay = () => { 
    if (selectedIds.length === 0) return;
    onPay(selectedIds); 
    onClose(); 
  };

  // Grouping logic (Day-wise ya Item-wise)
  const byDate = {};
  pendingItems.forEach(item => {
    const d = getResolvedDate(item);
    const dk = d ? fmtDate(d) : 'No Date';
    if (!byDate[dk]) byDate[dk] = [];
    byDate[dk].push(item);
  });

  const renderItem = (item) => {
    const isChecked = selectedIds.includes(item.id);
    const title = item.type === 'flight' ? `${item.from || ''} to ${item.to || ''}` : item.hotelName || item.name || item.type;
    const logoSrc = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;

    return (
      <div 
        key={item.id} 
        onClick={() => toggleItem(item.id)}
        style={{ 
          border: '1px solid', borderRadius: '12px', padding: '12px', marginBottom: '10px', 
          display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
          borderColor: isChecked ? 'rgb(247,190,57)' : '#e5e7eb',
          background: isChecked ? '#fffdf5' : '#fff'
        }}
      >
        <input 
          type="checkbox" 
          checked={isChecked} 
          onChange={() => {}} // Click div par handle ho raha hai
          style={{ width: '18px', height: '18px', accentColor: 'rgb(247,190,57)', cursor: 'pointer' }} 
        />
        
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {item.type === 'flight' && logoSrc ? <img src={logoSrc} style={{ width: '100%', objectFit: 'contain' }} /> : <span>{item.type === 'hotel' ? '🏨' : '📍'}</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>{title}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            {item.price ? fmt(item.price) : 'Price on request'} • {item.type.toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', padding: '5px 10px', cursor: 'pointer' }}>back</button>
          <span style={{ fontSize: '14px', fontWeight: 900 }}>BOOK ALL ITEMS</span>
        </div>
        <div style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '10px' }}>
          {[{ v: 'daywise', l: 'Day-wise' }, { v: 'itemwise', l: 'Item-wise' }].map(opt => (
            <button key={opt.v} onClick={() => setViewMode(opt.v)} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: viewMode === opt.v ? '#fff' : 'transparent', color: viewMode === opt.v ? '#111827' : '#6b7280' }}>{opt.l}</button>
          ))}
        </div>
      </div>

      {/* Select All Toolbar */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafafa' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#374151' }}>
          <input 
            type="checkbox" 
            checked={isAllSelected} 
            onChange={handleSelectAll} 
            style={{ width: '18px', height: '18px', accentColor: 'rgb(247,190,57)' }} 
          />
          Select All ({pendingItems.length})
        </label>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{selectedIds.length} items selected</span>
      </div>

      {/* List Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px 20px' }}>
        {Object.entries(byDate).map(([dateLabel, items]) => (
          <div key={dateLabel}>
            <SectionDivider label={dateLabel} />
            {items.map(renderItem)}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid #f3f4f6', background: '#fff' }}>
        <button 
          onClick={handlePay} 
          disabled={selectedIds.length === 0}
          style={{ width: '100%', padding: '14px', background: selectedIds.length > 0 ? 'rgb(247,190,57)' : '#e5e7eb', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 900, cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', marginBottom: '10px' }}
        >
          Pay for {selectedIds.length} Item{selectedIds.length !== 1 ? 's' : ''}
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '13px', color: '#6b7280', cursor: 'pointer' }}>Back to plan</button>
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const ref = useRef(null);

  // Outside click se band hoga
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchText('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!destinations || destinations.length === 0) return null;

  const filtered = searchText
    ? CITIES.filter(c => c.toLowerCase().includes(searchText.toLowerCase()))
    : [];

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', overflow: 'visible' }}>
     {destinations.map((d, i) => (
        <button
          key={i}
          onClick={() => onChange(selected === d ? '' : d)}
          style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            border: selected === d ? '2px solid rgb(247,190,57)' : '1px solid #e5e7eb',
            background: selected === d ? '#fef9c3' : '#fff',
            color: selected === d ? '#92400e' : '#374151',
          }}
        >
          {d}
        </button>
      ))}

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => { setSearchOpen(v => !v); setSearchText(''); }}
          style={{
            width: '26px', height: '26px', borderRadius: '50%', border: 'none',
            background: searchOpen ? 'rgb(247,190,57)' : '#f3f4f6',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke={searchOpen ? '#fff' : '#6b7280'} strokeWidth="2"/>
            <path d="M16.5 16.5L21 21" stroke={searchOpen ? '#fff' : '#6b7280'} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        {searchOpen && (
          <div style={{
            position: 'absolute', top: '32px', right: '0', zIndex: 9999,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px',
            padding: '10px', width: '200px', boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
          }}>
            <input
              autoFocus
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Search city..."
              style={{
                width: '100%', fontSize: '12px', border: '1px solid #e5e7eb',
                borderRadius: '8px', padding: '6px 10px', outline: 'none',
                boxSizing: 'border-box', marginBottom: '6px',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
            />
            {!searchText ? (
              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '6px 0' }}>
                Type to search cities...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '6px 0' }}>
                No results
              </div>
            ) : (
              <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filtered.map((d, i) => (
                  <div
                    key={i}
                    onMouseDown={e => {
                      e.preventDefault();
                      onChange(d);
                      setSearchOpen(false);
                      setSearchText('');
                    }}
                    style={{
                      fontSize: '12px', fontWeight: 600, padding: '7px 10px',
                      borderRadius: '8px', cursor: 'pointer', color: '#374151',
                      background: selected === d ? '#fef9c3' : 'transparent',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = selected === d ? '#fef9c3' : 'transparent'; }}
                  >
                    📍 {d}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ─── FilteredView ─────────────────────────────────────────────────────────────
function FilteredView({ filter, rfq, allDestData, onAddToPlan, planItems, planIds }) {
  const [selectedDest, setSelectedDest] = useState('');
  const [extraDestData, setExtraDestData] = useState([]);

  const allDestNames = rfq.destinations?.map(d => d.destination).filter(Boolean) || [];

  const handleDestChange = (dest) => {
    setSelectedDest(prev => prev === dest ? '' : dest);
    if (dest && !allDestData.some(dd => dd.destination === dest)
             && !extraDestData.some(dd => dd.destination === dest)) {
      setExtraDestData(prev => [...prev, {
        destination: dest,
        hotels: Array.from({ length: 6 }, (_, i) => ({
          hotelId: `SEARCH_${i}`,
          name: `${['Grand ','Royal ','City ','Park ','Central ','Premier '][i]}Hotel ${dest.split(',')[0]}`,
          cityName: dest,
          stars: [3,4,5,4,3,5][i] || 3,
          address: dest,
          rating: (4.0 + Math.random() * 0.9).toFixed(1),
          price: Math.floor(2000 + Math.random() * 8000),
          currency: 'INR',
          available: true,
        })),
        attractions: Array.from({ length: 6 }, (_, i) => ({
          attractionId: `SEARCH_ATT_${i}`,
          name: `${['Museum of ','Historic ','Central Park ','Art Gallery ','Old Town ','Monument '][i]}${dest.split(',')[0]}`,
          cityName: dest,
          category: ['Museum','Landmark','Park','Art Gallery','Historic Site','Monument'][i],
          address: dest,
          rating: (4.0 + Math.random() * 0.9).toFixed(1),
          available: true,
        })),
      }]);
    }
  };

  const combinedDestData = [...allDestData, ...extraDestData];
  const allCombinedNames = combinedDestData.map(dd => dd.destination).filter(Boolean);

  const filteredDestData = selectedDest
    ? combinedDestData.filter(dd => dd.destination === selectedDest)
    : combinedDestData;

  // ── YE FLIGHTS BLOCK ADD KARO ──
  if (filter === 'flights') return (
    <FlightsTab rfq={rfq} planItems={planItems} onAddToPlan={onAddToPlan} selectedDest={selectedDest} />
  );

  // ── YE HOTELS BLOCK ADD KARO ──
  if (filter === 'hotels') {
    const has = filteredDestData.some(dd => dd.hotels?.length > 0);
    return (
      <div className="p-4">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px', flexWrap:'wrap', gap:'8px' }}>
  <TabHeader title="Available Hotels" subtitle="Click + to add to your plan" />
  <DestDropdown destinations={allCombinedNames} selected={selectedDest} onChange={handleDestChange} />
</div>
         
        {!has ? <EmptyState icon="🏨" message="No hotel data." /> : filteredDestData.map((dd, di) => {
          const hotels = (dd.hotels || []).filter(Boolean);
          if (!hotels.length) return null;
          return (
            <DestSection key={di} index={di} name={dd.destination}>
              {hotels.map((hotel, hi) => {
                const id = `hotel_${hotel.hotelId || hi}_${dd.destination}`; 
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
          <DestDropdown destinations={allCombinedNames} selected={selectedDest} onChange={handleDestChange} />
        </div>
        {!has ? <EmptyState icon="map" message="No attractions found." /> : filteredDestData.map((dd, di) => {
          const atts = (dd.attractions || []).filter(Boolean);
          if (!atts.length) return null;
          return (
            <DestSection key={di} index={di} name={dd.destination}>
              {atts.map((a, ai) => {
                const id = `attraction_${a.attractionId || ai}_${dd.destination}`;
                return (
  <AttractionCard 
    key={ai} 
    attraction={a} 
    inPlan={planIds.includes(id)} 
    onAdd={(enrichedItem) => onAddToPlan(enrichedItem)}  // ✅ enrichedItem directly pass karo
  />
);
              })}
            </DestSection>
          );
        })}
      </div>
    );
  }

  if (filter === 'transfer') {
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
          <TabHeader title="Transfer Options" subtitle={`Local transfer in ${mainDest}`} />
          <DestDropdown destinations={allCombinedNames} selected={selectedDest} onChange={handleDestChange} />
        </div>
        <div className="flex flex-col gap-3">
          {opts.map(opt => {
            const id = 'transport_' + opt.id;
            return <TransportCard key={opt.id} option={opt} inPlan={planIds.includes(id)} onAdd={o => onAddToPlan({ ...o, type:'transfer', id })} />;
          })}
        </div>
      </div>
    );
  }

  if (filter === 'other') return <OtherTab onAddToPlan={onAddToPlan} />;
  return null;
}

// ─── DestinationTimeline (Panel 2 — Premium Travel Timeline) ─────────────────
function DestinationTimeline({
  planItems,
  destNames,
  grandTotal,
  removeFromPlan,
  viewMode,
  setViewMode,
  setShowBookView,
  setActiveFilter,
  startDate,
  addToPlan,
  reorderPlan,
  readOnlyPlan = false,
  onSendTripReview,
  canSendTripReview = false,
  reviewSendLoading = false,
  tripReviewStatus = 'draft',
  onViewAttachments,
  onUpdateItem,  
 
}) {
  const [collapsedDays, setCollapsedDays] = useState({});

  const toggleDay = (rawDate) => {
    setCollapsedDays(prev => ({ ...prev, [rawDate]: !prev[rawDate] }));
  };

  const handleDeleteFullDay = (dayItems) => {
    if (readOnlyPlan) return;
    if (window.confirm("Delete all items for this day?")) {
      dayItems.forEach(item => removeFromPlan(item.id));
    }
  };

const summaryConfig = [
  { type: 'flight',     label: 'Flights',    icon: '✈️' },
  { type: 'hotel',      label: 'Hotels',     icon: '🏨' },
  { type: 'attraction', label: 'Activities', icon: '🗺️' },
  { type: 'transfer',  label: 'Transfers',  icon: '🚗' },
  { type: 'other',      label: 'Other',      icon: '📎' },
];

// Sirf wahi items filter karo jo planItems mein maujood hain
// Naya Logic: Har type ke items count karo aur 0 waale hata do
const activeItems = summaryConfig.map(cfg => {
  // Hum count nikal rahe hain (Hotels mein hum sirf main booking count kar rahe hain, extra nights nahi)
  const count = planItems.filter(item => item.type === cfg.type && !item._isHotelContinuation).length;
  return { ...cfg, count };
}).filter(item => item.count > 0); // Sirf 1 ya usse zyada count waale hi list mein aayenge

   const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#fffbeb"; // Visual feedback (light yellow)
  };
  const handleDragLeave = (e) => {
    e.currentTarget.style.backgroundColor = "#fafafa"; // Reset color
  };
   const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#fafafa";
    if (readOnlyPlan) return;
    try {
      const data = e.dataTransfer.getData("itemData");
      if (data) {
        const item = JSON.parse(data);
        addToPlan(item); // Plan mein add kar dega
      }
    } catch (err) {
      console.error("Drop Error:", err);
    }
  };
const [itemFilter, setItemFilter] = useState('');
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

  // ─── Fixed Day Calculation Logic ───
const dayGroupsMap = {};
planItems.forEach(item => {
  const d = getResolvedDate(item);
  
  // ✅ Hotel ke liye multiple days generate karo
  if (item.type === 'hotel' && item.nights && Number(item.nights) > 1) {
    const nights = Number(item.nights);
    for (let n = 0; n < nights; n++) {
      const baseDate = new Date(d + 'T00:00:00');
      baseDate.setDate(baseDate.getDate() + n);
      const dk = baseDate.toISOString().slice(0, 10);
      if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];
      if (n === 0) {
        // ✅ Pehle din: full PlanCard dikhao (night badge ke saath)
        dayGroupsMap[dk].push({ ...item, _totalNights: nights });
      } else {
        // ✅ Agle din: sirf ek chhoti strip (no PlanCard, no delete button)
        dayGroupsMap[dk].push({
          ...item,
          id: `${item.id}_night_${n}`,
          _isHotelContinuation: true,
          _nightNumber: n + 1,
          _totalNights: nights,
          date: dk,
          checkIn: dk,
        });
      }
    }
  } else {
    const dk = d ? d : 'No Date';
if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];
dayGroupsMap[dk].push(item);
  }
});

  const sortedDayEntries = Object.entries(dayGroupsMap).sort(([a], [b]) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a) - new Date(b);
  });

  // Calculate baseline using the trip's official start date
  const planDates = planItems
  .map(item => getResolvedDate(item))
  .filter(d => d && d !== 'No Date')
  .sort();

const earliestItemDate = planDates.length > 0 ? planDates[0] : null;

// अगर प्लान में आइटम है, तो उसकी तारीख को "Day 1" का बेसलाइन मानें, 
// वरना फॉर्म की startDate को यूज करें।
const baseDateStr = earliestItemDate || startDate;
const tripBaseline = baseDateStr ? new Date(baseDateStr + 'T00:00:00') : null;
 

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>


      {/* ── Sticky Header (Updated to 5 Icons Style) ── */}
<div style={{
  padding: '8px 16px',
  borderBottom: '1px solid #f3f4f6',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
  background: '#fff',
  position: 'sticky',
  top: 0,
  zIndex: 10,
}}>
  {/* LEFT: Title + Badge + Item counts — sab ek row mein */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexWrap: 'wrap' }}>
    <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
      Trip Summary
    </h2>
    {readOnlyPlan && (
      <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', background: '#166534', color: '#fff', whiteSpace: 'nowrap' }}>
        Locked · Manager approved
      </span>
    )}
    <span style={{ color: '#e5e7eb' }}>|</span>
    {activeItems.map((item, index) => (
      <Fragment key={item.type}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280', fontSize: '11px', fontWeight: 600 }}>
          <span style={{ fontSize: '12px' }}>{item.icon}</span>
          <span style={{ color: '#111827', fontWeight: 800 }}>{item.count}</span>
          <span>{item.count > 1 ? item.label : item.label.replace(/s$/, '')}</span>
        </div>
        {index < activeItems.length - 1 && <span style={{ color: '#e5e7eb' }}>|</span>}
      </Fragment>
    ))}
  </div>

  {/* RIGHT: Attachments + Download + Toggle */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
    <button onClick={onViewAttachments} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '5px 10px', borderRadius: '8px', background: '#fff',
      border: '1.5px solid #e5e7eb', cursor: 'pointer',
      fontSize: '10px', fontWeight: 700, color: '#4b5563',
    }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
      View Attachments
    </button>

    <button style={{
      width: '28px', height: '28px', borderRadius: '8px', background: '#fff',
      border: '1.5px solid #e5e7eb', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563',
    }} title="Download Itinerary">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>

    <div style={{ display: 'flex', background: '#f3f4f6', padding: '2px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      {[{ label: 'Day-wise', value: 'daywise' }, { label: 'Item-wise', value: 'itemwise' }].map(opt => {
        const active = viewMode === opt.value;
        return (
          <button key={opt.value} onClick={() => setViewMode(opt.value)} style={{
            padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
            cursor: 'pointer', border: 'none',
            background: active ? '#fff' : 'transparent',
            color: active ? '#111827' : '#6b7280',
            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
</div>
{/* ── Item-wise Filter Tabs (sirf itemwise mode mein dikhao) ── */}
  
      {/* ── Scrollable Timeline Body ── */}
      <div 
       onDragOver={handleDragOver}   // <--- Add this
        onDragLeave={handleDragLeave} // <--- Add this
        onDrop={handleDrop} 
        style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 16px', background: '#fff' }}>

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

          /* ══ NAYA DAY-WISE VIEW (Image 1 & 2 Style) ══ */
          <div style={{ position: 'relative' }}>
    {sortedDayEntries.map(([rawDate, items], gi) => {
      const isCollapsed = collapsedDays[rawDate];
      let currentDayNum = gi + 1;
      const dayCity = getItemDestination(items[0], destNames) || "Destination";
      return (
        <div key={rawDate} style={{ marginBottom: '12px', background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => toggleDay(rawDate)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
    background: '#f3f4f6', // Pehle #fff7ed (orange) tha, ab light gray kar diya
    color: '#374151',      // Pehle #f97316 (orange) tha, ab dark gray kar diya
    fontSize: '10px', 
    fontWeight: 800, 
    padding: '2px 8px', 
    borderRadius: '6px', 
    border: '1px solid #e5e7eb', // Pehle #ffedd5 tha
    textTransform: 'uppercase' 
}}>
    DAY {currentDayNum}
</span>
                <div>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Day {currentDayNum} - {dayCity}</span>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>{rawDate === 'No Date' ? 'Unscheduled' : fmtDate(rawDate)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.2s' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
              </div>
              {!readOnlyPlan && (
              <button onClick={(e) => { e.stopPropagation(); handleDeleteFullDay(items); }} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #fee2e2', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
              )}
            </div>
          </div>
          {!isCollapsed && (
            <div style={{ padding: '16px', borderTop: '1.5px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fafafa' }}>
              {items.map((item) => <PlanCard key={item.id} item={item} onRemove={removeFromPlan} itemIndex={planItems.indexOf(item)} onReorder={reorderPlan} readOnlyPlan={readOnlyPlan} onUpdateItem={onUpdateItem} />)}
                </div>
          )}
        </div>
      );
    })}
  </div>
) : (

   
   /* ══ ITEM-WISE VIEW — Type-wise grouped, Day-wise UI style ══ */
          <div style={{ position: 'relative' }}>
            {(() => {
              const TYPE_CONFIG = [
                { type: 'flight',     label: 'Flights',     icon: '✈️' },
                { type: 'hotel',      label: 'Hotels',      icon: '🏨' },
                { type: 'attraction', label: 'Attractions', icon: '🗺️' },
                { type: 'transfer',  label: 'Transfer',   icon: '🚗' },
                { type: 'other',      label: 'Other',       icon: '📌' },
              ];

              return TYPE_CONFIG.map(({ type, label, icon }) => {
             const items = planItems.filter(i => i.type === type && (itemFilter === '' || itemFilter === type));
                if (!items.length) return null;

                return (
                  <div key={type} style={{
                    marginBottom: '20px',
                    background: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  }}>
                    {/* --- Type Header (Day-wise style) --- */}
                    <div style={{
                      padding: '12px 18px',
                      background: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{icon}</span>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#111827' }}>{label}</span>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700, color: '#6b7280',
                        background: '#f3f4f6', padding: '3px 10px', borderRadius: '20px',
                      }}>
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* --- Items --- */}
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {items.map((item) => (
                        <PlanCard
                          key={item.id}
                          item={item}
                          onRemove={removeFromPlan}
                          itemIndex={planItems.indexOf(item)}
                          onReorder={reorderPlan}
                          readOnlyPlan={readOnlyPlan}
                          onUpdateItem={onUpdateItem}
                        />
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
          
        
         
        
        
      </div>

      {/* ── Sticky Footer ── */}
     {/* ── Sticky Footer (Fixed & Centered) ── */}
    {/* ── Sticky Footer ── */}
     {/* ── Sticky Footer (Fixed & Centered) ── */}
    {/* ── Sticky Footer (Single Compact Row) ── */}
      {/* ── Sticky Footer (Single Compact Row) ── */}
      {planItems.length > 0 && (
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #f3f4f6',
          background: '#fff',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.04)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          {/* 1. Book Button — LEFT */}
          <button
            type="button"
            onClick={() => !readOnlyPlan && setShowBookView(true)}
            disabled={readOnlyPlan}
            style={{
              padding: '10px 28px',
              background: readOnlyPlan ? '#e5e7eb' : 'rgb(247,190,57)',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 900,
              cursor: readOnlyPlan ? 'not-allowed' : 'pointer',
              boxShadow: readOnlyPlan ? 'none' : '0 2px 10px rgba(247,190,57,0.38)',
              opacity: readOnlyPlan ? 0.75 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {readOnlyPlan ? 'Book (locked)' : 'BOOK NOW'}
          </button>

          {/* 2. Trip Review Button — MIDDLE */}
          <button
            type="button"
            onClick={onSendTripReview}
            disabled={!canSendTripReview || reviewSendLoading || readOnlyPlan}
            style={{
              flex: 1,
              padding: '10px 12px',
              background: readOnlyPlan ? '#dcfce7' : canSendTripReview ? '#fff' : '#f3f4f6',
              border: `1px solid ${readOnlyPlan ? '#86efac' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              color: readOnlyPlan ? '#166534' : '#6b7280',
              cursor: !canSendTripReview || reviewSendLoading || readOnlyPlan ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {reviewSendLoading
              ? '⏳ Sending…'
              : readOnlyPlan
                ? '✅ Trip review approved (locked)'
                : tripReviewStatus === 'sent'
                  ? '⏳ Manager reviewing trip…'
                  : tripReviewStatus === 'rejected'
                    ? '↩️ Re-send trip review'
                    : '📤 Send trip to manager review'}
          </button>

          {/* 3. Estimated Total — RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Estimated Total
            </span>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
              {fmt(grandTotal)}
            </span>
          </div>
        </div>
      )}
    </div> // Main div closing
  );
}

// ─── ResizerHandle (Isse hamesha component ke bahar rakho) ───
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
  const [isEditingName, setIsEditingName] = useState(false);
const [tempTripName, setTempTripName] = useState(rfq.tripName || '');
  const [profile,       setProfile]       = useState({ fullName:'', phone:'', passport:'', budget:'', reviewer:'' });
  const [showTpForm,    setShowTpForm]    = useState(false);
  const [showDetails,   setShowDetails]   = useState(false);
  const [showBookView,  setShowBookView]  = useState(false);
  const [showBudgetToast, setShowBudgetToast] = useState(true);
  const [viewMode,      setViewMode]      = useState('itemwise');
  const [activeFilter,  setActiveFilter]  = useState('flights');
   const [approvalStatus, setApprovalStatus] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [reviewSendLoading, setReviewSendLoading] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false); 


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
  const [groupChatOpen, setGroupChatOpen] = useState(false);


  // ── Responsive layout (mobile/tablet vs desktop) ──
  const [viewportW, setViewportW] = useState(() =>
    (typeof window !== 'undefined' ? window.innerWidth : 1200)
  );
  useEffect(() => {
    const onResize = () => setViewportW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const isCompact = viewportW < 1024; // mobile + tablet
  const [activePane, setActivePane] = useState('plan'); // plan | browse | chat
  useEffect(() => {
    if (!isCompact) setActivePane('plan');
    if (isCompact) setChatOpen(false);
  }, [isCompact]);

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
  // ✅ SAHI — DetailPage ke andar, handleSaveProfile ke paas
useEffect(() => {
  if (!rfq?._id) return;
  const fetchStatus = async () => {
    try {
      const res = await axios.get(`/api/budget-approvals/${rfq._id}`);
      if (res.data?.success) setApprovalStatus(res.data.data);
    } catch { }
  };
  fetchStatus();
  const interval = setInterval(fetchStatus, 4000);
  return () => clearInterval(interval);
}, [rfq?._id]);

  // Manager ne trip review approve kiya — user page refresh ke bina pick up
  useEffect(() => {
    if (!rfq?._id || rfq.reviewStatus !== 'sent') return;
    const tick = async () => {
      try {
        const res = await axios.get(`/api/rfqs/${rfq._id}`);
        if (res.data?.success && res.data.data?.reviewStatus === 'approved') {
          const d = res.data.data;
          setRfq(d);
          try {
            localStorage.setItem('current_rfq_' + (d._id || 'default'), JSON.stringify(d));
          } catch {}
          if (onUpdate) onUpdate(d);
        }
      } catch { /* ignore */ }
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => clearInterval(iv);
  }, [rfq?._id, rfq.reviewStatus]);

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
    // 3. NEW LOGIC: Plan mein added har item ki city check karo
  planItems.forEach(item => {
    let rawLocation = "";

    if (item.type === 'flight') {
      rawLocation = item.cityName || item.to || item.toAirport;
    } else if (item.type === 'hotel' || item.type === 'attraction') {
      rawLocation = item.cityName || item.address;
    } else if (item.type === 'transfer') {
      rawLocation = item.to; // Drop location
    } else if (item.type === 'other') {
      rawLocation = item.destination || item.cityName;
    }

    const c = resolveCity(rawLocation);
    if (c) cities.add(c);
  });

  return Array.from(cities);
}, [planItems, destNames, rfq.from]);
  const journeyPath = journeyCities

  // 3. Calculation for Date Range & Form-based Days
  const tripDateRange = startDate && endDate ? `${fmtDate(startDate)} - ${fmtDate(endDate)}` : "";
  const rfqTotalNights = rfq.destinations?.reduce((sum, d) => sum + (Number(d.nights || d.numberOfNights) || 0), 0) || 0;
  const totalDaysFromForm = rfqTotalNights > 0 ? rfqTotalNights + 1 : 1;

  // 4. Main Title Construction
  const tripTitle = (rfq.tripName || "MY TRIP").toUpperCase();
  const dynamicMainHeading = `${tripTitle}`;
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
    { id:'transfer',   label:'Transfer'   },
    { id:'other',       label:'Other'       },
  ];

  const addToPlan = (item) => {
    if (rfq.reviewStatus === 'approved') return;
    const id = item.id || (item.type + '_' + Date.now());
    setPlanItems(prev => {
      if (prev.find(p => p.id === id)) return prev;
      const next = [...prev, { ...item, id, status: item.status || 'pending' }];
      saveItems(next);
      return next;
    });
    setShowBudgetToast(true);
  };
const reorderPlan = (fromIdx, toIdx) => {
  if (rfq.reviewStatus === 'approved') return;
  setPlanItems(prev => {
    const next = [...prev];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    saveItems(next);
    return next;
  });
};
  const removeFromPlan = (id) => {
    if (rfq.reviewStatus === 'approved') return;
    setPlanItems(prev => {
    const next = prev.filter(p => p.id !== id);
    saveItems(next);
    return next;
  });
  };
  const updatePlanItem = (id, updates) => {
    setPlanItems(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveItems(next);
      return next;
    });
  };

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
  const handleUpdateTripName = async () => {
  if (!tempTripName.trim()) {
    setIsEditingName(false);
    return;
  }
  try {
    const res = await axios.put(`/api/rfqs/${rfq._id}`, { tripName: tempTripName });
    if (res.data?.success) {
      handleRfqUpdate(res.data.data);
      setIsEditingName(false);
    }
  } catch (err) {
    console.error("Failed to update trip name", err);
    alert("Could not update trip name");
  }
};

  const planFrozen = rfq.reviewStatus === 'approved';
  const budgetApproved = approvalStatus?.status === 'approved';
  const canSendTripReview =
    budgetApproved &&
    planItems.length > 0 &&
    !planFrozen &&
    rfq.reviewStatus !== 'sent' &&
    rfq.reviewStatus !== 'approved';

  const handleSendTripReview = async () => {
    if (!rfq?._id || planFrozen || reviewSendLoading) return;
    if (!budgetApproved) {
      window.alert('Pehle “Send Budget Approval” bhejo aur manager se budget approve karwao.');
      return;
    }
    if (planItems.length === 0) {
      window.alert('Plan mein kam se kam ek item add karo.');
      return;
    }
    if (!canSendTripReview) return;
    setReviewSendLoading(true);
    try {
      const res = await axios.post(`/api/rfqs/${rfq._id}/send-to-review`, {
        planItems,
        grandTotal,
      });
      if (res.data?.success) handleRfqUpdate(res.data.data);
      else window.alert(res.data?.message || 'Failed');
    } catch (e) {
      window.alert(e.response?.data?.message || e.message || 'Error');
    } finally {
      setReviewSendLoading(false);
    }
  };

  const flightTotal    = planItems.filter(p => p.type === 'flight'    && p.status !== 'cancelled').reduce((s, f) => s + (parseFloat(f.price) || 0), 0);
 const hotelTotal = planItems
  .filter(p => p.type === 'hotel' && p.status !== 'cancelled' && !p._isHotelContinuation)
  .reduce((s, h) => s + (parseFloat(h.price || 0) * (Number(h.nights) || 1)), 0);
 const transportTotal = planItems.filter(p => p.type === 'transfer' && p.status !== 'cancelled').reduce((s, t) => s + (parseFloat(t.price?.replace(/[^\d]/g, '') || 0) || 0), 0);
const otherTotal     = planItems.filter(p => p.type === 'other'     && p.status !== 'cancelled').reduce((s, o) => s + (parseFloat(o.price) || 0), 0);
const grandTotal     = flightTotal + hotelTotal + transportTotal + otherTotal;

  const activeBudget = rfq.budget || rfq.tripBudget || profile.budget || 0;

  /** User-facing trip ref (form pe jo ID dikhti hai); API/localStorage ke liye _id same rehta hai */
  const displayTripId =
    (rfq?.rfqId && String(rfq.rfqId).trim()) ||
    (rfq?._id && String(rfq._id).replace(/: /g, '').trim()) ||
    '';

 
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
  {isEditingName ? (
    <input
      autoFocus
      value={tempTripName}
      onChange={(e) => setTempTripName(e.target.value)}
      onBlur={handleUpdateTripName}
      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTripName()}
      style={{
        fontSize: '16px', fontWeight: 900, border: 'none',
        borderBottom: '2px solid rgb(247,190,57)', outline: 'none',
        background: 'transparent', color: '#111827', width: '200px'
      }}
    />
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <h1 className="text-[16px] font-black text-gray-900 tracking-tight leading-none uppercase">
        {rfq.tripName || "MY TRIP"}
      </h1>
      {!planFrozen && (
        <button
          onClick={() => { setTempTripName(rfq.tripName); setIsEditingName(true); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#9ca3af' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      )}
    </div>
  )}

  <span style={{ 
    fontSize: '9px', fontWeight: 800,
    background: planFrozen ? '#dcfce7' : rfq.reviewStatus === 'sent' ? '#fef3c7' : rfq.reviewStatus === 'rejected' ? '#fee2e2' : '#f3f4f6',
    color: planFrozen ? '#166534' : rfq.reviewStatus === 'sent' ? '#92400e' : rfq.reviewStatus === 'rejected' ? '#991b1b' : '#6b7280',
    padding: '2px 6px', borderRadius: '4px', border: '1px solid #e5e7eb',
    textTransform: 'uppercase', marginLeft: '2px',
  }}>
    {planFrozen ? 'Approved' : rfq.reviewStatus === 'sent' ? 'Review pending' : rfq.reviewStatus === 'rejected' ? 'Rejected' : 'Open'}
  </span>
  
  {tripDateRange && (
    <span style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', borderLeft: '1.5px solid #e5e7eb', paddingLeft: '12px' }}>
      {tripDateRange}
    </span>
  )}
</div>

              {/* ID Badge + Visual Journey Route (Arrows ➔) */}
              <div className="flex items-center gap-2">
                {displayTripId && (
               <span
                 className="text-[9px] font-extrabold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 uppercase tracking-widest"
                 title={rfq._id ? `DB id: ${rfq._id}` : undefined}
               >
  TRIP-ID: {displayTripId}
</span>

                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#6b7280" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
  <span style={{ 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#6b7280', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  }}>
    {rfqTotalNights} Night{rfqTotalNights !== 1 ? 's' : ''}
  </span>
</span>
<span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '10px' }}>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="#6b7280" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
  <span style={{ 
    fontSize: '10px', 
    fontWeight: 700, 
    color: '#6b7280', 
    textTransform: 'uppercase', 
    letterSpacing: '0.05em' 
  }}>
    {/* Total travelers calculation */}
    {(rfq.numberOfAdults || 1) + (rfq.numberOfChildren || 0) + (rfq.numberOfInfants || 0)} Pax
  </span>
</span>


<span className="text-gray-300 text-xs">|</span>
                
                <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'nowrap' }}>
 {journeyCities.map((city, i) => (
  <span key={i} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
    {i === 0 && (
      <svg width="10" height="12" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#E53E3E"/>
        <circle cx="12" cy="9" r="3" fill="#9B2C2C"/>
      </svg>
    )}
    <span style={{ fontSize:'10px', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.05em' }}>
      {city}
    </span>
    {i < journeyCities.length - 1 && (
      <span style={{ color:'#d1d5db', fontSize:'10px', margin:'0 2px' }}>•</span>
    )}
  </span>
))}
</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginRight: '10px', borderRight: '1px solid #e5e7eb', paddingRight: '10px' }}>
    
    {/* ✅ View business trip policy - LEFT side, bada aur dark */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
      <ShieldEmpty size={15} />
      <span style={{ fontSize: '12px', color: '#1e40af', textDecoration: 'underline', fontWeight: 700, letterSpacing: '0.01em' }}>
        View business trip policy
      </span>
    </div>

    {/* Trip Budget - RIGHT side */}
{/* Trip Budget — sirf tab dikhao jab approved NAHI hai */}
{approvalStatus?.status !== 'approved' && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1.5px solid #e5e7eb', paddingRight: '15px' }}>
    <span style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      Trip Budget :
    </span>
    <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827', whiteSpace: 'nowrap' }}>
      {activeBudget ? `₹${Number(activeBudget).toLocaleString('en-IN')}` : 'No Budget'}
    </span>
  </div>
)}


{/* Approved hone par sirf green badge */}
{approvalStatus?.status === 'approved' && (
  <div style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '6px', border: '1px solid #86efac' }}>
    ✅ Approved Budget: ₹{Number(approvalStatus.approvedBudget).toLocaleString('en-IN')}
  </div>
)}

{approvalStatus?.status === 'rejected' && (
  <div style={{ fontSize: '9px', fontWeight: 800, color: '#dc2626', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
    ❌ Rejected {approvalStatus.managerComment && `— ${approvalStatus.managerComment}`}
  </div>
)}
{approvalStatus?.status === 'pending' && (
  <div style={{ fontSize: '9px', fontWeight: 700, color: '#92400e', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px' }}>
    ⏳ Pending
  </div>
)}
  </div>
   {/* 1. NAYA BUTTON: Send Budget Approval */}
  <button 
    type="button"
    disabled={planFrozen || approvalLoading}
    style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '6px 12px', borderRadius: '8px', background: planFrozen ? '#f3f4f6' : '#fff',
      border: '1.5px solid rgb(247,190,57)', cursor: planFrozen || approvalLoading ? 'not-allowed' : 'pointer',
      fontSize: '10px', fontWeight: 800, color: planFrozen ? '#9ca3af' : 'rgb(180, 130, 0)',
      textTransform: 'uppercase', letterSpacing: '0.02em',
      transition: 'all 0.15s',
      opacity: planFrozen ? 0.7 : 1,
    }}
    onMouseEnter={e => { if (!planFrozen) e.currentTarget.style.background = '#fffbeb'; }}
    onMouseLeave={e => { if (!planFrozen) e.currentTarget.style.background = '#fff'; }}
    onClick={async () => {
  if (planFrozen || approvalLoading) return;
  setApprovalLoading(true);
  try {
    await axios.post('/api/budget-approvals', {
      tripId:           rfq._id,
      rfqId:            (rfq.rfqId && String(rfq.rfqId).trim()) || '',
      tripName:         rfq.tripName || 'My Trip',
      requestedBy:      'user',
      budget:           Number(activeBudget) || 0,
      grandTotal:       grandTotal,
      planItems:        planItems,
      destinations:     rfq.destinations || [],
      numberOfAdults:   rfq.numberOfAdults   || 1,
      numberOfChildren: rfq.numberOfChildren || 0,
      numberOfInfants:  rfq.numberOfInfants  || 0,
    });
    // Turant status fetch karo
    const res = await axios.get(`/api/budget-approvals/${rfq._id}`);
    if (res.data?.success) setApprovalStatus(res.data.data);
  } catch (err) {
    alert('Error sending approval: ' + (err.response?.data?.message || err.message));
  } finally {
    setApprovalLoading(false);
  }
}}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  {approvalLoading
  ? '⏳ Sending...'
  : approvalStatus?.status === 'pending'
    ? '⏳ Approval Pending'
    : approvalStatus?.status === 'approved'
      ? (() => {
          const approved = Number(approvalStatus.approvedBudget) || 0;
          const remaining = approved - grandTotal;
          const isOver = remaining < 0;
          return `${isOver ? '⚠️ Over ₹' : '✅ ₹'}${Math.abs(remaining).toLocaleString('en-IN')} ${isOver ? 'over' : 'left'}`;
        })()
      : approvalStatus?.status === 'rejected'
        ? '🔄 Re-send Approval'
        : '📤 Send Budget Approval'
}
  </button>
            <PermissionAvatars />

{/* ✅ Group Chat Button */}
<button
  onClick={() => setGroupChatOpen(v => !v)}
  style={{
    position: 'relative',
    width: '32px', height: '32px',
    borderRadius: '10px',
    background: groupChatOpen ? 'rgb(247,190,57)' : '#fff',
    border: `1.5px solid ${groupChatOpen ? 'rgb(247,190,57)' : '#e5e7eb'}`,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s',
    boxShadow: groupChatOpen ? '0 4px 12px rgba(247,190,57,0.35)' : 'none',
  }}
  title="Group Chat"
>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={groupChatOpen ? '#1a1a1a' : '#374151'}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
  <span style={{
    position: 'absolute', top: '-4px', right: '-4px',
    width: '9px', height: '9px', borderRadius: '50%',
    background: '#22c55e', border: '2px solid #fff',
  }} />
</button>
{/* 🔔 Notification Bell Button */}
<button
  style={{
    position: 'relative',
    width: '32px', height: '32px',
    borderRadius: '10px',
    background: '#fff',
    border: '1.5px solid #e5e7eb',
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.18s',
  }}
  title="Notifications"
>
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
  {/* Red dot — notification badge */}
  <span style={{
    position: 'absolute', top: '-4px', right: '-4px',
    width: '9px', height: '9px', borderRadius: '50%',
    background: '#ef4444', border: '2px solid #fff',
  }} />
</button>

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
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
              <button
                type="button"
                onClick={handleSendTripReview}
                disabled={!canSendTripReview || reviewSendLoading || planFrozen}
                style={{
                  padding:'8px 18px',
                  background: planFrozen ? '#dcfce7' : 'rgb(247,190,57)',
                  color:'#1a1a1a',
                  border:'none',
                  borderRadius:'10px',
                  fontSize:'12px',
                  fontWeight:700,
                  cursor: (!canSendTripReview || reviewSendLoading || planFrozen) ? 'not-allowed' : 'pointer',
                  opacity: (!canSendTripReview || reviewSendLoading) && !planFrozen ? 0.65 : 1,
                }}
              >
                {reviewSendLoading ? '⏳…' : planFrozen ? '✅ Trip locked' : rfq.reviewStatus === 'sent' ? '⏳ Pending' : '📤 Send trip review'}
              </button>
              {!budgetApproved && !planFrozen && (
                <span style={{ fontSize:'10px', color:'#9ca3af' }}>Budget approve pehle</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          Responsive Layout
      ══════════════════════════════════════════════ */}
      

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'column', position: 'relative' }}>
        {isCompact && (
          <div className="bg-white border-b border-gray-200 flex-shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2 px-3 py-2 min-w-max">
              {[
                { id: 'plan', label: 'Plan', icon: Icons.ClipboardList },
                { id: 'browse', label: 'Browse', icon: Icons.Search },
                { id: 'chat', label: 'AI', icon: Icons.Sparkles },
              ].map(t => {
                const ActiveIcon = t.icon;
                const active = activePane === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActivePane(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                      active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <ActiveIcon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isCompact ? (
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: 'row', position: 'relative' }}>
            {/* ── Panel 1: AI Chat (collapsible via Genie button) ── */}
            <div
              style={{
                width: chatOpen ? leftWidth : 0,
                flexShrink: 0,
                overflow: 'hidden',
                transition: chatOpen ? 'none' : 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                flexDirection: 'column',
                borderRight: 'none',
                position: 'relative',
              }}
            >
              {chatOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                  <AIChat
                    rfq={rfq}
                    onRfqUpdate={handleRfqUpdate}
                    onTabSwitch={tab => setActiveFilter(tab)}
                    onClose={() => setChatOpen(false)}
                  />
                </div>
              )}
            </div>

            <ResizerHandle visible={chatOpen} onMouseDown={(e) => startResizing('left', e)} />

            {/* ── Panel 2: TRAVEL TIMELINE ── */}
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
                  addToPlan={addToPlan}
                  reorderPlan={reorderPlan}
                  readOnlyPlan={planFrozen}
                  onSendTripReview={handleSendTripReview}
                  canSendTripReview={canSendTripReview}
                  reviewSendLoading={reviewSendLoading}
                  tripReviewStatus={rfq.reviewStatus || 'draft'}
                  onViewAttachments={() => setShowAttachments(true)}
                  onUpdateItem={updatePlanItem}
                />
              )}
            </div>

            <ResizerHandle visible={true} onMouseDown={(e) => startResizing('right', e)} />

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
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activePane === 'chat' && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <AIChat
                  rfq={rfq}
                  onRfqUpdate={handleRfqUpdate}
                  onTabSwitch={tab => { setActiveFilter(tab); setActivePane('browse'); }}
                  onClose={() => setActivePane('plan')}
                />
              </div>
            )}

            {activePane === 'plan' && (
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
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
                    addToPlan={addToPlan}
                    reorderPlan={reorderPlan}
                    readOnlyPlan={planFrozen}
                    onSendTripReview={handleSendTripReview}
                    canSendTripReview={canSendTripReview}
                    reviewSendLoading={reviewSendLoading}
                    tripReviewStatus={rfq.reviewStatus || 'draft'}
                     onViewAttachments={() => setShowAttachments(true)}  // ✅ ADD (agar nahi hai)
  onUpdateItem={updatePlanItem}      
                  />
                )}
              </div>
            )}

            {activePane === 'browse' && (
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
            )}
          </div>
        )}
      </div>
            {/* ✅ YAHAN ADD KARO */}
      {groupChatOpen && (
        <GroupChatBox onClose={() => setGroupChatOpen(false)} />
      )}

 {showAttachments && (
        <ViewAttachmentsModal
          planItems={planItems}
          onClose={() => setShowAttachments(false)}
        />
      )}
    </div>
  );
}