import { useState, useRef, useEffect, useMemo } from 'react';

const CITIES = [
  'Indore, India','Mumbai, India','Delhi, India','Bangalore, India',
  'Hyderabad, India','Chennai, India','Kolkata, India','Pune, India',
  'Ahmedabad, India','Jaipur, India','Surat, India','Lucknow, India',
  'London, UK','Dubai, UAE','Singapore','New York, USA','Paris, France','Tokyo, Japan',
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_HDR = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const TRIP_TYPES = ['Roundtrip','One way'];
const TODAY = new Date(); TODAY.setHours(0,0,0,0);
const fmt = d => d ? new Date(d+'T00:00:00').toLocaleDateString('en-US',{day:'numeric',month:'short'}) : null;
const toKey = (y,m,d) => `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const AIRLINES = [
  { name: 'Air India',          logo: '🇮🇳' },
  { name: 'IndiGo',             logo: '🔵' },
  { name: 'Emirates',           logo: '🇦🇪' },
  { name: 'Air France',         logo: '🇫🇷' },
  { name: 'Lufthansa',          logo: '🇩🇪' },
  { name: 'Singapore Airlines', logo: '🇸🇬' },
];

const IcoTakeoff = ({size=16,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M2.5 19h19v2h-19v-2zm7.18-1.73L7 15.1 5 17.1l2.68 2.17c.36.29.82.45 1.28.45h9.49c.55 0 1-.45 1-1v-.27c0-.55-.45-1-1-1H9.68zM21.5 9.5c0-.83-.67-1.5-1.5-1.5H13l-2.09-4.5H8.5L11 9.5H6L4.5 7.5H2l1.5 5.5L2 18.5h1.5L5 16.5h14c.83 0 1.5-.67 1.5-1.5V9.5z"/></svg>);
const IcoLand = ({size=16,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M2.5 19h19v2h-19v-2zm16.84-3.18c.36.29.82.45 1.28.45.55 0 1-.45 1-1v-.27c0-.55-.45-1-1-1H11.13L8.5 9.5H7l.59 5.33 11.75 1L2.5 13.5v1.5l16.84 1.82z"/></svg>);
const IcoCalendar = ({size=15,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cls}><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" fill="none"/><path d="M3 9h18" stroke="currentColor" strokeWidth="1.8"/><path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="7" y="13" width="3" height="3" rx="0.5" fill="currentColor" opacity="0.7"/></svg>);
const IcoSwap = ({size=12}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" fill="currentColor"/></svg>);
const IcoUser = ({size=15,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>);
const IcoHotel = ({size=16,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>);
const IcoPin = ({size=16,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cls}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>);
const IcoStar = ({size=11}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>);
const IcoClock = ({size=13,cls=''}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cls}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>);
const IcoBudget = ({size=15}) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>);

// ─── SEARCH LOADING MODAL ─────────────────────────────────────
function SearchLoadingModal({ from, to, onDone, isLoading }) {
  const [progress,      setProgress]      = useState(0);
  const [airline,       setAirline]       = useState(null);
  const [animDone,      setAnimDone]      = useState(false);
  const [readyToFinish, setReadyToFinish] = useState(false);

  const fromCode = (from || 'BOM').substring(0, 3).toUpperCase();
  const toCode   = (to   || 'DXB').substring(0, 3).toUpperCase();

  useEffect(() => {
    let prog = 0, ai = 0;
    const iv = setInterval(() => {
      prog += Math.random() * 10 + 5;
      if (prog > 100) prog = 100;
      setProgress(Math.round(prog));
      if (ai < AIRLINES.length && prog > (ai + 1) * (100 / (AIRLINES.length + 1))) {
        setAirline(AIRLINES[ai]); ai++;
      }
      if (prog >= 100) { clearInterval(iv); setAnimDone(true); }
    }, 220);
    return () => clearInterval(iv);
  }, []);

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current === true && !isLoading) setReadyToFinish(true);
    if (prevLoadingRef.current === false && !isLoading) setReadyToFinish(true);
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (animDone && readyToFinish) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
  }, [animDone, readyToFinish]);

  return (
    <div style={{position:'fixed',inset:0,zIndex:50000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.30)',padding:'16px'}}>
      <div style={{background:'#fff',borderRadius:'20px',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',padding:'48px 40px',width:'100%',maxWidth:'420px',textAlign:'center'}}>
        <p style={{fontSize:'11px',color:'#9ca3af',marginBottom:'6px',letterSpacing:'0.05em',textTransform:'uppercase'}}>Roundtrip flight</p>
        <h2 style={{fontSize:'32px',fontWeight:900,letterSpacing:'-0.03em',color:'#111827',marginBottom:'6px'}}>{fromCode} ⇄ {toCode}</h2>
        {animDone && isLoading ? (
          <p style={{fontSize:'13px',fontWeight:600,color:'#D97706',marginBottom:'28px'}}>✨ Almost there, loading your results...</p>
        ) : airline ? (
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'28px'}}>{airline.logo} Checking with {airline.name}</p>
        ) : (
          <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'28px'}}>Finding you the best flight options...</p>
        )}
        <div style={{position:'relative',height:'6px',background:'#f3f4f6',borderRadius:'999px',maxWidth:'320px',margin:'0 auto 24px'}}>
          <div style={{position:'absolute',height:'100%',background:'#F7BE39',borderRadius:'999px',width:`${progress}%`,transition:'width 0.5s ease'}}/>
          <span style={{position:'absolute',fontSize:'20px',top:'-10px',left:`${progress}%`,transform:'translateX(-50%)',transition:'left 0.5s ease',lineHeight:1}}>✈️</span>
        </div>
        {animDone && isLoading && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginTop:'8px'}}>
            <div style={{width:'16px',height:'16px',border:'2px solid #F7BE39',borderTopColor:'transparent',borderRadius:'50%',animation:'rfqSpin 0.7s linear infinite'}}/>
            <span style={{fontSize:'12px',color:'#9ca3af'}}>Loading your results...</span>
          </div>
        )}
        <p style={{fontSize:'11px',color:'#9ca3af',marginTop:'20px'}}>No hidden fees · trav platforms shows full price upfront</p>
      </div>
      <style>{`@keyframes rfqSpin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── CITY AUTOCOMPLETE INPUT ──────────────────────────────────
function CityInput({ value, onChange, placeholder, id, onSelectCallback, inputStyle={} }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const filtered = useMemo(() => {
    if (!value) return CITIES.slice(0,8);
    return CITIES.filter(c => c.toLowerCase().includes(value.toLowerCase())).slice(0,8);
  }, [value]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{position:'relative', flex:1, minWidth:0, zIndex: open ? 9999 : 'auto'}}>
      <input id={id} type="text" value={value} onChange={e => onChange(e.target.value)} onFocus={() => setOpen(true)}
        placeholder={placeholder} autoComplete="off"
        style={{width:'100%',background:'transparent',border:'none',outline:'none',fontSize:'14px',fontWeight:600,color:'#1f2937',...inputStyle}}
        className="placeholder-gray-400"/>
      {open && filtered.length > 0 && (
        <ul style={{position:'absolute',top:'calc(100% + 10px)',left:'-16px',minWidth:'220px',background:'#fff',border:'1px solid #f3f4f6',borderRadius:'14px',boxShadow:'0 8px 24px rgba(0,0,0,0.13)',zIndex:9999,padding:'6px 0',listStyle:'none',margin:0}}>
          {filtered.map(c=>(
            <li key={c} onMouseDown={e=>{e.preventDefault();onChange(c);setOpen(false);onSelectCallback?.();}}
              style={{padding:'10px 16px',fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',color:'#374151'}}
              onMouseEnter={e=>e.currentTarget.style.background='#fffbeb'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <span style={{color:'#F7BE39',fontSize:'13px'}}>📍</span>{c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── CALENDAR MODAL ───────────────────────────────────────────
function CalendarModal({ onClose, onApply, depDate, retDate, isOneWay }) {
  const [cy, setCy] = useState(TODAY.getFullYear());
  const [cm, setCm] = useState(TODAY.getMonth());
  const [selS, setSelS] = useState(depDate || null);
  const [selE, setSelE] = useState(retDate || null);
  const [phase, setPhase] = useState(0);
  const prev = () => cm===0?(setCy(cy-1),setCm(11)):setCm(cm-1);
  const next = () => cm===11?(setCy(cy+1),setCm(0)):setCm(cm+1);
  const pickDay = key => {
    if (isOneWay) { setSelS(key); setSelE(null); return; }
    if (!selS || phase===0 || (selS && selE)) { setSelS(key); setSelE(null); setPhase(1); }
    else { if (key<=selS){setSelE(selS);setSelS(key);}else setSelE(key); setPhase(0); }
  };
  const buildMonth = (y,m) => {
    const first = new Date(y,m,1).getDay(), dim = new Date(y,m+1,0).getDate(), cells=[];
    for(let i=0;i<first;i++) cells.push(null);
    for(let d=1;d<=dim;d++) cells.push(d);
    return cells;
  };
  const MonthGrid = ({y,m}) => {
    const cells = buildMonth(y,m);
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
            const isPast=dt<TODAY, isTod=dt.getTime()===TODAY.getTime();
            const isSel=key===selS||key===selE;
            const isRange=!isOneWay&&selS&&selE&&key>selS&&key<selE;
            return (
              <button key={i} disabled={isPast} onClick={()=>!isPast&&pickDay(key)}
                style={{height:'32px',width:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',border:'none',cursor:isPast?'not-allowed':'pointer',borderRadius:'50%',background:isSel?'#F7BE39':isRange?'#FFF8E6':'transparent',color:isPast?'#d1d5db':isSel?'#fff':isTod?'#D97706':'#374151',fontWeight:isSel||isTod?700:400,transition:'0.15s'}}
                onMouseEnter={e=>{if(!isSel&&!isPast) e.currentTarget.style.background='#fffbeb';}}
                onMouseLeave={e=>{if(!isSel&&!isRange) e.currentTarget.style.background='transparent';}}
              >{d}</button>
            );
          })}
        </div>
      </div>
    );
  };
  let m2=cm+1, y2=cy;
  if(m2>11){m2-=12;y2++;}
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',padding:'24px',width:'100%',maxWidth:'560px'}}>
        <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginBottom:'12px',fontWeight:500}}>
          {isOneWay?'Select departure date':(phase===0&&!selS?'Select departure date':phase===1?'Now select return date':'Dates selected')}
        </p>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'16px'}}>
          <button onClick={prev} style={{width:'32px',height:'32px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px'}}>‹</button>
          <button onClick={next} style={{width:'32px',height:'32px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'16px'}}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'32px'}}>
          <MonthGrid y={cy} m={cm}/><MonthGrid y={y2} m={m2}/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'12px',marginTop:'20px',paddingTop:'16px',borderTop:'1px solid #f3f4f6'}}>
          <button onClick={()=>{setSelS(null);setSelE(null);setPhase(0);}} style={{padding:'8px 20px',fontSize:'13px',fontWeight:600,color:'#6b7280',background:'transparent',border:'none',cursor:'pointer'}}>Reset</button>
          <button onClick={()=>{onApply(selS,isOneWay?null:selE);onClose();}} style={{padding:'8px 24px',background:'#F7BE39',color:'#fff',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'10px',cursor:'pointer'}}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── PASSENGERS MODAL ─────────────────────────────────────────
function PassengersModal({ adults, children, infants, travelClass, onUpdate, onClose }) {
  const [a,setA]=useState(adults), [c,setC]=useState(children), [inf,setInf]=useState(infants), [tc,setTc]=useState(travelClass);
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
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
              <button key={cl} onClick={()=>setTc(cl)} style={{padding:'8px',borderRadius:'8px',fontSize:'12px',fontWeight:600,cursor:'pointer',border:tc===cl?'1.5px solid #F7BE39':'1.5px solid #e5e7eb',background:tc===cl?'#FFF8E6':'#fff',color:tc===cl?'#D97706':'#6b7280',transition:'0.15s'}}>{cl}</button>
            ))}
          </div>
        </div>
        <button onClick={()=>{onUpdate(a,c,inf,tc);onClose();}} style={{width:'100%',marginTop:'20px',padding:'12px',background:'#F7BE39',border:'none',borderRadius:'12px',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:'14px'}}>Done</button>
      </div>
    </div>
  );
}

// ─── PRIVACY MODAL ────────────────────────────────────────────
function PrivacyModal({ onClose }) {
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',padding:'32px',width:'100%',maxWidth:'400px',textAlign:'center',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'12px',right:'14px',width:'28px',height:'28px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'13px',color:'#9ca3af'}}>✕</button>
        <div style={{width:'60px',height:'60px',borderRadius:'50%',background:'#F7BE39',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'28px',margin:'0 auto 16px'}}>🔒</div>
        <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'10px'}}>Your personal trips stay personal</h3>
        <p style={{color:'#6b7280',fontSize:'13px',lineHeight:1.6,marginBottom:'24px'}}>Personal travel is never shared with your company, and your company's travel policy won't apply — so you're free to choose whatever works for you.</p>
        <button onClick={onClose} style={{padding:'10px 32px',borderRadius:'999px',border:'2px solid #e5e7eb',background:'#fff',fontSize:'13px',fontWeight:600,cursor:'pointer',color:'#374151'}}>Got it</button>
      </div>
    </div>
  );
}

