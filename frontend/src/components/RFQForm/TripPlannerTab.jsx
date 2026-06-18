import { useState, useRef, useEffect, useMemo } from 'react';

// ─── SHARED CONSTANTS ─────────────────────────────────────────
const CITIES = [
  'Indore, India','Mumbai, India','Delhi, India','Bangalore, India',
  'Hyderabad, India','Chennai, India','Kolkata, India','Pune, India',
  'Ahmedabad, India','Jaipur, India','Surat, India','Lucknow, India',
  'London, UK','Dubai, UAE','Singapore','New York, USA','Paris, France','Tokyo, Japan',
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_HDR = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const fmt = d => d ? new Date(d+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : null;
const toKey = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const addDays = (dateStr, n) => {
  if (!dateStr) return null;
  const d = new Date(dateStr+'T00:00:00');
  d.setDate(d.getDate() + n);
  return toKey(d.getFullYear(), d.getMonth(), d.getDate());
};
const USER_PROFILE = { name: 'Trushant Shah', initials: 'TS', city: 'Indore, India' };

// ─── SHARED STYLES ────────────────────────────────────────────
const S = {
  label: { fontSize:'11px', fontWeight:700, color:'#8a8fa8', letterSpacing:'0.04em', marginBottom:'5px', display:'block' },
  inputBox: {
    border:'1.5px solid #e4e6f0', borderRadius:'8px', background:'#fff',
    display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'46px',
    transition:'border-color 0.2s',
  },
  inputText: { border:'none', outline:'none', fontFamily:'inherit', fontSize:'14px', fontWeight:600, color:'#1a1a2e', background:'transparent', flex:1, width:'100%' },
};

// ─── ICONS ────────────────────────────────────────────────────
const IcoTakeoff = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 19h19v2h-19v-2zm7.18-1.73L7 15.1 5 17.1l2.68 2.17c.36.29.82.45 1.28.45h9.49c.55 0 1-.45 1-1v-.27c0-.55-.45-1-1-1H9.68zM21.5 9.5c0-.83-.67-1.5-1.5-1.5H13l-2.09-4.5H8.5L11 9.5H6L4.5 7.5H2l1.5 5.5L2 18.5h1.5L5 16.5h14c.83 0 1.5-.67 1.5-1.5V9.5z"/></svg>);
const IcoCalendar = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.7"/></svg>);
const IcoUser  = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>);
const IcoBudget= ({size=14}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>);
const IcoPlus  = ({size=13}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>);
const IcoTrash = ({size=13}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const IcoNote  = ({size=14}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>);
const IcoLoc   = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>);
const IcoSparkle = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/></svg>);
const IcoArrow = ({size=14}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>);

// ─── COUNTER ──────────────────────────────────────────────────
function Counter({ value, onChange, min=0, max=99 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e4e6f0', borderRadius:'8px', height:'46px', overflow:'hidden' }}>
      <button onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width:'44px', height:'100%', background:'#F5A623', border:'none', color:'#fff', fontSize:'22px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
        onMouseEnter={e => e.currentTarget.style.background='#E09510'}
        onMouseLeave={e => e.currentTarget.style.background='#F5A623'}>−</button>
      <span style={{ flex:1, textAlign:'center', fontSize:'16px', fontWeight:800, color:'#1a1a2e', minWidth:'40px' }}>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width:'44px', height:'100%', background:'#F5A623', border:'none', color:'#fff', fontSize:'22px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
        onMouseEnter={e => e.currentTarget.style.background='#E09510'}
        onMouseLeave={e => e.currentTarget.style.background='#F5A623'}>+</button>
    </div>
  );
}

