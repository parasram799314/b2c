// components/FlightsTab.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';

const CITIES = [
  'Indore, India','Mumbai, India','Delhi, India','Bangalore, India',
  'Hyderabad, India','Chennai, India','Kolkata, India','Pune, India',
  'Ahmedabad, India','Jaipur, India','Surat, India','Lucknow, India',
  'London, UK','Dubai, UAE','Singapore','New York, USA','Paris, France','Tokyo, Japan',
];

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
        <div style={{position:'fixed',top:dropPos.top,left:dropPos.left,width:dropPos.width,zIndex:9999999,background:'#fff',border:'1px solid #f3f4f6',borderRadius:'14px',boxShadow:'0 12px 32px rgba(0,0,0,0.16)',padding:'6px 0',maxHeight:'260px',overflowY:'auto'}}>
          {filtered.map(c=>(
            <div key={c} onClick={e=>{e.stopPropagation();onChange(c);setOpen(false);}}
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

const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const KIWI = 'https://images.kiwi.com/airlines/64/';
const getLogoUrl = (name = '') => {
  const u = (name||'').trim().toUpperCase();
  const n = (name||'').trim().toLowerCase();
  const MAP = { AI:'AI', IX:'IX', '6E':'6E', SG:'SG', QP:'QP', UK:'UK', G8:'G8', EK:'EK', QR:'QR', EY:'EY', LH:'LH', BA:'BA', SQ:'SQ', TK:'TK' };
  if (MAP[u]) return `${WEGO}${MAP[u]}.png`;
  if (u === 'HR') return `${KIWI}HR.png`;
  if (u === '9I') return `${KIWI}9I.png`;
  if (n.includes('air india express')) return `${WEGO}IX.png`;
  if (n.includes('air india'))         return `${WEGO}AI.png`;
  if (n.includes('indigo'))            return `${WEGO}6E.png`;
  if (n.includes('spicejet'))          return `${WEGO}SG.png`;
  if (n.includes('akasa'))             return `${WEGO}QP.png`;
  if (n.includes('vistara'))           return `${WEGO}UK.png`;
  if (n.includes('emirates'))          return `${WEGO}EK.png`;
  if (n.includes('qatar'))             return `${WEGO}QR.png`;
  if (/^[A-Z0-9]{2,3}$/.test(u))      return `${WEGO}${u}.png`;
  return null;
};

const fmt = (n) => `${Number(n).toLocaleString('en-IN')}`;
const fmtCurrency = (price, currency = 'USD') => {
  const num = Number(price);
  // Always show in INR (convert from USD if needed)
  const inrAmount = currency === 'USD' ? Math.round(num * 83) : Math.round(num);
  return `₹${inrAmount.toLocaleString('en-IN')}`;
};
const parseDur = (s='') => { let m=0; const h=s.match(/(\d+)h/),mi=s.match(/(\d+)m/); if(h)m+=parseInt(h[1])*60; if(mi)m+=parseInt(mi[1]); return m; };
const fmtDate = (d) => { if(!d)return ''; const [y,mo,day]=d.split('-'); return new Date(+y,+mo-1,+day).toLocaleDateString('en-US',{month:'short',day:'numeric'}); };
const mkDefaults = (maxP=300000) => ({ stops:[], stopOneOrFewer:false, airlines:[], maxPrice:maxP, recommended:{direct:false,hideBudget:false,baggage:false}, departureTime:[0,24], arrivalTime:[0,24], sortBy:'priceLow' });

// ── FlightCard ────────────────────────────────────────────────────────────────
function FlightCard({ flight, inPlan, onAdd }) {
  const [imgErr, setImgErr] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [modal,  setModal]  = useState(false);
  const logoSrc = flight.logo || getLogoUrl(flight.airline||'');
  const depTime = flight.departureTime ?? flight.depTime ?? '';
  const arrTime = flight.arrivalTime  ?? flight.arrTime  ?? '';
  const price   = Number(flight.price);
  const stops   = Number(flight.stops??0);
  const nonStop = stops === 0;

  return (
    <>
      <div 
       draggable="true"
  onDragStart={(e) => {
    const dragData = {
      ...flight,
      type: 'flight',
      id: 'flight_' + (flight.id || flight.flightNumber || Date.now()),
      depTime: flight.departureTime ?? flight.depTime,
      arrTime: flight.arrivalTime ?? flight.arrTime,
    };
    e.dataTransfer.setData("itemData", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "copy";
  }}
      style={{ background:'#fff', border:`1px solid ${inPlan?'#F7BE39':'#e5e7eb'}`, borderRadius:'12px', overflow:'hidden', marginBottom:'10px', boxShadow: inPlan?'0 0 0 2px rgba(247,190,57,0.2)':'0 1px 3px rgba(0,0,0,0.06)' }}>

        {/* Logo + route */}
        <div style={{ padding:'12px 14px 6px', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', width:'110px', flexShrink:0 }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'9px', background:'#fff5f0', border:'1px solid #ffe4d6', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
              {logoSrc && !imgErr
                ? <img src={logoSrc} alt={flight.airline} style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={()=>setImgErr(true)} />
                : <span style={{fontSize:'18px'}}>✈</span>}
            </div>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#111827',lineHeight:1.2}}>{flight.airline}</div>
              <div style={{fontSize:'10px',color:'#9ca3af',marginTop:'1px'}}>{flight.flightNumber}</div>
            </div>
          </div>

          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'6px' }}>
            <div>
              <div style={{fontSize:'18px',fontWeight:800,color:'#111827',lineHeight:1}}>{depTime}</div>
              <div style={{fontSize:'10px',color:'#374151',fontWeight:600,marginTop:'2px'}}>
                {flight.from||flight.fromAirport}
                {flight.terminalFrom && <span style={{color:'#ef4444',marginLeft:'2px'}}>T{flight.terminalFrom}</span>}
              </div>
            </div>
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center'}}>
              <span style={{fontSize:'10px',color:'#6b7280',marginBottom:'3px'}}>{flight.duration}</span>
              <div style={{width:'100%',display:'flex',alignItems:'center'}}>
                <div style={{flex:1,borderBottom:'1.5px dashed #d1d5db'}} />
                <span style={{margin:'0 4px',fontSize:'11px',color:'#9ca3af'}}>✈</span>
                <div style={{flex:1,borderBottom:'1.5px dashed #d1d5db'}} />
              </div>
              <span style={{fontSize:'10px',fontWeight:700,marginTop:'3px',color:nonStop?'#16a34a':'#f59e0b'}}>
                {nonStop ? 'Non-stop' : `${stops} Stop${stops>1?'s':''}`}
              </span>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'18px',fontWeight:800,color:'#111827',lineHeight:1}}>
                {arrTime}
                {(flight.nextDayArrival||flight.nextDay) && <sup style={{fontSize:'9px',color:'#F7BE39'}}>+1</sup>}
              </div>
              <div style={{fontSize:'10px',color:'#374151',fontWeight:600,marginTop:'2px'}}>
                {flight.to||flight.toAirport}
                {flight.terminalTo && <span style={{color:'#ef4444',marginLeft:'2px'}}>T{flight.terminalTo}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Price + Add to Plan */}
        <div style={{padding:'4px 14px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'20px',fontWeight:800,color:'#111827'}}>{fmtCurrency(price, flight.currency)}</div>
          {inPlan
            ? <span style={{padding:'7px 14px',borderRadius:'8px',background:'#dcfce7',color:'#16a34a',fontSize:'12px',fontWeight:700}}>✓ In Plan</span>
            : <button onClick={()=>onAdd(flight)}
                style={{background:'#F7BE39',color:'#1a1a1a',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'13px',fontWeight:700,cursor:'pointer',boxShadow:'0 2px 6px rgba(247,190,57,0.4)'}}
                onMouseEnter={e=>e.currentTarget.style.background='#e6ad2a'}
                onMouseLeave={e=>e.currentTarget.style.background='#F7BE39'}>
                Add to Plan
              </button>
          }
        </div>

        {/* Baggage + actions */}
        <div style={{borderTop:'1px solid #f3f4f6',padding:'6px 14px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'11px',color:'#6b7280'}}>{flight.baggage?.iB||'15 Kg'} · {flight.baggage?.cB||'7 Kg'}</span>
          <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
            <button onClick={()=>setSaved(v=>!v)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'14px',padding:0,color:saved?'#e91e63':'#d1d5db'}}>{saved?'♥':'♡'}</button>
            <button onClick={()=>setModal(true)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:700,color:'#1d4ed8',padding:0}}>Details</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div onClick={()=>setModal(false)} style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'#fff',borderRadius:'18px',width:'100%',maxWidth:'400px',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.2)'}}>
            <div style={{background:'#F7BE39',padding:'14px 18px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,fontSize:'14px',color:'#1a1a1a'}}>Flight Details</span>
              <button onClick={()=>setModal(false)} style={{width:'26px',height:'26px',borderRadius:'50%',background:'rgba(0,0,0,0.12)',border:'none',cursor:'pointer',fontSize:'13px'}}>✕</button>
            </div>
            <div style={{padding:'18px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'14px'}}>
                <div style={{width:'42px',height:'42px',borderRadius:'10px',background:'#fff5f0',border:'1px solid #ffe4d6',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <img src={flight.logo||getLogoUrl(flight.airline||'')} alt={flight.airline} style={{width:'100%',height:'100%',objectFit:'contain'}} onError={e=>e.target.style.display='none'} />
                </div>
                <div><div style={{fontWeight:700,fontSize:'14px',color:'#111827'}}>{flight.airline}</div><div style={{fontSize:'11px',color:'#9ca3af'}}>{flight.flightNumber}</div></div>
              </div>
              <div style={{background:'#f9fafb',borderRadius:'10px',padding:'14px',display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                <div><div style={{fontSize:'9px',color:'#9ca3af'}}>Departure</div><div style={{fontSize:'20px',fontWeight:800,color:'#111'}}>{depTime}</div><div style={{fontSize:'12px',fontWeight:600,color:'#374151'}}>{flight.from||flight.fromAirport}</div></div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'#6b7280'}}>{flight.duration}</div>
                  <div style={{display:'flex',alignItems:'center',margin:'4px 0'}}><div style={{width:'28px',height:'1.5px',background:'#d1d5db'}}/><span style={{margin:'0 3px',fontSize:'11px'}}>✈</span><div style={{width:'28px',height:'1.5px',background:'#d1d5db'}}/></div>
                  <div style={{fontSize:'10px',fontWeight:700,color:'#16a34a'}}>{nonStop?'Non-stop':`${stops} Stop(s)`}</div>
                </div>
                <div style={{textAlign:'right'}}><div style={{fontSize:'9px',color:'#9ca3af'}}>Arrival</div><div style={{fontSize:'20px',fontWeight:800,color:'#111'}}>{arrTime}</div><div style={{fontSize:'12px',fontWeight:600,color:'#374151'}}>{flight.to||flight.toAirport}</div></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                {[{l:'🧳 Check-in',v:flight.baggage?.iB||'15 Kg'},{l:'💼 Cabin',v:flight.baggage?.cB||'7 Kg'}].map(b=>(
                  <div key={b.l} style={{flex:1,background:'#f9fafb',borderRadius:'8px',padding:'8px 10px'}}>
                    <div style={{fontSize:'10px',fontWeight:700,color:'#374151',marginBottom:'2px'}}>{b.l}</div>
                    <div style={{fontSize:'11px',color:'#6b7280'}}>{b.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FlightsTab({ rfq, planItems, onAddToPlan, selectedDest }) {
  const [rawFlights,    setRawFlights]    = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [filters,       setFilters]       = useState(mkDefaults());
  const [minPrice,      setMinPrice]      = useState(0);
  const [maxPriceLimit, setMaxPriceLimit] = useState(300000);
  const [visibleCount,  setVisibleCount]  = useState(15);
  const [dates,         setDates]         = useState([]);
  const [selectedDate,  setSelectedDate]  = useState('');
  const [dateOffset,    setDateOffset]    = useState(0);
  const [showFilters,   setShowFilters]   = useState(false);
  const observerRef = useRef(null);

  const firstDest = rfq?.destinations?.[0];
  const [fromCity, setFromCity] = useState(rfq?.sourceCity || rfq?.source || 'Indore');
  const [tripType, setTripType] = useState('oneWay');
  const adults = rfq?.numberOfPax || 1;

  // Find the selected destination from rfq.destinations
  const selectedDestData = selectedDest 
    ? rfq?.destinations?.find(d => d.destination === selectedDest) 
    : firstDest;

  const [toCity, setToCity] = useState(selectedDestData?.destination || '');
  
  // Update toCity when selectedDest changes
  useEffect(() => {
    if (selectedDestData?.destination) {
      setToCity(selectedDestData.destination);
    }
  }, [selectedDestData]);

  const baseDate = selectedDestData?.dateOfArrival
    ? new Date(selectedDestData.dateOfArrival).toISOString().slice(0,10)
    : new Date().toISOString().slice(0,10);

  // Date strip
  useEffect(()=>{
    const base = new Date(baseDate+'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const strip = [];
    for(let i=-2+dateOffset;i<=2+dateOffset;i++){ const d=new Date(base); d.setDate(d.getDate()+i); if(d>=today)strip.push(d.toISOString().slice(0,10)); }
    setDates(strip);
    if(!selectedDate||!strip.includes(selectedDate)) setSelectedDate(strip[Math.min(2,strip.length-1)]||'');
  },[baseDate,dateOffset]);

  // Fetch
  const doSearch = async(from,to,date)=>{
    if(!to||!date)return;
    setLoading(true); setError(''); setRawFlights([]);
    try{
      const res = await axios.post('/api/search',{ searchQuery:{ routeInfos:[{fromCityOrAirport:{code:from},toCityOrAirport:{code:to},travelDate:date}], paxInfo:{ADULT:String(adults)} }});
      const list = Array.isArray(res.data)?res.data:(res.data?.onward||[]);
      setRawFlights(list);
      if(list.length){ const prices=list.map(f=>Number(f.price)).filter(p=>p>0); if(prices.length){ const mn=Math.min(...prices),mx=Math.max(...prices); setMinPrice(mn); setMaxPriceLimit(mx); setFilters(p=>({...p,maxPrice:mx})); } }
    }catch{ 
      // Silently use empty array - backend fallback will provide data
      setRawFlights([]); 
    }
    setLoading(false);
  };

  useEffect(()=>{ if(selectedDate)doSearch(fromCity,toCity,selectedDate); },[selectedDate]);

  // Infinite scroll
  useEffect(()=>{
    const obs=new IntersectionObserver(e=>{if(e[0].isIntersecting)setVisibleCount(p=>p+15);},{threshold:0.1});
    if(observerRef.current)obs.observe(observerRef.current);
    return()=>{if(observerRef.current)obs.unobserve(observerRef.current);};
  },[]);

  const setF      = fn=>setFilters(p=>fn(p));
  const toggleStop= n=>setF(p=>({...p,stops:p.stops.includes(n)?p.stops.filter(s=>s!==n):[...p.stops,n]}));
  const toggleAir = a=>setF(p=>({...p,airlines:p.airlines.includes(a)?p.airlines.filter(x=>x!==a):[...p.airlines,a]}));
  const toggleRec = f=>setF(p=>({...p,recommended:{...p.recommended,[f]:!p.recommended[f]}}));
  const toggleOF  = ()=>setFilters(p=>({...p,stopOneOrFewer:!p.stopOneOrFewer,stops:!p.stopOneOrFewer?[]:p.stops}));

  const filtered = useMemo(()=>{
    return rawFlights.filter(f=>{
      const s=Number(f.stops??0);
      if(filters.stopOneOrFewer&&s>1)return false;
      if(!filters.stopOneOrFewer&&filters.stops.length>0&&!filters.stops.includes(s))return false;
      if(filters.airlines.length>0&&!filters.airlines.some(a=>(f.airline||'').toLowerCase().includes(a.toLowerCase())))return false;
      if(Number(f.price)>filters.maxPrice)return false;
      if(filters.recommended.direct&&s!==0)return false;
      if(filters.recommended.hideBudget){const b=['indigo','spicejet','akasa','go first','airasia'];if(b.some(x=>(f.airline||'').toLowerCase().includes(x)))return false;}
      const getH=t=>parseInt((t||'').split(':')[0])||0;
      const dep=getH(f.departureTime??f.depTime),arr=getH(f.arrivalTime??f.arrTime);
      if(dep<filters.departureTime[0]||dep>=filters.departureTime[1])return false;
      if(arr<filters.arrivalTime[0]||arr>=filters.arrivalTime[1])return false;
      return true;
    }).sort((a,b)=>{
      if(filters.sortBy==='priceLow')     return Number(a.price)-Number(b.price);
      if(filters.sortBy==='priceHigh')    return Number(b.price)-Number(a.price);
      if(filters.sortBy==='durationShort')return parseDur(a.duration)-parseDur(b.duration);
      if(filters.sortBy==='departEarly')  return (a.departureTime||a.depTime||'').localeCompare(b.departureTime||b.depTime||'');
      return 0;
    });
  },[rawFlights,filters]);

  const airlineStats = useMemo(()=>{
    const s={};
    rawFlights.forEach(f=>{if(!s[f.airline])s[f.airline]={count:0,minPrice:Infinity,logo:f.logo,name:f.airline,currency:f.currency||'USD'};s[f.airline].count++;s[f.airline].minPrice=Math.min(s[f.airline].minPrice,Number(f.price));});
    return Object.values(s);
  },[rawFlights]);

  const stopStats = useMemo(()=>{
    const s={0:{count:0,minPrice:Infinity,currency:'USD'},1:{count:0,minPrice:Infinity,currency:'USD'},2:{count:0,minPrice:Infinity,currency:'USD'}};
    rawFlights.forEach(f=>{const k=Math.min(Number(f.stops??0),2);s[k].count++;s[k].minPrice=Math.min(s[k].minPrice,Number(f.price));s[k].currency=f.currency||'USD';});
    return s;
  },[rawFlights]);

  const planIds = planItems.map(p=>p.id);
  // components/FlightsTab.jsx mein handleAdd function ko update karein

const handleAdd = (flight) => {
  const id = 'flight_' + (flight.id || flight.flightNumber || Date.now());
  
  // --- YE LOGIC ADD KAREIN: USD ko INR mein convert karke save karo ---
  const rawPrice = Number(flight.price);
  const inrPrice = flight.currency === 'USD' ? Math.round(rawPrice * 83) : rawPrice;

  onAddToPlan({
    ...flight,
    type: 'flight',
    id,
    price: inrPrice, // Ab yahan 19000+ wala number save hoga
    depTime: flight.departureTime ?? flight.depTime,
    arrTime: flight.arrivalTime ?? flight.arrTime,
    depDate: selectedDate
  });
};
  const inputBox = { display:'flex',alignItems:'center',gap:'8px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'8px 10px' };
  const lbl = { fontSize:'10px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'4px' };

  return (
    <div
    
     style={{display:'flex',flexDirection:'column',height:'100%',overflowY:'auto',background:'#f3f4f6'}}>

      {/* Destination indicator */}
      {selectedDest && (
        <div style={{flexShrink:0,background:'#fef3c7',borderBottom:'1px solid #fde68a',padding:'6px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'11px',fontWeight:700,color:'#92400e'}}>Showing flights to:</span>
            <span style={{fontSize:'12px',fontWeight:800,color:'#1a1a1a',background:'#fff',padding:'3px 8px',borderRadius:'6px',border:'1px solid #fbbf24'}}>{selectedDest}</span>
          </div>
          <span style={{fontSize:'10px',color:'#92400e',fontWeight:600}}>Filtered</span>
        </div>
      )}

      {/* 1. SEARCH FORM */}
      <div style={{flexShrink:0,background:'linear-gradient(135deg,#F7BE39,#c99a20)',padding:'10px'}}>
        <div style={{background:'#fff',borderRadius:'12px',padding:'14px',boxShadow:'0 4px 16px rgba(0,0,0,0.1)'}}>

          {/* Trip type */}
          <div style={{display:'flex',gap:'6px',marginBottom:'12px'}}>
            {[{v:'oneWay',l:'One Way'},{v:'roundTrip',l:'Round Trip'}].map(opt=>(
              <button key={opt.v} onClick={()=>setTripType(opt.v)} style={{padding:'5px 14px',borderRadius:'20px',fontSize:'12px',fontWeight:600,cursor:'pointer',background:'transparent',color:tripType===opt.v?'#F7BE39':'#6b7280',border:tripType===opt.v?'2px solid #F7BE39':'2px solid transparent'}}>{opt.l}</button>
            ))}
          </div>

          {/* FROM */}
          <div style={{marginBottom:'8px'}}>
            <div style={lbl}>From</div>
            <div style={inputBox}><span style={{color:'#F7BE39'}}>✈</span><CityInput value={fromCity} onChange={setFromCity} placeholder="Departure city" id="flights_from_city" /></div>
          </div>

          {/* TO */}
          <div style={{marginBottom:'8px'}}>
            <div style={lbl}>To</div>
            <div style={inputBox}><span>🏙️</span><CityInput value={toCity} onChange={setToCity} placeholder="Arrival city" id="flights_to_city" /></div>
          </div>

          {/* DATE + PAX */}
          <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
            <div style={{flex:1}}>
              <div style={lbl}>Departure</div>
              <div style={inputBox}><span style={{fontSize:'12px'}}>📅</span><input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{flex:1,border:'none',background:'transparent',fontSize:'12px',fontWeight:600,color:'#111827',outline:'none'}} /></div>
            </div>
            <div style={{flex:1}}>
              <div style={lbl}>Passengers</div>
              <div style={inputBox}><span>👤</span><div><div style={{fontSize:'12px',fontWeight:600,color:'#111827'}}>{adults} Traveler(s)</div><div style={{fontSize:'10px',color:'#9ca3af'}}>Economy</div></div></div>
            </div>
          </div>

          {/* Search btn */}
          <button onClick={()=>{setVisibleCount(15);doSearch(fromCity,toCity,selectedDate);}} style={{width:'100%',padding:'11px',background:'#F7BE39',color:'#1a1a1a',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:800,cursor:'pointer',boxShadow:'0 3px 10px rgba(247,190,57,0.4)'}}>Search</button>
        </div>
      </div>

      {/* 2. FILTER TOGGLE */}
     {/* 2. FILTER TOGGLE */}
      <div style={{flexShrink:0,background:'#fff',borderBottom:'1px solid #e5e7eb'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',cursor:'pointer'}} onClick={()=>setShowFilters(v=>!v)}>
          
          {/* LEFT SIDE: Arrow Icon + Heading + Reset Button */}
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            {/* Arrow Icon yahan move kar diya */}
            <span style={{fontSize:'11px',color:'#9ca3af'}}>{showFilters?'▲':'▼'}</span>
            
            <span style={{fontSize:'13px',fontWeight:700,color:'#111827'}}>Sort &amp; Filter</span>
            
            <button 
              onClick={e=>{e.stopPropagation();setFilters(mkDefaults(maxPriceLimit));}} 
              style={{fontSize:'11px',color:'#F7BE39',background:'none',border:'none',cursor:'pointer',fontWeight:700}}
            >
              Reset All
            </button>
          </div>

          {/* RIGHT SIDE: Only Flight Count */}
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'11px',color:'#9ca3af'}}>({filtered.length} flights)</span>
          </div>
        </div>

        {showFilters && (
          <div style={{padding:'0 12px 12px',borderTop:'1px solid #f3f4f6'}}>

            {/* Sort */}
            <div style={{marginTop:'10px',marginBottom:'10px',display:'flex',alignItems:'center',gap:'8px'}}>
              <span style={{fontSize:'12px',fontWeight:600,color:'#374151'}}>Sort:</span>
              <select value={filters.sortBy} onChange={e=>setF(p=>({...p,sortBy:e.target.value}))} style={{fontSize:'12px',padding:'4px 8px',borderRadius:'8px',border:'1px solid #e5e7eb',color:'#374151',background:'#fff',outline:'none',cursor:'pointer'}}>
                <option value="priceLow">Cheapest First</option>
                <option value="priceHigh">Price: High to Low</option>
                <option value="durationShort">Fastest First</option>
                <option value="departEarly">Departure: Earliest</option>
              </select>
            </div>

            {/* Recommended */}
            <div style={{marginBottom:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>Recommended</div>
              {[{id:'r1',l:'Non-stop',f:'direct'},{id:'r2',l:'Hide budget airlines',f:'hideBudget'},{id:'r3',l:'Checked baggage',f:'baggage'}].map(r=>(
                <label key={r.id} htmlFor={r.id} style={{display:'flex',alignItems:'center',gap:'7px',padding:'3px 0',cursor:'pointer'}}>
                  <input type="checkbox" id={r.id} checked={filters.recommended[r.f]} onChange={()=>toggleRec(r.f)} style={{width:'13px',height:'13px',accentColor:'#F7BE39',cursor:'pointer'}} />
                  <span style={{fontSize:'12px',color:'#374151',fontWeight:500}}>{r.l}</span>
                </label>
              ))}
            </div>

            {/* Stops */}
            <div style={{marginBottom:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>Stops</div>
              <label style={{display:'flex',alignItems:'center',gap:'7px',padding:'3px 0',cursor:'pointer'}}>
                <input type="checkbox" checked={filters.stopOneOrFewer} onChange={toggleOF} style={{width:'13px',height:'13px',accentColor:'#F7BE39',cursor:'pointer'}} />
                <span style={{fontSize:'12px',color:'#374151',fontWeight:500}}>1 stop or fewer</span>
              </label>
              {[{k:0,l:'Non-stop'},{k:1,l:'1 Stop'},{k:2,l:'2+ Stops'}].map(({k,l})=>(
                <label key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 0',cursor:'pointer'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                    <input type="checkbox" checked={filters.stops.includes(k)} onChange={()=>toggleStop(k)} style={{width:'13px',height:'13px',accentColor:'#F7BE39',cursor:'pointer'}} />
                    <span style={{fontSize:'12px',color:'#374151',fontWeight:500}}>{l} ({stopStats[k]?.count||0})</span>
                  </div>
                  {stopStats[k]?.minPrice!==Infinity&&<span style={{fontSize:'11px',color:'#6b7280'}}>{fmtCurrency(stopStats[k].minPrice, stopStats[k].currency)}</span>}
                </label>
              ))}
            </div>

            {/* Max Price */}
            <div style={{marginBottom:'10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                <span style={{fontSize:'11px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em'}}>Max Price</span>
                <span style={{fontSize:'12px',fontWeight:700,color:'#F7BE39'}}>{fmtCurrency(filters.maxPrice, 'USD')}</span>
              </div>
              <input type="range" min={minPrice} max={maxPriceLimit} value={filters.maxPrice} onChange={e=>setF(p=>({...p,maxPrice:Number(e.target.value)}))} style={{width:'100%',accentColor:'#F7BE39'}} />
              <div style={{display:'flex',justifyContent:'space-between',fontSize:'10px',color:'#9ca3af'}}><span>{fmtCurrency(minPrice, 'USD')}</span><span>{fmtCurrency(maxPriceLimit, 'USD')}</span></div>
            </div>

            {/* Times */}
            <div style={{marginBottom:'10px'}}>
              <div style={{fontSize:'11px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'6px'}}>Times</div>
              {[{l:'Departure',k:'departureTime'},{l:'Arrival',k:'arrivalTime'}].map(t=>(
                <div key={t.k} style={{marginBottom:'8px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:'11px',color:'#374151',marginBottom:'3px'}}>
                    <span style={{fontWeight:600}}>{t.l} time</span>
                    <span style={{color:'#F7BE39',fontWeight:600}}>{String(filters[t.k][0]).padStart(2,'0')}:00 – {String(filters[t.k][1]).padStart(2,'0')}:00</span>
                  </div>
                  <input type="range" min={0} max={24} value={filters[t.k][1]} onChange={e=>setF(p=>({...p,[t.k]:[0,Number(e.target.value)]}))} style={{width:'100%',accentColor:'#F7BE39'}} />
                </div>
              ))}
            </div>

            {/* Airlines */}
            {airlineStats.length>0&&(
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                  <span style={{fontSize:'11px',fontWeight:700,color:'#6b7280',textTransform:'uppercase',letterSpacing:'0.07em'}}>Airlines</span>
                  <button onClick={()=>setF(p=>({...p,airlines:[]}))} style={{fontSize:'10px',color:'#F7BE39',background:'none',border:'none',cursor:'pointer',fontWeight:700}}>Reset</button>
                </div>
                {airlineStats.map(a=>(
                  <label key={a.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'3px 0',cursor:'pointer'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
                      <input type="checkbox" checked={filters.airlines.includes(a.name)} onChange={()=>toggleAir(a.name)} style={{width:'13px',height:'13px',accentColor:'#F7BE39',cursor:'pointer',flexShrink:0}} />
                      <img src={a.logo||getLogoUrl(a.name)} alt={a.name} style={{width:'22px',height:'22px',objectFit:'contain',borderRadius:'5px',border:'1px solid #f3f4f6'}} onError={e=>e.target.style.display='none'} />
                      <span style={{fontSize:'12px',color:'#374151',fontWeight:500}}>{a.name} <span style={{color:'#9ca3af'}}>({a.count})</span></span>
                    </div>
                    {a.minPrice!==Infinity&&<span style={{fontSize:'11px',color:'#6b7280'}}>{fmtCurrency(a.minPrice, a.currency)}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. DATE STRIP */}
      <div style={{flexShrink:0,background:'#fff',borderBottom:'1px solid #e5e7eb',padding:'8px 10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
          <button onClick={()=>setDateOffset(p=>p-1)} style={{width:'26px',height:'44px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',fontSize:'14px',flexShrink:0}}>‹</button>
          {dates.map(d=>{
            const sel=d===selectedDate;
            return(
              <button key={d} onClick={()=>{setSelectedDate(d);setVisibleCount(15);}} style={{flex:1,padding:'5px 2px',borderRadius:'8px',cursor:'pointer',border:sel?'2px solid #F7BE39':'1px solid #e5e7eb',background:sel?'#fffdf5':'#fff',textAlign:'center'}}>
                <div style={{fontSize:'12px',fontWeight:700,color:sel?'#F7BE39':'#374151'}}>{fmtDate(d)}</div>
                <div style={{fontSize:'9px',color:'#9ca3af',marginTop:'1px'}}>–</div>
              </button>
            );
          })}
          <button onClick={()=>setDateOffset(p=>p+1)} style={{width:'26px',height:'44px',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',cursor:'pointer',fontSize:'14px',flexShrink:0}}>›</button>
          <button style={{flexShrink:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'none',border:'1px solid #e5e7eb',borderRadius:'8px',padding:'5px 6px',cursor:'pointer'}}>
            <span style={{fontSize:'14px'}}>📊</span>
            <span style={{fontSize:'8px',color:'#1d4ed8',fontWeight:700}}>Price</span>
          </button>
        </div>
      </div>

      {/* 4. FLIGHT CARDS */}
      <div style={{padding:'10px'}}>
        {loading&&(
          <div style={{textAlign:'center',padding:'30px',color:'#9ca3af'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>✈</div>
            <div style={{fontSize:'13px',fontWeight:500}}>Searching best flights...</div>
          </div>
        )}
        {!loading&&error&&<div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'10px',padding:'12px',color:'#dc2626',fontSize:'12px'}}>⚠️ {error}</div>}
        {!loading&&!error&&filtered.length===0&&(
          <div style={{textAlign:'center',padding:'30px',background:'#fff',borderRadius:'12px',border:'1px solid #e5e7eb'}}>
            <div style={{fontSize:'28px',marginBottom:'8px'}}>✈</div>
            <div style={{fontSize:'13px',fontWeight:600,color:'#374151'}}>{rawFlights.length>0?'No flights match filters':'No flights found'}</div>
            <div style={{fontSize:'11px',color:'#9ca3af',marginTop:'4px'}}>{rawFlights.length>0?'Try adjusting filters.':'Search karo upar se.'}</div>
            {rawFlights.length>0&&<button onClick={()=>setFilters(mkDefaults(maxPriceLimit))} style={{marginTop:'10px',padding:'6px 16px',background:'#F7BE39',color:'#1a1a1a',border:'none',borderRadius:'8px',cursor:'pointer',fontWeight:600,fontSize:'12px'}}>Reset Filters</button>}
          </div>
        )}
        {!loading&&!error&&filtered.slice(0,visibleCount).map((flight,i)=>{
          const itemId='flight_'+(flight.id||flight.flightNumber||i);
          return <FlightCard key={itemId} flight={flight} inPlan={planIds.includes(itemId)} onAdd={handleAdd} />;
        })}
        <div ref={observerRef} style={{height:'16px',textAlign:'center',fontSize:'10px',color:'#9ca3af'}}>
          {filtered.length>visibleCount&&'Loading more...'}
        </div>
      </div>
    </div>
  );
}