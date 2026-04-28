// components/detail/AIChat.jsx
// ✅ Fix 1 — reply field name: res.data.reply (not reply_text)
// ✅ Fix 2 — flowState initialized properly, never sent as null
// ✅ Fix 3 — cardData render guard added, safe optional chaining everywhere
// ✅ Fix 4 — "show me flight details" at IDLE now forces flight_search intent

import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

const MAX_TOKENS = 2000;

// ── Airline logo helper ──────────────────────────────────────────────────────
const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
const IATA_NAME = {
  AI: 'Air India', '6E': 'IndiGo', SG: 'SpiceJet', UK: 'Vistara',
  QP: 'Akasa Air', EK: 'Emirates', QR: 'Qatar Airways', EY: 'Etihad',
  LH: 'Lufthansa', BA: 'British Airways', SQ: 'Singapore Airlines',
  FZ: 'flydubai', G8: 'Go First', I5: 'Air Asia India',
};
function airlineLogo(code = '') {
  if (/^[A-Z0-9]{2,3}$/.test(code.toUpperCase())) return `${WEGO}${code.toUpperCase()}.png`;
  return null;
}

const GOLD   = '#F7BE39';
const GOLD_D = '#E09510';
const DARK   = '#1a1a2e';
const GRAY   = '#6b7280';