// ─── POLICY MODAL ─────────────────────────────────────────────
function PolicyModal({ onClose }) {
  const [tab,setTab]=useState('Flights');
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'600px',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',position:'relative',overflow:'hidden'}}>
        <button onClick={onClose} style={{position:'absolute',top:'12px',right:'14px',width:'28px',height:'28px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'13px',color:'#9ca3af'}}>✕</button>
        <div style={{padding:'20px 24px 0'}}>
          <h3 style={{fontSize:'16px',fontWeight:700}}>Your travel policy</h3>
          <p style={{fontSize:'11px',color:'#9ca3af',marginTop:'2px',marginBottom:'14px'}}>Assigned to you by travplatforms</p>
          <div style={{display:'flex',borderBottom:'1px solid #f3f4f6'}}>
            {['Flights','Hotels'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px',fontSize:'13px',fontWeight:600,border:'none',borderBottom:`2px solid ${tab===t?'#F7BE39':'transparent'}`,background:'transparent',cursor:'pointer',color:tab===t?'#1f2937':'#9ca3af',marginBottom:'-1px'}}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{maxHeight:'260px',overflow:'auto'}}>
          <table style={{width:'100%',fontSize:'13px',borderCollapse:'collapse'}}>
            <thead><tr style={{background:'#f9fafb'}}>
              <th style={{padding:'10px 20px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'#9ca3af',textTransform:'uppercase',width:'130px'}}></th>
              <th style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'#9ca3af',textTransform:'uppercase'}}>Domestic</th>
              <th style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:700,color:'#9ca3af',textTransform:'uppercase'}}>International</th>
            </tr></thead>
            <tbody>
              {[['Price','Book up to the maximum price shown','Book up to the maximum price shown'],['Cabin max','Premium Economy','Premium Economy'],['Advance booking','Minimum 7 days','Minimum 14 days']].map(([k,v1,v2])=>(
                <tr key={k} style={{borderTop:'1px solid #f3f4f6'}}>
                  <td style={{padding:'10px 20px',fontWeight:600,color:'#1f2937',verticalAlign:'top'}}>{k}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280',verticalAlign:'top'}}>{v1}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280',verticalAlign:'top'}}>{v2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{padding:'12px'}}/>
      </div>
    </div>
  );
}

// ─── ADD TRAVELER MODAL ───────────────────────────────────────
function AddTravelerModal({ onClose, onAdd }) {
  const [fn,setFn]=useState(''), [mn,setMn]=useState(''), [ln,setLn]=useState(''), [email,setEmail]=useState('');
  const canAdd = fn.trim()&&ln.trim()&&email.trim();
  const handleAdd = () => {
    if(!canAdd) return;
    const name=[fn.trim(),mn.trim(),ln.trim()].filter(Boolean).join(' ');
    onAdd?.({id:Date.now().toString(),name,initials:(fn[0]+ln[0]).toUpperCase(),email:email.trim()});
    onClose();
  };
  const inp = {border:'1px solid #e5e7eb',borderRadius:'10px',padding:'10px 14px',fontSize:'13px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit'};
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.4)',padding:'16px'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'20px',padding:'28px',width:'100%',maxWidth:'480px',boxShadow:'0 24px 64px rgba(0,0,0,0.2)',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:'12px',right:'14px',background:'none',border:'none',fontSize:'18px',cursor:'pointer',color:'#9ca3af'}}>✕</button>
        <h3 style={{fontSize:'18px',fontWeight:700,marginBottom:'6px'}}>Add traveler</h3>
        <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'18px'}}>Add the traveler's information below.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <input value={fn} onChange={e=>setFn(e.target.value)} style={inp} placeholder="First name *"/>
          <input value={mn} onChange={e=>setMn(e.target.value)} style={inp} placeholder="Middle (optional)"/>
          <input value={ln} onChange={e=>setLn(e.target.value)} style={inp} placeholder="Last name *"/>
        </div>
        <div style={{...inp,display:'flex',alignItems:'center',gap:'8px',marginBottom:'18px',padding:'10px 14px',borderRadius:'10px'}}>
          <span style={{color:'#9ca3af',fontSize:'13px'}}>✉</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} style={{flex:1,border:'none',outline:'none',fontSize:'13px',fontFamily:'inherit'}} placeholder="Email *"/>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:'10px'}}>
          <button onClick={onClose} style={{padding:'10px 20px',borderRadius:'10px',border:'2px solid #e5e7eb',fontSize:'13px',fontWeight:600,cursor:'pointer',background:'#fff',color:'#374151'}}>Cancel</button>
          <button onClick={handleAdd} disabled={!canAdd} style={{padding:'10px 20px',borderRadius:'10px',border:'none',fontSize:'13px',fontWeight:700,cursor:canAdd?'pointer':'not-allowed',background:canAdd?'#F7BE39':'#f3f4f6',color:canAdd?'#fff':'#9ca3af',transition:'0.2s'}}>Add traveler</button>
        </div>
      </div>
    </div>
  );
}

