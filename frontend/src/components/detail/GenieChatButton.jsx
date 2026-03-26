// components/detail/GenieChatButton.jsx

import { useEffect, useState } from 'react';

// ─── ANIMATED GENIE ROBOT SVG ─────────────────────────────────
function GenieRobot({ size = 60 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="genie-robot-svg"
    >
      {/* Antenna base */}
      <line x1="40" y1="16" x2="40" y2="7" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Antenna ball glow */}
      <circle cx="40" cy="5" r="4.5" fill="white" fillOpacity="0.3" />
      <circle cx="40" cy="5" r="3" fill="white" />

      {/* Head/Body — slightly tilting via CSS */}
      <g className="genie-head">
        {/* Head shadow */}
        <rect x="13" y="16" width="54" height="42" rx="16" fill="rgba(0,0,0,0.12)" transform="translate(1,2)" />
        {/* Head body */}
        <rect x="13" y="16" width="54" height="42" rx="16" fill="white" fillOpacity="0.18" />
        <rect x="15" y="18" width="50" height="38" rx="14" fill="white" fillOpacity="0.15" />

        {/* ── LEFT EYE ── */}
        <g className="genie-eye-left">
          <ellipse cx="30" cy="34" rx="7" ry="7" fill="white" />
          <ellipse cx="30" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
          <circle cx="30" cy="34" r="2.8" fill="#1a0a00" />
          <circle cx="31.2" cy="32.8" r="1.1" fill="white" />
          <ellipse cx="30" cy="28" rx="7" ry="0.5" fill="#F5A623" className="genie-eyelid-left" />
        </g>

        {/* ── RIGHT EYE ── */}
        <g className="genie-eye-right">
          <ellipse cx="50" cy="34" rx="7" ry="7" fill="white" />
          <ellipse cx="50" cy="34" rx="4.5" ry="4.5" fill="#F5A623" />
          <circle cx="50" cy="34" r="2.8" fill="#1a0a00" />
          <circle cx="51.2" cy="32.8" r="1.1" fill="white" />
          <ellipse cx="50" cy="28" rx="7" ry="0.5" fill="#F5A623" className="genie-eyelid-right" />
        </g>

        {/* ── MOUTH ── */}
        <path
          d="M28 47 Q40 55 52 47"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          className="genie-mouth"
        />

        {/* Cheek blush left */}
        <ellipse cx="20" cy="42" rx="5" ry="3" fill="#FFD166" fillOpacity="0.4" />
        {/* Cheek blush right */}
        <ellipse cx="60" cy="42" rx="5" ry="3" fill="#FFD166" fillOpacity="0.4" />
      </g>

      {/* Ears / side panels */}
      <rect x="8" y="30" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.4" />
      <rect x="65" y="30" width="7" height="12" rx="3.5" fill="white" fillOpacity="0.4" />
    </svg>
  );
}

