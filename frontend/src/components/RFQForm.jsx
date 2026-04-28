import { useState, useRef, useEffect, useMemo } from 'react';
import TripLoader from './TripLoader';
import TripPlannerTab from './RFQForm/TripPlannerTab';

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

const IcoTakeoff = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M2.5 19h19v2h-19v-2zm7.18-1.73L7 15.1 5 17.1l2.68 2.17c.36.29.82.45 1.28.45h9.49c.55 0 1-.45 1-1v-.27c0-.55-.45-1-1-1H9.68zM21.5 9.5c0-.83-.67-1.5-1.5-1.5H13l-2.09-4.5H8.5L11 9.5H6L4.5 7.5H2l1.5 5.5L2 18.5h1.5L5 16.5h14c.83 0 1.5-.67 1.5-1.5V9.5z"/></svg>);
const IcoCalendar = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.7"/></svg>);
const IcoUser  = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>);
const IcoHotel = ({size=16}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>);
const IcoBudget= ({size=14}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>);
const IcoPlus  = ({size=13}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>);
const IcoTrash = ({size=13}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>);
const IcoNote  = ({size=14}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>);
const IcoLoc   = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>);

// Shared styles
const S = {
  label: { fontSize:'11px', fontWeight:700, color:'#8a8fa8', letterSpacing:'0.04em', marginBottom:'5px', display:'block' },
  inputBox: {
    border:'1.5px solid #e4e6f0', borderRadius:'8px', background:'#fff',
    display:'flex', alignItems:'center', gap:'8px', padding:'0 12px', height:'46px',
    transition:'border-color 0.2s',
  },
  inputBoxFocus: { borderColor:'#F5A623' },
  inputText: { border:'none', outline:'none', fontFamily:'inherit', fontSize:'14px', fontWeight:600, color:'#1a1a2e', background:'transparent', flex:1, width:'100%' },
};

