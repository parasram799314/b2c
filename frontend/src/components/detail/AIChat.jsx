// components/detail/AIChat.jsx
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// ── Token config ──────────────────────────────────────────────────────────────
const MAX_TOKENS        = 2000;
const TOKENS_PER_CHAR_IN  = 0.25; // ~4 chars = 1 token
const TOKENS_PER_CHAR_OUT = 0.25;
// ─────────────────────────────────────────────────────────────────────────────

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
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [btnHovered,     setBtnHovered]     = useState(false);

  // ── Token state ─────────────────────────────────────────────────────────────

  const [tokensUsed,    setTokensUsed]    = useState(0);
  const [lastMsgTokens, setLastMsgTokens] = useState(0);
  const [tokenLoading,  setTokenLoading]  = useState(true);
  // ─────────────────────────────────────────────────────────────────────────────

  const bottomRef = useRef(null);

    useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await axios.get('/api/users/chat-tokens');
        if (res.data.success) {
          setTokensUsed(res.data.used);
        }
      } catch (err) {
        console.error('Token fetch failed:', err);
      } finally {
        setTokenLoading(false);
      }
    };
    fetchTokens();
  }, []);



  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Derived token values ───────────────────────────────────────────────────
  const tokensRemaining  = Math.max(0, MAX_TOKENS - tokensUsed);
  const tokenPct         = Math.min((tokensUsed / MAX_TOKENS) * 100, 100);
  const isTokenExhausted = tokensUsed >= MAX_TOKENS;

  const barColor = tokenPct > 80 ? '#ef4444' : tokenPct > 50 ? '#f59e0b' : '#4ade80';
  const dotColor = tokenPct > 80 ? '#f87171' : tokenPct > 50 ? '#f59e0b' : '#4ade80';
  const dotShadow = tokenPct > 80
    ? '0 0 0 3px rgba(248,113,113,0.2)'
    : tokenPct > 50
    ? '0 0 0 3px rgba(245,158,11,0.2)'
    : '0 0 0 3px rgba(74,222,128,0.2)';
  // ─────────────────────────────────────────────────────────────────────────────

 const sendMessage = async (text) => {
    if (!text.trim() || loading || isTokenExhausted || tokenLoading) return;

    // ── Block if tokens exhausted ──────────────────────────────────────────
    if (isTokenExhausted) return;

    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // 1. Backend Chat API call (Isi ke andar tokens minus ho jayenge ab)
      const res = await axios.post('/api/rfqs/chat', {
        rfqId:           rfq?.rfqId || rfq?._id,
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

      // Results update logic (Waisa hi hai)
      if (typeof onResults === 'function') {
        onResults({ hotels, flights, restaurants, attractions, raw: res.data });
      }

      // List formatting logic (Waisa hi hai)
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

      const fullReply = [reply, listText].filter(Boolean).join('\n\n');
      setMessages(prev => [...prev, { role: 'ai', text: fullReply }]);

      // 2. TOKEN UPDATE (Sirf ye change hua hai)
      // Backend ab reply ke saath 'used' tokens bhej raha hai, hum seedha wahi set karenge.
      if (res.data.used !== undefined) {
        setTokensUsed(res.data.used); 
        // Last message tokens calculate karlo sirf UI dikhane ke liye
        setLastMsgTokens(Math.ceil((userMsg.length + fullReply.length) * TOKENS_PER_CHAR_IN));
      }

      // ── Tab switching logic (Waisa hi hai) ──
      if      (hotels.length      > 0) onTabSwitch?.('hotels');
      else if (flights.length     > 0) onTabSwitch?.('flights');
      else if (restaurants.length > 0) onTabSwitch?.('restaurants');
      else if (attractions.length > 0) onTabSwitch?.('attractions');

    } catch (err) {
      console.error("Chat Error:", err);
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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>

        {/* Left: green dot + title + token bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: dotColor,
            display: 'inline-block', marginTop: '4px',
            boxShadow: dotShadow,
            flexShrink: 0,
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>AI Assistant</div>
            <div style={{ fontSize: '10px', color: '#9ca3af' }}>Ask anything about your trip</div>

            {/* ── Token bar ── */}
            <div style={{ marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <span style={{ fontSize: '9px', color: '#6b7280' }}>
                  Tokens:{' '}
                  <b style={{ color: isTokenExhausted ? '#ef4444' : '#111827' }}>
                    {tokensRemaining}
                  </b>{' '}
                  remaining
                </span>
                {lastMsgTokens > 0 && (
                  <span style={{ fontSize: '9px', color: '#9ca3af' }}>
                    Last msg: -{lastMsgTokens}
                  </span>
                )}
              </div>
              <div style={{
                width: '100%', height: '4px', background: '#f3f4f6',
                borderRadius: '999px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: '999px',
                  width: `${tokenPct}%`,
                  background: barColor,
                  transition: 'width 0.4s ease, background 0.3s ease',
                }} />
              </div>
            </div>
            {/* ── /Token bar ── */}

          </div>
        </div>

        {/* ── RIGHT: Genie Robot close button ── */}
        {onClose && (
          <div
            onClick={onClose}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            title="Close AI Chat"
            style={{
              width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
              cursor: 'pointer',
              background: btnHovered
                ? 'radial-gradient(circle at 35% 30%, #FFE066, #F5A623 55%, #D97706)'
                : 'radial-gradient(circle at 35% 30%, #FFD166, #F5A623 55%, #E09510)',
              border: '2px solid #fff',
              boxShadow: btnHovered
                ? '0 0 0 3px rgba(245,166,35,0.3), 0 4px 12px rgba(245,166,35,0.5)'
                : '0 0 0 2px rgba(245,166,35,0.15), 0 2px 6px rgba(245,166,35,0.35)',
              transform: btnHovered ? 'scale(1.12)' : 'scale(1)',
              transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', zIndex: 100000,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="40" y1="18" x2="40" y2="10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="40" cy="8" r="4" fill="white" fillOpacity="0.9" />
              <rect x="14" y="18" width="52" height="40" rx="14" fill="white" fillOpacity="0.22" />
              <ellipse cx="30" cy="34" rx="7" ry="7" fill="white" />
              <ellipse cx="30" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
              <circle cx="30" cy="34" r="2.8" fill="#1a0a00" />
              <circle cx="31.5" cy="32.5" r="1.1" fill="white" />
              <ellipse cx="50" cy="34" rx="7" ry="7" fill="white" />
              <ellipse cx="50" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
              <circle cx="50" cy="34" r="2.8" fill="#1a0a00" />
              <circle cx="51.5" cy="32.5" r="1.1" fill="white" />
              <path d="M28 47 Q40 56 52 47" stroke="white" strokeWidth="2.8" strokeLinecap="round" fill="none" />
              <ellipse cx="20" cy="42" rx="5" ry="3" fill="white" fillOpacity="0.25" />
              <ellipse cx="60" cy="42" rx="5" ry="3" fill="white" fillOpacity="0.25" />
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

        {/* Token exhausted message */}
        {isTokenExhausted && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
            <div style={{
              background: '#fef2f2', color: '#991b1b',
              fontSize: '10px', borderRadius: '20px',
              border: '1px solid #fecaca', padding: '4px 14px', fontWeight: 600,
            }}>
              Token limit reached. Chat unavailable.
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
                disabled={isTokenExhausted}
                style={{
                  padding: '4px 10px',
                  background: isTokenExhausted ? '#f3f4f6' : '#f9fafb',
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  fontSize: '10px',
                  color: isTokenExhausted ? '#9ca3af' : '#374151',
                  cursor: isTokenExhausted ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  opacity: isTokenExhausted ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!isTokenExhausted) {
                    e.currentTarget.style.background = '#fffbeb';
                    e.currentTarget.style.borderColor = '#fde68a';
                  }
                }}
                onMouseLeave={e => {
                  if (!isTokenExhausted) {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }
                }}
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
placeholder={tokenLoading ? 'Loading…' : isTokenExhausted ? 'Token limit reached — try tomorrow' : 'Ask anything about the trip…'}
disabled={isTokenExhausted || tokenLoading}
            style={{
              flex: 1, border: '1px solid #e5e7eb', borderRadius: '20px',
              padding: '8px 14px', fontSize: '12px', outline: 'none',
              color: isTokenExhausted ? '#9ca3af' : '#111827',
              background: isTokenExhausted ? '#f3f4f6' : '#fafafa',
              cursor: isTokenExhausted ? 'not-allowed' : 'text',
            }}
            onFocus={e => {
              if (!isTokenExhausted) {
                e.target.style.borderColor = 'rgb(247,190,57)';
                e.target.style.background = '#fff';
              }
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.background = isTokenExhausted ? '#f3f4f6' : '#fafafa';
            }}
          />
          <button
            onClick={() => sendMessage(input)}
           disabled={loading || !input.trim() || isTokenExhausted || tokenLoading}
            style={{
              width: '34px', height: '34px', flexShrink: 0,
              background: loading || !input.trim() || isTokenExhausted ? '#e5e7eb' : 'rgb(247,190,57)',
              border: 'none', borderRadius: '50%',
              cursor: loading || !input.trim() || isTokenExhausted ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading && input.trim() && !isTokenExhausted) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke={loading || !input.trim() || isTokenExhausted ? '#9ca3af' : '#1a1a1a'}
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