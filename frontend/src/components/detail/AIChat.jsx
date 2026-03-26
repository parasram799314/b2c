// components/detail/AIChat.jsx
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const QUICK_PROMPTS = [
  { label: '✈️ Cheap flights',    message: 'What are the cheapest flight options?',        tab: 'flights'     },
  { label: '🏨 5 star hotels',    message: 'Show me the best 5 star hotels available.',    tab: 'hotels'      },
  { label: '🗺️ Top attractions',  message: 'What are the top attractions I should visit?', tab: 'attractions' },
  { label: '🍽️ Best food',        message: 'What are the best restaurants to try?',        tab: 'restaurants' },
  { label: '📋 Visa check',       message: 'What documents and visa do I need?',           tab: 'checklist'   },
  { label: '🌤️ Weather tips',     message: 'What should I pack based on the weather?',     tab: 'weather'     },
];

function BubbleUser({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
      <div style={{
        background: 'rgb(247,190,57)', color: '#1a1a1a',
        fontSize: '12px', borderRadius: '16px 16px 4px 16px',
        padding: '8px 12px', maxWidth: '85%', lineHeight: '1.5',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontWeight: 500,
      }}>
        {text}
      </div>
    </div>
  );
}

function BubbleAI({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
      <div style={{
        background: '#fff', border: '1px solid #f3f4f6', color: '#374151',
        fontSize: '12px', borderRadius: '16px 16px 16px 4px',
        padding: '8px 12px', maxWidth: '95%', lineHeight: '1.6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>
    </div>
  );
}

function BubbleSystem({ text }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
      <div style={{
        background: '#fffbeb', color: '#92400e',
        fontSize: '10px', borderRadius: '20px',
        border: '1px solid #fde68a', padding: '3px 12px', fontWeight: 600,
      }}>
        {text}
      </div>
    </div>
  );
}

export default function AIChat({ rfq, onTabSwitch, onResults, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi! I'm your AI travel assistant for your ${
        rfq?.destinations?.map(d => d.destination).join(' & ') || 'trip'
      }. Ask me anything about your itinerary, or use the quick buttons below!`,
    },
  ]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const res = await axios.post('/api/rfqs/chat', {
        rfqId:           rfq?._id,
        itinerary:       rfq?.itinerary || '',
        destinations:    rfq?.destinations || [],
        destinationData: rfq?.destinationData || [],
        guestCountry:    rfq?.guestCountry || '',
        message:         userMsg,
      });
      const reply       = res.data?.reply_text || res.data?.reply || 'Sorry, I could not answer that.';
      const hotels      = res.data?.hotels      || [];
      const flights     = res.data?.flights     || [];
      const restaurants = res.data?.restaurants || [];
      const attractions = res.data?.attractions || [];

      if (typeof onResults === 'function') {
        onResults({ hotels, flights, restaurants, attractions, raw: res.data });
      }

      let listText = '';
      if (hotels.length > 0) {
        listText = hotels.slice(0, 3).map((h, idx) => {
          const price  = h.price_per_night?.amount ? `${h.price_per_night.currency} ${h.price_per_night.amount}/night` : 'Price on request';
          const rating = h.rating ? `⭐ ${h.rating}` : '⭐ —';
          return `${idx + 1}. ${h.hotel_name}\n   ${rating}\n   Price: ${price}`;
        }).join('\n\n');
      } else if (flights.length > 0) {
        listText = flights.slice(0, 3).map((f, idx) => {
          const price = f.price?.amount ? `${f.price.currency} ${f.price.amount}` : 'Price on request';
          return `${idx + 1}. ${f.origin_label || f.origin} → ${f.destination_label || f.destination}\n   ${f.airline} ${f.flight_number}\n   ${f.departure_time} → ${f.arrival_time} · ${f.duration}\n   Price: ${price}`;
        }).join('\n\n');
      }

      setMessages(prev => [...prev, { role: 'ai', text: [reply, listText].filter(Boolean).join('\n\n') }]);

      if      (hotels.length      > 0) onTabSwitch?.('hotels');
      else if (flights.length     > 0) onTabSwitch?.('flights');
      else if (restaurants.length > 0) onTabSwitch?.('restaurants');
      else if (attractions.length > 0) onTabSwitch?.('attractions');

    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I had trouble connecting. Please try again.' }]);
    }
    setLoading(false);
  };

  const handleQuick = (prompt) => {
    if (prompt.tab) {
      onTabSwitch?.(prompt.tab);
      setMessages(prev => [...prev, { role: 'system', text: `↗ Switched to ${prompt.tab} tab` }]);
    }
    sendMessage(prompt.message);
  };

  return (
    <div style={{
      background: '#fff', display: 'flex', flexDirection: 'column',
      height: '100%', width: '100%', overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '10px 12px 8px',
        borderBottom: '1px solid #f3f4f6',
        flexShrink: 0,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>

        {/* Left: green dot + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: '#4ade80', display: 'inline-block',
            boxShadow: '0 0 0 3px rgba(74,222,128,0.2)', flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>AI Assistant</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>Ask anything about your trip</div>
          </div>
        </div>

        {/* ── RIGHT: Chota Genie Robot close button ── */}
        {onClose && (
          <div
            onClick={onClose}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            title="Close AI Chat"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              flexShrink: 0,
              cursor: 'pointer',
              // ── Golden circle background — same as floating genie ──
              background: btnHovered
                ? 'radial-gradient(circle at 35% 30%, #FFE066, #F5A623 55%, #D97706)'
                : 'radial-gradient(circle at 35% 30%, #FFD166, #F5A623 55%, #E09510)',
              border: '2px solid #fff',
              boxShadow: btnHovered
                ? '0 0 0 3px rgba(245,166,35,0.3), 0 4px 12px rgba(245,166,35,0.5)'
                : '0 0 0 2px rgba(245,166,35,0.15), 0 2px 6px rgba(245,166,35,0.35)',
              transform: btnHovered ? 'scale(1.12)' : 'scale(1)',
              transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              zIndex: 100000,
            }}
          >
            {/*
              ── GENIE ROBOT FACE — exact same SVG as GenieChatButton's GenieRobot
              but without className animations (those need CSS injection)
              The golden background comes from the parent div's background style
            ──────────────────────────────────────────────────────────────────── */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Antenna */}
              <line x1="40" y1="18" x2="40" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="40" cy="8" r="4" fill="white" fillOpacity="0.9" />

              {/* Head rect */}
              <rect x="14" y="18" width="52" height="40" rx="14" fill="white" fillOpacity="0.22" />

              {/* Left eye */}
              <ellipse cx="30" cy="34" rx="7" ry="7" fill="white" />
              <ellipse cx="30" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
              <circle cx="30" cy="34" r="2.8" fill="#1a0a00" />
              <circle cx="31.5" cy="32.5" r="1.1" fill="white" />

              {/* Right eye */}
              <ellipse cx="50" cy="34" rx="7" ry="7" fill="white" />
              <ellipse cx="50" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
              <circle cx="50" cy="34" r="2.8" fill="#1a0a00" />
              <circle cx="51.5" cy="32.5" r="1.1" fill="white" />

              {/* Smile */}
              <path d="M28 47 Q40 56 52 47" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />

              {/* Cheeks */}
              <ellipse cx="20" cy="42" rx="5" ry="3" fill="white" fillOpacity="0.25" />
              <ellipse cx="60" cy="42" rx="5" ry="3" fill="white" fillOpacity="0.25" />

              {/* Ears */}
              <rect x="8" y="30" width="6" height="12" rx="3" fill="white" fillOpacity="0.5" />
              <rect x="66" y="30" width="6" height="12" rx="3" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
        {messages.map((msg, i) => (
          msg.role === 'user'   ? <BubbleUser   key={i} text={msg.text} /> :
          msg.role === 'system' ? <BubbleSystem key={i} text={msg.text} /> :
                                  <BubbleAI     key={i} text={msg.text} />
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              background: '#fff', border: '1px solid #f3f4f6',
              borderRadius: '16px 16px 16px 4px', padding: '10px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0, 150, 300].map(delay => (
                  <span key={delay} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: '#d1d5db', display: 'inline-block',
                    animation: 'aichat-bounce 1.2s infinite',
                    animationDelay: `${delay}ms`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Bottom: Quick prompts + Input ── */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #f3f4f6', background: '#fff' }}>

        {/* Quick Prompts */}
        <div style={{ padding: '8px 10px 6px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: '6px', whiteSpace: 'nowrap' }}>
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleQuick(p)}
                style={{
                  padding: '4px 10px', background: '#f9fafb',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '10px', color: '#374151', cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fffbeb'; e.currentTarget.style.borderColor = '#fde68a'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#e5e7eb'; }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Row */}
        <div style={{ padding: '4px 10px 12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder="Ask anything about the trip…"
            style={{
              flex: 1, border: '1px solid #e5e7eb', borderRadius: '20px',
              padding: '8px 14px', fontSize: '12px', outline: 'none',
              color: '#111827', background: '#fafafa',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgb(247,190,57)'; e.target.style.background = '#fff'; }}
            onBlur={e  => { e.target.style.borderColor = '#e5e7eb'; e.target.style.background = '#fafafa'; }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: '34px', height: '34px', flexShrink: 0,
              background: loading || !input.trim() ? '#e5e7eb' : 'rgb(247,190,57)',
              border: 'none', borderRadius: '50%',
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading && input.trim()) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke={loading || !input.trim() ? '#9ca3af' : '#1a1a1a'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes aichat-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}