// ─── GOLDEN COUNTER ───────────────────────────────────────────
function Counter({ value, onChange, min=0, max=99 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', border:'1.5px solid #e4e6f0', borderRadius:'8px', height:'46px', overflow:'hidden' }}>
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{ width:'44px', height:'100%', background:'#F5A623', border:'none', color:'#fff', fontSize:'22px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background='#E09510'}
        onMouseLeave={e => e.currentTarget.style.background='#F5A623'}
      >−</button>
      <span style={{ flex:1, textAlign:'center', fontSize:'16px', fontWeight:800, color:'#1a1a2e', minWidth:'40px' }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{ width:'44px', height:'100%', background:'#F5A623', border:'none', color:'#fff', fontSize:'22px', fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.background='#E09510'}
        onMouseLeave={e => e.currentTarget.style.background='#F5A623'}
      >+</button>
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
    const cells=buildMonth(y,m);
    return (
      <div>
        <p style={{textAlign:'center',fontWeight:700,fontSize:'14px',marginBottom:'12px'}}>{MONTHS[m]} {y}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'6px'}}>
          {DAYS_HDR.map(d=><div key={d} style={{textAlign:'center',fontSize:'11px',color:'#9ca3af',fontWeight:600,padding:'4px 0'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
          {cells.map((d,i)=>{
            if(!d) return <div key={i}/>;
            const key=toKey(y,m,d), dt=new Date(y,m,d);
            const isPast=dt<TODAY, isTod=dt.getTime()===TODAY.getTime(), isSel=key===selS;
            return (
              <button key={i} disabled={isPast} onClick={()=>!isPast&&setSelS(key)}
                style={{height:'32px',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',border:'none',cursor:isPast?'not-allowed':'pointer',borderRadius:'50%',background:isSel?'#F5A623':'transparent',color:isPast?'#d1d5db':isSel?'#fff':isTod?'#D97706':'#374151',fontWeight:isSel||isTod?700:400}}
                onMouseEnter={e=>{if(!isSel&&!isPast)e.currentTarget.style.background='#FFF3DC';}}
                onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background='transparent';}}
              >{d}</button>
            );
          })}
        </div>
      </div>
    );
  };
  let m2=cm+1,y2=cy; if(m2>11){m2-=12;y2++;}
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.45)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',boxShadow:'0 24px 64px rgba(0,0,0,0.22)',padding:'24px',width:'100%',maxWidth:'560px'}}>
        <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginBottom:'12px',fontWeight:500}}>Select date</p>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
          <button onClick={prev} style={{width:'32px',height:'32px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px'}}>‹</button>
          <button onClick={next} style={{width:'32px',height:'32px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px'}}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px'}}>
          <MonthGrid y={cy} m={cm}/><MonthGrid y={y2} m={m2}/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #f3f4f6'}}>
          <button onClick={()=>setSelS(null)} style={{padding:'8px 20px',fontSize:'13px',fontWeight:600,color:'#6b7280',background:'transparent',border:'none',cursor:'pointer'}}>Reset</button>
          <button onClick={()=>{onApply(selS);onClose();}} style={{padding:'8px 24px',background:'#F5A623',color:'#fff',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'10px',cursor:'pointer'}}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── PASSENGERS MODAL ─────────────────────────────────────────
function PassengersModal({ adults, children, infants, travelClass, onUpdate, onClose }) {
  const [a,setA]=useState(adults),[c,setC]=useState(children),[inf,setInf]=useState(infants),[tc,setTc]=useState(travelClass);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',padding:'24px',width:'100%',maxWidth:'340px',boxShadow:'0 20px 40px rgba(0,0,0,0.2)'}}>
        <h3 style={{marginBottom:'20px',fontSize:'16px',fontWeight:700}}>Travelers & Class</h3>
        {[{l:'Adults',s:'12+ yrs',v:a,st:setA,min:1},{l:'Children',s:'2–12 yrs',v:c,st:setC,min:0},{l:'Infants',s:'0–2 yrs',v:inf,st:setInf,min:0}].map(row=>(
          <div key={row.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <div><div style={{fontSize:'14px',fontWeight:600}}>{row.l}</div><div style={{fontSize:'11px',color:'#9ca3af'}}>{row.s}</div></div>
            <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
              <button onClick={()=>row.st(Math.max(row.min,row.v-1))} style={{width:'30px',height:'30px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
              <span style={{fontWeight:700,minWidth:'20px',textAlign:'center'}}>{row.v}</span>
              <button onClick={()=>row.st(row.v+1)} style={{width:'30px',height:'30px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px',display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
            </div>
          </div>
        ))}
        <div style={{marginTop:'12px',borderTop:'1px solid #f3f4f6',paddingTop:'14px'}}>
          <div style={{fontSize:'11px',fontWeight:700,color:'#9ca3af',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'0.05em'}}>Class</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
            {['Economy','Business','First Class','Premium'].map(cl=>(
              <button key={cl} onClick={()=>setTc(cl)} style={{padding:'8px',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:tc===cl?'1.5px solid #F5A623':'1.5px solid #e5e7eb',background:tc===cl?'#FFF3DC':'#fff',color:tc===cl?'#D97706':'#6b7280'}}>{cl}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>{onUpdate(a,c,inf,tc);onClose();}} style={{width:'100%',marginTop:'20px',padding:'12px',background:'#F5A623',border:'none',borderRadius:'12px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'14px'}}>Done</button>
      </div>
    </div>
  );
}

// ─── PRIVACY MODAL ────────────────────────────────────────────
function PrivacyModal({ onClose }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',padding:'32px',width:'100%',maxWidth:'400px',textAlign:'center',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'12px',right:'14px',width:'28px',height:'28px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'13px',color:'#9ca3af'}}>✕</button>
        <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>🔒</div>
        <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'10px'}}>Your personal trips stay personal</h3>
        <p style={{color:'#6b7280',fontSize:'13px',lineHeight:1.6,marginBottom:'24px'}}>Personal travel is never shared with your company, and your company's travel policy won't apply.</p>
        <button onClick={onClose} style={{padding:'10px 32px',borderRadius:'999px',border:'2px solid #e5e7eb',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',color:'#374151'}}>Got it</button>
      </div>
    </div>
  );
}

// ─── ADD TRAVELER MODAL ───────────────────────────────────────
function AddTravelerModal({ onClose, onAdd }) {
  const [fn,setFn]=useState(''),[mn,setMn]=useState(''),[ln,setLn]=useState(''),[email,setEmail]=useState('');
  const canAdd=fn.trim()&&ln.trim()&&email.trim();
  const inp={border:'1px solid #e5e7eb',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'480px',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'12px',right:'14px',background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:'#9ca3af'}}>✕</button>
        <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'6px'}}>Add traveler</h3>
        <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'18px'}}>Add the traveler's information below.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <input value={fn} onChange={e=>setFn(e.target.value)} style={inp} placeholder="First name *"/>
          <input value={mn} onChange={e=>setMn(e.target.value)} style={inp} placeholder="Middle (optional)"/>
          <input value={ln} onChange={e=>setLn(e.target.value)} style={inp} placeholder="Last name *"/>
        </div>
        <div style={{...inp,display:'flex',alignItems:'center',gap:'8px',marginBottom:'18px'}}>
          <span style={{color:'#9ca3af',fontSize:'13px'}}>✉</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:'13px',fontFamily:'inherit'}} placeholder="Email *"/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
          <button onClick={onClose} style={{padding:'10px 20px',borderRadius:'10px',border:'2px solid #e5e7eb',fontSize:'13px',fontWeight:600,cursor:'pointer',background:'#fff',color:'#374151'}}>Cancel</button>
          <button onClick={()=>{if(!canAdd)return;const name=[fn,mn,ln].filter(Boolean).join(' ');onAdd({id:Date.now().toString(),name,initials:(fn[0]+ln[0]).toUpperCase(),email:email.trim()});onClose();}} disabled={!canAdd} style={{padding:'10px 20px',borderRadius:'10px',border:'none',fontSize:'13px',fontWeight:700,cursor:canAdd?'pointer':'not-allowed',background:canAdd?'#F5A623':'#f3f4f6',color:canAdd?'#fff':'#9ca3af'}}>Add traveler</button>
        </div>
      </div>
    </div>
  );
}