// ─── STYLE INJECTION ─────────────────────────────────────────
const STYLE_ID = 'genie-btn-styles-v2';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes genie-float {
      0%,100% { transform: translateY(0px) rotate(0deg); }
      30%      { transform: translateY(-7px) rotate(-2deg); }
      70%      { transform: translateY(-4px) rotate(2deg); }
    }
    .genie-float { animation: genie-float 3.2s ease-in-out infinite; }

    @keyframes genie-pulse {
      0%   { transform: scale(1);    opacity: 0.6; }
      70%  { transform: scale(1.65); opacity: 0; }
      100% { transform: scale(1.65); opacity: 0; }
    }
    .genie-pulse { animation: genie-pulse 2.4s ease-out infinite; }

    @keyframes genie-pulse2 {
      0%   { transform: scale(1);    opacity: 0.35; }
      70%  { transform: scale(1.85); opacity: 0; }
      100% { transform: scale(1.85); opacity: 0; }
    }
    .genie-pulse2 { animation: genie-pulse2 2.4s ease-out infinite 0.8s; }

    @keyframes genie-head-sway {
      0%,100% { transform: rotate(0deg) translateX(0px); }
      20%     { transform: rotate(-6deg) translateX(-2px); }
      50%     { transform: rotate(5deg) translateX(2px); }
      80%     { transform: rotate(-3deg) translateX(-1px); }
    }
    .genie-head {
      transform-origin: 40px 58px;
      animation: genie-head-sway 4s ease-in-out infinite;
    }

    @keyframes genie-blink {
      0%, 90%, 100% { ry: 0.5; cy: 28; }
      94%            { ry: 7;   cy: 34; }
    }
    .genie-eyelid-left  { animation: genie-blink 4s ease-in-out infinite; }
    .genie-eyelid-right { animation: genie-blink 4s ease-in-out infinite 0.05s; }

    @keyframes genie-pupil-look {
      0%,100% { transform: translate(0px, 0px); }
      20%     { transform: translate(-1.5px, 1px); }
      40%     { transform: translate(1.5px, -1px); }
      60%     { transform: translate(0px, 1.5px); }
      80%     { transform: translate(-1px, -1.5px); }
    }
    .genie-eye-left circle,
    .genie-eye-right circle {
      animation: genie-pupil-look 5s ease-in-out infinite;
    }

    @keyframes genie-smile {
      0%,100% { d: path("M28 47 Q40 55 52 47"); }
      50%     { d: path("M29 46 Q40 57 51 46"); }
    }
    .genie-mouth { animation: genie-smile 3s ease-in-out infinite; }

    @keyframes genie-antenna-glow {
      0%,100% { filter: drop-shadow(0 0 3px rgba(255,220,100,0.8)); }
      50%     { filter: drop-shadow(0 0 10px rgba(255,220,100,1)); }
    }
    .genie-robot-svg { animation: genie-antenna-glow 2s ease-in-out infinite; }

    @keyframes genie-badge-pop {
      0%   { transform: scale(0); opacity: 0; }
      70%  { transform: scale(1.3); }
      100% { transform: scale(1);  opacity: 1; }
    }
    .genie-badge { animation: genie-badge-pop 0.4s cubic-bezier(.34,1.56,.64,1) forwards; }

    @keyframes genie-tooltip-in {
      from { opacity: 0; transform: translateY(6px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .genie-tooltip { animation: genie-tooltip-in 0.22s cubic-bezier(.34,1.56,.64,1) forwards; }

    @keyframes genie-star {
      0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
      40%,60% { opacity: 1; transform: scale(1) rotate(180deg); }
    }
    .genie-star-1 { animation: genie-star 3s ease-in-out infinite 0s; }
    .genie-star-2 { animation: genie-star 3s ease-in-out infinite 1s; }
    .genie-star-3 { animation: genie-star 3s ease-in-out infinite 2s; }

    @keyframes genie-orbit {
      from { transform: rotate(0deg) translateX(38px) rotate(0deg); }
      to   { transform: rotate(360deg) translateX(38px) rotate(-360deg); }
    }
    .genie-orbit-dot {
      position: absolute;
      top: 50%; left: 50%;
      width: 7px; height: 7px;
      margin: -3.5px;
      border-radius: 50%;
      background: rgba(255,220,80,0.9);
      box-shadow: 0 0 8px rgba(255,220,80,1);
      animation: genie-orbit 3s linear infinite;
    }
    .genie-orbit-dot-2 {
      animation-delay: -1.5s;
      background: rgba(255,255,255,0.8);
      box-shadow: 0 0 6px white;
    }

    @keyframes genie-label-shimmer {
      0%,100% { opacity: 0.8; letter-spacing: 0.08em; }
      50%     { opacity: 1;   letter-spacing: 0.14em; }
    }
    .genie-label { animation: genie-label-shimmer 2.5s ease-in-out infinite; }

    @keyframes genie-ring-spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .genie-ring {
      position: absolute; inset: -4px;
      border-radius: 50%;
      border: 2.5px dashed rgba(255,220,80,0.5);
      animation: genie-ring-spin 8s linear infinite;
    }
    .genie-ring-2 {
      position: absolute; inset: -8px;
      border-radius: 50%;
      border: 1.5px dashed rgba(255,220,80,0.25);
      animation: genie-ring-spin 12s linear infinite reverse;
    }
  `;
  document.head.appendChild(s);
}

// ─── STAR SVG ────────────────────────────────────────────────
function Star({ size = 12, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
// Props:
//   open        — boolean : chat panel khula hai ya nahi
//   onToggle    — function: Genie face click karo → chat KHULTA hai
//   onClose     — function: ✕ button click karo  → chat BAND hota hai  ← ONLY CHANGE
//   unreadCount — number  : badge count (optional)
export default function GenieChatButton({ open, onToggle, onClose, unreadCount = 0 }) {
  const [hovered, setHovered] = useState(false);
  useEffect(() => { injectStyles(); }, []);

  // Chat khula ho toh floating Genie dikhao hi mat
  if (open) return null;

  return (
    <div style={{
      position: 'fixed', left: 20, bottom: 90, zIndex: 99999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      userSelect: 'none',
    }}>

      {/* ── Tooltip (hover pe dikhta hai) ── */}
      {hovered && (
        <div className="genie-tooltip" style={{
          background: 'linear-gradient(135deg, #1f2937, #111827)',
          color: '#FFD166', fontSize: '11px', fontWeight: 800,
          padding: '6px 14px', borderRadius: '20px',
          whiteSpace: 'nowrap', pointerEvents: 'none',
          marginBottom: '8px',
          border: '1px solid rgba(245,166,35,0.3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          letterSpacing: '0.04em',
        }}>
          ✨ Ask AI anything!
        </div>
      )}

      {/* ── Floating sparkle stars ── */}
      <div style={{ position: 'absolute', top: -18, left: -14, color: '#FFD166', zIndex: 1 }}>
        <Star size={10} style={{ display: 'block' }} className="genie-star-1" />
      </div>
      <div style={{ position: 'absolute', top: -8, right: -16, color: '#FFF', zIndex: 1 }}>
        <Star size={7} className="genie-star-2" />
      </div>
      <div style={{ position: 'absolute', bottom: 28, right: -12, color: '#FFD166', zIndex: 1 }}>
        <Star size={8} className="genie-star-3" />
      </div>

      {/* ── Float wrapper ── */}
      <div className="genie-float" style={{ position: 'relative' }}>

        {/* Outer slow pulse */}
        <div className="genie-pulse2" style={{
          position: 'absolute', top: 0, left: 0,
          width: '68px', height: '68px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.5), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Inner fast pulse */}
        <div className="genie-pulse" style={{
          position: 'absolute', top: 0, left: 0,
          width: '68px', height: '68px', borderRadius: '50%',
          background: 'rgba(245,166,35,0.55)',
          pointerEvents: 'none',
        }} />

        {/* Spinning dashed rings */}
        <div className="genie-ring" />
        <div className="genie-ring-2" />

        {/* Orbiting dots */}
        <div className="genie-orbit-dot" />
        <div className="genie-orbit-dot genie-orbit-dot-2" />

        {/* ══════════════════════════════════════════
            ✕ CLOSE BUTTON — ONLY CHANGE FROM ORIGINAL
            Pehle: setHidden(true)  → side tab mein chhupaata tha
            Ab:    onClose()        → chat panel band karta hai
        ══════════════════════════════════════════ */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClose) onClose();
          }}
          title="Close AI Chat"
          style={{
            position: 'absolute', top: -5, right: -5,
            width: '20px', height: '20px', borderRadius: '50%',
            background: '#1f2937', border: '2px solid #FFD166',
            color: '#FFD166', fontSize: '9px', fontWeight: 900,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 20,
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            padding: 0, lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* ── Main Genie Button — click to OPEN chat ── */}
        <div
          onClick={onToggle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '68px', height: '68px', borderRadius: '50%',
            background: hovered
              ? 'radial-gradient(circle at 35% 30%, #FFE066, #F5A623 55%, #D97706)'
              : 'radial-gradient(circle at 35% 30%, #FFD166, #F5A623 55%, #E09510)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: hovered
              ? '0 0 0 4px rgba(245,166,35,0.25), 0 8px 32px rgba(245,166,35,0.7), 0 2px 8px rgba(0,0,0,0.2)'
              : '0 0 0 3px rgba(245,166,35,0.15), 0 6px 22px rgba(245,166,35,0.5), 0 2px 6px rgba(0,0,0,0.15)',
            transition: 'box-shadow 0.25s, background 0.25s, transform 0.15s',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
            position: 'relative',
          }}
        >
          <GenieRobot size={52} />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <div className="genie-badge" style={{
              position: 'absolute', top: '-3px', right: '-3px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff', fontSize: '10px', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* ── GENIE label ── */}
      <span className="genie-label" style={{
        marginTop: '26px',
        fontSize: '9px', fontWeight: 900,
        background: 'linear-gradient(90deg, #F5A623, #FFD166, #F5A623)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        textShadow: 'none',
      }}>
        ✦ GENIE ✦
      </span>
    </div>
  );
}