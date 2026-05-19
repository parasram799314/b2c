import { useEffect, useState } from 'react';
import { Icons } from '../ui/icons';

const LOADING_MESSAGES = [
  { icon: <Icons.Plane className="w-5 h-5 text-amber-500" />, text: 'Preparing your journey...' },
  { icon: <Icons.MapPin className="w-5 h-5 text-amber-500" />, text: 'Mapping your destinations...' },
  { icon: <Icons.Hotel className="w-5 h-5 text-amber-500" />, text: 'Finding the best stays...' },
  { icon: <Icons.Checklist className="w-5 h-5 text-amber-500" />, text: 'Building your itinerary...' },
  { icon: <Icons.Sparkles className="w-5 h-5 text-amber-500" />, text: 'Almost there...' },
];

const FLIGHT_PATH_DOTS = 7;

export default function TripLoader({ isVisible, destinations = [] }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dotIndex, setDotIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [planePos, setPlanePos] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    setMsgIndex(0);
    setProgress(0);
    setPlanePos(0);

    const msgInterval = setInterval(() => {
      setMsgIndex(p => (p + 1) % LOADING_MESSAGES.length);
    }, 1800);

    const dotInterval = setInterval(() => {
      setDotIndex(p => (p + 1) % FLIGHT_PATH_DOTS);
    }, 400);

    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return 92;
        return p + Math.random() * 8;
      });
    }, 600);

    const planeInterval = setInterval(() => {
      setPlanePos(p => (p + 1) % 100);
    }, 60);

    return () => {
      clearInterval(msgInterval);
      clearInterval(dotInterval);
      clearInterval(progressInterval);
      clearInterval(planeInterval);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const currentMsg = LOADING_MESSAGES[msgIndex];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgFade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes planeFly {
          0% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(4px) translateY(-3px); }
          50% { transform: translateX(0px) translateY(-5px); }
          75% { transform: translateX(-4px) translateY(-3px); }
          100% { transform: translateX(0px) translateY(0px); }
        }
        @keyframes trailFade {
          0% { opacity: 0.9; transform: scaleX(1); }
          100% { opacity: 0; transform: scaleX(0); }
        }
        @keyframes cloudDrift {
          0% { transform: translateX(0px); }
          50% { transform: translateX(12px); }
          100% { transform: translateX(0px); }
        }
        @keyframes cloudDrift2 {
          0% { transform: translateX(0px); }
          50% { transform: translateX(-10px); }
          100% { transform: translateX(0px); }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.6); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.92) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(245,166,35,0); }
        }
        @keyframes dottedTrail {
          0% { stroke-dashoffset: 200; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes progressGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(245,166,35,0.6); }
          50% { box-shadow: 0 0 20px rgba(245,166,35,0.9), 0 0 40px rgba(245,166,35,0.3); }
        }

        .trip-loader-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(10, 12, 25, 0.82);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: overlayIn 0.3s ease both;
          padding: 16px;
        }
        .trip-loader-card {
          background: #ffffff;
          border-radius: 28px;
          padding: 48px 52px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
          animation: cardIn 0.45s cubic-bezier(0.22,1,0.36,1) both 0.1s;
          position: relative;
          overflow: hidden;
          text-align: center;
        }
        .card-bg-glow {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
        }
        .card-bg-dots {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(245,166,35,0.08) 1px, transparent 1px);
          background-size: 28px 28px;
          pointer-events: none;
          opacity: 0.6;
        }
        .plane-stage {
          position: relative;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
        }
        .cloud {
          position: absolute;
          opacity: 0.55;
        }
        .cloud-1 { top: 20px; left: 30px; animation: cloudDrift 5s ease-in-out infinite; }
        .cloud-2 { bottom: 18px; right: 35px; animation: cloudDrift2 6s ease-in-out infinite; }
        .cloud-3 { top: 15px; right: 60px; animation: cloudDrift 7s ease-in-out infinite 1s; }
        .plane-orbit {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFF3DC, #FFEAB5);
          border: 2.5px solid #F5A623;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          animation: orbitPulse 2s ease-in-out infinite;
          z-index: 2;
        }
        .plane-icon {
          font-size: 32px;
          animation: planeFly 3s ease-in-out infinite;
          display: block;
          line-height: 1;
        }
        .orbit-ring {
          position: absolute;
          width: 108px;
          height: 108px;
          border-radius: 50%;
          border: 1.5px dashed rgba(245,166,35,0.3);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: spin 12s linear infinite;
        }
        .orbit-ring-2 {
          position: absolute;
          width: 136px;
          height: 136px;
          border-radius: 50%;
          border: 1px dashed rgba(245,166,35,0.15);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: spin 18s linear infinite reverse;
        }
        .orbit-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #F5A623;
          top: -3.5px;
          left: 50%;
          margin-left: -3.5px;
          box-shadow: 0 0 6px rgba(245,166,35,0.8);
        }

        .msg-wrap {
          min-height: 52px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }
        .msg-icon {
          font-size: 20px;
          margin-bottom: 6px;
          animation: msgFade 1.8s ease both;
        }
        .msg-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a2e;
          animation: msgFade 1.8s ease both;
          letter-spacing: -0.01em;
        }

        .progress-wrap {
          margin-bottom: 28px;
        }
        .progress-track {
          width: 100%;
          height: 6px;
          background: #f3f4f6;
          border-radius: 999px;
          overflow: visible;
          position: relative;
          margin-bottom: 10px;
        }
        .progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #F5A623, #FFD166);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          animation: progressGlow 1.5s ease-in-out infinite;
        }
        .progress-tip {
          position: absolute;
          right: -4px;
          top: 50%;
          transform: translateY(-50%);
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #F5A623;
          border: 2.5px solid #fff;
          box-shadow: 0 0 8px rgba(245,166,35,0.7);
        }
        .progress-label {
          display: flex;
          justify-content: space-between;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .progress-pct {
          color: #F5A623;
          font-weight: 800;
        }

        .flight-dots {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 28px;
        }
        .flight-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          transition: background 0.3s;
        }
        .flight-dot.active {
          background: #F5A623;
          box-shadow: 0 0 6px rgba(245,166,35,0.6);
        }
        .flight-dot.done {
          background: #FFD166;
        }
        .flight-line {
          width: 20px;
          height: 2px;
          background: linear-gradient(90deg, #e5e7eb, #e5e7eb);
          border-radius: 1px;
          transition: background 0.3s;
        }
        .flight-line.done {
          background: linear-gradient(90deg, #F5A623, #FFD166);
        }

        .trip-header {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 26px;
          font-weight: 900;
          color: #111827;
          margin-bottom: 4px;
          letter-spacing: -0.03em;
          animation: fadeInDown 0.5s ease both 0.2s;
        }
        .trip-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #9ca3af;
          font-weight: 500;
          margin-bottom: 32px;
          animation: fadeInDown 0.5s ease both 0.3s;
        }
        .dest-tags {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 28px;
          animation: fadeInUp 0.5s ease both 0.4s;
        }
        .dest-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #FFF3DC;
          border: 1.5px solid #F5A623;
          border-radius: 999px;
          padding: 4px 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #D97706;
        }
        .dest-arrow {
          color: #F5A623;
          font-size: 14px;
          font-weight: 700;
        }

        .shimmer-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: linear-gradient(90deg, #FFF3DC 25%, #FFD166 50%, #FFF3DC 75%);
          background-size: 200% auto;
          color: #D97706;
          border: 1.5px solid #F5A623;
          animation: shimmer 2s linear infinite;
        }
      `}</style>

      <div className="trip-loader-overlay">
        <div className="trip-loader-card">
          <div className="card-bg-glow" />
          <div className="card-bg-dots" />

          {/* Title */}
          <div className="trip-header">Create trip manually</div>
          <div className="trip-sub">Please wait for some time</div>

          {/* Destination tags */}
          {destinations.length > 0 && (
            <div className="dest-tags">
              {destinations.map((d, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="dest-tag">
                    📍 {d.destination || d.city || `Stop ${i + 1}`}
                  </span>
                  {i < destinations.length - 1 && <span className="dest-arrow">→</span>}
                </span>
              ))}
            </div>
          )}

          {/* Animated plane stage */}
          <div className="plane-stage">
            {/* Clouds */}
            <div className="cloud cloud-1">
              <svg width="52" height="28" viewBox="0 0 52 28" fill="none">
                <ellipse cx="26" cy="20" rx="22" ry="8" fill="#f3f4f6"/>
                <ellipse cx="18" cy="16" rx="12" ry="9" fill="#f3f4f6"/>
                <ellipse cx="32" cy="14" rx="10" ry="8" fill="#f3f4f6"/>
              </svg>
            </div>
            <div className="cloud cloud-2">
              <svg width="40" height="22" viewBox="0 0 40 22" fill="none">
                <ellipse cx="20" cy="16" rx="17" ry="6" fill="#f3f4f6"/>
                <ellipse cx="14" cy="13" rx="9" ry="7" fill="#f3f4f6"/>
                <ellipse cx="26" cy="11" rx="8" ry="7" fill="#f3f4f6"/>
              </svg>
            </div>
            <div className="cloud cloud-3">
              <svg width="32" height="18" viewBox="0 0 32 18" fill="none">
                <ellipse cx="16" cy="13" rx="13" ry="5" fill="#FFF3DC"/>
                <ellipse cx="11" cy="10" rx="7" ry="6" fill="#FFF3DC"/>
                <ellipse cx="21" cy="9" rx="6" ry="5" fill="#FFF3DC"/>
              </svg>
            </div>

            {/* Orbit rings + plane */}
            <div className="plane-orbit">
              <span className="plane-icon">✈️</span>
              <div className="orbit-ring">
                <div className="orbit-dot" />
              </div>
              <div className="orbit-ring-2" />
            </div>
          </div>

          {/* Animated message */}
          <div className="msg-wrap">
            <div className="msg-icon" key={`icon-${msgIndex}`}>{currentMsg.icon}</div>
            <div className="msg-text" key={`text-${msgIndex}`}>{currentMsg.text}</div>
          </div>

          {/* Flight dots path */}
          <div className="flight-dots">
            {Array.from({ length: FLIGHT_PATH_DOTS }).map((_, i) => {
              const active = i === dotIndex;
              const done = i < dotIndex;
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className={`flight-dot ${active ? 'active' : ''} ${done ? 'done' : ''}`} />
                  {i < FLIGHT_PATH_DOTS - 1 && <span className={`flight-line ${done ? 'done' : ''}`} />}
                </span>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="progress-wrap">
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min(progress, 92)}%` }}>
                <div className="progress-tip" />
              </div>
            </div>
            <div className="progress-label">
              <span>Processing trip</span>
              <span className="progress-pct">{Math.round(Math.min(progress, 92))}%</span>
            </div>
          </div>

          {/* Shimmer badge */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="shimmer-badge">
              <span>⚡</span> Powered by Travplatforms
            </span>
          </div>
        </div>
      </div>
    </>
  );
}