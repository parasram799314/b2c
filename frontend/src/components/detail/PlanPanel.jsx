// components/detail/PlanPanel.jsx
import { useEffect, useMemo, useState } from 'react';

const TYPE_ICONS  = { flight:'✈️', hotel:'🏨', attraction:'🗺️', restaurant:'🍽️', transfer:'🚗' };
const TYPE_COLORS = { flight:'bg-blue-50 border-blue-100', hotel:'bg-amber-50 border-amber-100', attraction:'bg-green-50 border-green-100', restaurant:'bg-orange-50 border-orange-100', transfer:'bg-gray-50 border-gray-100' };
const TRANSPORT_ICONS = { cab:'🚕', metro:'🚇', bus:'🚌', rental:'🚗', train:'🚆', ferry:'⛴️' };

function fmtDate(d) {
  if (!d) return null;
  try {
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      const [y,m,dd] = d.split('-');
      return new Date(parseInt(y),parseInt(m)-1,parseInt(dd)).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    }
    const dt = new Date(d);
    if (!isNaN(dt)) return dt.toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    return d;
  } catch { return d; }
}

function Tag({ color, children }) {
  const cls = { amber:'bg-amber-100/70 text-amber-800', blue:'bg-blue-100/60 text-blue-800', green:'bg-green-100/60 text-green-800', gray:'bg-gray-100 text-gray-600', gold:'bg-yellow-100/60 text-yellow-800' }[color]||'bg-gray-100 text-gray-600';
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md inline-block mr-1 mt-1 ${cls}`}>{children}</span>;
}

function PlanItem({ item, onRemove, status }) {
  const icon  = TYPE_ICONS[item.type]  || '📌';
  const color = TYPE_COLORS[item.type] || 'bg-gray-50 border-gray-100';
  const isPaid = status === 'paid';
  const isInvalid = status === 'invalid';
  let primary='', secondary='';
  const tags=[];

  if (item.type==='flight') {
    const from=item.fromAirport||item.from||'?', to=item.toAirport||item.to||'?';
    primary=`${from} → ${to}`;
    secondary=[item.airline,item.flightNumber].filter(Boolean).join(' · ');
    let rawDate=item.depDate||item.date||'';
    if (!rawDate&&item.id) { const p=item.id.split('_'),l=p[p.length-1]; if(/^\d{4}-\d{2}-\d{2}$/.test(l)) rawDate=l; }
    if (rawDate) tags.push({color:'amber',label:`📅 ${fmtDate(rawDate)||rawDate}`});
    if (item.depTime||item.arrTime) tags.push({color:'blue',label:`🕐 ${item.depTime||'?'} → ${item.arrTime||'?'}${item.nextDay?' (+1)':''}`});
    if (item.duration) tags.push({color:'gray',label:`⏱ ${item.duration}`});
    if (item.stops===0) tags.push({color:'green',label:'✈ Direct'});
    else if (item.stops!=null) tags.push({color:'gray',label:`✈ ${item.stops} stop${item.stops>1?'s':''}`});
    if (item.price) tags.push({color:'gold',label:`${item.currency||''} ${parseFloat(item.price).toLocaleString()}`});
  }
  else if (item.type==='hotel') {
    primary=item.name||'Hotel';
    secondary=item.address||item.cityName||'';
    if (item.stars) secondary=`${'⭐'.repeat(Math.min(Number(item.stars),5))} ${secondary}`.trim();
    if (item.checkIn) tags.push({color:'amber',label:`📅 Check-in: ${fmtDate(item.checkIn)}`});
    if (item.nights)  tags.push({color:'blue', label:`🌙 ${item.nights} night${Number(item.nights)>1?'s':''}`});
    if (item.price)   tags.push({color:'gold', label:`${item.currency||''} ${parseFloat(item.price).toLocaleString()}/night`});
    if (item.rating)  tags.push({color:'green',label:`⭐ ${item.rating}`});
  }
  else if (item.type==='transfer') {
    const tIcon=TRANSPORT_ICONS[item.id]||'🚗';
    primary=`${tIcon} ${item.id?(item.id.charAt(0).toUpperCase()+item.id.slice(1)):'Transfer'}`;
    secondary=item.provider||'';
    if (item.from&&item.to) tags.push({color:'gray', label:`📍 ${item.from} → ${item.to}`});
    if (item.pickupDate)    tags.push({color:'amber',label:`📅 ${fmtDate(item.pickupDate)}`});
    if (item.pickupTime)    tags.push({color:'blue', label:`🕐 Pickup: ${item.pickupTime}`});
    if (item.duration)      tags.push({color:'gray', label:`⏱ ${item.duration}`});
    if (item.price)         tags.push({color:'gold', label:item.price});
  }
  else if (item.type==='restaurant') {
    primary=item.name||'Restaurant';
    secondary=[item.cuisine, item.address||item.cityName].filter(Boolean).join(' · ');
    if (item.visitDate) tags.push({color:'amber', label:`📅 ${fmtDate(item.visitDate)}`});
    if (item.visitTime) tags.push({color:'blue',  label:`🕐 ${item.visitTime}`});
    if (item.rating)    tags.push({color:'green', label:`⭐ ${item.rating}`});
  }
  else if (item.type==='attraction') {
    primary=item.name||'Attraction';
    secondary=[item.category, item.cityName].filter(Boolean).join(' · ');
    if (item.rating) tags.push({color:'green', label:`⭐ ${item.rating}`});
  }
  else { primary=item.name||item.id; secondary=item.note||item.provider||''; }

  const badgeCls = isPaid
    ? 'bg-green-500 text-white'
    : isInvalid
    ? 'bg-gray-200 text-gray-700'
    : 'bg-yellow-100 text-yellow-700';
  const badgeLabel = isPaid ? 'Paid' : isInvalid ? 'Invalid' : 'Pending';

  return (
    <div className={`border rounded-xl p-3 flex items-start gap-2.5 ${color} shadow-sm ${isPaid ? 'ring-1 ring-green-300 border-green-300' : ''} ${isInvalid ? 'opacity-70' : ''}`}>
      <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs font-bold text-gray-800 leading-tight flex-1 min-w-0">{primary}</div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap ${badgeCls}`}>{badgeLabel}</span>
        </div>
        {secondary && <div className="text-[10px] text-gray-500 truncate mt-0.5">{secondary}</div>}
        {tags.length>0 && <div className="flex flex-wrap mt-0.5">{tags.map((t,i)=><Tag key={i} color={t.color}>{t.label}</Tag>)}</div>}
      </div>
      {!isPaid && (
        <button onClick={()=>onRemove(item.id)} className="w-5 h-5 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-400 flex items-center justify-center text-[10px] transition-all flex-shrink-0 mt-0.5">✕</button>
      )}
    </div>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────
