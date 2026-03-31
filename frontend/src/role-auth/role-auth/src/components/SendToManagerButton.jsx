// ============================================================
//  SendToManagerButton.jsx
//
//  USAGE — Jahan bhi user ke page pe trigger button lagana ho:
//
//    import SendToManagerButton from '../role-auth/src/components/SendToManagerButton';
//    <SendToManagerButton rfq={currentRfq} />
//
//  Props:
//    rfq   — the rfq/trip object (from your existing app state)
//    style — optional extra styles for the button wrapper
// ============================================================
import { useState }        from 'react';
import { useAuth }         from '../context/AuthContext';
import { useTripReview }   from '../context/TripReviewContext';

const Y = 'rgb(247,190,57)';

export default function SendToManagerButton({ rfq, style = {} }) {
  const { user }                        = useAuth();
  const { submitTrip, getStatus }       = useTripReview();
  const [confirm, setConfirm]           = useState(false);
  const [justSent, setJustSent]         = useState(false);

  // Live status from context
  const status = rfq?._id ? getStatus(rfq._id) : null;

  const send = () => {
    submitTrip(rfq, user?.name || 'User');
    setJustSent(true);
    setConfirm(false);
  };

  // ── Already sent / status badge ────────────────────────────
  if (status === 'approved') return (
    <Chip bg="#d1fae5" color="#065f46" style={style}>✅ Manager ne Approve kiya!</Chip>
  );
  if (status === 'rejected') return (
    <Chip bg="#fee2e2" color="#991b1b" style={style}>❌ Manager ne Reject kiya</Chip>
  );
  if (justSent || status === 'pending') return (
    <Chip bg="#fef3c7" color="#92400e" style={style}>⏳ Manager ke paas bheja gaya</Chip>
  );

  // ── Confirm mini-popup ──────────────────────────────────────
  if (confirm) return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: `2px solid ${Y}`, padding: 14,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      display: 'inline-block', ...style,
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
        📤 Manager ko is trip ki review bhejni hai?
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn bg={Y} color="#1a1a1a" onClick={send}>Haan, Bhejo ✓</Btn>
        <Btn bg="#f3f4f6" color="#6b7280" onClick={() => setConfirm(false)}>Cancel</Btn>
      </div>
    </div>
  );

  // ── Default button ──────────────────────────────────────────
  return (
    <button
      onClick={() => setConfirm(true)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        background: Y, color: '#1a1a1a', border: 'none',
        padding: '9px 17px', borderRadius: 10,
        fontSize: 13, fontWeight: 800, cursor: 'pointer',
        transition: 'background .2s', ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#e6ad2a'}
      onMouseLeave={e => e.currentTarget.style.background = Y}
    >
      📤 Manager ko Bhejo
    </button>
  );
}

// ── Small helpers ─────────────────────────────────────────────
function Chip({ bg, color, style, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: bg, color, padding: '7px 14px',
      borderRadius: 10, fontSize: 12, fontWeight: 700, ...style,
    }}>{children}</span>
  );
}

function Btn({ bg, color, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '7px 0', background: bg, color,
      border: 'none', borderRadius: 8,
      fontSize: 12, fontWeight: 700, cursor: 'pointer',
    }}>{children}</button>
  );
}