// ─── DEPARTURE WINDOW MODAL ───────────────────────────────────
function DepWindowModal({ from, to, depDate, retDate, tripType, onClose, onApply }) {
  const [depRange,setDepRange]=useState([0,100]), [retRange,setRetRange]=useState([0,100]);
  const isOneWay = tripType==='One way';
  const toTime = pct => { const mins=Math.round(pct*1440/100),h=Math.floor(mins/60),m=mins%60,ampm=h<12?'am':'pm'; return `${h===0?12:h>12?h-12:h}:${String(m).padStart(2,'0')} ${ampm}`; };
  const fromCode=(from||'BOM').substring(0,3).toUpperCase(), toCode=(to||'DXB').substring(0,3).toUpperCase();
  const dep=depDate?new Date(depDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'Mon, May 4';
  const ret=retDate?new Date(retDate+'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'Thu, May 7';
  const SliderRow=({label,range,setRange})=>{
    const [left,right]=range, trackRef=useRef(), dragging=useRef(null);
    const getPct=clientX=>{const rect=trackRef.current.getBoundingClientRect();return Math.max(0,Math.min(100,((clientX-rect.left)/rect.width)*100));};
    const onPointerDown=e=>{e.preventDefault();const pct=getPct(e.clientX);dragging.current=Math.abs(pct-left)<=Math.abs(pct-right)?'left':'right';trackRef.current.setPointerCapture(e.pointerId);};
    const onPointerMove=e=>{if(!dragging.current)return;const pct=getPct(e.clientX);dragging.current==='left'?setRange([Math.min(Math.round(pct),right-1),right]):setRange([left,Math.max(Math.round(pct),left+1)]);};
    const onPointerUp=()=>{dragging.current=null;};
    return (
      <div style={{marginBottom:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
          <p style={{fontSize:'13px',fontWeight:700,color:'#1f2937'}}>{label}</p>
          <span style={{fontSize:'11px',fontWeight:700,color:'#fff',background:'#F7BE39',borderRadius:'999px',padding:'2px 10px'}}>{toTime(left)} – {toTime(right)}</span>
        </div>
        <div ref={trackRef} style={{position:'relative',height:'20px',display:'flex',alignItems:'center',cursor:'pointer',userSelect:'none'}}
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
          <div style={{position:'absolute',width:'100%',height:'6px',background:'#f3f4f6',borderRadius:'999px'}}/>
          <div style={{position:'absolute',height:'6px',background:'#F7BE39',borderRadius:'999px',left:`${left}%`,width:`${right-left}%`}}/>
          <div style={{position:'absolute',width:'18px',height:'18px',background:'#F7BE39',borderRadius:'50%',border:'2px solid #fff',boxShadow:'0 2px 6px rgba(0,0,0,0.15)',left:`calc(${left}% - 9px)`,zIndex:2}}/>
          <div style={{position:'absolute',width:'18px',height:'18px',background:'#F7BE39',borderRadius:'50%',border:'2px solid #fff',boxShadow:'0 2px 6px rgba(0,0,0,0.15)',left:`calc(${right}% - 9px)`,zIndex:2}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:'4px'}}>
          <span style={{fontSize:'10px',color:'#9ca3af'}}>12:00 am</span>
          <span style={{fontSize:'10px',color:'#9ca3af'}}>11:59 pm</span>
        </div>
      </div>
    );
  };
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:20000,display:'flex',alignItems:'flex-start',justifyContent:'center',paddingTop:'140px',background:'rgba(0,0,0,0.18)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'16px',boxShadow:'0 20px 48px rgba(0,0,0,0.15)',padding:'20px',width:'360px'}}>
        <SliderRow label={`${fromCode} departure — ${dep}`} range={depRange} setRange={setDepRange}/>
        {!isOneWay&&<SliderRow label={`${toCode} departure — ${ret}`} range={retRange} setRange={setRetRange}/>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:'10px',paddingTop:'12px',borderTop:'1px solid #f3f4f6'}}>
          <button onClick={()=>{setDepRange([0,100]);setRetRange([0,100]);}} style={{fontSize:'13px',fontWeight:600,color:'#F7BE39',background:'none',border:'none',cursor:'pointer',padding:'6px 12px'}}>Reset</button>
          <button onClick={()=>{onApply(`${fromCode}: ${toTime(depRange[0])} – ${toTime(depRange[1])}`);onClose();}} style={{padding:'8px 24px',background:'#F7BE39',color:'#fff',fontSize:'13px',fontWeight:700,border:'none',borderRadius:'10px',cursor:'pointer'}}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── FIELD PILL COMPONENTS ────────────────────────────────────
function CityPill({ icon, label, value, onChange, placeholder, style={} }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',transition:'background 0.15s',position:'relative',overflow:'visible',...style}}>
      <span style={{flexShrink:0,color:'#9ca3af'}}>{icon}</span>
      <div style={{minWidth:0,flex:1,overflow:'visible'}}>
        <p style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af',marginBottom:'3px',lineHeight:1}}>{label}</p>
        <CityInput value={value} onChange={onChange} placeholder={placeholder} id={label}/>
      </div>
    </div>
  );
}

function DatePill({ label, value, onClick, style={} }) {
  return (
    <button type="button" onClick={onClick} style={{display:'flex',alignItems:'center',gap:'10px',padding:'12px 16px',background:'transparent',border:'none',cursor:'pointer',textAlign:'left',transition:'background 0.15s',...style}}
      onMouseEnter={e=>e.currentTarget.style.background='#fffbeb'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
      <IcoCalendar size={15}/>
      <div>
        <p style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af',marginBottom:'3px',lineHeight:1}}>{label}</p>
        <p style={{fontSize:'13px',fontWeight:600,color:value?'#1f2937':'#9ca3af',whiteSpace:'nowrap'}}>{value||'Select date'}</p>
      </div>
    </button>
  );
}

function CounterPill({ icon, label, value, onDec, onInc, min=1, max=20, style={} }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',...style}}>
      {icon&&<span style={{flexShrink:0,color:'#9ca3af'}}>{icon}</span>}
      <div>
        <p style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af',marginBottom:'3px',lineHeight:1}}>{label}</p>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <button type="button" onClick={onDec} disabled={value<=min} style={{width:'18px',height:'18px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:value<=min?'not-allowed':'pointer',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center',opacity:value<=min?0.35:1}}>−</button>
          <span style={{fontSize:'13px',fontWeight:700,minWidth:'14px',textAlign:'center'}}>{value}</span>
          <button type="button" onClick={onInc} disabled={value>=max} style={{width:'18px',height:'18px',borderRadius:'50%',border:'1px solid #e5e7eb',background:'#fff',cursor:value>=max?'not-allowed':'pointer',fontSize:'12px',display:'flex',alignItems:'center',justifyContent:'center',opacity:value>=max?0.35:1}}>+</button>
        </div>
      </div>
    </div>
  );
}

function SelectPill({ icon, label, value, onChange, options, style={} }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',...style}}>
      {icon&&<span style={{flexShrink:0,color:'#9ca3af'}}>{icon}</span>}
      <div>
        <p style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9ca3af',marginBottom:'3px',lineHeight:1}}>{label}</p>
        <select value={value} onChange={e=>onChange(e.target.value)} style={{background:'transparent',border:'none',outline:'none',fontSize:'13px',fontWeight:600,color:'#1f2937',cursor:'pointer',fontFamily:'inherit'}}>
          {options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
        </select>
      </div>
    </div>
  );
}

const VDiv = () => <div style={{width:'1px',background:'#f3f4f6',alignSelf:'stretch',margin:'8px 0'}}/>;
const PillRow = ({children, style={}}) => (
  <div style={{display:'flex',alignItems:'stretch',border:'1.5px solid #e5e7eb',borderRadius:'999px',background:'#fff',overflow:'visible',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',position:'relative',...style}}>
    {children}
  </div>
);

// ─── MAIN RFQFORM ─────────────────────────────────────────────
export default function RFQForm({ onSubmit, loading, onExpandChange, onAddToPlan, onOpenDetail }) {
  const [expanded,    setExpanded]    = useState(false);
  const [showLoader,  setShowLoader]  = useState(false);
  const formRef = useRef();

  // ── Scroll lock when form is open ──
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  const doExpand = () => { setExpanded(true); onExpandChange?.(true); };
  const doCollapse = () => { setExpanded(false); onExpandChange?.(false); };

  const [travelType, setTravelType] = useState('business');
  const [activeTab,  setActiveTab]  = useState('Flights');

  // ── Trip type dropdown ──
  const [tripType,   setTripType]   = useState('Roundtrip');
  const [showTripDD, setShowTripDD] = useState(false);
  const tripDDRef = useRef();
  useEffect(() => {
    const h = e => { if (tripDDRef.current && !tripDDRef.current.contains(e.target)) setShowTripDD(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Budget ──
  const [budget, setBudget] = useState('');

  // ── Flights ──
  const [from,    setFrom]    = useState('');
  const [to,      setTo]      = useState('');
  const [depDate, setDepDate] = useState(null);
  const [retDate, setRetDate] = useState(null);
  const [depWindow, setDepWindow] = useState('Any time');
  const [adults,   setAdults]   = useState(1);
  const [children, setChildren] = useState(0);
  const [infants,  setInfants]  = useState(0);
  const [tClass,   setTClass]   = useState('Economy');
  const totalPax = adults + children + infants;

  // ── Trip Planner ──
  const [tripName, setTripName] = useState('');
  const [tripBudget, setTripBudget] = useState('');
  const [tripReviewer, setTripReviewer] = useState('');

  // ── Hotels ──
  const [hCity, setHCity] = useState(''), [hCI, setHCI] = useState(null), [hCO, setHCO] = useState(null);
  const [hRooms, setHRooms] = useState(1), [hGuests, setHGuests] = useState(2), [hStars, setHStars] = useState('Any');

  // ── Modals ──
  const [showCal,      setShowCal]      = useState(false);
  const [showPrivacy,  setShowPrivacy]  = useState(false);
  const [showPolicy,   setShowPolicy]   = useState(false);
  const [showAddTrav,  setShowAddTrav]  = useState(false);
  const [showDepWin,   setShowDepWin]   = useState(false);
  const [showPax,      setShowPax]      = useState(false);
  const [showHotelCal, setShowHotelCal] = useState(null);

  // ── Travelers ──
  const [travelerSearch, setTravelerSearch] = useState(false);
  const [travelerSearchVal, setTravelerSearchVal] = useState('');
  const [travelers, setTravelers] = useState([{ id: 'ts', name: 'Trushant Shah', initials: 'TS' }]);

  const isOneWay = tripType === 'One way';

  // Flights, Hotels, Trip Planner tabs
  const TABS = [
    { id: 'Flights',      icon: <IcoTakeoff size={16}/> },
    { id: 'Hotels',       icon: <IcoHotel size={16}/>   },
    { id: 'Trip Planner', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> },
  ];

  const handleLoaderDone = () => { setShowLoader(false); doCollapse(); };

  const handleSubmit = () => {
    if (!from || !to || !depDate) return;
    const rfqPayload = {
      destinations: [{ destination: to || hCity, dateOfArrival: depDate || hCI }],
      guestCountry: from || 'India',
      numberOfAdults: adults,
      numberOfChildren: children,
      numberOfInfants: infants,
      travelClass: tClass,
      tripType: retDate ? 'round' : 'oneway',
      serviceType: activeTab,
      travelType: travelType,
      budget,
    };
    onSubmit?.(rfqPayload);
    setShowLoader(true);
  };

  const handleAddOnly = () => {
    if (activeTab === 'Hotels' && hCity && hCI) {
      const now = Date.now();
      const nights = hCI && hCO ? Math.max(1, Math.round((new Date(hCO) - new Date(hCI)) / 86400000)) : 1;
      const planItems = [{
        id: `hotel_${now}`, type: 'hotel', dayIndex: 0, name: hCity,
        checkIn: hCI, checkOut: hCO, nights, rooms: hRooms,
        label: `🏨 ${hCity}`,
        sublabel: `Check-in: ${fmt(hCI)}${hCO ? ' · Check-out: ' + fmt(hCO) : ''} · ${hRooms} rooms`,
        status: 'pending', price: 5000,
      }];
      onAddToPlan?.(planItems);
      doCollapse();
    }
    if (activeTab === 'Trip Planner' && from && to && depDate) {
      const tripRfq = {
        _id: 'trip_' + Date.now(),
        destinations: [{ destination: to, dateOfArrival: depDate, numberOfNights: retDate ? Math.max(1, Math.round((new Date(retDate) - new Date(depDate)) / 86400000)) : 1 }],
        guestCountry: from,
        numberOfAdults: adults, numberOfChildren: children, numberOfInfants: infants,
        travelClass: tClass, tripType: retDate ? 'round' : 'oneway',
        serviceType: 'Trip Planner', travelType, budget,
        itinerary: `Trip from ${from} to ${to}\nDeparture: ${depDate}${retDate ? '\nReturn: ' + retDate : ''}\nTravelers: ${adults + children + infants}\nClass: ${tClass}`,
        destinationData: [], createdAt: new Date().toISOString(), status: 'draft',
        tripName, tripReviewer,
      };
      if (onOpenDetail && typeof onOpenDetail === 'function') { onOpenDetail(tripRfq); }
      doCollapse();
    }
  };

  const canSubmit = from && to && depDate;
  const canAddHotel = hCity && hCI;
  const canTripPlanner = from && to && depDate;

  // ── COLLAPSED STATE ──
  if (!expanded) {
    return (
      <div style={{width:'100%',animation:'rfqRise 0.6s cubic-bezier(0.22,1,0.36,1) both'}}>
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
          {travelType==='personal'&&(<span style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',color:'#6b7280'}}>🔒 <span style={{color:'#D97706',fontWeight:600,cursor:'pointer'}} onClick={()=>setShowPrivacy(true)}>Private · Learn more</span></span>)}
        </div>
        <div style={{maxWidth:'460px'}}>
          <div onClick={doExpand}
            style={{display:'flex',alignItems:'center',gap:'10px',border:'2px solid #e5e7eb',borderRadius:'999px',padding:'8px 8px 8px 18px',background:'#fff',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',cursor:'pointer',transition:'border-color 0.2s,box-shadow 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#fcd34d';e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb';e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)';}}>
            <span style={{fontSize:'18px',flexShrink:0}}>📍</span>
            <span style={{flex:1,fontSize:'14px',color:'#9ca3af',userSelect:'none'}}>Where do you want to go?</span>
            <button type="button" onClick={e=>{e.stopPropagation();doExpand();}}
              style={{width:'40px',height:'40px',borderRadius:'50%',border:'none',background:'#F7BE39',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 4px 14px rgba(247,190,57,0.45)',transition:'background 0.2s,transform 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#e6a800';e.currentTarget.style.transform='scale(1.08)';}}
              onMouseLeave={e=>{e.currentTarget.style.background='#F7BE39';e.currentTarget.style.transform='scale(1)';}}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </button>
          </div>
        </div>
        {showPrivacy&&<PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
      </div>
    );
  }

  // ── EXPANDED STATE — Fixed centered modal ──
  return (
    <>
      <style>{`@keyframes rfqRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes rfqExpand{from{opacity:0;transform:translateY(-8px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}.rfq-pill-hover:hover{background:#fffbeb!important;}select option{font-family:inherit;}input::placeholder{color:#9ca3af;}`}</style>

      {/* Loader */}
      {showLoader && (
        <SearchLoadingModal from={from} to={to} onDone={handleLoaderDone} isLoading={loading}/>
      )}

      {/* Fixed overlay — click outside closes */}
      <div
        onClick={doCollapse}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.40)',
          backdropFilter: 'blur(3px)',
          padding: '20px',
          overflowY: 'auto',
        }}
      >
        {/* Form card — click stops propagation */}
        <div
          ref={formRef}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '900px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.22)',
            animation: 'rfqExpand 0.3s cubic-bezier(0.22,1,0.36,1) both',
          }}
        >
          <div style={{padding:'28px 32px'}}>

            {/* Header */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'22px'}}>
              <h2 style={{fontSize:'24px',fontWeight:900,letterSpacing:'-0.02em',color:'#111827',fontFamily:'Georgia,serif',margin:0}}>Book a trip</h2>
              <button onClick={doCollapse} style={{width:'34px',height:'34px',borderRadius:'50%',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer',fontSize:'14px',color:'#9ca3af',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            {/* Business / Personal toggle */}
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'22px',flexWrap:'wrap'}}>
              <div style={{display:'flex',alignItems:'center',background:'#f3f4f6',borderRadius:'999px',padding:'4px',gap:'2px'}}>
                {['business','personal'].map(t=>(
                  <button key={t} onClick={()=>{setTravelType(t);if(t==='personal')setShowPrivacy(true);}}
                    style={{padding:'7px 18px',borderRadius:'999px',fontSize:'13px',fontWeight:600,cursor:'pointer',border:'none',background:travelType===t?'#1f2937':'transparent',color:travelType===t?'#fff':'#6b7280',transition:'all 0.2s'}}>
                    {t==='business'?'Business travel':'Personal travel'}
                  </button>
                ))}
              </div>
              {travelType==='personal'&&(
                <button onClick={()=>setShowPrivacy(true)} style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'12px',color:'#6b7280',background:'none',border:'none',cursor:'pointer'}}>
                  🔒 Personal bookings are private <span style={{color:'#D97706',fontWeight:600}}>Learn more</span>
                </button>
              )}
            </div>

            {/* Tabs — Flights + Hotels only */}
            <div style={{display:'flex',borderBottom:'1px solid #f3f4f6',marginBottom:'20px',gap:0}}>
              {TABS.map(({id,icon})=>(
                <button key={id} onClick={()=>setActiveTab(id)}
                  style={{display:'flex',alignItems:'center',gap:'7px',padding:'11px 20px',fontSize:'13px',whiteSpace:'nowrap',border:'none',borderBottom:`2px solid ${activeTab===id?'#F7BE39':'transparent'}`,background:'transparent',cursor:'pointer',color:activeTab===id?'#111827':'#9ca3af',fontWeight:activeTab===id?600:400,marginBottom:'-1px',transition:'color 0.15s'}}>
                  <span style={{color:activeTab===id?'#D97706':'#9ca3af',transition:'color 0.15s'}}>{icon}</span>{id}
                </button>
              ))}
            </div>

            {/* ── FILTER BAR: Roundtrip DD + Budget only ── */}
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'18px',flexWrap:'wrap'}}>

              {/* Roundtrip dropdown */}
              <div ref={tripDDRef} style={{position:'relative'}}>
                <button onClick={()=>setShowTripDD(!showTripDD)}
                  style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',fontWeight:600,border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'7px 16px',cursor:'pointer',background:'#fff',color:'#374151',transition:'border-color 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='#F7BE39'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
                  {tripType} <span style={{color:'#9ca3af',fontSize:'10px'}}>▾</span>
                </button>
                {showTripDD && (
                  <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'#fff',borderRadius:'12px',boxShadow:'0 12px 32px rgba(0,0,0,0.12)',border:'1px solid #f3f4f6',padding:'6px 0',zIndex:100,minWidth:'140px'}}>
                    {TRIP_TYPES.map(t=>(
                      <button key={t} onClick={()=>{setTripType(t);setShowTripDD(false);if(t==='One way')setRetDate(null);}}
                        style={{width:'100%',textAlign:'left',padding:'10px 16px',fontSize:'13px',background:'transparent',border:'none',cursor:'pointer',color:tripType===t?'#D97706':'#374151',fontWeight:tripType===t?700:400,display:'flex',justifyContent:'space-between',alignItems:'center'}}
                        onMouseEnter={e=>e.currentTarget.style.background='#fffbeb'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        {t} {tripType===t&&<span style={{color:'#F7BE39'}}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget input */}
              <div style={{display:'flex',alignItems:'center',gap:'8px',border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'7px 16px',background:'#fff',transition:'border-color 0.15s'}}
                onFocusCapture={e=>e.currentTarget.style.borderColor='#F7BE39'}
                onBlurCapture={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
                <IcoBudget size={14}/>
                <span style={{fontSize:'12px',color:'#9ca3af',fontWeight:600}}>₹</span>
                <input
                  type="number"
                  value={budget}
                  onChange={e=>setBudget(e.target.value)}
                  placeholder="Budget"
                  style={{
                    background:'transparent',border:'none',outline:'none',
                    fontSize:'13px',fontWeight:600,color:'#374151',
                    width:'90px',fontFamily:'inherit',
                  }}
                />
              </div>

              {/* Reviewer dropdown — only shown in Trip Planner tab */}
              {activeTab==='Trip Planner'&&(
                <div style={{display:'flex',alignItems:'center',gap:'8px',border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'7px 16px',background:'#fff',transition:'border-color 0.15s'}}
                  onFocusCapture={e=>e.currentTarget.style.borderColor='#F7BE39'}
                  onBlurCapture={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
                  <span style={{fontSize:'13px',color:'#9ca3af'}}>👤</span>
                  <select
                    value={tripReviewer}
                    onChange={e=>setTripReviewer(e.target.value)}
                    style={{background:'transparent',border:'none',outline:'none',fontSize:'13px',fontWeight:600,color:tripReviewer?'#374151':'#9ca3af',cursor:'pointer',fontFamily:'inherit',minWidth:'100px'}}
                  >
                    <option value="">Reviewer</option>
                    <option value="Trushant Shah">Trushant Shah</option>
                    <option value="Tushar">Tushar</option>
                    <option value="Rahul">Rahul</option>
                    <option value="Priya">Priya</option>
                    <option value="Amit">Amit</option>
                    <option value="Neha">Neha</option>
                  </select>
                </div>
              )}

              {/* Passengers & Class pill (kept for functionality) */}
              <button onClick={()=>setShowPax(true)}
                style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'7px 14px',cursor:'pointer',background:'#fff',color:'#374151',marginLeft:'auto',transition:'border-color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#F7BE39'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#e5e7eb'}>
                <IcoUser size={13}/>
                <span style={{fontWeight:700}}>{totalPax} Traveler{totalPax>1?'s':''}</span>
                <span style={{fontSize:'11px',color:'#9ca3af'}}>{tClass}</span>
                <span style={{color:'#9ca3af',fontSize:'10px'}}>▾</span>
              </button>
            </div>

            {/* ── TAB CONTENT ── */}
            <div key={activeTab} style={{animation:'rfqExpand 0.2s ease both'}}>

              {/* FLIGHTS */}
              {activeTab==='Flights'&&(
                <div style={{display:'flex',alignItems:'stretch',gap:'10px',marginBottom:'18px',flexWrap:'wrap'}}>
                  <PillRow style={{flex:1,minWidth:'280px'}}>
                    <CityPill icon={<IcoTakeoff size={16}/>} label="From *" value={from} onChange={setFrom} placeholder="Origin" style={{flex:1}}/>
                    <VDiv/>
                    <div style={{display:'flex',alignItems:'center',padding:'0 6px',flexShrink:0}}>
                      <button onClick={()=>{const t=from;setFrom(to);setTo(t);}} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af'}}>
                        <IcoSwap size={11}/>
                      </button>
                    </div>
                    <VDiv/>
                    <CityPill icon={<IcoLand size={16}/>} label="To *" value={to} onChange={setTo} placeholder="Destination" style={{flex:1}}/>
                  </PillRow>
                  <PillRow style={{flexShrink:0}}>
                    <DatePill label="Depart date *" value={fmt(depDate)} onClick={()=>setShowCal(true)} style={{borderRadius:'999px 0 0 999px'}}/>
                    {!isOneWay&&<><VDiv/><DatePill label="Return date" value={fmt(retDate)} onClick={()=>setShowCal(true)} style={{borderRadius:'0 999px 999px 0'}}/></>}
                  </PillRow>
                </div>
              )}

              {/* HOTELS */}
              {activeTab==='Hotels'&&(
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'18px'}}>
                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                    <PillRow style={{flex:1,minWidth:'220px'}}>
                      <CityPill icon={<IcoHotel size={16}/>} label="City / Destination *" value={hCity} onChange={setHCity} placeholder="Where are you going?" style={{width:'100%'}}/>
                    </PillRow>
                    <PillRow style={{flexShrink:0}}>
                      <DatePill label="Check-in *" value={fmt(hCI)} onClick={()=>setShowHotelCal('h_ci')}/>
                      <VDiv/>
                      <DatePill label="Check-out" value={fmt(hCO)} onClick={()=>setShowHotelCal('h_co')}/>
                    </PillRow>
                  </div>
                  <PillRow>
                    <CounterPill icon={<IcoHotel size={14}/>} label="Rooms" value={hRooms} onDec={()=>setHRooms(p=>Math.max(1,p-1))} onInc={()=>setHRooms(p=>p+1)} min={1} max={10}/>
                    <VDiv/>
                    <CounterPill icon={<IcoUser size={14}/>} label="Guests" value={hGuests} onDec={()=>setHGuests(p=>Math.max(1,p-1))} onInc={()=>setHGuests(p=>p+1)} min={1} max={20}/>
                    <VDiv/>
                    <SelectPill icon={<IcoStar size={13}/>} label="Min Stars" value={hStars} onChange={setHStars} options={['Any','2★+','3★+','4★+','5★']}/>
                  </PillRow>
                </div>
              )}

              {/* TRIP PLANNER */}
              {activeTab==='Trip Planner'&&(
                <div style={{display:'flex',alignItems:'stretch',gap:'10px',marginBottom:'18px',flexWrap:'wrap'}}>
                  <PillRow style={{flex:1,minWidth:'280px'}}>
                    <CityPill icon={<IcoTakeoff size={16}/>} label="From *" value={from} onChange={setFrom} placeholder="Origin" style={{flex:1}}/>
                    <VDiv/>
                    <div style={{display:'flex',alignItems:'center',padding:'0 6px',flexShrink:0}}>
                      <button onClick={()=>{const t=from;setFrom(to);setTo(t);}} style={{width:'26px',height:'26px',borderRadius:'50%',border:'1.5px solid #e5e7eb',background:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'#9ca3af'}}>
                        <IcoSwap size={11}/>
                      </button>
                    </div>
                    <VDiv/>
                    <CityPill icon={<IcoLand size={16}/>} label="To *" value={to} onChange={setTo} placeholder="Destination" style={{flex:1}}/>
                  </PillRow>
                  <PillRow style={{flexShrink:0}}>
                    <DatePill label="Depart date *" value={fmt(depDate)} onClick={()=>setShowCal(true)}/>
                    {!isOneWay&&<><VDiv/><DatePill label="Return date" value={fmt(retDate)} onClick={()=>setShowCal(true)}/></>}
                  </PillRow>
                </div>
              )}
            </div>

            {/* Travelers row */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px',flexWrap:'wrap'}}>
              {travelers.map(t=>(
                <div key={t.id} style={{display:'flex',alignItems:'center',gap:'8px',border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'5px 10px 5px 5px',background:'#fff',fontSize:'13px'}}>
                  <div style={{width:'24px',height:'24px',borderRadius:'50%',background:'#F7BE39',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'8px',fontWeight:700,color:'#fff',flexShrink:0}}>{t.initials}</div>
                  <span style={{fontWeight:500,color:'#1f2937'}}>{t.name}</span>
                  <button onClick={()=>setTravelers(p=>p.filter(x=>x.id!==t.id))} style={{color:'#9ca3af',fontSize:'10px',background:'none',border:'none',cursor:'pointer',padding:'0 2px'}}>✕</button>
                </div>
              ))}
              <button onClick={()=>setShowAddTrav(true)} style={{display:'flex',alignItems:'center',gap:'6px',border:'1.5px dashed #d1d5db',borderRadius:'999px',padding:'5px 12px',fontSize:'13px',color:'#6b7280',cursor:'pointer',background:'#fff'}}>⊕ Add travelers</button>
            </div>

            {/* Bottom extras */}
            <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}>
              <button style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',fontWeight:600,color:'#D97706',background:'#FFF8E6',border:'1px solid #FDE68A',borderRadius:'999px',padding:'6px 12px',cursor:'pointer'}}>
                <IcoStar size={11}/> Add a loyalty program
              </button>
              <button onClick={()=>setShowPolicy(true)} style={{fontSize:'12px',fontWeight:600,color:'#D97706',background:'none',border:'none',cursor:'pointer',padding:'4px 6px'}}>Your flight policy</button>
              <button onClick={()=>setShowDepWin(true)}
                style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'12px',color:'#374151',border:'1.5px solid #e5e7eb',borderRadius:'999px',padding:'6px 12px',cursor:'pointer',background:'#fff',marginLeft:'auto'}}>
                <IcoClock size={11}/>Dep. window: <strong style={{marginLeft:'2px'}}>{depWindow}</strong><span style={{color:'#9ca3af',fontSize:'9px'}}>▾</span>
              </button>
            </div>

            {/* CTAs */}
            <div style={{display:'flex',gap:'12px',paddingTop:'14px',borderTop:'1px solid #f3f4f6'}}>
              {activeTab==='Flights'&&(
                <button onClick={handleSubmit} disabled={!canSubmit||loading}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'14px',borderRadius:'12px',border:'none',background:canSubmit?'#F7BE39':'#f3f4f6',color:canSubmit?'#fff':'#9ca3af',fontSize:'15px',fontWeight:700,cursor:canSubmit?'pointer':'not-allowed',boxShadow:canSubmit?'0 6px 20px rgba(247,190,57,0.35)':'none',transition:'all 0.2s'}}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                  {loading?'Searching...':'Search & Add to Plan'}
                </button>
              )}
              {activeTab==='Hotels'&&(
                <button onClick={handleAddOnly} disabled={!canAddHotel}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'14px',borderRadius:'12px',border:'none',background:canAddHotel?'#F7BE39':'#f3f4f6',color:canAddHotel?'#fff':'#9ca3af',fontSize:'15px',fontWeight:700,cursor:canAddHotel?'pointer':'not-allowed',boxShadow:canAddHotel?'0 6px 20px rgba(247,190,57,0.35)':'none',transition:'all 0.2s'}}>
                  ＋ Add Hotel to Plan
                </button>
              )}
              {activeTab==='Trip Planner'&&(
                <button onClick={handleAddOnly} disabled={!canTripPlanner}
                  style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'14px',borderRadius:'12px',border:'none',background:canTripPlanner?'#F7BE39':'#f3f4f6',color:canTripPlanner?'#fff':'#9ca3af',fontSize:'15px',fontWeight:700,cursor:canTripPlanner?'pointer':'not-allowed',boxShadow:canTripPlanner?'0 6px 20px rgba(247,190,57,0.35)':'none',transition:'all 0.2s'}}>
                  🗺️ Create Trip Plan
                </button>
              )}
              <button disabled style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'14px',borderRadius:'12px',border:'2px dashed #e5e7eb',background:'#f9fafb',color:'#9ca3af',fontSize:'15px',fontWeight:700,cursor:'not-allowed'}}>
                Preplanned <span style={{fontSize:'11px',background:'#e5e7eb',color:'#9ca3af',borderRadius:'999px',padding:'2px 8px',fontWeight:600}}>Soon</span>
              </button>
            </div>

            {/* Modals */}
            {showCal       && <CalendarModal onClose={()=>setShowCal(false)} onApply={(s,e)=>{setDepDate(s);setRetDate(e);}} depDate={depDate} retDate={retDate} isOneWay={isOneWay}/>}
            {showHotelCal==='h_ci' && <CalendarModal onClose={()=>setShowHotelCal(null)} isOneWay onApply={s=>setHCI(s)} depDate={hCI}/>}
            {showHotelCal==='h_co' && <CalendarModal onClose={()=>setShowHotelCal(null)} isOneWay onApply={s=>setHCO(s)} depDate={hCO}/>}
            {showPrivacy   && <PrivacyModal onClose={()=>setShowPrivacy(false)}/>}
            {showPolicy    && <PolicyModal  onClose={()=>setShowPolicy(false)}/>}
            {showAddTrav   && <AddTravelerModal onClose={()=>setShowAddTrav(false)} onAdd={t=>setTravelers(p=>[...p,t])}/>}
            {showPax       && <PassengersModal adults={adults} children={children} infants={infants} travelClass={tClass} onUpdate={(a,c,i,tc)=>{setAdults(a);setChildren(c);setInfants(i);setTClass(tc);}} onClose={()=>setShowPax(false)}/>}
            {showDepWin    && <DepWindowModal from={from} to={to} depDate={depDate} retDate={retDate} tripType={tripType} onClose={()=>setShowDepWin(false)} onApply={setDepWindow}/>}
          </div>
        </div>
      </div>
    </>
  );
}