function PaymentModal({ planItems, onClose, onSuccess }) {
  const [step, setStep]     = useState(0);
  const [traveller, setTraveller] = useState({ firstName:'', lastName:'', email:'', phone:'', passport:'', nationality:'', travellers:'1', requests:'' });
  const [payForm, setPayForm]     = useState({ method:'Credit Card', cardNum:'', expiry:'', cvv:'', cardName:'', upiId:'' });

  const flights    = planItems.filter(p=>p.type==='flight');
  const hotels     = planItems.filter(p=>p.type==='hotel');
  const transports = planItems.filter(p=>p.type==='transfer');
  const restaurants= planItems.filter(p=>p.type==='restaurant');

  const flightTotal = flights.reduce((s,f)=>s+(parseFloat(f.price)||0),0);
  const hotelTotal  = hotels.reduce((s,h)=>s+(parseFloat(h.price||0)*(Number(h.nights)||1)),0);
  const grandTotal  = flightTotal + hotelTotal;

  const STEPS = ['Review','Traveller','Payment','Done'];

  const canNext = () => {
    if (step===1) return traveller.firstName&&traveller.lastName&&traveller.email&&traveller.phone;
    if (step===2) {
      if (payForm.method==='Credit Card') return payForm.cardNum&&payForm.expiry&&payForm.cvv&&payForm.cardName;
      if (payForm.method==='UPI') return payForm.upiId;
      return true;
    }
    return true;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.6)'}}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-base font-black text-gray-900">
                {step===3 ? '🎉 Booking Confirmed!' : '🧳 Complete Your Booking'}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{planItems.length} item{planItems.length!==1?'s':''} selected</div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition-all">✕</button>
          </div>
          <div className="flex items-center gap-0">
            {STEPS.map((s,i)=>(
              <div key={s} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all ${i<step?'bg-amber-500 border-amber-500 text-white':i===step?'bg-gray-900 border-gray-900 text-white':'bg-white border-gray-200 text-gray-400'}`}>
                    {i<step?'✓':i+1}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-wider ${i===step?'text-gray-900':'text-gray-400'}`}>{s}</span>
                </div>
                {i<STEPS.length-1 && <div className={`h-0.5 w-full mb-3 ${i<step?'bg-amber-500':'bg-gray-200'}`}/>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">

          {step===0 && (
            <div className="space-y-3">
              {flights.length>0 && (
                <ModalSection icon="✈️" title="Flights" badge={flights.length} badgeColor="blue">
                  {flights.map((f,i)=>(
                    <ModalRow key={i}
                      left={<>
                        <div className="font-semibold text-xs text-gray-800">{f.fromAirport||f.from||'?'} → {f.toAirport||f.to||'?'}</div>
                        <div className="text-[10px] text-gray-400">{[f.airline,f.flightNumber].filter(Boolean).join(' ')} {f.depDate?`· ${fmtDate(f.depDate)}`:''}</div>
                        <div className="text-[10px] text-gray-500">🕐 {f.depTime||'?'} → {f.arrTime||'?'} · {f.duration||''}</div>
                      </>}
                      right={f.price&&<span className="text-xs font-black text-gray-800">{f.currency||'USD'} {parseFloat(f.price).toLocaleString()}</span>}
                    />
                  ))}
                  {flightTotal>0 && <SubtotalRow label="Flights total" value={`USD ${flightTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}/>}
                </ModalSection>
              )}

              {hotels.length>0 && (
                <ModalSection icon="🏨" title="Hotels" badge={hotels.length} badgeColor="amber">
                  {hotels.map((h,i)=>(
                    <ModalRow key={i}
                      left={<>
                        <div className="font-semibold text-xs text-gray-800">{h.name}</div>
                        <div className="text-[10px] text-gray-400">{h.address||h.cityName}</div>
                        <div className="text-[10px] text-gray-500">📅 {fmtDate(h.checkIn)||'—'} · 🌙 {h.nights||1} night{(h.nights||1)>1?'s':''}</div>
                      </>}
                      right={h.price
                        ? <span className="text-xs font-black text-gray-800">{h.currency||''} {(parseFloat(h.price)*(Number(h.nights)||1)).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                        : <span className="text-[10px] text-gray-400">On request</span>}
                    />
                  ))}
                  {hotelTotal>0 && <SubtotalRow label="Hotels total" value={`USD ${hotelTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}/>}
                </ModalSection>
              )}

              {transports.length>0 && (
                <ModalSection icon="🚗" title="Transfer" badge={transports.length} badgeColor="gray">
                  {transports.map((t,i)=>(
                    <ModalRow key={i}
                      left={<>
                        <div className="font-semibold text-xs text-gray-800">{TRANSPORT_ICONS[t.id]||'🚗'} {t.id?.charAt(0).toUpperCase()+t.id?.slice(1)}</div>
                        <div className="text-[10px] text-gray-500">📍 {t.from} → {t.to} {t.pickupDate?`· 📅 ${fmtDate(t.pickupDate)}`:''} {t.pickupTime?`· 🕐 ${t.pickupTime}`:''}</div>
                      </>}
                      right={t.price&&<span className="text-xs font-bold text-gray-600">{t.price}</span>}
                    />
                  ))}
                </ModalSection>
              )}

              {restaurants.length>0 && (
                <ModalSection icon="🍽️" title="Restaurants" badge={restaurants.length} badgeColor="orange">
                  {restaurants.map((r,i)=>(
                    <ModalRow key={i}
                      left={<>
                        <div className="font-semibold text-xs text-gray-800">{r.name}</div>
                        <div className="text-[10px] text-gray-400">{[r.cuisine, r.address||r.cityName].filter(Boolean).join(' · ')}</div>
                        {(r.visitDate||r.visitTime) && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            {r.visitDate && `📅 ${fmtDate(r.visitDate)}`}
                            {r.visitDate && r.visitTime && ' · '}
                            {r.visitTime && `🕐 ${r.visitTime}`}
                          </div>
                        )}
                      </>}
                      right={null}
                    />
                  ))}
                </ModalSection>
              )}

              {grandTotal>0 && (
                <div className="bg-gray-900 rounded-2xl p-4 flex items-center justify-between mt-2">
                  <div>
                    <div className="text-white text-xs font-black uppercase tracking-wider">Estimated Total</div>
                    <div className="text-gray-400 text-[10px] mt-0.5">Flights + Hotels · excl. taxes</div>
                  </div>
                  <div className="text-amber-400 text-xl font-black">USD {grandTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
                </div>
              )}
            </div>
          )}

          {step===1 && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Primary Traveller Details</p>
              <div className="grid grid-cols-2 gap-3">
                <MField label="First Name *" value={traveller.firstName} onChange={v=>setTraveller(p=>({...p,firstName:v}))} placeholder="John"/>
                <MField label="Last Name *"  value={traveller.lastName}  onChange={v=>setTraveller(p=>({...p,lastName:v}))}  placeholder="Doe"/>
              </div>
              <MField label="Email *"  value={traveller.email}  onChange={v=>setTraveller(p=>({...p,email:v}))}  placeholder="john@email.com" type="email"/>
              <MField label="Phone *"  value={traveller.phone}  onChange={v=>setTraveller(p=>({...p,phone:v}))}  placeholder="+91 98765 43210"/>
              <div className="grid grid-cols-2 gap-3">
                <MField label="Passport / ID" value={traveller.passport} onChange={v=>setTraveller(p=>({...p,passport:v}))} placeholder="A1234567"/>
                <MField label="Nationality"   value={traveller.nationality} onChange={v=>setTraveller(p=>({...p,nationality:v}))} placeholder="Indian"/>
              </div>
              <MField label="No. of Travellers" value={traveller.travellers} onChange={v=>setTraveller(p=>({...p,travellers:v}))} placeholder="1" type="number"/>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Special Requests</label>
                <textarea rows={2} placeholder="Vegetarian meal, wheelchair access..." value={traveller.requests} onChange={e=>setTraveller(p=>({...p,requests:e.target.value}))}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"/>
              </div>
            </div>
          )}

          {step===2 && (
            <div className="space-y-3">
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Choose Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                {['Credit Card','UPI','Bank Transfer'].map(m=>(
                  <button key={m} onClick={()=>setPayForm(p=>({...p,method:m}))}
                    className={`py-3 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 ${payForm.method===m?'bg-gray-900 text-white border-gray-900':'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}>
                    <span className="text-lg">{m==='Credit Card'?'💳':m==='UPI'?'📱':'🏦'}</span>
                    {m}
                  </button>
                ))}
              </div>
              {payForm.method==='Credit Card' && (
                <div className="space-y-3">
                  <MField label="Card Number" value={payForm.cardNum} onChange={v=>setPayForm(p=>({...p,cardNum:v}))} placeholder="1234 5678 9012 3456"/>
                  <div className="grid grid-cols-2 gap-3">
                    <MField label="Expiry" value={payForm.expiry} onChange={v=>setPayForm(p=>({...p,expiry:v}))} placeholder="MM/YY"/>
                    <MField label="CVV" value={payForm.cvv} onChange={v=>setPayForm(p=>({...p,cvv:v}))} placeholder="•••" type="password"/>
                  </div>
                  <MField label="Name on Card" value={payForm.cardName} onChange={v=>setPayForm(p=>({...p,cardName:v}))} placeholder="John Doe"/>
                </div>
              )}
              {payForm.method==='UPI' && (
                <MField label="UPI ID" value={payForm.upiId} onChange={v=>setPayForm(p=>({...p,upiId:v}))} placeholder="john@upi"/>
              )}
              {payForm.method==='Bank Transfer' && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-1.5 text-xs text-blue-700">
                  <div className="font-black text-blue-900 mb-1">Bank Transfer Details</div>
                  <div>Account: <b>TravelApp Pvt Ltd</b></div>
                  <div>Acc No: <b>1234567890</b></div>
                  <div>IFSC: <b>HDFC0001234</b></div>
                  <div className="text-[10px] text-blue-400 mt-1">Transfer & share receipt with our team</div>
                </div>
              )}
              {grandTotal>0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">Amount to Pay</span>
                  <span className="text-base font-black text-amber-700">USD {grandTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              )}
              <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-xl p-3">
                <span>🔒</span>
                <div className="text-[10px] text-green-700"><b className="text-green-900">Secure Payment</b><br/>256-bit SSL encrypted. Your info is never stored.</div>
              </div>
            </div>
          )}

          {step===3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto">🎉</div>
              <div>
                <div className="text-lg font-black text-gray-900">Booking Submitted!</div>
                <div className="text-xs text-gray-400 mt-1">Confirmation sent to <b className="text-gray-700">{traveller.email||'your email'}</b></div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-left space-y-2">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Booking Summary</div>
                {[['Name',`${traveller.firstName} ${traveller.lastName}`],['Phone',traveller.phone],['Travellers',traveller.travellers||'1'],['Items',planItems.length],grandTotal>0&&['Total',`USD ${grandTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`]].filter(Boolean).map(([k,v])=>(
                  <div key={k} className="flex justify-between text-xs"><span className="text-gray-500">{k}</span><span className="font-bold text-gray-800">{v}</span></div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400 bg-gray-50 rounded-xl p-3">Our team will contact you within <b>2–4 hours</b> to confirm availability.</div>
            </div>
          )}
        </div>

        {step < 3 && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0 flex gap-3">
            {step>0 && (
              <button onClick={()=>setStep(s=>s-1)} className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
                ← Back
              </button>
            )}
            <button
              onClick={()=>{
                if(step===2){
                  try { onSuccess?.(); }
                  finally { setStep(3); }
                } else setStep(s=>s+1);
              }}
              disabled={!canNext()}
              className={`flex-[2] py-3 text-sm font-black rounded-2xl transition-all ${canNext()?'bg-amber-500 hover:bg-amber-600 text-white shadow-lg':'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              {step===0?'Continue →':step===1?'Go to Payment →':step===2?'Confirm & Pay 🔒':'Done'}
            </button>
          </div>
        )}
        {step===3 && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button onClick={onClose} className="w-full py-3 text-sm font-black bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all">Close ✓</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ModalSection({ icon, title, badge, badgeColor, children }) {
  const bg  = {blue:'bg-blue-50 border-blue-100', amber:'bg-amber-50 border-amber-100', gray:'bg-gray-50 border-gray-200', orange:'bg-orange-50 border-orange-100'}[badgeColor]||'bg-gray-50 border-gray-100';
  const bdg = {blue:'bg-blue-100 text-blue-700', amber:'bg-amber-100 text-amber-700', gray:'bg-gray-200 text-gray-600', orange:'bg-orange-100 text-orange-700'}[badgeColor]||'bg-gray-100 text-gray-600';
  return (
    <div className={`border rounded-2xl overflow-hidden ${bg}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/50">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-black text-gray-700 uppercase tracking-wider flex-1">{title}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${bdg}`}>{badge}</span>
      </div>
      <div className="divide-y divide-white/50">{children}</div>
    </div>
  );
}

function ModalRow({ left, right }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5">
      <div className="flex-1 min-w-0">{left}</div>
      {right && <div className="flex-shrink-0 text-right pt-0.5">{right}</div>}
    </div>
  );
}

function SubtotalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white/50 border-t border-white/50">
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-black text-gray-800">{value}</span>
    </div>
  );
}

function MField({ label, value, onChange, placeholder, type='text' }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"/>
    </div>
  );
}

export default function PlanPanel({ planItems=[], onRemove, onClose }) {
  const [showPayment, setShowPayment] = useState(false);

  const grouped   = planItems.reduce((acc,item)=>{ if(!acc[item.type]) acc[item.type]=[]; acc[item.type].push(item); return acc; },{});
  const typeOrder = ['flight','hotel','transfer','restaurant','attraction'];

  const flightTotal = planItems.filter(p=>p.type==='flight').reduce((s,f)=>s+(parseFloat(f.price)||0),0);
  const hotelTotal  = planItems.filter(p=>p.type==='hotel').reduce((s,h)=>s+(parseFloat(h.price||0)*(Number(h.nights)||1)),0);
  const grandTotal  = flightTotal + hotelTotal;

  return (
    <>
      {showPayment && <PaymentModal planItems={planItems} onClose={()=>setShowPayment(false)}/>}

      <div className="w-96 border-l border-gray-100 bg-white flex flex-col flex-shrink-0 overflow-hidden shadow-xl z-20" style={{height:"100%"}}>

        <div className="px-4 py-3.5 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 uppercase tracking-tighter">Plan Summary</span>
              <span className="px-2 py-0.5 bg-amber-500 rounded-full text-white text-[10px] font-bold">{planItems.length}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-900 transition-all">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto p-3 flex flex-col gap-4" style={{flex:"1 1 0",minHeight:0}}>
          {planItems.length===0 ? (
            <div className="text-center py-20 text-gray-300 text-[11px] italic">Your plan is empty.<br/>Add flights, hotels &amp; transfer.</div>
          ) : (
            typeOrder.map(type=>{
              if (!grouped[type]?.length) return null;
              return (
                <div key={type}>
                  <div className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest flex items-center gap-1.5 px-1">
                    <span className="h-px flex-1 bg-gray-100"/>
                    {TYPE_ICONS[type]} {type}s
                    <span className="h-px flex-1 bg-gray-100"/>
                  </div>
                  <div className="flex flex-col gap-2">
                    {grouped[type].map((item,idx)=><PlanItem key={`${item.id}-${idx}`} item={item} onRemove={onRemove}/>)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {planItems.length>0 && (
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/40">
            {grandTotal>0 && (
              <div className="px-4 py-3 space-y-1.5 border-b border-gray-100">
                {flightTotal>0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">✈️ Flights</span>
                    <span className="font-semibold text-gray-700">USD {flightTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  </div>
                )}
                {hotelTotal>0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-500">🏨 Hotels</span>
                    <span className="font-semibold text-gray-700">USD {hotelTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Total</span>
                  <span className="text-sm font-black text-amber-600">USD {grandTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                </div>
              </div>
            )}
            <div className="p-3">
              <button
                onClick={()=>setShowPayment(true)}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-sm font-black rounded-2xl py-3.5 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                🔒 Submit &amp; Pay
                {grandTotal>0 && <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">USD {grandTotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}