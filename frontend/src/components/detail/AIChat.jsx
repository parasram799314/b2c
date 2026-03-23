// components/detail/AIChat.jsx
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 600;

const QUICK_PROMPTS = [
  { label: '+ Cheap flights',    message: 'What are the cheapest flight options?',       tab: 'flights'     },
  { label: '🏨 5 star hotels',   message: 'Show me the best 5 star hotels available.',   tab: 'hotels'      },
  { label: '🗺️ Top attractions', message: 'What are the top attractions I should visit?', tab: 'attractions' },
  { label: '🍽️ Best food',       message: 'What are the best restaurants to try?',       tab: 'restaurants' },
  { label: '📋 Visa check',      message: 'What documents and visa do I need?',          tab: 'checklist'   },
  { label: '🌤️ Weather tips',    message: 'What should I pack based on the weather?',    tab: 'weather'     },
];

function BubbleUser({ text }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="bg-gold-500 text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] leading-relaxed shadow-sm">
        {text}
      </div>
    </div>
  );
}

function BubbleAI({ text }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-white border border-gray-100 text-gray-700 text-xs rounded-2xl rounded-tl-sm px-3 py-2 max-w-[95%] leading-relaxed shadow-sm whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

function BubbleSystem({ text }) {
  return (
    <div className="flex justify-center mb-3">
      <div className="bg-gold-50 text-gold-600 text-xs rounded-full border border-gold-200 px-3 py-1 font-medium">
        {text}
      </div>
    </div>
  );
}

export default function AIChat({ rfq, onTabSwitch, onResults }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: `Hi! I'm your AI travel assistant for your ${
        rfq?.destinations?.map(d => d.destination).join(' & ') || 'trip'
      }. Ask me anything about your itinerary, or use the quick buttons below!`,
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(360);
  const bottomRef = useRef(null);
  const dragRef = useRef({ dragging: false, startX: 0, startWidth: 360 });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const clientX = 'touches' in e ? e.touches?.[0]?.clientX : e.clientX;
      if (typeof clientX !== 'number') return;
      const dx = clientX - dragRef.current.startX;
      const next = Math.min(MAX_CHAT_WIDTH, Math.max(MIN_CHAT_WIDTH, dragRef.current.startWidth + dx));
      setPanelWidth(next);
    };
    const onUp = () => {
      dragRef.current.dragging = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

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

      const reply = res.data?.reply_text || res.data?.reply || 'Sorry, I could not answer that.';
      const hotels = res.data?.hotels || [];
      const flights = res.data?.flights || [];
      const restaurants = res.data?.restaurants || [];
      const attractions = res.data?.attractions || [];

      // Push structured results up to the parent so tabs can render them
      if (typeof onResults === 'function') {
        onResults({ hotels, flights, restaurants, attractions, raw: res.data });
      }

      // Keep chat text-based: show a clean list + "View Details" hint
      let listText = '';
      if (Array.isArray(hotels) && hotels.length > 0) {
        listText = hotels.slice(0, 3).map((h, idx) => {
          const price = h.price_per_night?.amount ? `${h.price_per_night.currency} ${h.price_per_night.amount}/night` : 'Price on request';
          const rating = h.rating ? `⭐ ${h.rating}` : '⭐ —';
          return `${idx + 1}. ${h.hotel_name}\n   ${rating}\n   Price: ${price}\n   [View Details]`;
        }).join('\n\n');
      } else if (Array.isArray(flights) && flights.length > 0) {
        listText = flights.slice(0, 3).map((f, idx) => {
          const price = f.price?.amount ? `${f.price.currency} ${f.price.amount}` : 'Price on request';
          return `${idx + 1}. ${f.origin_label || f.origin} → ${f.destination_label || f.destination}\n   ${f.airline} ${f.flight_number}\n   ${f.departure_time} → ${f.arrival_time} · ${f.duration}\n   Price: ${price}\n   [View Details]`;
        }).join('\n\n');
      }

      setMessages(prev => [...prev, { role: 'ai', text: [reply, listText].filter(Boolean).join('\n\n') }]);

      // Auto-switch tab based on returned structured results (language-agnostic)
      if (Array.isArray(hotels) && hotels.length > 0) onTabSwitch?.('hotels');
      else if (Array.isArray(flights) && flights.length > 0) onTabSwitch?.('flights');
      else if (Array.isArray(restaurants) && restaurants.length > 0) onTabSwitch?.('restaurants');
      else if (Array.isArray(attractions) && attractions.length > 0) onTabSwitch?.('attractions');

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Sorry, I had trouble connecting. Please try again.',
      }]);
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
    <div
      className="border-r border-gray-100 bg-white flex flex-col flex-shrink-0 overflow-hidden relative h-full"
      style={{ width: panelWidth }}
    >
      {/* Drag handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize"
        onMouseDown={(e) => {
          dragRef.current.dragging = true;
          dragRef.current.startX = e.clientX;
          dragRef.current.startWidth = panelWidth;
        }}
        onTouchStart={(e) => {
          const x = e.touches?.[0]?.clientX;
          if (typeof x !== 'number') return;
          dragRef.current.dragging = true;
          dragRef.current.startX = x;
          dragRef.current.startWidth = panelWidth;
        }}
        className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-gold-100/60 active:bg-gold-200/70 transition-colors"
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-bold text-gray-900">AI Assistant</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5">Ask anything about your trip</div>
      </div>

      {/* Messages - Takes remaining space */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {messages.map((msg, i) => (
          msg.role === 'user'   ? <BubbleUser   key={i} text={msg.text} /> :
          msg.role === 'system' ? <BubbleSystem key={i} text={msg.text} /> :
                                  <BubbleAI     key={i} text={msg.text} />
        ))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Bottom Section - Search Bar at Bottom */}
      <div className="flex-shrink-0 border-t border-gray-100 bg-white">
        {/* Quick prompts */}
        <div className="px-3 py-2">
          <div className="flex gap-1.5 flex-wrap">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleQuick(p)}
                disabled={loading}
                className="text-xs bg-gray-50 border border-gray-200 hover:border-gold-300 hover:bg-gold-50 text-gray-600 hover:text-gold-700 rounded-full px-2.5 py-1 transition-all whitespace-nowrap"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input - Search Bar at Bottom */}
        <div className="px-3 pb-3">
          <div className="flex gap-2 items-center">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask anything about the trip…"
              className="flex-1 border border-gray-200 rounded-2xl px-3 py-2 text-xs outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-100 placeholder-gray-300 transition-all"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-8 h-8 bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}