// ─── CITY AUTOCOMPLETE ────────────────────────────────────────
function CityInput({ value, onChange, placeholder, id, style={} }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top:0, left:0, width:200 });
  const inputRef = useRef();
  const ref = useRef();
  const filtered = useMemo(() => {
    if (!value) return CITIES.slice(0, 8);
    return CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0, 8);
  }, [value]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleFocus = () => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: Math.max(220, r.width) });
    }
    setOpen(true);
  };

  return (
    <div ref={ref} style={{ position:'relative', flex:1, minWidth:0, ...style }}>
      <input ref={inputRef} id={id} type="text" value={value}
        onChange={e => onChange(e.target.value)} onFocus={handleFocus}
        placeholder={placeholder} autoComplete="off"
        style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:'14px', fontWeight:600, color:'#1f2937' }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position:'fixed', top:dropPos.top, left:dropPos.left, width:dropPos.width, zIndex:999999, background:'#fff', border:'1px solid #f3f4f6', borderRadius:'14px', boxShadow:'0 12px 32px rgba(0,0,0,0.16)', padding:'6px 0', maxHeight:'260px', overflowY:'auto' }}>
          {filtered.map(c => (
            <div key={c} onMouseDown={e => { e.preventDefault(); onChange(c); setOpen(false); }}
              style={{ padding:'10px 16px', fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', color:'#374151' }}
              onMouseEnter={e => e.currentTarget.style.background='#FFF3DC'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <span style={{ color:'#F5A623' }}>📍</span>{c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CALENDAR MODAL ───────────────────────────────────────────
function CalendarModal({ onClose, onApply, depDate }) {
  const [cy, setCy] = useState(TODAY.getFullYear());
  const [cm, setCm] = useState(TODAY.getMonth());
  const [selS, setSelS] = useState(depDate || null);
  const prev = () => cm===0?(setCy(cy-1),setCm(11)):setCm(cm-1);
  const next = () => cm===11?(setCy(cy+1),setCm(0)):setCm(cm+1);
  const buildMonth = (y,m) => {
    const first=new Date(y,m,1).getDay(), dim=new Date(y,m+1,0).getDate(), cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=dim;d++) cells.push(d);
    return cells;
  };
  const MonthGrid = ({y,m}) => {
    const cells = buildMonth(y,m);
    return (
      <div>
        <p style={{ textAlign:'center', fontWeight:700, fontSize:'14px', marginBottom:'12px' }}>{MONTHS[m]} {y}</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'6px' }}>
          {DAYS_HDR.map(d => <div key={d} style={{ textAlign:'center', fontSize:'11px', color:'#9ca3af', fontWeight:600, padding:'4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
          {cells.map((d,i) => {
            if (!d) return <div key={i}/>;
            const key=toKey(y,m,d), dt=new Date(y,m,d);
            const isPast=dt<TODAY, isTod=dt.getTime()===TODAY.getTime(), isSel=key===selS;
            return (
              <button key={i} disabled={isPast} onClick={() => !isPast && setSelS(key)}
                style={{ height:'32px', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', border:'none', cursor:isPast?'not-allowed':'pointer', borderRadius:'50%', background:isSel?'#F5A623':'transparent', color:isPast?'#d1d5db':isSel?'#fff':isTod?'#D97706':'#374151', fontWeight:isSel||isTod?700:400 }}
                onMouseEnter={e => { if(!isSel&&!isPast) e.currentTarget.style.background='#FFF3DC'; }}
                onMouseLeave={e => { if(!isSel) e.currentTarget.style.background='transparent'; }}
              >{d}</button>
            );
          })}
        </div>
      </div>
    );
  };
  let m2=cm+1, y2=cy; if(m2>11){m2-=12;y2++;}
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.45)', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px', boxShadow:'0 24px 64px rgba(0,0,0,0.22)', padding:'24px', width:'100%', maxWidth:'560px' }}>
        <p style={{ textAlign:'center', fontSize:'12px', color:'#9ca3af', marginBottom:'12px', fontWeight:500 }}>Select date</p>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
          <button onClick={prev} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'16px' }}>‹</button>
          <button onClick={next} style={{ width:'32px', height:'32px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'16px' }}>›</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
          <MonthGrid y={cy} m={cm}/><MonthGrid y={y2} m={m2}/>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px', marginTop:'20px', paddingTop:'16px', borderTop:'1px solid #f3f4f6' }}>
          <button onClick={() => setSelS(null)} style={{ padding:'8px 20px', fontSize:'13px', fontWeight:600, color:'#6b7280', background:'transparent', border:'none', cursor:'pointer' }}>Reset</button>
          <button onClick={() => { onApply(selS); onClose(); }} style={{ padding:'8px 24px', background:'#F5A623', color:'#fff', fontSize:'13px', fontWeight:700, border:'none', borderRadius:'10px', cursor:'pointer' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── PASSENGERS MODAL ─────────────────────────────────────────
function PassengersModal({ adults, children, infants, travelClass, onUpdate, onClose }) {
  const [a,setA]=useState(adults),[c,setC]=useState(children),[inf,setInf]=useState(infants),[tc,setTc]=useState(travelClass);
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px', padding:'24px', width:'100%', maxWidth:'340px', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ marginBottom:'20px', fontSize:'16px', fontWeight:700 }}>Travelers & Class</h3>
        {[{l:'Adults',s:'12+ yrs',v:a,st:setA,min:1},{l:'Children',s:'2–12 yrs',v:c,st:setC,min:0},{l:'Infants',s:'0–2 yrs',v:inf,st:setInf,min:0}].map(row => (
          <div key={row.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <div><div style={{ fontSize:'14px', fontWeight:600 }}>{row.l}</div><div style={{ fontSize:'11px', color:'#9ca3af' }}>{row.s}</div></div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <button onClick={() => row.st(Math.max(row.min, row.v-1))} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
              <span style={{ fontWeight:700, minWidth:'20px', textAlign:'center' }}>{row.v}</span>
              <button onClick={() => row.st(row.v+1)} style={{ width:'30px', height:'30px', borderRadius:'50%', border:'1px solid #e5e7eb', background:'#fff', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
            </div>
          </div>
        ))}
        <div style={{ marginTop:'12px', borderTop:'1px solid #f3f4f6', paddingTop:'14px' }}>
          <div style={{ fontSize:'11px', fontWeight:700, color:'#9ca3af', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.05em' }}>Class</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
            {['Economy','Business','First Class','Premium'].map(cl => (
              <button key={cl} onClick={() => setTc(cl)} style={{ padding:'8px', borderRadius:'8px', fontSize:'12px', fontWeight:600, cursor:'pointer', border:tc===cl?'1.5px solid #F5A623':'1.5px solid #e5e7eb', background:tc===cl?'#FFF3DC':'#fff', color:tc===cl?'#D97706':'#6b7280' }}>{cl}</button>
            ))}
          </div>
        </div>
        <button onClick={() => { onUpdate(a,c,inf,tc); onClose(); }} style={{ width:'100%', marginTop:'20px', padding:'12px', background:'#F5A623', border:'none', borderRadius:'12px', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'14px' }}>Done</button>
      </div>
    </div>
  );
}

// ─── ADD TRAVELER MODAL ───────────────────────────────────────
function AddTravelerModal({ onClose, onAdd }) {
  const [fn,setFn]=useState(''),[mn,setMn]=useState(''),[ln,setLn]=useState(''),[email,setEmail]=useState('');
  const canAdd = fn.trim()&&ln.trim()&&email.trim();
  const inp = { border:'1px solid #e5e7eb', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', outline:'none', width:'100%', boxSizing:'border-box', fontFamily:'inherit' };
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99999, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,0,0,0.4)', padding:'16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:'20px', padding:'28px', width:'100%', maxWidth:'480px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', position:'relative' }}>
        <button onClick={onClose} style={{ position:'absolute', top:'12px', right:'14px', background:'none', border:'none', fontSize:'18px', cursor:'pointer', color:'#9ca3af' }}>✕</button>
        <h3 style={{ fontSize:'18px', fontWeight:700, marginBottom:'6px' }}>Add traveler</h3>
        <p style={{ fontSize:'13px', color:'#6b7280', marginBottom:'18px' }}>Add the traveler's information below.</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'10px' }}>
          <input value={fn} onChange={e=>setFn(e.target.value)} style={inp} placeholder="First name *"/>
          <input value={mn} onChange={e=>setMn(e.target.value)} style={inp} placeholder="Middle (optional)"/>
          <input value={ln} onChange={e=>setLn(e.target.value)} style={inp} placeholder="Last name *"/>
        </div>
        <div style={{ ...inp, display:'flex', alignItems:'center', gap:'8px', marginBottom:'18px' }}>
          <span style={{ color:'#9ca3af', fontSize:'13px' }}>✉</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{ flex:1, border:'none', outline:'none', fontSize:'13px', fontFamily:'inherit' }} placeholder="Email *"/>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:'10px' }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:'10px', border:'2px solid #e5e7eb', fontSize:'13px', fontWeight:600, cursor:'pointer', background:'#fff', color:'#374151' }}>Cancel</button>
          <button onClick={() => { if(!canAdd) return; const name=[fn,mn,ln].filter(Boolean).join(' '); onAdd({id:Date.now().toString(),name,initials:(fn[0]+ln[0]).toUpperCase(),email:email.trim()}); onClose(); }} disabled={!canAdd}
            style={{ padding:'10px 20px', borderRadius:'10px', border:'none', fontSize:'13px', fontWeight:700, cursor:canAdd?'pointer':'not-allowed', background:canAdd?'#F5A623':'#f3f4f6', color:canAdd?'#fff':'#9ca3af' }}>Add traveler</button>
        </div>
      </div>
    </div>
  );
}

// ─── DESTINATION ROW ──────────────────────────────────────────
function DestinationRow({ index, dest, onUpdate, onRemove, canRemove }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <div className="rfqDestinationGrid">
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'5px' }}>
            <label style={{ ...S.label, marginBottom:0 }}>Destination {index + 1}:</label>
            {canRemove && (
              <button onClick={() => onRemove(index)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c', padding:0, display:'flex', alignItems:'center' }}>
                <IcoTrash size={12}/>
              </button>
            )}
          </div>
          <div style={{ ...S.inputBox, paddingRight:'8px' }}
            onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
            onBlurCapture={e => e.currentTarget.style.borderColor='#e4e6f0'}>
            <CityInput value={dest.city} onChange={v => onUpdate(index, { city: v })} placeholder="City or country" id={`dest_${index}`}/>
            <span style={{ color:'#aaa', flexShrink:0 }}><IcoLoc size={16}/></span>
          </div>
        </div>
        <div>
          <label style={S.label}>Number Of Nights:</label>
          <Counter value={dest.nights} onChange={n => onUpdate(index, { nights: n })} min={1} max={60}/>
        </div>
      </div>
    </div>
  );
}

// ─── HOTEL SECTION ────────────────────────────────────────────
function TripHotelSection({ totalPax }) {
  const [tripHotel, setTripHotel] = useState(false);
  const [tripHotelRooms, setTripHotelRooms] = useState(1);
  const [tripRatings, setTripRatings] = useState([]);

  return (
    <div style={{ background:'#f9fafb', borderRadius:'10px', padding:'14px 16px', marginBottom:'16px', border:'1px solid #e4e6f0' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap', marginBottom: tripHotel ? '14px' : '0' }}>
        <span style={{ fontSize:'13px', fontWeight:700, color:'#1a1a2e', whiteSpace:'nowrap' }}>Require hotels?</span>
        {[{v:true,l:'Yes'},{v:false,l:'No'}].map(opt => (
          <label key={opt.l} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontWeight:600, fontSize:'13px' }}>
            <input type="radio" name="tripHotelReq2" checked={tripHotel===opt.v} onChange={() => setTripHotel(opt.v)}
              style={{ accentColor:'#F5A623', width:'15px', height:'15px' }}/>
            {opt.v && tripHotel ? <span style={{ color:'#F5A623' }}>{opt.l}</span> : opt.l}
          </label>
        ))}
        {tripHotel && totalPax > 1 && (
          <>
            <div style={{ width:'1px', height:'24px', background:'#e4e6f0', flexShrink:0 }}/>
            <span style={{ fontSize:'13px', fontWeight:700, color:'#1a1a2e', whiteSpace:'nowrap' }}>Rooms:</span>
            <div style={{ width:'130px' }}>
              <Counter value={tripHotelRooms} onChange={setTripHotelRooms} min={1} max={10}/>
            </div>
          </>
        )}
      </div>
      {tripHotel && (
        <div style={{ borderTop:'1px solid #e4e6f0', paddingTop:'12px' }}>
          <label style={{ ...S.label, fontSize:'11px', marginBottom:'8px' }}>
            Preferred Hotel Ratings: <span style={{ fontWeight:400, color:'#aaa', textTransform:'none' }}>(Multiple Select)</span>
          </label>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
            {[1,2,3,4,5].map(star => {
              const isSel = tripRatings.includes(star);
              return (
                <button key={star} type="button"
                  onClick={() => setTripRatings(prev => isSel ? prev.filter(s=>s!==star) : [...prev, star])}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'5px 12px', borderRadius:'8px', border:`1.5px solid ${isSel?'#F5A623':'#e4e6f0'}`, background: isSel?'#FFF3DC':'#fff', cursor:'pointer', fontSize:'12px', fontWeight:700, color: isSel?'#D97706':'#6b7280', transition:'all 0.15s' }}>
                  {star} Star
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TRAVELERS BAR (Row 4) ────────────────────────────────────
function TravelersBar({ travelers, setTravelers, budget, setBudget, tripReviewer, setTripReviewer, adults, children, infants, tClass, onOpenAddTrav, onOpenPax }) {
  const totalPax = adults + children + infants;
  return (
    <div style={{ background:'#fff', borderRadius:'12px', padding:'10px 16px', border:'1px solid #e4e6f0', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
      {/* Traveler pills */}
      <div style={{ display:'flex', alignItems:'center', gap:'6px', flex:1, flexWrap:'wrap', minWidth:0 }}>
        {travelers.map(t => (
          <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'6px', border:'1.5px solid #e5e7eb', borderRadius:'999px', padding:'4px 10px 4px 4px', background:'#fff', fontSize:'12px' }}>
            <div style={{ width:'22px', height:'22px', borderRadius:'50%', background:'#F5A623', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'8px', fontWeight:700, color:'#fff', flexShrink:0 }}>{t.initials}</div>
            <span style={{ fontWeight:500, color:'#1f2937' }}>{t.name}</span>
            {t.id!=='ts' && <button onClick={() => setTravelers(p => p.filter(x=>x.id!==t.id))} style={{ color:'#9ca3af', fontSize:'10px', background:'none', border:'none', cursor:'pointer', padding:'0 1px' }}>✕</button>}
          </div>
        ))}
        <button onClick={onOpenAddTrav} style={{ display:'flex', alignItems:'center', gap:'5px', border:'1.5px dashed #d1d5db', borderRadius:'999px', padding:'4px 11px', fontSize:'12px', color:'#6b7280', cursor:'pointer', background:'#fff' }}>⊕ Add travelers</button>
      </div>
      {/* Right controls */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0, flexWrap:'wrap' }}>
        {/* Budget */}
        <div style={{ display:'flex', alignItems:'center', gap:'5px', border:'1.5px solid #e5e7eb', borderRadius:'999px', padding:'5px 12px', background:'#fff' }}
          onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
          onBlurCapture={e => e.currentTarget.style.borderColor='#e5e7eb'}>
          <IcoBudget size={12}/>
          <span style={{ fontSize:'11px', color:'#9ca3af', fontWeight:600 }}>₹</span>
          <input type="number" value={budget} onChange={e=>setBudget(e.target.value)} placeholder="Budget"
            style={{ background:'transparent', border:'none', outline:'none', fontSize:'12px', fontWeight:600, color:'#374151', width:'72px', fontFamily:'inherit' }}/>
        </div>
        {/* Reviewer */}
        <div style={{ display:'flex', alignItems:'center', gap:'5px', border:'1.5px solid #e5e7eb', borderRadius:'999px', padding:'5px 12px', background:'#fff' }}
          onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
          onBlurCapture={e => e.currentTarget.style.borderColor='#e5e7eb'}>
          <span style={{ fontSize:'11px', color:'#9ca3af' }}>👤</span>
          <select value={tripReviewer} onChange={e=>setTripReviewer(e.target.value)}
            style={{ background:'transparent', border:'none', outline:'none', fontSize:'12px', fontWeight:600, color:tripReviewer?'#374151':'#9ca3af', cursor:'pointer', fontFamily:'inherit', minWidth:'80px' }}>
            <option value="">Reviewer</option>
            <option>Trushant Shah</option><option>Tushar</option><option>Rahul</option>
            <option>Priya</option><option>Amit</option><option>Neha</option>
          </select>
        </div>
        {/* Pax button */}
        <button onClick={onOpenPax}
          style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', border:'1.5px solid #e5e7eb', borderRadius:'999px', padding:'6px 14px', cursor:'pointer', background:'#fff', color:'#374151', transition:'border-color 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor='#F5A623'}
          onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
          <IcoUser size={12}/>
          <span style={{ fontWeight:700 }}>{totalPax} Traveler{totalPax>1?'s':''}</span>
          <span style={{ fontSize:'10px', color:'#9ca3af' }}>{tClass}</span>
          <span style={{ color:'#9ca3af', fontSize:'10px' }}>▾</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ── MAIN TRIP PLANNER TAB COMPONENT ──────────────────────────
// ─────────────────────────────────────────────────────────────
export default function TripPlannerTab({ rfqId, onSubmit, loading, travelType = 'business' }) {
  // ── MODE: 'manual' | 'ai' ───────────────────────────────────
  const [mode, setMode] = useState('manual');

  // ── AI prompt text ──────────────────────────────────────────
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ── SHARED FORM STATE ───────────────────────────────────────
  const [tripName,     setTripName]     = useState('');
  const [from,         setFrom]         = useState(USER_PROFILE.city);
  const [depDate,      setDepDate]      = useState(null);
  const [showDepCal,   setShowDepCal]   = useState(false);
  const [destinations, setDestinations] = useState([{ id:1, city:'', arrivalDate:null, nights:1 }]);
  const [openCal,      setOpenCal]      = useState(null);
  const [returnToBase, setReturnToBase] = useState(false);
  const [budget,       setBudget]       = useState('');
  const [tripReviewer, setTripReviewer] = useState('');
  const [note,         setNote]         = useState('');

  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const [infants,  setInfants]  = useState(0);
  const [tClass,   setTClass]   = useState('Economy');
  const totalPax = adults + children + infants;

  const [travelers,   setTravelers]   = useState([{ id:'ts', name:USER_PROFILE.name, initials:USER_PROFILE.initials }]);
  const [showAddTrav, setShowAddTrav] = useState(false);
  const [showPax,     setShowPax]     = useState(false);

  // Destination helpers
  const updateDest = (i, patch) => setDestinations(p => p.map((d, idx) => idx !== i ? d : { ...d, ...patch }));
  const removeDest = (i) => setDestinations(p => p.filter((_,idx) => idx !== i));
  const addDest    = () => {
    setDestinations(p => {
      const last = p[p.length - 1];
      const newArrival = last?.arrivalDate ? addDays(last.arrivalDate, last.nights) : null;
      return [...p, { id:Date.now(), city:'', arrivalDate:newArrival, nights:1 }];
    });
  };

  // Auto-cascade arrival dates
  useEffect(() => {
    setDestinations(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length - 1; i++) {
        if (next[i].arrivalDate) {
          next[i+1] = { ...next[i+1], arrivalDate: addDays(next[i].arrivalDate, next[i].nights) };
        }
      }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(destinations.map(d => ({ a:d.arrivalDate, n:d.nights })))]);

  const canTrip = destinations[0]?.city.trim() !== '';

  // ── Fill form from AI plan ──────────────────────────────────
  const applyAIPlan = (plan) => {
    if (plan.tripName)     setTripName(plan.tripName);
    if (plan.from)         setFrom(plan.from);
    if (plan.depDate)      setDepDate(plan.depDate);
    if (plan.adults)       setAdults(plan.adults);
    if (plan.children !== undefined) setChildren(plan.children);
    if (plan.infants  !== undefined) setInfants(plan.infants);
    if (plan.travelClass)  setTClass(plan.travelClass);
    if (plan.budget)       setBudget(plan.budget);
    if (plan.note)         setNote(plan.note);
    if (plan.returnToBase !== undefined) setReturnToBase(plan.returnToBase);
    if (plan.destinations?.length) {
      setDestinations(plan.destinations.map((d, i) => ({
        id: Date.now() + i,
        city: d.city || '',
        arrivalDate: null,
        nights: d.nights || 1
      })));
    }
  };

  // ── AI Generate handler ─────────────────────────────────────
  const handleAIGo = async () => {
    const text = aiPrompt.trim();
    if (!text || aiLoading) return;
    setAiLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an expert AI travel planner. From the user's description, extract trip details and respond ONLY with a JSON object (no extra text, no markdown fences) with these fields:
{
  "tripName": "...",
  "from": "city, country",
  "depDate": "YYYY-MM-DD or null",
  "destinations": [{"city": "...", "nights": N}],
  "adults": N,
  "children": N,
  "infants": N,
  "travelClass": "Economy|Business|First Class|Premium",
  "budget": "amount or empty string",
  "returnToBase": true or false,
  "note": "any special requirements or empty string"
}
Use sensible defaults if data is missing (adults: 1, children: 0, infants: 0, travelClass: "Economy"). Always return valid JSON only.`,
          messages: [{ role: 'user', content: text }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || '';
      // Try to parse JSON (strip fences just in case)
      const clean = raw.replace(/```json|```/g, '').trim();
      const plan = JSON.parse(clean);
      applyAIPlan(plan);
      setMode('manual'); // switch to manual view to show filled form
    } catch (err) {
      alert('AI could not parse your request. Please try again with more details.');
    }
    setAiLoading(false);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!canTrip) return;
    const rfq = {
      rfqId,
      from,
      tripName,
      depDate: depDate || new Date().toISOString().split('T')[0],
      destinations: destinations.map(d => ({
        destination: d.city,
        dateOfArrival: d.arrivalDate || new Date().toISOString().split('T')[0],
        numberOfNights: d.nights,
        nights: d.nights,
      })),
      numberOfAdults: adults, numberOfChildren: children, numberOfInfants: infants,
      travelClass: tClass, budget, reviewer: tripReviewer, note,
      returnToBase,
      travelType,   // business | personal
      tripType: travelType, // business | personal
      createdAt: new Date().toISOString(), status:'draft',
    };
    onSubmit?.(rfq);
  };

  // ── STYLES ──────────────────────────────────────────────────
  const css = `
    .rfqDestinationGrid{display:grid;grid-template-columns:1fr 200px;gap:14px;align-items:start;}
    @media(max-width:640px){.rfqDestinationGrid{grid-template-columns:1fr;gap:10px;}}
  `;

  // ─── ROW 1: Header ─────────────────────────────────────────
  const Row1 = (
    <div style={{ display:'flex', gap:'12px', marginBottom:'16px', alignItems:'flex-end' }}>
      {/* Trip Name */}
      <div style={{ flex:1 }}>
        <label style={S.label}>Trip Name:</label>
        <div style={S.inputBox}
          onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
          onBlurCapture={e  => e.currentTarget.style.borderColor='#e4e6f0'}>
          <input value={tripName} onChange={e => setTripName(e.target.value)}
            placeholder="Enter trip name (e.g. Summer Vacation)" style={S.inputText}/>
        </div>
      </div>
      {/* Status */}
      <div style={{ width:'120px', flexShrink:0 }}>
        <label style={S.label}>Status:</label>
        <div style={{ ...S.inputBox, cursor:'default', userSelect:'none' }}>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#9ca3af', flexShrink:0 }}/>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#374151' }}>OPEN</span>
        </div>
      </div>
      {/* Trip ID */}
      <div style={{ width:'170px', flexShrink:0 }}>
        <label style={{ ...S.label, visibility:'hidden' }}>ID</label>
        <div style={{ ...S.inputBox, cursor:'default', userSelect:'none', justifyContent:'center' }}>
          <span style={{ fontSize:'11px', color:'#9ca3af', fontWeight:600, marginRight:'4px' }}>Trip ID:</span>
          <span style={{ fontSize:'14px', fontWeight:700, color:'#D97706' }}>{rfqId}</span>
        </div>
      </div>
    </div>
  );

  // ─── ROW 2: Mode Toggle ─────────────────────────────────────
  const Row2 = (
    <div style={{ display:'flex', gap:'10px', marginBottom:'16px' }}>
      {/* Create Manually */}
      <button
        onClick={() => setMode('manual')}
        style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          padding:'10px 16px', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit',
          fontSize:'13px', fontWeight:700, transition:'all 0.15s',
          border: mode==='manual' ? '2px solid #F5A623' : '2px solid #e4e6f0',
          background: mode==='manual' ? '#F5A623' : '#fff',
          color: mode==='manual' ? '#fff' : '#6b7280',
          boxShadow: mode==='manual' ? '0 4px 14px rgba(245,166,35,0.3)' : 'none',
        }}>
        <IcoNote size={14}/> Create Manually
      </button>
      {/* AI Generate */}
      <button
        onClick={() => setMode('ai')}
        style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
          padding:'10px 16px', borderRadius:'10px', cursor:'pointer', fontFamily:'inherit',
          fontSize:'13px', fontWeight:700, transition:'all 0.15s',
          border: mode==='ai' ? '2px solid transparent' : '2px solid #e4e6f0',
          background: mode==='ai' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#fff',
          color: mode==='ai' ? '#fff' : '#6b7280',
          boxShadow: mode==='ai' ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
        }}>
        <IcoSparkle size={14}/> ✨ AI Generate
      </button>
    </div>
  );

  // ─── ROW 3: Conditional Content ────────────────────────────
  const Row3 = mode === 'ai' ? (
    // AI Mode: Large textarea
    <div style={{ background:'#fff', borderRadius:'12px', padding:'16px', marginBottom:'16px', border:'1.5px solid #e4e6f0' }}
      onFocusCapture={e => e.currentTarget.style.borderColor='#6366f1'}
      onBlurCapture={e  => e.currentTarget.style.borderColor='#e4e6f0'}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
        <div style={{ width:'26px', height:'26px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <IcoSparkle size={13} style={{ color:'#fff' }}/>
        </div>
        <span style={{ fontSize:'12px', fontWeight:700, color:'#6366f1', letterSpacing:'0.03em' }}>DESCRIBE YOUR TRIP</span>
      </div>
      <textarea
        value={aiPrompt}
        onChange={e => setAiPrompt(e.target.value)}
        onKeyDown={e => { if (e.key==='Enter' && (e.metaKey||e.ctrlKey)) handleAIGo(); }}
        placeholder={`Tell me about your trip and I'll plan everything!\n\nExamples:\n• "Plan a 7-day trip from Mumbai to Paris and London in April with 2 adults, budget ₹2L"\n• "Business trip from Delhi to Singapore and Tokyo next month, 3 nights each, Business class"\n• "Family vacation from Indore to Goa for 5 days in December, 2 adults 2 children"`}
        rows={8}
        style={{
          width:'100%', background:'transparent', border:'none', outline:'none',
          fontSize:'14px', fontWeight:500, color:'#1f2937', fontFamily:'inherit',
          resize:'vertical', lineHeight:1.6, boxSizing:'border-box',
        }}
      />
      <p style={{ fontSize:'10px', color:'#9ca3af', marginTop:'8px', textAlign:'right' }}>
        Press <kbd style={{ background:'#f3f4f6', padding:'1px 5px', borderRadius:'4px', fontSize:'10px', border:'1px solid #e5e7eb' }}>⌘ Enter</kbd> or click GO →
      </p>
    </div>
  ) : (
    // Manual Mode: Full destination form
    <div style={{ background:'#fff', borderRadius:'12px', padding:'20px', marginBottom:'16px', border:'1px solid #e4e6f0' }}>
      {/* From + Departure */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:'14px', marginBottom:'20px', flexWrap:'wrap' }}>
        <div style={{ minWidth:'180px', flex:1 }}>
          <label style={S.label}>From:</label>
          <div style={{ ...S.inputBox, background:'#f7f8fc' }}
            onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
            onBlurCapture={e  => e.currentTarget.style.borderColor='#e4e6f0'}>
            <span style={{ color:'#9ca3af', flexShrink:0 }}><IcoTakeoff size={14}/></span>
            <CityInput value={from} onChange={setFrom} placeholder="Departure city" id="tp_from_city"/>
          </div>
        </div>
        <div style={{ minWidth:'170px' }}>
          <label style={S.label}>Departure Date:</label>
          <button onClick={() => setShowDepCal(true)}
            style={{ ...S.inputBox, width:'100%', cursor:'pointer', justifyContent:'space-between' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#F5A623'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#e4e6f0'}>
            <span style={{ fontSize:'14px', fontWeight:600, color:depDate?'#1a1a2e':'#aaa' }}>{depDate ? fmt(depDate) : 'Select date'}</span>
            <span style={{ color:'#aaa', flexShrink:0 }}><IcoCalendar size={15}/></span>
          </button>
        </div>
      </div>

      {/* Destinations */}
      {destinations.map((dest, i) => (
        <DestinationRow key={dest.id} index={i} dest={dest} onUpdate={updateDest} onRemove={removeDest} canRemove={destinations.length>1}/>
      ))}

      {/* Add destination + Return to base */}
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'4px', flexWrap:'wrap' }}>
        <button onClick={addDest}
          style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 18px', fontSize:'12px', fontWeight:700, color:'#fff', background:'#F5A623', border:'none', borderRadius:'20px', cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.background='#E09510'}
          onMouseLeave={e => e.currentTarget.style.background='#F5A623'}>
          <IcoPlus size={12}/> Add Destination
        </button>
        <label style={{ display:'flex', alignItems:'center', gap:'7px', cursor:'pointer', fontSize:'12px', fontWeight:600, color:'#374151' }}>
          <input type="checkbox" checked={returnToBase} onChange={e => setReturnToBase(e.target.checked)}
            style={{ accentColor:'#F5A623', width:'14px', height:'14px', cursor:'pointer' }}/>
          Return to base
        </label>
      </div>

      {/* Hotel Section */}
      <div style={{ marginTop:'16px' }}>
        <TripHotelSection totalPax={totalPax}/>
      </div>

      {/* Note */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', border:'1.5px solid #e4e6f0', borderRadius:'10px', padding:'10px 14px', background:'#f9fafb', transition:'border-color 0.15s' }}
        onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
        onBlurCapture={e  => e.currentTarget.style.borderColor='#e4e6f0'}>
        <span style={{ color:'#9ca3af', marginTop:'2px', flexShrink:0 }}><IcoNote size={13}/></span>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af', marginBottom:'4px', lineHeight:1 }}>Notes (optional)</p>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="Special requirements, preferred hotels, visa notes..."
            rows={2}
            style={{ width:'100%', background:'transparent', border:'none', outline:'none', fontSize:'13px', fontWeight:500, color:'#374151', fontFamily:'inherit', resize:'none', lineHeight:1.5 }}/>
        </div>
      </div>
    </div>
  );

  // ─── ROW 4: Travelers Bar ───────────────────────────────────
  const Row4 = (
    <div style={{ marginBottom:'14px' }}>
      <TravelersBar
        travelers={travelers} setTravelers={setTravelers}
        budget={budget} setBudget={setBudget}
        tripReviewer={tripReviewer} setTripReviewer={setTripReviewer}
        adults={adults} children={children} infants={infants} tClass={tClass}
        onOpenAddTrav={() => setShowAddTrav(true)}
        onOpenPax={() => setShowPax(true)}
      />
    </div>
  );

  // ─── ROW 5: Action Button ───────────────────────────────────
  const Row5 = (
    <div style={{ display:'flex', justifyContent:'flex-end' }}>
      {mode === 'ai' ? (
        <button onClick={handleAIGo} disabled={!aiPrompt.trim() || aiLoading}
          style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'12px 28px', borderRadius:'10px', border:'none', fontFamily:'inherit',
            background: aiPrompt.trim() && !aiLoading ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f3f4f6',
            color: aiPrompt.trim() && !aiLoading ? '#fff' : '#9ca3af',
            fontSize:'14px', fontWeight:700,
            cursor: aiPrompt.trim() && !aiLoading ? 'pointer' : 'not-allowed',
            boxShadow: aiPrompt.trim() && !aiLoading ? '0 6px 20px rgba(99,102,241,0.35)' : 'none',
            transition:'all 0.2s',
          }}>
          {aiLoading ? (
            <>
              <span style={{ display:'flex', gap:'3px', alignItems:'center' }}>
                {[0,1,2].map(i => <span key={i} style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#fff', animation:`bounce 1.2s ${i*0.15}s infinite` }}/>)}
              </span>
              Thinking...
            </>
          ) : (
            <><IcoSparkle size={14}/> GO <IcoArrow size={14}/></>
          )}
        </button>
      ) : (
        <button onClick={handleSubmit} disabled={!canTrip || loading}
          style={{
            display:'flex', alignItems:'center', gap:'8px',
            padding:'12px 28px', borderRadius:'10px', border:'none', fontFamily:'inherit',
            background: (canTrip && !loading) ? '#F5A623' : '#f3f4f6',
            color: (canTrip && !loading) ? '#fff' : '#9ca3af',
            fontSize:'14px', fontWeight:700,
            cursor: (canTrip && !loading) ? 'pointer' : 'not-allowed',
            boxShadow: (canTrip && !loading) ? '0 6px 20px rgba(245,166,35,0.35)' : 'none',
            transition:'all 0.2s',
          }}
          onMouseEnter={e => { if(canTrip && !loading) e.currentTarget.style.background='#E09510'; }}
          onMouseLeave={e => { if(canTrip && !loading) e.currentTarget.style.background='#F5A623'; }}>
          <IcoNote size={14}/> {loading ? 'Creating...' : 'Next'}
        </button>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        ${css}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
      `}</style>

      {Row2}
      {Row1}
      {Row3}
      {Row4}
      {Row5}

      {/* Modals */}
      {showDepCal  && <CalendarModal onClose={() => setShowDepCal(false)} onApply={s => setDepDate(s)} depDate={depDate}/>}
      {openCal !== null && <CalendarModal onClose={() => setOpenCal(null)} onApply={s => { updateDest(openCal, { arrivalDate:s }); setOpenCal(null); }} depDate={destinations[openCal]?.arrivalDate}/>}
      {showAddTrav && <AddTravelerModal onClose={() => setShowAddTrav(false)} onAdd={t => setTravelers(p => [...p, t])}/>}
      {showPax     && <PassengersModal adults={adults} children={children} infants={infants} travelClass={tClass} onUpdate={(a,c,i,tc) => { setAdults(a); setChildren(c); setInfants(i); setTClass(tc); }} onClose={() => setShowPax(false)}/>}
    </>
  );
}