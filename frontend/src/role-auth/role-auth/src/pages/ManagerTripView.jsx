// ============================================================
//  ManagerTripView.jsx
//  Sirf Trip Review ke liye — full timeline + approve/reject
//  Budget approval ab inline ManagerPage mein hota hai
// ============================================================

import { useState, useEffect, Fragment } from 'react';
import GroupChatBox from '../../../../components/detail/headings/GroupChatBox';
import axios from 'axios';

// ─── Helpers ─────────────────────────────────────────────────
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

function getItemDestination(item, destNames) {
  const candidates = [item.cityName, item.destination, item.toAirport, item.to, item.address, item.name]
    .filter(Boolean).map(s => String(s).toLowerCase());
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

// ─── PTag ─────────────────────────────────────────────────────
function PTag({ bg, color, children }) {
  return (
    <span style={{ fontSize:'10px', fontWeight:600, padding:'2px 7px', borderRadius:'6px', background:bg||'#f3f4f6', color:color||'#374151', display:'inline-block' }}>
      {children}
    </span>
  );
}

// ─── PlanCard (read-only for manager) ─────────────────────────
function PlanCard({ item }) {
  const [imgErr, setImgErr] = useState(false);
  const status       = item.status || 'pending';
  const resolvedDate = getResolvedDate(item);
  const titleText    = item.type === 'flight'
    ? `${item.fromAirport || item.from || ''} → ${item.toAirport || item.to || ''}`
    : item.hotelName || item.name || item.type;
  const logoSrc = item.type === 'flight' ? (item.logo || getLogoUrl(item.airline || '')) : null;

  const borderStyle = status === 'paid'
    ? { borderColor:'#86efac', background:'#f0fdf4' }
    : { borderColor:'#e5e7eb', background:'#fff' };

  const renderFlight = () => (
    <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'10px', overflow:'hidden', flexShrink:0, border:'1px solid #f1f5f9', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {logoSrc && !imgErr
            ? <img src={logoSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={() => setImgErr(true)} />
            : <span style={{ fontSize:'24px' }}>✈️</span>}
        </div>
        <div style={{ minWidth:'80px' }}>
          <div style={{ fontSize:'15px', fontWeight:800, color:'#1a1a1a' }}>{item.airline || 'AI'}</div>
          <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:700 }}>{item.flightNumber || ''}</div>
        </div>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'12px', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:900 }}>{item.depTime || '-'}</div>
            <div style={{ fontSize:'11px', color:'#64748b', fontWeight:700 }}>{item.from || '-'}</div>
          </div>
          <div style={{ flex:1, textAlign:'center', minWidth:'80px' }}>
            <div style={{ fontSize:'11px', color:'#94a3b8', fontWeight:700 }}>{item.duration || ''}</div>
            <div style={{ height:'1.5px', background:'#e2e8f0', width:'100%' }} />
            <div style={{ fontSize:'11px', color:'#f59e0b', fontWeight:800 }}>
              {item.stops === 0 ? 'Non-stop' : `${item.stops || 0} Stops`}
            </div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'20px', fontWeight:900 }}>{item.arrTime || '-'}</div>
            <div style={{ fontSize:'11px', color:'#64748b', fontWeight:700 }}>{item.to || '-'}</div>
          </div>
        </div>
        <div style={{ textAlign:'right', minWidth:'100px', display:'flex', flexDirection:'column', gap:'8px' }}>
          <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background: status==='paid' ? '#dcfce7' : '#fef3c7', color: status==='paid' ? '#16a34a' : '#92400e', textTransform:'uppercase', alignSelf:'flex-end' }}>
            {status}
          </span>
          <div style={{ fontSize:'18px', fontWeight:900, color:'#111827' }}>{fmt(item.price || 0)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ marginBottom:'16px', borderRadius:'16px', border:'1.5px solid', ...borderStyle, overflow:'hidden', boxShadow:'0 2px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ padding:'16px' }}>
        {item.type === 'flight' ? renderFlight() : (
          <div style={{ display:'flex', alignItems:'stretch', gap:'12px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'10px', background:'#f8fafc', border:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
              {item.type==='hotel' ? '🏨' : item.type==='attraction' ? '🗺️' : item.type==='transfer' ? '🚗' : '📌'}
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', minWidth:0 }}>
              <span style={{ fontSize:'15px', fontWeight:800, color:'#111827', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{titleText}</span>
              <div style={{ fontSize:'12px', color:'#64748b', marginTop:'2px' }}>{item.address || item.cityName || item.destination || ''}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'4px', marginTop:'8px' }}>
                {resolvedDate && <PTag bg="#f1f5f9" color="#475569">{fmtDate(resolvedDate)}</PTag>}
                {item.referenceId && <PTag bg="#f3f4f6" color="#6b7280">Ref: {item.referenceId}</PTag>}
              </div>
            </div>
            <div style={{ textAlign:'right', minWidth:'100px', display:'flex', flexDirection:'column', justifyContent:'space-between', flexShrink:0 }}>
              <span style={{ fontSize:'9px', fontWeight:800, padding:'2px 8px', borderRadius:'20px', background: status==='paid' ? '#dcfce7' : '#fef3c7', color: status==='paid' ? '#16a34a' : '#92400e', textTransform:'uppercase' }}>
                {status==='paid' ? 'PAID' : 'PENDING'}
              </span>
              <div style={{ fontSize:'18px', fontWeight:900, color:'#111827' }}>
                {item.price ? fmt(item.price) : ''}
              </div>
            </div>
          </div>
        )}
      </div>
      {item.userNote && (
        <div style={{ background:'#f8fafc', padding:'8px 16px', borderTop:'1px solid #f1f5f9', fontSize:'12px', color:'#64748b' }}>
          📝 {item.userNote}
        </div>
      )}
    </div>
  );
}

// ─── Manager Timeline ──────────────────────────────────────────
function ManagerTimeline({ planItems, destNames, grandTotal, viewMode, setViewMode }) {
  const [collapsedDays, setCollapsedDays] = useState({});
  const toggleDay = (rawDate) => setCollapsedDays(prev => ({ ...prev, [rawDate]: !prev[rawDate] }));

  const summaryConfig = [
    { type:'flight',     label:'Flights',    icon:'✈️' },
    { type:'hotel',      label:'Hotels',     icon:'🏨' },
    { type:'attraction', label:'Activities', icon:'🗺️' },
    { type:'transfer',   label:'Transfers',  icon:'🚗' },
    { type:'other',      label:'Other',      icon:'📎' },
  ];
  const activeItems = summaryConfig.map(cfg => ({
    ...cfg,
    count: planItems.filter(i => i.type === cfg.type && !i._isHotelContinuation).length,
  })).filter(i => i.count > 0);

  // Day groups
  const dayGroupsMap = {};
  planItems.forEach(item => {
    const d = getResolvedDate(item);
    if (item.type === 'hotel' && item.nights && Number(item.nights) > 1) {
      const nights = Number(item.nights);
      for (let n = 0; n < nights; n++) {
        const baseDate = new Date(d + 'T00:00:00');
        baseDate.setDate(baseDate.getDate() + n);
        const dk = baseDate.toISOString().slice(0, 10);
        if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];
        dayGroupsMap[dk].push(n === 0
          ? { ...item, _totalNights: nights }
          : { ...item, id: `${item.id}_night_${n}`, _isHotelContinuation: true, _nightNumber: n + 1, _totalNights: nights, date: dk, checkIn: dk }
        );
      }
    } else {
      const dk = d || 'No Date';
      if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];
      dayGroupsMap[dk].push(item);
    }
  });

  const sortedDayEntries = Object.entries(dayGroupsMap).sort(([a], [b]) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a) - new Date(b);
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background:'#fff' }}>

      {/* Header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <h2 style={{ fontSize:'20px', fontWeight:900, color:'#111827', margin:'0 0 6px 0' }}>Trip Summary</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            {activeItems.map((item, index) => (
              <Fragment key={item.type}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', color:'#6b7280', fontSize:'12px', fontWeight:600 }}>
                  <span style={{ fontSize:'14px' }}>{item.icon}</span>
                  <span style={{ color:'#111827', fontWeight:800 }}>{item.count}</span>
                  <span>{item.count > 1 ? item.label : item.label.replace(/s$/, '')}</span>
                </div>
                {index < activeItems.length - 1 && <span style={{ color:'#e5e7eb' }}>|</span>}
              </Fragment>
            ))}
          </div>
        </div>
        {/* Toggle */}
        <div style={{ display:'flex', background:'#f3f4f6', padding:'3px', borderRadius:'12px', border:'1px solid #e5e7eb' }}>
          {[{ label:'Day-wise', value:'daywise' }, { label:'Item-wise', value:'itemwise' }].map(opt => {
            const active = viewMode === opt.value;
            return (
              <button key={opt.value} onClick={() => setViewMode(opt.value)} style={{
                padding:'6px 14px', borderRadius:'9px', fontSize:'11px', fontWeight:700,
                cursor:'pointer', border:'none', background: active ? '#fff' : 'transparent',
                color: active ? '#111827' : '#6b7280',
                boxShadow: active ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1, overflowY:'auto', padding:'24px 24px 16px', background:'#fff' }}>
        {planItems.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 20px' }}>
            <div style={{ fontSize:'52px', marginBottom:'18px' }}>🗺️</div>
            <h3 style={{ fontSize:'17px', fontWeight:900, color:'#374151', marginBottom:'8px' }}>No items in plan yet</h3>
            <p style={{ fontSize:'12px', color:'#9ca3af' }}>User ne abhi koi item plan mein add nahi kiya.</p>
          </div>
        ) : viewMode === 'daywise' ? (
          <div>
            {sortedDayEntries.map(([rawDate, items], gi) => {
              const isCollapsed = collapsedDays[rawDate];
              const dayCity = getItemDestination(items[0], destNames) || 'Destination';
              return (
                <div key={rawDate} style={{ marginBottom:'12px', background:'#fff', borderRadius:'12px', border:'1.5px solid #e5e7eb', overflow:'hidden' }}>
                  <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={() => toggleDay(rawDate)}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ background:'#f3f4f6', color:'#374151', fontSize:'10px', fontWeight:800, padding:'2px 8px', borderRadius:'6px', border:'1px solid #e5e7eb', textTransform:'uppercase' }}>
                        DAY {gi + 1}
                      </span>
                      <div>
                        <span style={{ fontSize:'14px', fontWeight:700 }}>Day {gi + 1} - {dayCity}</span>
                        <div style={{ fontSize:'11px', color:'#9ca3af' }}>{rawDate === 'No Date' ? 'Unscheduled' : fmtDate(rawDate)}</div>
                      </div>
                    </div>
                    <div style={{ width:'32px', height:'32px', borderRadius:'8px', border:'1.5px solid #f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition:'0.2s' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                  {!isCollapsed && (
                    <div style={{ padding:'16px', borderTop:'1.5px solid #f3f4f6', display:'flex', flexDirection:'column', gap:'12px', background:'#fafafa' }}>
                      {items.map(item => <PlanCard key={item.id} item={item} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {[
              { type:'flight',     label:'Flights',     icon:'✈️' },
              { type:'hotel',      label:'Hotels',      icon:'🏨' },
              { type:'attraction', label:'Attractions', icon:'🗺️' },
              { type:'transfer',   label:'Transfer',    icon:'🚗' },
              { type:'other',      label:'Other',       icon:'📌' },
            ].map(({ type, label, icon }) => {
              const items = planItems.filter(i => i.type === type);
              if (!items.length) return null;
              return (
                <div key={type} style={{ marginBottom:'20px', background:'#fff', borderRadius:'12px', border:'1px solid #e5e7eb', overflow:'hidden' }}>
                  <div style={{ padding:'12px 18px', background:'#f9fafb', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'16px' }}>{icon}</span>
                      <span style={{ fontSize:'15px', fontWeight:800, color:'#111827' }}>{label}</span>
                    </div>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#6b7280', background:'#f3f4f6', padding:'3px 10px', borderRadius:'20px' }}>
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>
                    {items.map(item => <PlanCard key={item.id} item={item} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Grand total only (approve/reject upar sub-bar mein hai) */}
      {planItems.length > 0 && (
        <div style={{ padding:'14px 20px', borderTop:'1px solid #f3f4f6', background:'#fff', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'16px', flexShrink:0 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', fontWeight:700, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>Plan Total</div>
            <div style={{ fontSize:'24px', fontWeight:900, color:'#111827' }}>{fmt(grandTotal)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ManagerTripView ──────────────────────────────────────
export default function ManagerTripView({ rfq: initialRfq, initialPlanItems: propPlanItems = [], initialApprovalDoc = null, onBack }) {
  const rfq = initialRfq;
  const [viewMode, setViewMode]             = useState('daywise');
  const [groupChatOpen, setGroupChatOpen]   = useState(false);
  const [approvalData, setApprovalData]     = useState(() => initialApprovalDoc || null);
  const [actionLoading, setActionLoading]   = useState(false);
  const [planItems, setPlanItems]           = useState(() => propPlanItems || []);

  useEffect(() => {
    setPlanItems(propPlanItems || []);
  }, [initialRfq?._id, propPlanItems]);

  // Fetch latest approval + plan items
  useEffect(() => {
    if (!initialRfq?._id) return;
    axios.get(`/api/budget-approvals/${initialRfq._id}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const d = res.data.data;
          setApprovalData(d);
          if (Array.isArray(d.planItems) && d.planItems.length) {
            setPlanItems(d.planItems);
          }
        }
      })
      .catch(() => {});
  }, [initialRfq?._id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/budget-approvals/${rfq._id}`, {
        status: 'approved',
        approvedBudget: approvalData?.budget ?? rfq.budget,
      });
      if (res.data?.success) setApprovalData(res.data.data);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/budget-approvals/${rfq._id}`, {
        status: 'rejected',
      });
      if (res.data?.success) setApprovalData(res.data.data);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const destNames = rfq?.destinations?.map((d) => d.destination).filter(Boolean) || [];

  const flightTotal   = planItems.filter(p => p.type==='flight'   && p.status!=='cancelled').reduce((s,f) => s+(parseFloat(f.price)||0), 0);
  const hotelTotal    = planItems.filter(p => p.type==='hotel'    && p.status!=='cancelled' && !p._isHotelContinuation).reduce((s,h) => s+(parseFloat(h.price||0)*(Number(h.nights)||1)), 0);
  const otherTotal    = planItems.filter(p => p.type==='other'    && p.status!=='cancelled').reduce((s,o) => s+(parseFloat(o.price)||0), 0);
  const transferTotal = planItems.filter(p => p.type==='transfer' && p.status!=='cancelled').reduce((s,t) => s+(parseFloat((t.price||'').toString().replace(/[^\d]/g,''))||0), 0);
  const grandTotal    = flightTotal + hotelTotal + otherTotal + transferTotal;

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#f8fafc', fontFamily:"'Segoe UI', sans-serif" }}>

      {/* ── 1. NAVBAR ── */}
      <header style={{ background:'rgb(247,190,57)', flexShrink:0 }}>
        <div style={{ padding:'6px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height:'28px', objectFit:'contain' }} />
          <span style={{ fontSize:'10px', fontWeight:800, background:'#1e293b', color:'#fff', padding:'3px 10px', borderRadius:'20px' }}>
            👔 MANAGER VIEW
          </span>
        </div>
      </header>

      {/* ── 2. SUB-BAR ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', flexShrink:0 }}>
        <div style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          {/* Left: Back + title */}
          <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
            <button
              type="button"
              onClick={onBack}
              style={{ width:'34px', height:'34px', background:'#f3f4f6', border:'1px solid #e5e7eb', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M10 4L6 8l4 4" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:900, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {rfq?.tripName || 'Trip review'}
              </div>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8' }}>
                ID: {(approvalData?.rfqId && String(approvalData.rfqId)) || rfq?._id}
              </div>
            </div>
          </div>

          {/* Right: Group Chat */}
          <button
            onClick={() => setGroupChatOpen(!groupChatOpen)}
            style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgb(247,190,57)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Approve / Reject bar — sirf pending pe */}
        {approvalData?.status === 'pending' && (
          <div style={{
            padding:'10px 16px', borderTop:'1px solid #fde68a',
            background:'linear-gradient(180deg, #fffbeb 0%, #fff 100%)',
            display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'flex-end', gap:10,
          }}>
            <span style={{ fontSize:12, fontWeight:800, color:'#92400e', marginRight:'auto' }}>
              Action required — budget approval
            </span>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleApprove}
              style={{ padding:'10px 22px', background:'rgb(247,190,57)', color:'#1a1a1a', border:'none', borderRadius:12, fontSize:13, fontWeight:900, cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
            >
              {actionLoading ? '⏳…' : '✅ Approve'}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReject}
              style={{ padding:'10px 18px', background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:12, fontSize:13, fontWeight:900, cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
            >
              {actionLoading ? '⏳…' : '❌ Reject'}
            </button>
          </div>
        )}

        {/* Already approved / rejected status bar */}
        {approvalData?.status === 'approved' && (
          <div style={{ padding:'8px 16px', background:'#dcfce7', borderTop:'1px solid #86efac', fontSize:12, fontWeight:800, color:'#166534' }}>
            ✅ Budget approved — ₹{Number(approvalData.approvedBudget || approvalData.budget).toLocaleString('en-IN')}
            {approvalData.managerComment ? ` · "${approvalData.managerComment}"` : ''}
          </div>
        )}
        {approvalData?.status === 'rejected' && (
          <div style={{ padding:'8px 16px', background:'#fee2e2', borderTop:'1px solid #fecaca', fontSize:12, fontWeight:800, color:'#dc2626' }}>
            ❌ Budget rejected{approvalData.managerComment ? ` · "${approvalData.managerComment}"` : ''}
          </div>
        )}
      </div>

      {/* ── 3. MAIN: Trip Timeline ── */}
      <div style={{ flex:1, background:'#f8fafc', overflow:'hidden', display:'flex', flexDirection:'column', minHeight:0 }}>
        <ManagerTimeline
          planItems={planItems}
          destNames={destNames}
          grandTotal={grandTotal}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />
      </div>

      {/* ── 4. CHAT BOX OVERLAY ── */}
      {groupChatOpen && <GroupChatBox onClose={() => setGroupChatOpen(false)} />}
    </div>
  );
}