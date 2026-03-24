// components/detail/GenieChatButton.jsx

import { useEffect, useState } from 'react';

function GenieRobot({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="14" width="40" height="34" rx="12" fill="white" fillOpacity="0.22" />
      <rect x="14" y="16" width="36" height="30" rx="10" fill="white" fillOpacity="0.18" />
      <line x1="32" y1="14" x2="32" y2="7" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="32" cy="5" r="3" fill="white" fillOpacity="0.9" />
      <circle cx="24" cy="28" r="5" fill="white" />
      <circle cx="40" cy="28" r="5" fill="white" />
      <circle cx="24" cy="28" r="2.8" fill="#4f46e5" />
      <circle cx="40" cy="28" r="2.8" fill="#4f46e5" />
      <circle cx="25.2" cy="26.8" r="1" fill="white" />
      <circle cx="41.2" cy="26.8" r="1" fill="white" />
      <path d="M24 37 Q32 43 40 37" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="9" y="25" width="5" height="8" rx="2.5" fill="white" fillOpacity="0.5" />
      <rect x="50" y="25" width="5" height="8" rx="2.5" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

const STYLE_ID = 'genie-btn-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes genie-float {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes genie-pulse {
      0%   { transform: scale(1);    opacity: 0.55; }
      70%  { transform: scale(1.55); opacity: 0; }
      100% { transform: scale(1.55); opacity: 0; }
    }
    .genie-float { animation: genie-float 2.8s ease-in-out infinite; }
    .genie-pulse { animation: genie-pulse 2.2s ease-out infinite; }
    @keyframes genie-badge-pop {
      0%   { transform: scale(0); opacity: 0; }
      70%  { transform: scale(1.2); }
      100% { transform: scale(1);  opacity: 1; }
    }
    .genie-badge { animation: genie-badge-pop 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }
    @keyframes genie-tooltip-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .genie-tooltip { animation: genie-tooltip-in 0.18s ease forwards; }
  `;
  document.head.appendChild(s);
}

export default function GenieChatButton({ open, onToggle, unreadCount = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => { injectStyles(); }, []);

  // Chat panel open hai → Genie button hide (panel ka apna arrow handle karega)
  if (open) return null;

  // ── Hidden State: sirf ek side-tab dikhao wapas lane ke liye ──
  if (hidden) {
    return (
      <div
        onClick={() => setHidden(false)}
        title="Open Genie"
        style={{
          position: 'fixed', left: 0, bottom: 80, zIndex: 99999,
          background: 'rgb(247,190,57)',
          borderRadius: '0 10px 10px 0',
          padding: '10px 8px',
          cursor: 'pointer',
          boxShadow: '2px 2px 12px rgba(247,190,57,0.45)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          writingMode: 'vertical-rl',
          fontSize: '9px', fontWeight: 800, color: '#1a1a1a',
          letterSpacing: '0.1em',
          userSelect: 'none',
          transition: 'box-shadow 0.2s',
        }}
      >
        ✨ GENIE
      </div>
    );
  }

  const gradFrom = 'rgb(247,190,57)';
  const gradTo   = 'rgb(220,155,20)';

  return (
    <div style={{ position:'fixed', left:20, bottom:100, zIndex:99999, display:'flex', flexDirection:'column', alignItems:'center', userSelect:'none' }}>

      {/* Tooltip */}
      {hovered && (
        <div className="genie-tooltip" style={{ background:'#1f2937', color:'#f9fafb', fontSize:'11px', fontWeight:700, padding:'5px 12px', borderRadius:'20px', whiteSpace:'nowrap', pointerEvents:'none', marginBottom:'6px' }}>
          AI Assistant ✨
        </div>
      )}

      <div className="genie-float" style={{ position:'relative' }}>

        {/* Pulse ring */}
        <div className="genie-pulse" style={{ position:'absolute', top:0, left:0, width:'60px', height:'60px', borderRadius:'50%', background:gradFrom, pointerEvents:'none' }} />

        {/* ── Close (X) Button — top-right corner ── */}
        <button
          onClick={(e) => { e.stopPropagation(); setHidden(true); }}
          title="Hide Genie"
          style={{
            position: 'absolute', top: '-6px', right: '-6px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#1f2937', border: '2px solid #fff',
            color: '#fff', fontSize: '9px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 10, lineHeight: 1,
            boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            padding: 0,
          }}
        >
          ✕
        </button>

        {/* Main Genie Button */}
        <div
          style={{
            width:'60px', height:'60px', borderRadius:'50%',
            background:`radial-gradient(circle at 35% 35%, ${gradFrom}, ${gradTo})`,
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
            boxShadow: hovered ? '0 8px 28px rgba(247,190,57,0.6)' : '0 4px 18px rgba(247,190,57,0.4)',
            transition:'box-shadow 0.2s, transform 0.15s',
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
            position:'relative',
          }}
          onClick={onToggle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Click to open AI"
        >
          <GenieRobot size={36} />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div className="genie-badge" style={{ position:'absolute', top:'-4px', right:'-4px', width:'20px', height:'20px', borderRadius:'50%', background:'#ef4444', color:'#fff', fontSize:'10px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* GENIE label */}
      <span style={{ marginTop: '22px', fontSize:'9px', fontWeight:800, color:'rgb(220,155,20)', letterSpacing:'0.08em', whiteSpace:'nowrap', pointerEvents:'none' }}>
        GENIE
      </span>

    </div>
  );
}