// ── createFlowState helper (mirrors backend) ─────────────────────────────────
// ✅ Fix 2: always send a valid flowState to backend, never null/undefined
function createFlowState(overrides = {}) {
  return {
    step:                          'IDLE',
    searchMode:                    null,
    confirmedDestination:          null,
    confirmedOrigin:               null,
    confirmedTripType:             null,
    confirmedDate:                 null,
    confirmedReturnDate:           null,
    confirmedPax:                  null,
    confirmedCabin:                null,
    preferredHotelStars:           undefined,
    preferredAttractionCategories: null,
    retryCount:                    {},
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE FLIGHT CARD
// ─────────────────────────────────────────────────────────────────────────────
function InlineFlightCard({ flight, onAdd, inPlan }) {
  const [imgErr, setImgErr] = useState(false);
  const logoSrc  = airlineLogo(flight.airline || '');
  // ✅ support both field name variants from backend
  const depTime  = flight.departureTime ?? flight.depTime  ?? '—';
  const arrTime  = flight.arrivalTime   ?? flight.arrTime  ?? '—';
  const from     = flight.from          ?? flight.origin   ?? '—';
  const to       = flight.to            ?? flight.destination ?? '—';
  const price    = Number(flight.price  || 0);
  const currency = (flight.currency === 'USD' || flight.currency === '$') ? '$' : '₹';
  const airName  = IATA_NAME[flight.airline] || flight.airlineName || flight.airline || '—';

  return (
    <div style={{
      background: inPlan ? '#f0fdf4' : '#fff',
      border: `1.5px solid ${inPlan ? '#86efac' : '#e5e7eb'}`,
      borderRadius: '12px', padding: '12px 14px',
      flexShrink: 0, width: '280px', marginRight: '12px',
      transition: 'border-color .2s',
    }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '8px',
          background: '#fff5f0', border: '1px solid #ffe4d6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {logoSrc && !imgErr
            ? <img src={logoSrc} alt={airName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setImgErr(true)} />
            : <span style={{ fontSize: '18px' }}>✈</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: DARK }}>{airName}</div>
          <div style={{ fontSize: '11px', color: GRAY }}>{flight.flightNumber || flight.flightNo || ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: DARK, letterSpacing: '-0.5px' }}>
            {currency}{Math.round(price).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '10px', color: GRAY }}>per person</div>
        </div>
      </div>

      {/* route row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <div style={{ minWidth: '54px' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: DARK, lineHeight: 1 }}>{depTime}</div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>
            {from}
            {flight.fromTerminal && <span style={{ color: '#ef4444', marginLeft: '3px' }}>T{flight.fromTerminal}</span>}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '10px', color: GRAY, marginBottom: '4px' }}>{flight.duration || ''}</div>
          <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, borderBottom: '1.5px dashed #d1d5db' }} />
            <span style={{ margin: '0 4px', fontSize: '12px', color: GRAY }}>✈</span>
            <div style={{ flex: 1, borderBottom: '1.5px dashed #d1d5db' }} />
          </div>
          <div style={{
            fontSize: '10px', fontWeight: 700, marginTop: '4px',
            color: Number(flight.stops) === 0 ? '#16a34a' : '#f59e0b',
          }}>
            {Number(flight.stops) === 0 ? 'Non-stop' : `${flight.stops} Stop`}
          </div>
        </div>
        <div style={{ minWidth: '54px', textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: DARK, lineHeight: 1 }}>
            {arrTime}
            {(flight.nextDayArrival || flight.nextDay) &&
              <sup style={{ fontSize: '10px', color: GOLD, marginLeft: '2px' }}>+1</sup>}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{to}</div>
        </div>
      </div>

      {/* add button */}
      <button
        onClick={() => !inPlan && onAdd?.(flight, 'flight')}
        disabled={inPlan}
        style={{
          width: '100%', padding: '7px 0', borderRadius: '8px', border: 'none',
          background: inPlan ? '#dcfce7' : GOLD,
          color: inPlan ? '#16a34a' : DARK,
          fontSize: '12px', fontWeight: 700, cursor: inPlan ? 'default' : 'pointer',
          transition: 'background .15s',
        }}
        onMouseEnter={e => { if (!inPlan) e.currentTarget.style.background = GOLD_D; }}
        onMouseLeave={e => { if (!inPlan) e.currentTarget.style.background = GOLD; }}
      >
        {inPlan ? '✓ Added to Plan' : '+ Add to Plan'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE HOTEL CARD
// ─────────────────────────────────────────────────────────────────────────────
const HOTEL_FALLBACK = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=70';
function InlineHotelCard({ hotel, onAdd, inPlan }) {
  const stars = Math.min(Math.max(Number(hotel.stars) || 3, 1), 5);
  const price = hotel.price ? `${hotel.currency || 'INR'} ${parseFloat(hotel.price).toLocaleString()}` : null;

  return (
    <div style={{
      background: inPlan ? '#f0fdf4' : '#fff',
      border: `1.5px solid ${inPlan ? '#86efac' : '#e5e7eb'}`,
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div style={{ height: '80px', background: '#f3f4f6', position: 'relative' }}>
        <img
          src={hotel.image || HOTEL_FALLBACK}
          alt={hotel.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = HOTEL_FALLBACK; }}
        />
        <div style={{
          position: 'absolute', top: '6px', left: '6px',
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 8px',
        }}>{stars}⭐</div>
        {price && (
          <div style={{
            position: 'absolute', bottom: '6px', left: '6px',
            background: 'rgba(255,255,255,0.92)', color: DARK,
            fontSize: '11px', fontWeight: 700, borderRadius: '20px', padding: '2px 8px',
          }}>{price}<span style={{ color: GRAY, fontWeight: 400 }}>/night</span></div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: DARK, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.name}</div>
        <div style={{ fontSize: '11px', color: GRAY, marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.address || hotel.cityName}</div>
        {hotel.rating && (
          <div style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
            ⭐ {hotel.rating}{hotel.ratingCount ? ` (${Number(hotel.ratingCount).toLocaleString()})` : ''}
          </div>
        )}
        <button
          onClick={() => !inPlan && onAdd?.(hotel, 'hotel')}
          disabled={inPlan}
          style={{
            width: '100%', padding: '7px 0', borderRadius: '8px', border: 'none',
            background: inPlan ? '#dcfce7' : GOLD,
            color: inPlan ? '#16a34a' : DARK,
            fontSize: '12px', fontWeight: 700, cursor: inPlan ? 'default' : 'pointer',
          }}
          onMouseEnter={e => { if (!inPlan) e.currentTarget.style.background = GOLD_D; }}
          onMouseLeave={e => { if (!inPlan) e.currentTarget.style.background = GOLD; }}
        >
          {inPlan ? '✓ Added to Plan' : '+ Add to Plan'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE ATTRACTION / RESTAURANT CARD
// ─────────────────────────────────────────────────────────────────────────────
const ATTR_FALLBACK = 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=300&q=70';
function InlineAttractionCard({ attraction, onAdd, inPlan, type = 'attraction' }) {
  return (
    <div style={{
      background: inPlan ? '#f0fdf4' : '#fff',
      border: `1.5px solid ${inPlan ? '#86efac' : '#e5e7eb'}`,
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div style={{ height: '70px', background: '#f3f4f6', position: 'relative' }}>
        <img
          src={attraction.image || ATTR_FALLBACK}
          alt={attraction.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.src = ATTR_FALLBACK; }}
        />
        {(attraction.category || attraction.cuisine) && (
          <div style={{
            position: 'absolute', top: '6px', left: '6px',
            background: 'rgba(247,190,57,0.9)', color: DARK,
            fontSize: '10px', fontWeight: 700, borderRadius: '20px', padding: '2px 8px',
          }}>{attraction.category || attraction.cuisine}</div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: DARK, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attraction.name}</div>
        <div style={{ fontSize: '11px', color: GRAY, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attraction.address || attraction.cityName}</div>
        {attraction.rating && <div style={{ fontSize: '11px', color: '#374151', marginBottom: '6px' }}>⭐ {attraction.rating}</div>}
        {attraction.entryFee && <div style={{ fontSize: '11px', color: GRAY, marginBottom: '6px' }}>🎟️ {attraction.entryFee}</div>}
        {attraction.priceLevel && <div style={{ fontSize: '11px', color: GRAY, marginBottom: '6px' }}>💰 {attraction.priceLevel}</div>}
        <button
          onClick={() => !inPlan && onAdd?.(attraction, type)}
          disabled={inPlan}
          style={{
            width: '100%', padding: '6px 0', borderRadius: '8px', border: `1px solid ${inPlan ? '#86efac' : '#e5e7eb'}`,
            background: inPlan ? '#dcfce7' : '#f9fafb',
            color: inPlan ? '#16a34a' : '#374151',
            fontSize: '12px', fontWeight: 700, cursor: inPlan ? 'default' : 'pointer',
          }}
          onMouseEnter={e => { if (!inPlan) { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fde68a'; } }}
          onMouseLeave={e => { if (!inPlan) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
        >
          {inPlan ? '✓ Added' : '+ Add to Plan'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK PROMPTS
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: '✈️ Flights',       message: 'Show me available flights',          intent: 'flights'     },
  { label: '🏨 Hotels',        message: 'Show me hotels to stay',             intent: 'hotels'      },
  { label: '🗺️ Attractions',   message: 'What are the top attractions?',      intent: 'attractions' },
  { label: '🍽️ Restaurants',   message: 'Best restaurants to try?',           intent: 'restaurants' },
  { label: '📋 Visa & Docs',   message: 'What visa and documents do I need?', tab: 'checklist'      },
  { label: '🌤️ Weather & Pack',message: 'What to pack based on the weather?', tab: 'weather'        },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AIChat({ rfq, onTabSwitch, onResults, onClose }) {
  const [messages, setMessages] = useState([{
    id: 1, role: 'ai',
    text: rfq?.destinations?.length
      ? `Hello! ✈️ I am your AI Travel Genie for **${rfq.destinations.map(d => d.destination).join(' & ')}**. How can I help you with flights, hotels, or attractions today?`
      : `Hello! ✈️ I am your AI Travel Genie. Where would you like to go?`,
  }]);
  const [input,        setInput]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [tokensUsed,   setTokensUsed]   = useState(0);
  const [lastMsgTok,   setLastMsgTok]   = useState(0);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [planItems,    setPlanItems]    = useState([]);

  // ✅ Fix 2: flowState always initialized to valid object, never null
  const [flowState, setFlowState] = useState(() => createFlowState());
  const [history,   setHistory]   = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    axios.get('/api/users/chat-tokens')
      .then(r => { if (r.data.success) setTokensUsed(r.data.used || 0); })
      .catch(() => {})
      .finally(() => setTokenLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const tokensRemaining  = Math.max(0, MAX_TOKENS - tokensUsed);
  const tokenPct         = Math.min((tokensUsed / MAX_TOKENS) * 100, 100);
  const isTokenExhausted = tokensUsed >= MAX_TOKENS;
  const barColor  = tokenPct > 80 ? '#ef4444' : tokenPct > 50 ? '#f59e0b' : '#4ade80';
  const dotColor  = barColor;
  const dotShadow = tokenPct > 80 ? '0 0 0 3px rgba(248,113,113,.2)' : tokenPct > 50 ? '0 0 0 3px rgba(245,158,11,.2)' : '0 0 0 3px rgba(74,222,128,.2)';

  // ── Add to plan ─────────────────────────────────────────────────────────────
  const handleAddToPlan = useCallback((item, type) => {
    const key = `${type}_${item.hotelId || item.flightNumber || item.attractionId || item.restaurantId || item.name || Math.random()}`;
    if (planItems.some(p => p.key === key)) return;
    const newItem = { key, type, data: item };
    setPlanItems(prev => [...prev, newItem]);
    onResults?.({ planItem: newItem });

    const followUps = {
      hotel:      `**${item.name}** has been added to your plan! 🏨 How many nights are you planning to stay?`,
      flight:     `**${IATA_NAME[item.airline] || item.airline} ${item.flightNumber || ''}** added! ✈️ How many passengers are traveling?`,
      attraction: `**${item.name}** added to your plan! 🗺️ Would you like to see more attractions?`,
      restaurant: `**${item.name}** added to your plan! 🍽️ Would you like more restaurant recommendations?`,
    };
    setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: followUps[type] || 'Added to plan! ✅' }]);
  }, [planItems, onResults]);

  // ── Main send ───────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (rawText) => {
    const text = (rawText || input).trim();
    if (!text || loading || isTokenExhausted || tokenLoading) return;
    setInput('');

    const userMsg = { id: Date.now(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);

    const updatedHistory = [...history, { role: 'user', content: text }];
    setHistory(updatedHistory);
    setLoading(true);

    try {
      const res = await axios.post('/api/rfqs/chat', {
        rfqId:               rfq?.rfqId || rfq?._id,
        message:             text,
        conversationHistory: updatedHistory,
        // ✅ Fix 2: always send valid flowState object (never null/undefined)
        flowState:           flowState || createFlowState(),
      });

      const data = res.data || {};

      // ✅ Fix 1: backend sends "reply" not "reply_text"
      const reply       = data.reply || data.reply_text || 'Sorry, kuch problem ho gayi. Please dobara try karein.';
      const flights     = Array.isArray(data.flights)     ? data.flights     : [];
      const hotels      = Array.isArray(data.hotels)      ? data.hotels      : [];
      const attractions = Array.isArray(data.attractions) ? data.attractions : [];
      const restaurants = Array.isArray(data.restaurants) ? data.restaurants : [];

      const newHistory = [...updatedHistory, { role: 'assistant', content: reply }];
      setHistory(newHistory);

      // ✅ Fix 2: save updated flow state from backend response
      if (data.updatedFlowState) {
        setFlowState(data.updatedFlowState);
      }

      // ✅ Fix 3: cardData only set when arrays have items
      const cardData = {
        flights:     flights.length     ? flights     : null,
        hotels:      hotels.length      ? hotels      : null,
        attractions: attractions.length ? attractions : null,
        restaurants: restaurants.length ? restaurants : null,
      };
      const hasCards = flights.length || hotels.length || attractions.length || restaurants.length;

      if (hasCards) {
        onResults?.({ hotels, flights, attractions, restaurants, raw: data });
        if (flights.length)     onTabSwitch?.('flights');
        else if (hotels.length) onTabSwitch?.('hotels');
        else if (attractions.length) onTabSwitch?.('attractions');
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        text: reply,
        // ✅ Fix 3: only attach cardData when there's something to show
        cardData: hasCards ? cardData : null,
      }]);

      if (data.used !== undefined) {
        setTokensUsed(data.used);
        setLastMsgTok(Math.ceil((text.length + reply.length) * 0.25));
      }

    } catch (err) {
      console.error('[AIChat] error:', err);
      const errMsg = err?.response?.data?.message || 'Network error. Please try again.';
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'ai', text: errMsg }]);
    }

    setLoading(false);
  }, [input, loading, isTokenExhausted, tokenLoading, rfq, history, flowState, onResults, onTabSwitch]);

  const handleQuick = (prompt) => {
    if (prompt.tab) { onTabSwitch?.(prompt.tab); return; }
    sendMessage(prompt.message);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden' }}>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #f3f4f6', flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, display: 'inline-block', marginTop: '4px', boxShadow: dotShadow, flexShrink: 0, transition: 'all 0.3s' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>AI Travel Genie</div>
            <div style={{ fontSize: '10px', color: GRAY }}>
              {rfq?.destinations?.[0]?.destination
                ? `Trip to ${rfq.destinations.map(d => d.destination).join(', ')}`
                : 'Ask anything about your trip'}
            </div>

            {/* Token bar */}
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '9px', color: GRAY }}>
                  Tokens: <b style={{ color: isTokenExhausted ? '#ef4444' : '#111827' }}>{tokensRemaining}</b> remaining
                </span>
                {lastMsgTok > 0 && <span style={{ fontSize: '9px', color: '#9ca3af' }}>Last: -{lastMsgTok}</span>}
              </div>
              <div style={{ width: '100%', height: '4px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '999px', width: `${tokenPct}%`, background: barColor, transition: 'width .4s, background .3s' }} />
              </div>
            </div>

            {/* Plan counter */}
            {planItems.length > 0 && (
              <div style={{ marginTop: '5px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: GOLD_D }}>
                  ✓ {planItems.length} item{planItems.length > 1 ? 's' : ''} added to plan
                </span>
              </div>
            )}

            {/* Flow state debug pill (only in dev) */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ marginTop: '3px', fontSize: '9px', color: '#9ca3af' }}>
                Step: {flowState?.step || 'IDLE'} | Mode: {flowState?.searchMode || '—'}
              </div>
            )}
          </div>
        </div>

        {onClose && <GeniButton onClick={onClose} />}
      </div>

      {/* ── MESSAGES ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'user'   && <BubbleUser   text={msg.text} />}
            {msg.role === 'system' && <BubbleSystem text={msg.text} />}
            {msg.role === 'ai' && (
              <>
                <BubbleAI text={msg.text} />

                {/* ✅ Fix 3: safe guard — only render cards when cardData exists and has content */}
                {msg.cardData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px' }}>

                    {/* Flights — horizontal scroll */}
                    {msg.cardData.flights && msg.cardData.flights.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                          ✈️ {msg.cardData.flights.length} flight{msg.cardData.flights.length > 1 ? 's' : ''} found
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: '10px' }}>
                          {msg.cardData.flights.map((f, i) => (
                            <InlineFlightCard
                              key={i}
                              flight={f}
                              onAdd={handleAddToPlan}
                              inPlan={planItems.some(p => p.type === 'flight' && (p.data.flightNumber === f.flightNumber || p.data.flightNo === f.flightNo))}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hotels — 2 col grid */}
                    {msg.cardData.hotels && msg.cardData.hotels.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                          🏨 {msg.cardData.hotels.length} hotel{msg.cardData.hotels.length > 1 ? 's' : ''} found
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {msg.cardData.hotels.slice(0, 4).map((h, i) => (
                            <InlineHotelCard
                              key={i}
                              hotel={h}
                              onAdd={handleAddToPlan}
                              inPlan={planItems.some(p => p.type === 'hotel' && (p.data.hotelId === h.hotelId || p.data.name === h.name))}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attractions */}
                    {msg.cardData.attractions && msg.cardData.attractions.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                          🗺️ {msg.cardData.attractions.length} attraction{msg.cardData.attractions.length > 1 ? 's' : ''} found
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {msg.cardData.attractions.slice(0, 4).map((a, i) => (
                            <InlineAttractionCard
                              key={i}
                              attraction={a}
                              onAdd={handleAddToPlan}
                              type="attraction"
                              inPlan={planItems.some(p => p.type === 'attraction' && p.data.name === a.name)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restaurants */}
                    {msg.cardData.restaurants && msg.cardData.restaurants.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: GRAY, marginBottom: '6px' }}>
                          🍽️ {msg.cardData.restaurants.length} restaurant{msg.cardData.restaurants.length > 1 ? 's' : ''} found
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {msg.cardData.restaurants.slice(0, 4).map((r, i) => (
                            <InlineAttractionCard
                              key={i}
                              attraction={{ ...r, category: r.cuisine || 'Restaurant' }}
                              onAdd={handleAddToPlan}
                              type="restaurant"
                              inPlan={planItems.some(p => p.type === 'restaurant' && p.data.name === r.name)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '16px 16px 16px 4px', padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 150, 300].map(d => (
                  <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d1d5db', display: 'inline-block', animation: 'aichat-bounce 1.2s infinite', animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {isTokenExhausted && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{ background: '#fef2f2', color: '#991b1b', fontSize: '10px', borderRadius: '20px', border: '1px solid #fecaca', padding: '4px 14px', fontWeight: 600 }}>
              Token limit reached. Chat unavailable today.
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── BOTTOM: Quick prompts + Input ────────────────────────────────── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #f3f4f6', background: '#fff' }}>

        {/* Quick chips */}
        <div style={{ padding: '8px 10px 6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => !isTokenExhausted && handleQuick(p)}
                disabled={isTokenExhausted}
                style={{
                  padding: '4px 10px',
                  background: isTokenExhausted ? '#f3f4f6' : '#f9fafb',
                  border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '10px',
                  color: isTokenExhausted ? '#9ca3af' : '#374151',
                  cursor: isTokenExhausted ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s',
                }}
                onMouseEnter={e => { if (!isTokenExhausted) { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fde68a'; } }}
                onMouseLeave={e => { if (!isTokenExhausted) { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; } }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Input row */}
        <div style={{ padding: '4px 10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={
              tokenLoading       ? 'Loading…'
              : isTokenExhausted ? 'Token limit reached — try tomorrow'
              : 'Ask about flights, hotels, weather, visa…'
            }
            disabled={isTokenExhausted || tokenLoading}
            style={{
              flex: 1, border: '1px solid #e5e7eb', borderRadius: '20px',
              padding: '8px 14px', fontSize: '12px', outline: 'none',
              color: isTokenExhausted ? '#9ca3af' : '#111827',
              background: isTokenExhausted ? '#f3f4f6' : '#fafafa',
              cursor: isTokenExhausted ? 'not-allowed' : 'text',
            }}
            onFocus={e => { if (!isTokenExhausted) { e.target.style.borderColor = GOLD; e.target.style.background = '#fff'; } }}
            onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = isTokenExhausted ? '#f3f4f6' : '#fafafa'; }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || isTokenExhausted || tokenLoading}
            style={{
              width: '34px', height: '34px', flexShrink: 0,
              background: (loading || !input.trim() || isTokenExhausted) ? '#e5e7eb' : GOLD,
              border: 'none', borderRadius: '50%',
              cursor: (loading || !input.trim() || isTokenExhausted) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
            }}
            onMouseEnter={e => { if (!loading && input.trim() && !isTokenExhausted) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke={(loading || !input.trim() || isTokenExhausted) ? '#9ca3af' : '#1a1a1a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes aichat-bounce {
          0%,60%,100%{ transform:translateY(0); }
          30%{ transform:translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function BubbleUser({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
      <div style={{ background: GOLD, color: '#1a1a1a', fontSize: '12px', borderRadius: '16px 16px 4px 16px', padding: '8px 12px', maxWidth: '85%', lineHeight: '1.5', boxShadow: '0 1px 3px rgba(0,0,0,.08)', fontWeight: 500 }}>
        {text}
      </div>
    </div>
  );
}

function BubbleAI({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
      <div style={{ background: '#fff', border: '1px solid #f3f4f6', color: '#374151', fontSize: '12px', borderRadius: '16px 16px 16px 4px', padding: '8px 12px', maxWidth: '95%', lineHeight: '1.6', boxShadow: '0 1px 3px rgba(0,0,0,.05)', whiteSpace: 'pre-wrap' }}>
        {parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)}
      </div>
    </div>
  );
}

function BubbleSystem({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
      <div style={{ background: '#fffbeb', color: '#92400e', fontSize: '10px', borderRadius: '20px', border: '1px solid #fde68a', padding: '3px 12px', fontWeight: 600 }}>
        {text}
      </div>
    </div>
  );
}

function GeniButton({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Close AI Chat"
      style={{
        width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
        cursor: 'pointer',
        background: hov
          ? 'radial-gradient(circle at 35% 30%, #FFE066, #F5A623 55%, #D97706)'
          : 'radial-gradient(circle at 35% 30%, #FFD166, #F5A623 55%, #E09510)',
        border: '2px solid #fff',
        boxShadow: hov
          ? '0 0 0 3px rgba(245,166,35,.3), 0 4px 12px rgba(245,166,35,.5)'
          : '0 0 0 2px rgba(245,166,35,.15), 0 2px 6px rgba(245,166,35,.35)',
        transform: hov ? 'scale(1.12)' : 'scale(1)',
        transition: 'all .18s cubic-bezier(.34,1.56,.64,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
        <line x1="40" y1="18" x2="40" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="40" cy="8" r="4" fill="white" fillOpacity="0.9"/>
        <rect x="14" y="18" width="52" height="40" rx="14" fill="white" fillOpacity="0.22"/>
        <ellipse cx="30" cy="34" rx="7" ry="7" fill="white"/>
        <ellipse cx="30" cy="34" rx="4.5" ry="4.5" fill="#F5A623"/>
        <circle cx="30" cy="34" r="2.8" fill="#1a0a00"/>
        <circle cx="31.5" cy="32.5" r="1.1" fill="white"/>
        <ellipse cx="50" cy="34" rx="7" ry="7" fill="white"/>
        <ellipse cx="50" cy="34" rx="4.5" ry="4.5" fill="#F5A623"/>
        <circle cx="50" cy="34" r="2.8" fill="#1a0a00"/>
        <circle cx="51.5" cy="32.5" r="1.1" fill="white"/>
        <path d="M28 47 Q40 56 52 47" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
        <rect x="8" y="30" width="6" height="12" rx="3" fill="white" fillOpacity="0.5"/>
        <rect x="66" y="30" width="6" height="12" rx="3" fill="white" fillOpacity="0.5"/>
      </svg>
    </div>
  );
}