// ============================================================
//  ManagerPage.jsx — Budget approval inline + Trip review full detail
// ============================================================
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import ManagerTripView from './ManagerTripView';
import { useAuth } from '../context/AuthContext';
import GroupChatBox from '../../../../components/detail/headings/GroupChatBox';

// ─── PermissionAvatars (same as DetailPage) ───────────────────
const DUMMY_USERS = [
  { initial: 'T', name: 'Trushant Shah', permission: 'Admin',    permBg: '#ede9fe', permColor: '#5b21b6', avatarBg: '#8b5cf6' },
  { initial: 'R', name: 'Rahul Mehta',   permission: 'Can Edit', permBg: '#dbeafe', permColor: '#1e40af', avatarBg: '#0ea5e9' },
  { initial: 'P', name: 'Priya Nair',    permission: 'View Only',permBg: '#d1fae5', permColor: '#065f46', avatarBg: '#f59e0b' },
];

function PermissionAvatars() {
  const [openIdx, setOpenIdx] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenIdx(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center' }}>
      {DUMMY_USERS.map((u, i) => (
        <div
          key={i}
          style={{ position: 'relative', zIndex: DUMMY_USERS.length - i }}
          onMouseEnter={() => setOpenIdx(i)}
          onMouseLeave={() => setOpenIdx(null)}
          onClick={() => setOpenIdx(openIdx === i ? null : i)}
        >
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: u.avatarBg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', fontWeight: 700,
            border: '2px solid #fff',
            marginRight: i < DUMMY_USERS.length - 1 ? '-6px' : '0',
            cursor: 'pointer',
            transition: 'transform 0.15s',
            transform: openIdx === i ? 'scale(1.18)' : 'scale(1)',
            boxShadow: openIdx === i ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            userSelect: 'none',
          }}>
            {u.initial}
          </div>
          {openIdx === i && (
            <div style={{
              position: 'absolute', top: '32px', left: '50%', transform: 'translateX(-50%)',
              background: '#1f2937', color: '#fff',
              borderRadius: '9px', padding: '8px 11px',
              fontSize: '11px', whiteSpace: 'nowrap',
              zIndex: 9999, pointerEvents: 'none',
              boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
            }}>
              <div style={{
                position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)',
                width: 0, height: 0,
                borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                borderBottom: '5px solid #1f2937',
              }} />
              <div style={{ fontWeight: 700, fontSize: '11px', marginBottom: '5px', color: '#f9fafb' }}>{u.name}</div>
              <span style={{
                fontSize: '10px', fontWeight: 600,
                background: u.permBg, color: u.permColor,
                padding: '2px 8px', borderRadius: '4px',
                display: 'inline-block',
              }}>
                {u.permission}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main ManagerPage ──────────────────────────────────────────
export default function ManagerPage({ onBack }) {
  const { user, logout } = useAuth();

  // ── Section tabs ──────────────────────────────────────────
  const [mainSection, setMainSection] = useState('budget'); // 'budget' | 'tripReview'

  // ── Group chat (page-level) ───────────────────────────────
  const [groupChatOpen, setGroupChatOpen] = useState(false);

  // ── Budget approval state ─────────────────────────────────
  const [filter, setFilter]                   = useState('pending');
  const [rows, setRows]                       = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [expandedId, setExpandedId]           = useState(null);
  const [managerComment, setManagerComment]   = useState('');
  const [actionLoading, setActionLoading]     = useState(false);

  // ── Trip review state ─────────────────────────────────────
  const [tripReviewRows, setTripReviewRows]               = useState([]);
  const [tripReviewLoading, setTripReviewLoading]         = useState(false);
  const [tripReviewError, setTripReviewError]             = useState('');
  const [tripReviewSelected, setTripReviewSelected]       = useState(null);
  const [tripReviewActionLoading, setTripReviewActionLoading] = useState('');

  // ── Load budget approvals ─────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = filter === 'pending'
        ? '/api/budget-approvals?status=pending'
        : '/api/budget-approvals';
      const res = await axios.get(url);
      if (res.data?.success) {
        setRows(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setRows([]);
        setError('Invalid response from server');
      }
    } catch (err) {
      setRows([]);
      setError(err.response?.data?.message || err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (mainSection !== 'budget') return;
    load();
  }, [load, mainSection]);

  // ── Load trip reviews ─────────────────────────────────────
  const loadTripReviews = useCallback(async () => {
    setTripReviewLoading(true);
    setTripReviewError('');
    try {
      const res = await axios.get('/api/rfqs?pendingTripReview=true');
      if (res.data?.success) {
        setTripReviewRows(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setTripReviewRows([]);
        setTripReviewError('Invalid response from server');
      }
    } catch (err) {
      setTripReviewRows([]);
      setTripReviewError(err.response?.data?.message || err.message || 'Failed to load trip reviews');
    } finally {
      setTripReviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mainSection === 'tripReview') loadTripReviews();
  }, [mainSection, loadTripReviews]);

  // ── Budget approve / reject ───────────────────────────────
  const handleApprove = async (a) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/budget-approvals/${a.tripId}`, {
        status: 'approved',
        approvedBudget: a.budget,
        managerComment,
      });
      if (res.data?.success) {
        setRows(prev => prev.map(r => r.tripId === a.tripId ? res.data.data : r));
        setExpandedId(null);
        setManagerComment('');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (a) => {
    setActionLoading(true);
    try {
      const res = await axios.patch(`/api/budget-approvals/${a.tripId}`, {
        status: 'rejected',
        managerComment,
      });
      if (res.data?.success) {
        setRows(prev => prev.map(r => r.tripId === a.tripId ? res.data.data : r));
        setExpandedId(null);
        setManagerComment('');
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Trip review detail view ───────────────────────────────
  if (tripReviewSelected) {
    const r = tripReviewSelected;
    const payload = r.reviewPayload && typeof r.reviewPayload === 'object' ? r.reviewPayload : {};
    const frozenItems =
      Array.isArray(payload.planItems) && payload.planItems.length > 0
        ? payload.planItems
        : Array.isArray(r.planItems) ? r.planItems : [];
    const frozenTotal =
      payload.grandTotal != null ? payload.grandTotal : r.grandTotal != null ? r.grandTotal : null;

    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 100 }}>

        {/* ── Main Navbar ── */}
        <header style={{ background: 'rgb(247,190,57)', padding: '6px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height: 28, objectFit: 'contain' }} />
            <span style={{ fontSize: 10, fontWeight: 800, background: '#1e293b', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>
              👔 MANAGER VIEW
            </span>
          </div>
        </header>

        {/* ── Sub-navbar ── */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Back button */}
          <button
            type="button"
            onClick={() => setTripReviewSelected(null)}
            style={{ width: '32px', height: '32px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          {/* Right: Permission avatars + Group chat + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PermissionAvatars />

            {/* Group Chat Button */}
            <button
              onClick={() => setGroupChatOpen(v => !v)}
              style={{
                position: 'relative',
                width: '32px', height: '32px',
                borderRadius: '10px',
                background: groupChatOpen ? 'rgb(247,190,57)' : '#fff',
                border: `1.5px solid ${groupChatOpen ? 'rgb(247,190,57)' : '#e5e7eb'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s',
                boxShadow: groupChatOpen ? '0 4px 12px rgba(247,190,57,0.35)' : 'none',
              }}
              title="Group Chat"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                  stroke={groupChatOpen ? '#1a1a1a' : '#374151'}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                width: '9px', height: '9px', borderRadius: '50%',
                background: '#22c55e', border: '2px solid #fff',
              }} />
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={() => logout()}
              style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: '9px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 24px' }}>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>
            {r.tripName || 'Trip review request'}
          </h1>
          <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 4px' }}>
            Trip ID: <strong style={{ color: '#0f172a' }}>{String(r._id)}</strong>
          </p>
          {r.reviewSentAt && (
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 18px' }}>
              Sent for review: {new Date(r.reviewSentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}

          {frozenTotal != null && (
            <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 16, fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
              Snapshot total: ₹{Number(frozenTotal).toLocaleString('en-IN')}
            </div>
          )}

          <div style={{ fontSize: 13, fontWeight: 800, color: '#374151', marginBottom: 8 }}>Plan items (snapshot)</div>
          {frozenItems.length === 0 ? (
            <div style={{ padding: 16, background: '#fff', borderRadius: 12, color: '#94a3b8' }}>
              Koi item snapshot mein nahi — user side check karein.
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {frozenItems.map((item, idx) => {
                const WEGO = 'https://assets.wego.com/image/upload/h_240,c_fill,f_auto,fl_lossy,q_auto:best,g_auto/v20260217/flights/airlines_square/';
                const MAP = { AI:'AI', IX:'IX', '6E':'6E', SG:'SG', QP:'QP', UK:'UK', G8:'G8', EK:'EK', QR:'QR', EY:'EY', LH:'LH', BA:'BA', SQ:'SQ', TK:'TK' };
                const u = (item?.airline || '').trim().toUpperCase();
                const logoUrl = item?.type === 'flight' && MAP[u] ? `${WEGO}${MAP[u]}.png` : null;
                const typeIcon = item?.type === 'hotel' ? '🏨' : item?.type === 'attraction' ? '🗺️' : item?.type === 'transfer' ? '🚗' : item?.type === 'other' ? '📌' : null;
                const titleText = item?.type === 'flight'
                  ? `${item?.from || item?.fromAirport || ''} → ${item?.to || item?.toAirport || ''}`
                  : item?.hotelName || item?.name || item?.type || 'Item';

                return (
                  <li key={item?.id || idx} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {item?.type === 'flight' && logoUrl
                          ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                          : <span style={{ fontSize: 18 }}>{typeIcon || '✈️'}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{titleText}</div>
                        {item?.type === 'flight' && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item?.airline} {item?.flightNumber} · {item?.depTime} → {item?.arrTime}{item?.stops === 0 ? ' · Non-stop' : item?.stops ? ` · ${item.stops} Stop(s)` : ''}</div>}
                        {item?.type === 'hotel' && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item?.cityName || item?.address}{item?.nights ? ` · ${item.nights} night(s)` : ''}</div>}
                        {(item?.type === 'attraction' || item?.type === 'transfer' || item?.type === 'other') && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{item?.address || item?.cityName || item?.destination || ''}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        {item?.price && <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a' }}>Rs.{Math.round(Number(item.price)).toLocaleString('en-IN')}</div>}
                        <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase', background: item?.status === 'paid' ? '#dcfce7' : '#fef3c7', color: item?.status === 'paid' ? '#16a34a' : '#92400e' }}>
                          {item?.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Fixed footer: Approve / Reject */}
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, padding: '12px 16px 20px', background: 'linear-gradient(180deg, transparent 0%, #f8fafc 20%)', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={!!tripReviewActionLoading}
            onClick={async () => {
              setTripReviewActionLoading('approve');
              try {
                await axios.post(`/api/rfqs/${r._id}/approve-review`);
                setTripReviewSelected(null);
                loadTripReviews();
              } catch (err) {
                alert(err.response?.data?.message || err.message || 'Approve failed');
              } finally { setTripReviewActionLoading(''); }
            }}
            style={{ padding: '14px 28px', borderRadius: 14, border: 'none', background: tripReviewActionLoading ? '#94a3b8' : '#16a34a', color: '#fff', fontWeight: 900, fontSize: 14, cursor: tripReviewActionLoading ? 'wait' : 'pointer' }}
          >
            {tripReviewActionLoading === 'approve' ? '⏳ Approving…' : '✅ Approve Trip Review'}
          </button>
          <button
            type="button"
            disabled={!!tripReviewActionLoading}
            onClick={async () => {
              if (!window.confirm('Trip review reject kar do? User dubara changes kar sakta hai.')) return;
              setTripReviewActionLoading('reject');
              try {
                await axios.post(`/api/rfqs/${r._id}/reject-review`);
                setTripReviewSelected(null);
                loadTripReviews();
              } catch (err) {
                alert(err.response?.data?.message || err.message || 'Reject failed');
              } finally { setTripReviewActionLoading(''); }
            }}
            style={{ padding: '14px 22px', borderRadius: 14, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 900, fontSize: 14, cursor: tripReviewActionLoading ? 'wait' : 'pointer' }}
          >
            {tripReviewActionLoading === 'reject' ? '⏳ Rejecting…' : '❌ Reject Review'}
          </button>
        </div>

        {groupChatOpen && <GroupChatBox onClose={() => setGroupChatOpen(false)} />}
      </div>
    );
  }

  // ── Main list page ────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── Main Navbar (yellow) ── */}
      <header style={{ background: 'rgb(247,190,57)', padding: '6px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height: 28, objectFit: 'contain' }} />
          <span style={{ fontSize: 10, fontWeight: 800, background: '#1e293b', color: '#fff', padding: '3px 10px', borderRadius: 20 }}>
            👔 Manager
          </span>
        </div>
      </header>

      {/* ── Sub-navbar (white bar) ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Left: Back button */}
        <button
          type="button"
          onClick={() => onBack && onBack()}
          style={{ width: '32px', height: '32px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8l4 4" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Right: Username + Permission avatars + Group chat + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Username */}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            {user?.name || user?.email}
          </span>

          {/* Permission Avatars */}
          <PermissionAvatars />

          {/* Group Chat Button */}
          <button
            onClick={() => setGroupChatOpen(v => !v)}
            style={{
              position: 'relative',
              width: '32px', height: '32px',
              borderRadius: '10px',
              background: groupChatOpen ? 'rgb(247,190,57)' : '#fff',
              border: `1.5px solid ${groupChatOpen ? 'rgb(247,190,57)' : '#e5e7eb'}`,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
              boxShadow: groupChatOpen ? '0 4px 12px rgba(247,190,57,0.35)' : 'none',
            }}
            title="Group Chat"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                stroke={groupChatOpen ? '#1a1a1a' : '#374151'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              />
            </svg>
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              width: '9px', height: '9px', borderRadius: '50%',
              background: '#22c55e', border: '2px solid #fff',
            }} />
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => logout()}
            style={{ fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: '9px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', color: '#374151' }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Section tabs: Budget | Trip Review */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, background: '#e2e8f0', padding: 4, borderRadius: 12, width: '100%', maxWidth: 440, boxSizing: 'border-box' }}>
          {[
            { id: 'budget',     label: 'Budget approvals' },
            { id: 'tripReview', label: 'Trip reviews'     },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setMainSection(t.id); setExpandedId(null); setManagerComment(''); }}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 800,
                background: mainSection === t.id ? '#fff' : 'transparent',
                color:      mainSection === t.id ? '#0f172a' : '#64748b',
                boxShadow:  mainSection === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ BUDGET APPROVALS SECTION ══ */}
        {mainSection === 'budget' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>Budget approval requests</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>
              Pending requests user ne "Send Budget Approval" se bheje hain. Card tap karo aur inline approve / reject karo.
            </p>

            {/* Pending / All filter */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content' }}>
              {[{ id: 'pending', label: 'Pending' }, { id: 'all', label: 'All' }].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setFilter(t.id); setExpandedId(null); setManagerComment(''); }}
                  style={{
                    padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 800,
                    background: filter === t.id ? '#fff' : 'transparent',
                    color:      filter === t.id ? '#0f172a' : '#64748b',
                    boxShadow:  filter === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ padding: '12px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontWeight: 600 }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>
                  {filter === 'pending' ? 'Koi pending request nahi' : 'Koi request nahi mili'}
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                  User side se "Send Budget Approval" dabane ke baad yahan dikhega.
                </div>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rows.map((a) => (
                  <li key={a._id || a.tripId}>
                    <div
                      onClick={() => {
                        if (a.status !== 'pending') return;
                        setExpandedId(prev => prev === a.tripId ? null : a.tripId);
                        setManagerComment('');
                      }}
                      style={{
                        width: '100%', padding: '16px 18px', background: '#fff',
                        border: `1.5px solid ${expandedId === a.tripId ? 'rgb(247,190,57)' : '#e2e8f0'}`,
                        borderRadius: expandedId === a.tripId ? '14px 14px 0 0' : '14px',
                        cursor: a.status === 'pending' ? 'pointer' : 'default',
                        display: 'flex', flexDirection: 'column', gap: 8,
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{a.tripName || 'Untitled trip'}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>
                            Trip ID: {a.rfqId || a.tripId}
                            {a.rfqId && <span style={{ display: 'block', fontSize: 9, opacity: 0.8 }}>Ref: {a.tripId}</span>}
                          </div>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                          padding: '4px 10px', borderRadius: 8, flexShrink: 0,
                          ...(a.status === 'pending'
                            ? { background: '#fef3c7', color: '#92400e' }
                            : a.status === 'approved'
                            ? { background: '#dcfce7', color: '#166534' }
                            : { background: '#fee2e2', color: '#991b1b' }),
                        }}>
                          {a.status || '—'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#475569', flexWrap: 'wrap' }}>
                        <span>Budget: <strong style={{ color: '#0f172a' }}>₹{Number(a.budget || 0).toLocaleString('en-IN')}</strong></span>
                        <span>Plan total: <strong style={{ color: Number(a.grandTotal) > Number(a.budget) ? '#dc2626' : '#16a34a' }}>₹{Number(a.grandTotal || 0).toLocaleString('en-IN')}</strong></span>
                        {a.sentAt && <span style={{ color: '#94a3b8' }}>Sent: {new Date(a.sentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                      </div>

                      {a.status === 'pending' && <div style={{ fontSize: 12, fontWeight: 700, color: 'rgb(180,130,0)' }}>{expandedId === a.tripId ? 'Close ▲' : 'Tap to approve / reject ▼'}</div>}
                      {a.status === 'approved' && <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>✅ Approved — ₹{Number(a.approvedBudget || a.budget).toLocaleString('en-IN')}{a.managerComment ? ` · "${a.managerComment}"` : ''}</div>}
                      {a.status === 'rejected' && <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>❌ Rejected{a.managerComment ? ` · "${a.managerComment}"` : ''}</div>}
                    </div>

                    {/* Inline Expand Panel */}
                    {expandedId === a.tripId && a.status === 'pending' && (
                      <div style={{ background: '#fffbeb', border: '1.5px solid rgb(247,190,57)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '18px 18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 3 }}>User Budget</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>₹{Number(a.budget).toLocaleString('en-IN')}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', marginBottom: 3 }}>Plan Total</div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: Number(a.grandTotal) > Number(a.budget) ? '#dc2626' : '#16a34a' }}>₹{Number(a.grandTotal).toLocaleString('en-IN')}</div>
                          </div>
                          {Number(a.grandTotal) > Number(a.budget) && (
                            <div style={{ alignSelf: 'center', fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '5px 12px', borderRadius: 8 }}>
                              ⚠️ ₹{(Number(a.grandTotal) - Number(a.budget)).toLocaleString('en-IN')} over budget
                            </div>
                          )}
                        </div>
                        <textarea
                          value={managerComment}
                          onChange={e => setManagerComment(e.target.value)}
                          placeholder="Optional comment for user..."
                          rows={2}
                          style={{ width: '100%', fontSize: 12, border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}
                        />
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleApprove(a)}
                            style={{ flex: 1, padding: '13px', background: 'rgb(247,190,57)', color: '#1a1a1a', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1, boxShadow: '0 4px 14px rgba(247,190,57,0.4)' }}
                          >
                            {actionLoading ? '⏳ Processing...' : '✅ Approve Budget'}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleReject(a)}
                            style={{ padding: '13px 22px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 12, fontSize: 14, fontWeight: 900, cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? 0.7 : 1 }}
                          >
                            {actionLoading ? '⏳' : '❌ Reject'}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* ══ TRIP REVIEWS SECTION ══ */}
        {mainSection === 'tripReview' && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>Trip review requests</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 18px' }}>
              Jab user ne budget approve hone ke baad "Send trip review" bheja ho, woh trips yahan dikhengi.
              Approve karne par user ka plan lock ho jata hai.
            </p>

            {tripReviewError && (
              <div style={{ padding: '12px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 10, fontSize: 13, marginBottom: 14 }}>
                {tripReviewError}
              </div>
            )}

            {tripReviewLoading ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontWeight: 600 }}>Loading…</div>
            ) : tripReviewRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#374151' }}>Koi pending trip review nahi</div>
                <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                  Pehle budget approve hona chahiye, phir user "Send trip review" karega.
                </div>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tripReviewRows.map((trip) => (
                  <li key={trip._id}>
                    <button
                      type="button"
                      onClick={() => setTripReviewSelected(trip)}
                      style={{ width: '100%', textAlign: 'left', padding: '16px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgb(247,190,57)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(247,190,57,0.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{trip.tripName || 'Untitled trip'}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginTop: 4 }}>Trip ID: {String(trip._id)}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 8, flexShrink: 0, background: '#fef3c7', color: '#92400e' }}>
                          Awaiting review
                        </span>
                      </div>
                      {trip.reviewSentAt && <div style={{ fontSize: 12, color: '#64748b' }}>Sent: {new Date(trip.reviewSentAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgb(180,130,0)' }}>Open review →</div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Group Chat Overlay */}
      {groupChatOpen && <GroupChatBox onClose={() => setGroupChatOpen(false)} />}
    </div>
  );
}