// ─── CITY AUTOCOMPLETE ────────────────────────────────────────
function CityInput({ value, onChange, placeholder, id, style={} }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 200 });
  const inputRef = useRef();
  const ref = useRef();
  const filtered = useMemo(()=>{
    if(!value) return CITIES.slice(0,8);
    return CITIES.filter(c=>c.toLowerCase().includes(value.toLowerCase())).slice(0,8);
  },[value]);

  useEffect(()=>{
    const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h);
  },[]);

  const handleFocus = () => {
    if(inputRef.current){
      const r=inputRef.current.getBoundingClientRect();
      setDropPos({top: r.bottom+window.scrollY+6, left: r.left+window.scrollX, width: Math.max(220, r.width)});
    }
    setOpen(true);
  };

  return (
    <div ref={ref} style={{position:'relative',flex:1,minWidth:0,...style}}>
      <input
        ref={inputRef}
        id={id} type="text" value={value}
        onChange={e=>onChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder} autoComplete="off"
        style={{width:'100%',background:'transparent',border:'none',outline:'none',fontSize:'14px',fontWeight:600,color:'#1f2937'}}
      />
      {open && filtered.length>0 && (
        <div style={{position:'fixed',top:dropPos.top,left:dropPos.left,width:dropPos.width,zIndex:999999,background:'#fff',border:'1px solid #f3f4f6',borderRadius:'14px',boxShadow:'0 12px 32px rgba(0,0,0,0.16)',padding:'6px 0',maxHeight:'260px',overflowY:'auto'}}>
          {filtered.map(c=>(
            <div key={c} onMouseDown={e=>{e.preventDefault();onChange(c);setOpen(false);}}
              style={{padding:'10px 16px',fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',color:'#374151'}}
              onMouseEnter={e=>e.currentTarget.style.background='#FFF3DC'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{color:'#F5A623'}}>📍</span>{c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DESTINATION ROW ─────────────────────────────────────────
function DestinationRow({ index, dest, onUpdate, onRemove, canRemove, isFirst }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="rfqDestinationGrid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <label style={{ ...S.label, marginBottom: 0 }}>Destination {index + 1}:</label>
            {canRemove && (
              <button onClick={() => onRemove(index)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c', padding: 0, display: 'flex', alignItems: 'center' }}>
                <IcoTrash size={12}/>
              </button>
            )}
          </div>
          <div style={{ ...S.inputBox, paddingRight:'8px' }}
            onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
            onBlurCapture={e => e.currentTarget.style.borderColor='#e4e6f0'}>
            <CityInput value={dest.city} onChange={v => onUpdate(index, { city: v })} placeholder="" id={`dest_${index}`}/>
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

// ─── HOTEL SECTION ───────────────────────────────────────────
function HotelSection({ hCity, setHCity, onOpenHCal, hCI, hCO, totalTravelers }) {
  const [requireHotel, setRequireHotel] = useState(true);
  const [numRooms, setNumRooms] = useState(1);
  const [ratings, setRatings] = useState([]);
  const [rooms, setRooms] = useState([{ adults:1, childrenBed:0, childrenNoBed:0 }]);

  const showRoomCounter = totalTravelers > 1;
  const activeRooms = showRoomCounter ? numRooms : 1;

  useEffect(() => {
    setRooms(prev => {
      if (activeRooms > prev.length) {
        return [...prev, ...Array(activeRooms - prev.length).fill(null).map(() => ({ adults:1, childrenBed:0, childrenNoBed:0 }))];
      }
      return prev.slice(0, activeRooms);
    });
  }, [activeRooms]);

  const updateRoom = (i, patch) => setRooms(p => p.map((r,idx) => idx===i ? {...r,...patch} : r));
  const toggleRating = (r) => setRatings(p => p.includes(r) ? p.filter(x=>x!==r) : [...p,r]);

  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px', fontSize:'15px', fontWeight:700 }}>
        <span>Do you require hotels?</span>
        {[{v:true,l:'Yes'},{v:false,l:'No'}].map(opt => (
          <label key={opt.l} style={{ display:'flex', alignItems:'center', gap:'6px', cursor:'pointer', fontWeight:600, fontSize:'14px' }}>
            <input type="radio" name="hotelReq" checked={requireHotel===opt.v} onChange={()=>setRequireHotel(opt.v)}
              style={{ accentColor:'#F5A623', width:'16px', height:'16px' }}/>
            {opt.v ? <span style={{color:'#F5A623'}}>{opt.l}</span> : opt.l}
          </label>
        ))}
      </div>

      {requireHotel && (
        <>
          <div className="rfqHotelCityDatesGrid">
            <div>
              <label style={S.label}>City / Destination:</label>
              <div style={{ ...S.inputBox }}
                onFocusCapture={e => e.currentTarget.style.borderColor='#F5A623'}
                onBlurCapture={e => e.currentTarget.style.borderColor='#e4e6f0'}>
                <CityInput value={hCity} onChange={setHCity} placeholder="City or destination" id="hotel_city"/>
                <span style={{color:'#aaa',flexShrink:0}}><IcoLoc size={15}/></span>
              </div>
            </div>
            <div>
              <label style={S.label}>Check-in Date:</label>
              <button onClick={() => onOpenHCal('ci')}
                style={{ ...S.inputBox, width:'100%', cursor:'pointer', justifyContent:'space-between' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#F5A623'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e4e6f0'}>
                <span style={{ fontSize:'14px', fontWeight:600, color: hCI?'#1a1a2e':'#aaa' }}>{hCI ? fmt(hCI) : ''}</span>
                <span style={{color:'#aaa',flexShrink:0}}><IcoCalendar size={15}/></span>
              </button>
            </div>
            <div>
              <label style={S.label}>Check-out Date:</label>
              <button onClick={() => onOpenHCal('co')}
                style={{ ...S.inputBox, width:'100%', cursor:'pointer', justifyContent:'space-between' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#F5A623'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e4e6f0'}>
                <span style={{ fontSize:'14px', fontWeight:600, color: hCO?'#1a1a2e':'#aaa' }}>{hCO ? fmt(hCO) : ''}</span>
                <span style={{color:'#aaa',flexShrink:0}}><IcoCalendar size={15}/></span>
              </button>
            </div>
          </div>

          {showRoomCounter && (
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px' }}>
            <label style={{ fontSize:'14px', fontWeight:700, color:'#1a1a2e', whiteSpace:'nowrap' }}>Number Of Rooms:</label>
            <div style={{ width:'200px' }}>
              <Counter value={numRooms} onChange={setNumRooms} min={1} max={10}/>
            </div>
          </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(230px, 1fr))', gap:'14px', marginBottom:'20px', overflowX:'auto' }}>
            {rooms.map((room, i) => (
              <div key={i} style={{ border:'1.5px solid #F5A623', borderRadius:'12px', padding:'16px' }}>
                <p style={{ fontWeight:800, fontSize:'14px', textAlign:'center', marginBottom:'14px', color:'#1a1a2e' }}>Room {i+1}:</p>
                {[
                  { label:'Number of Adults:', val:room.adults, key:'adults', min:1 },
                  { label:'Children (With Bed):', val:room.childrenBed, key:'childrenBed', min:0 },
                  { label:'Children (No Bed):', val:room.childrenNoBed, key:'childrenNoBed', min:0 },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: field.key==='childrenNoBed' ? 0 : '12px' }}>
                    <label style={{ ...S.label, marginBottom:'6px' }}>{field.label}</label>
                    <Counter value={field.val} onChange={v => updateRoom(i, { [field.key]: v })} min={field.min}/>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div>
            <label style={{ ...S.label, fontSize:'13px' }}>Hotel Ratings: <span style={{ fontWeight:400, color:'#aaa' }}>(Multiple Select)</span></label>
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              {[1,2,3,4,5].map(r => (
                <button key={r} onClick={() => toggleRating(r)}
                  style={{ display:'flex', alignItems:'center', gap:'4px', padding:'7px 16px', borderRadius:'8px', border:`1.5px solid ${ratings.includes(r)?'#F5A623':'#e4e6f0'}`, background: ratings.includes(r)?'#FFF3DC':'#fff', cursor:'pointer', fontSize:'13px', fontWeight:700, color: ratings.includes(r)?'#D97706':'#6b7280', transition:'all 0.15s' }}>
                   <span style={{fontSize:'12px'}}>{r} Star</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────
export default function RFQForm({ onSubmit, loading, onExpandChange, onAddToPlan, onOpenDetail }) {
  const [expanded,   setExpanded]   = useState(false);
  const [showLoader, setShowLoader] = useState(false);  
  const formRef = useRef();

  useEffect(()=>{
    document.body.style.overflow = expanded ? 'hidden' : '';
    return ()=>{ document.body.style.overflow=''; };
  },[expanded]);

  const doExpand   = ()=>{ setExpanded(true);  onExpandChange?.(true);  };
  const doCollapse = ()=>{ setExpanded(false); onExpandChange?.(false); };

  const [travelType, setTravelType] = useState('business');
  const [activeTab,  setActiveTab]  = useState('Trip Planner');

  const [budget,       setBudget]       = useState('');
  const [tripReviewer, setTripReviewer] = useState('');
  const [note,         setNote]         = useState('');

  const [from, setFrom] = useState(USER_PROFILE.city);

  // ✅ FIX: rfqId sirf short display ID hai — MongoDB _id se alag
  // Format: "A24CIM" (6 char alphanumeric)
  const [rfqId] = useState(() => Date.now().toString(36).toUpperCase().slice(-6));

  const [depDate,     setDepDate]     = useState(null);
  const [showDepCal,  setShowDepCal]  = useState(false);

  const [destinations, setDestinations] = useState([{ id:1, city:'', arrivalDate:null, nights:1 }]);
  const [openCal, setOpenCal] = useState(null);
  const [returnToBase, setReturnToBase] = useState(false);
  const [tripName, setTripName] = useState('');

  const updateDest = (i, patch) => {
    setDestinations(p => p.map((d, idx) => {
      if (idx !== i) return d;
      const updated = { ...d, ...patch };
      return updated;
    }));
  };
  const removeDest = (i) => setDestinations(p => p.filter((_,idx) => idx !== i));
  const addDest    = () => {
    setDestinations(p => {
      const last = p[p.length - 1];
      let newArrival = null;
      if (last?.arrivalDate) {
        newArrival = addDays(last.arrivalDate, last.nights);
      }
      return [...p, { id:Date.now(), city:'', arrivalDate:newArrival, nights:1 }];
    });
  };

  useEffect(() => {
    setDestinations(prev => {
      const next = [...prev];
      for (let i = 0; i < next.length - 1; i++) {
        if (next[i].arrivalDate) {
          const autoNext = addDays(next[i].arrivalDate, next[i].nights);
          next[i+1] = { ...next[i+1], arrivalDate: autoNext };
        }
      }
      return next;
    });
  }, [JSON.stringify(destinations.map(d => ({ a: d.arrivalDate, n: d.nights })))]);

  const [hCity,setHCity]=useState('');
  const [hCI,setHCI]=useState(null),[hCO,setHCO]=useState(null);
  const [showHCal,setShowHCal]=useState(null);

  const [adults,setAdults]=useState(1),[children,setChildren]=useState(0),[infants,setInfants]=useState(0),[tClass,setTClass]=useState('Economy');
  const totalPax=adults+children+infants;

  const [showPrivacy,setShowPrivacy]=useState(false);
  const [showAddTrav,setShowAddTrav]=useState(false);
  const [showPax,setShowPax]=useState(false);
  const [tripHotel,setTripHotel]=useState(false);
  const [tripRatings, setTripRatings] = useState([]);
  const [tripHotelRooms,setTripHotelRooms]=useState(1);

  const [travelers,setTravelers]=useState([{id:'ts',name:USER_PROFILE.name,initials:USER_PROFILE.initials}]);

  const TABS=[
    {id:'Flights',     icon:<IcoTakeoff size={15}/>},
    {id:'Hotels',      icon:<IcoHotel size={15}/>},
    {id:'Trip Planner',icon:<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>},
  ];

  const canTrip = destinations[0]?.city.trim() !== "";
  const canHotel = hCity.trim() !== "";

  // ✅ FIX: _id nahi bhej rahe — rfqId alag field hai
  // MongoDB apna khud ka ObjectId _id generate karega
  const handleTripCreate = (aiMode=false) => {
    if(!canTrip) return;
    const rfq = {
      rfqId,                    // ✅ "A24CIM" — display ID, MongoDB _id se alag
      from,
      tripName,
      depDate: depDate || new Date().toISOString().split('T')[0],
      destinations: destinations.map(d => ({
        destination:   d.city,
        dateOfArrival: d.arrivalDate || new Date().toISOString().split('T')[0],
        numberOfNights: d.nights,    // ✅ model field name: numberOfNights
      })),
      numberOfAdults:   adults,
      numberOfChildren: children,
      numberOfInfants:  infants,
      travelClass:      tClass,
      travelType,               // business | personal
      tripType:         travelType, // mapped for consistency with backend field name
      budget,
      reviewer:         tripReviewer,
      note,
      returnToBase,
      aiGenerate:       aiMode,
      createdAt:        new Date().toISOString(),
      status:           'draft',
    };
    setShowLoader(true);
    doCollapse();
    onSubmit?.(rfq);
  };

  // ── COLLAPSED ──
  if(!expanded){
    return (
      <div style={{width:'100%'}}>
        <style>{`@keyframes rfqRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes rfqExpand{from{opacity:0;transform:translateY(-6px) scale(0.99)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'16px',flexWrap:'wrap'}}>
          <div style={{display:'flex',background:'#f3f4f6',borderRadius:'999px',padding:'3px',gap:'2px'}}>
            {['business','personal'].map(t=>(
              <button key={t} type="button" onClick={e=>{e.stopPropagation();setTravelType(t);if(t==='personal')setShowPrivacy(true);}}
                style={{padding:'7px 16px',borderRadius:'999px',fontSize:'13px',fontWeight:600,cursor:'pointer',border:'none',background:travelType===t?'#1f2937':'transparent',color:travelType===t?'#fff':'#6b7280',transition:'all 0.2s'}}>
                {t==='business'?'Business travel':'Personal travel'}
              </button>
            ))}
          </div>
          {travelType==='personal'&&<span style={{fontSize:'12px',color:'#D97706',fontWeight:600,cursor:'pointer'}} onClick={()=>setShowPrivacy(true)}>🔒 Private · Learn more</span>}
        </div>
        <div style={{maxWidth:'460px'}}>
          <div onClick={doExpand}
            style={{display:'flex',alignItems:'center',gap:'10px',border:'2px solid #e5e7eb',borderRadius:'999px',padding:'8px 8px 8px 18px',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',cursor:'pointer',transition:'border-color 0.2s,box-shadow 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#fcd34d';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)';}}>
            <span style={{fontSize:'18px',flexShrink:0}}>📍</span>
            <span style={{flex:1,fontSize:'14px',color:'#9ca3af',userSelect:'none'}}>Where do you want to go?</span>
            <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 14px rgba(245,166,35,0.45)'}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </div>
          </div>
        </div>
        {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
        <TripLoader
          isVisible={showLoader}
          destinations={destinations.map(d => ({ destination: d.city }))}
        />
      </div>
    );
  }

  // ── EXPANDED ──
  return (
    <>
      <style>{`
        @keyframes rfqExpand{from{opacity:0;transform:translateY(-8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        select option{font-family:inherit;}
        input::placeholder,textarea::placeholder{color:#9ca3af;}
        button:focus{outline:none;}
        .rfqOverlay{
          position:fixed;left:0;right:0;bottom:0;top:64px;z-index:9998;
          display:flex;align-items:flex-start;justify-content:center;
          background:rgba(0,0,0,0.40);backdrop-filter:blur(3px);
          padding:16px;overflow-y:auto;
        }
        .rfqOverlayInner{
          position:relative;width:100%;max-width:940px;
          max-height:calc(100vh - 96px);overflow-y:auto;
          background:#f7f8fc;border-radius:20px;
          box-shadow:0 32px 80px rgba(0,0,0,0.22);
          animation:rfqExpand 0.3s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (max-width:640px){
          .rfqOverlay{top:56px;padding:12px;}
          .rfqOverlayInner{max-height:calc(100vh - 80px);}
        }
        .rfqDestinationGrid{
          display:grid;grid-template-columns:1fr 200px;gap:14px;align-items:start;
        }
        @media (max-width:640px){
          .rfqDestinationGrid{grid-template-columns:1fr;gap:10px;}
        }
        .rfqHotelCityDatesGrid{
          display:grid;grid-template-columns:1fr 180px 180px;gap:14px;margin-bottom:20px;
        }
        @media (max-width:640px){
          .rfqHotelCityDatesGrid{grid-template-columns:1fr;gap:12px;margin-bottom:16px;}
        }
        @media (min-width:641px) and (max-width:1023px){
          .rfqHotelCityDatesGrid{grid-template-columns:1fr 1fr;gap:14px;}
        }
      `}</style>

      <div onClick={doCollapse} className="rfqOverlay">
        <div ref={formRef} onClick={e=>e.stopPropagation()} className="rfqOverlayInner">
          <div style={{padding:'clamp(16px, 3vw, 28px) clamp(16px, 4vw, 32px)'}}>

            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                <h2 style={{fontSize:'24px',fontWeight:900,letterSpacing:'-0.02em',color:'#111827',fontFamily:'Georgia,serif',margin:0}}>Book a trip</h2>
              </div>
              <button onClick={doCollapse} style={{width:'34px',height:'34px',borderRadius:'50%',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'14px',color:'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* Business/Personal */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'20px',flexWrap:'wrap'}}>
              <div style={{display:'flex',background:'#f3f4f6',borderRadius:'999px',padding:'4px',gap:'2px'}}>
                {['business','personal'].map(t=>(
                  <button key={t} onClick={()=>{setTravelType(t);if(t==='personal')setShowPrivacy(true);}}
                    style={{padding:'7px 18px',borderRadius:'999px',fontSize:'13px',fontWeight:600,cursor:'pointer',border:'none',background:travelType===t?'#1f2937':'transparent',color:travelType===t?'#fff':'#6b7280',transition:'all 0.2s'}}>
                    {t==='business'?'Business travel':'Personal travel'}
                  </button>
                ))}
              </div>
              {travelType==='personal'&&<button onClick={()=>setShowPrivacy(true)} style={{fontSize:'12px',color:'#D97706',background:'none',border:'none',cursor:'pointer',fontWeight:600}}>🔒 Private · Learn more</button>}
            </div>

            {/* Tabs */}
            <div style={{display:'flex',borderBottom:'2px solid #e4e6f0',marginBottom:'24px',background:'#fff',borderRadius:'12px 12px 0 0',padding:'0 4px',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
              {TABS.map(({id,icon})=>(
                <button key={id} onClick={()=>setActiveTab(id)}
                  style={{display:'flex',alignItems:'center',gap:'7px',padding:'13px 20px',fontSize:'13px',whiteSpace:'nowrap',border:'none',borderBottom:`2px solid ${activeTab===id?'#F5A623':'transparent'}`,background:'transparent',cursor:'pointer',color:activeTab===id?'#111827':'#9ca3af',fontWeight:activeTab===id?700:400,marginBottom:'-2px'}}>
                  <span style={{color:activeTab===id?'#F5A623':'#9ca3af'}}>{icon}</span>{id}
                </button>
              ))}
            </div>

            {/* White content card */}
            <div style={{ background:'#fff', borderRadius:'14px', padding:'24px', marginBottom:'16px', border:'1px solid #e4e6f0' }}>

              {/* ── FLIGHTS TAB ── */}
              {activeTab==='Flights' && (
                <div>
                  {/* Trip Name + Status row */}
                  <div style={{ display:'flex', gap:'14px', marginBottom:'20px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Trip Name:</label>
                      <div style={S.inputBox}>
                        <input
                          value={tripName}
                          onChange={e => setTripName(e.target.value)}
                          placeholder="Enter trip name (e.g. Summer Vacation)"
                          style={S.inputText}
                        />
                      </div>
                    </div>
                    <div style={{ width:'280px', flexShrink:0 }}>
                      <label style={S.label}>Status:</label>
                      <div style={{ ...S.inputBox, border:'1.5px solid #e5e7eb', borderRadius:'10px', background:'#fff', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#9ca3af', flexShrink:0 }}/>
                          <span style={{ fontSize:'14px', fontWeight:700, color:'#374151' }}>OPEN</span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'12px', color:'#9ca3af', fontWeight:500 }}>Trip ID:</span>
                          {/* ✅ rfqId directly — no ': ' prefix anymore */}
                          <span style={{ fontSize:'12px', fontWeight:700, color:'#D97706' }}>{rfqId}</span>
                          <span style={{ color:'#9ca3af', fontSize:'10px' }}>▾</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* From row */}
                  <div style={{ display:'flex', alignItems:'flex-end', gap:'14px', marginBottom:'24px', flexWrap:'wrap' }}>
                    <div style={{ minWidth:'200px', flex:1 }}>
                      <label style={S.label}>From:</label>
                      <div style={{ ...S.inputBox, background:'#f7f8fc' }}
                        onFocusCapture={e=>e.currentTarget.style.borderColor='#F5A623'}
                        onBlurCapture={e=>e.currentTarget.style.borderColor='#e4e6f0'}>
                        <span style={{color:'#9ca3af',flexShrink:0}}><IcoTakeoff size={14}/></span>
                        <CityInput value={from} onChange={setFrom} placeholder="Departure city" id="from_city"/>
                      </div>
                    </div>
                    <div style={{ minWidth:'180px' }}>
                      <label style={S.label}>Departure Date:</label>
                      <button onClick={()=>setShowDepCal(true)}
                        style={{ ...S.inputBox, width:'100%', cursor:'pointer', justifyContent:'space-between' }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor='#F5A623'}
                        onMouseLeave={e=>e.currentTarget.style.borderColor='#e4e6f0'}>
                        <span style={{fontSize:'14px',fontWeight:600,color:depDate?'#1a1a2e':'#aaa'}}>{depDate?fmt(depDate):'Select date'}</span>
                        <span style={{color:'#aaa',flexShrink:0}}><IcoCalendar size={15}/></span>
                      </button>
                    </div>
                  </div>

                  {destinations.map((dest,i) => (
                    <DestinationRow key={dest.id} index={i} dest={dest} onUpdate={updateDest} onRemove={removeDest} canRemove={destinations.length>1} onOpenCal={idx=>setOpenCal(idx)} isFirst={i===0}/>
                  ))}

                  {/* Add destination + Return to base */}
                  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginTop:'8px', flexWrap:'wrap' }}>
                    <button onClick={addDest}
                      style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 22px', fontSize:'13px', fontWeight:700, color:'#fff', background:'#F5A623', border:'none', borderRadius:'24px', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e=>e.currentTarget.style.background='#E09510'}
                      onMouseLeave={e=>e.currentTarget.style.background='#F5A623'}>
                      <IcoPlus size={13}/> Add Destination
                    </button>
                    <label style={{ display:'flex', alignItems:'center', gap:'7px', cursor:'pointer', fontSize:'13px', fontWeight:600, color:'#374151', marginLeft:'8px' }}>
                      <input type="checkbox" checked={returnToBase} onChange={e=>setReturnToBase(e.target.checked)}
                        style={{ accentColor:'#F5A623', width:'15px', height:'15px', cursor:'pointer' }}/>
                      Return to base
                    </label>
                  </div>

                  {/* ✅ Create Trip button */}
                  <div style={{ marginTop:'24px', display:'flex', justifyContent:'flex-end' }}>
                    <button
                      onClick={() => handleTripCreate(false)}
                      disabled={!canTrip}
                      style={{
                        padding:'12px 32px', fontSize:'14px', fontWeight:800,
                        background: canTrip ? '#F5A623' : '#f3f4f6',
                        color: canTrip ? '#fff' : '#9ca3af',
                        border:'none', borderRadius:'12px',
                        cursor: canTrip ? 'pointer' : 'not-allowed',
                        boxShadow: canTrip ? '0 4px 14px rgba(245,166,35,0.4)' : 'none',
                        transition:'all 0.2s',
                      }}
                      onMouseEnter={e=>{ if(canTrip) e.currentTarget.style.background='#E09510'; }}
                      onMouseLeave={e=>{ if(canTrip) e.currentTarget.style.background='#F5A623'; }}
                    >
                      Create Trip →
                    </button>
                  </div>
                </div>
              )}

              {/* ── HOTELS TAB ── */}
              {activeTab==='Hotels' && (
                <HotelSection hCity={hCity} setHCity={setHCity} onOpenHCal={setShowHCal} hCI={hCI} hCO={hCO} totalTravelers={totalPax}/>
              )}

              {/* ── TRIP PLANNER TAB ── */}
              {activeTab === 'Trip Planner' && (
                <TripPlannerTab
                  rfqId={rfqId}
                  onSubmit={onSubmit}
                  loading={loading}
                  travelType={travelType}
                />
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── MODALS ── */}
      {showDepCal&&<CalendarModal onClose={()=>setShowDepCal(false)} onApply={s=>setDepDate(s)} depDate={depDate}/>}
      {openCal!==null&&<CalendarModal
        onClose={()=>setOpenCal(null)}
        onApply={s=>{ updateDest(openCal,{arrivalDate:s}); setOpenCal(null); }}
        depDate={destinations[openCal]?.arrivalDate}
      />}
      {showHCal==='ci'&&<CalendarModal onClose={()=>setShowHCal(null)} onApply={s=>setHCI(s)} depDate={hCI}/>}
      {showHCal==='co'&&<CalendarModal onClose={()=>setShowHCal(null)} onApply={s=>setHCO(s)} depDate={hCO}/>}
      {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
      {showAddTrav&&<AddTravelerModal onClose={()=>setShowAddTrav(false)} onAdd={t=>setTravelers(p=>[...p,t])}/>}
      {showPax&&<PassengersModal adults={adults} children={children} infants={infants} travelClass={tClass} onUpdate={(a,c,i,tc)=>{setAdults(a);setChildren(c);setInfants(i);setTClass(tc);}} onClose={()=>setShowPax(false)}/>}
      <TripLoader
        isVisible={showLoader}
        destinations={destinations.map(d => ({ destination: d.city }))}
      />
    </>
  );
}