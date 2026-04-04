// ─── ManagerApprovalsSection.jsx ─────────────────────────────────────────────
// Drop-in replacement for the approvals section in HomePage.jsx
// Props: budgetApprovals, tripReviews, approvalsLoading, onApprove, onReject, onTripApprove, onTripReject
import PlanCard from './shared/PlanCard';
import { useState } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null ? `₹${Math.round(Number(n)).toLocaleString('en-IN')}` : '—';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

const TYPE_META = {
  flight:     { icon: '✈️', label: 'Flight',     bg: '#eff6ff', color: '#1e40af' },
  hotel:      { icon: '🏨', label: 'Hotel',      bg: '#f0fdf4', color: '#166534' },
  attraction: { icon: '🗺️', label: 'Attraction', bg: '#fefce8', color: '#854d0e' },
  transfer:   { icon: '🚗', label: 'Transfer',   bg: '#fdf4ff', color: '#6b21a8' },
  other:      { icon: '📌', label: 'Other',      bg: '#fff7ed', color: '#9a3412' },
};

// ── PlanItemRow — compact card for trip review items ─────────────────────────
function PlanItemRow({ item }) {
  const meta  = TYPE_META[item.type] || TYPE_META.other;
  const title =
    item.type === 'flight'
      ? `${item.fromAirport || item.from || '?'} → ${item.toAirport || item.to || '?'}`
      : item.hotelName || item.name || item.activity || meta.label;
  const subtitle =
    item.type === 'flight'
      ? `${item.airline || ''} · ${item.depTime || ''} – ${item.arrTime || ''}`
      : item.address || item.cityName || item.destination || '';
  const price =
    item.type === 'hotel'
      ? parseFloat(item.price || 0) * (Number(item.nights) || 1)
      : parseFloat(item.price || 0);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px', borderRadius: '10px',
      background: '#fff', border: '1px solid #f3f4f6',
      marginBottom: '6px',
    }}>
      {/* Icon */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0,
        background: meta.bg, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '16px',
      }}>
        {meta.icon}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px', fontWeight: 700, color: '#111827',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* Type badge */}
      <span style={{
        fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '6px',
        background: meta.bg, color: meta.color, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {meta.label.toUpperCase()}
      </span>

      {/* Price */}
      {price > 0 && (
        <div style={{
          fontSize: '12px', fontWeight: 800, color: '#111827',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          {fmt(price)}
        </div>
      )}
    </div>
  );
}

// ── BudgetApprovalCard ────────────────────────────────────────────────────────
function BudgetApprovalCard({ approval, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');

  const pax =
    (approval.numberOfAdults || 1) +
    (approval.numberOfChildren || 0) +
    (approval.numberOfInfants || 0);

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: '1.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px',
    }}>
      {/* SINGLE ROW */}
      <div style={{
        padding: '14px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>

        {/* LEFT: Trip info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
              {approval.tripName || 'Untitled Trip'}
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '5px', border: '1px solid #fde68a' }}>
              ID: {approval.rfqId || (approval.tripId ? approval.tripId.slice(-6).toUpperCase() : 'N/A')}
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              {fmtDate(approval.sentAt || approval.createdAt)}
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              · {approval.requestedByName || 'user'} · {pax} Pax
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              · {(approval.destinations || []).map(d => d.destination).filter(Boolean).join(', ') || '—'}
            </span>
          </div>
        </div>

        {/* RIGHT: Budget + Divider + Note + Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Budget amount */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Requested budget
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af', whiteSpace: 'nowrap' }}>
              {fmt(approval.budget)}
            </span>
          </div>

          {/* Vertical divider */}
          <div style={{ width: '1px', height: '40px', background: '#e5e7eb', flexShrink: 0 }} />

          {/* Note textarea */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            style={{
              width: '180px', fontSize: '11px', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '6px 8px', outline: 'none',
              resize: 'none', fontFamily: 'inherit', color: '#111827',
              background: '#fafafa', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgb(247,190,57)'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />

          {/* Approve + Reject stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => onApprove(approval.tripId, note)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Approve
            </button>
            <button
              onClick={() => onReject(approval.tripId, note)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Reject
            </button>
          </div>

        </div>
      </div>

      {/* Plan items toggle - same as before */}
      {(approval.planItems || []).length > 0 && (
        <>
          <div
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 16px', background: '#f9fafb',
              borderTop: '1px solid #f3f4f6', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>
              🗒 View {approval.planItems.length} plan item{approval.planItems.length !== 1 ? 's' : ''}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          {expanded && (
            <div style={{ padding: '12px 14px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              {approval.planItems.map((item, i) => (
                <PlanCard key={item.id || i} item={item} readOnlyPlan={true} onRemove={() => {}} onReorder={() => {}} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── TripReviewCard ────────────────────────────────────────────────────────────
function TripReviewCard({ trip, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState('');
  const payload    = trip.reviewPayload || {};
  const planItems  = payload.planItems || [];
  const grandTotal = payload.grandTotal || 0;

  const pax =
    (trip.numberOfAdults || 1) +
    (trip.numberOfChildren || 0) +
    (trip.numberOfInfants || 0);

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: '1.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px',
    }}>
      {/* SINGLE ROW — same layout as BudgetApprovalCard */}
      <div style={{
        padding: '14px 18px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', gap: '12px',
      }}>

        {/* LEFT: Trip info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
              {trip.tripName || 'Untitled Trip'}
            </span>
            {trip.rfqId && (
              <span style={{ fontSize: '10px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '5px', border: '1px solid #fde68a' }}>
                ID: {trip.rfqId}
              </span>
            )}
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              {fmtDate(trip.reviewSentAt || trip.updatedAt)}
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              · {trip.createdByName || 'user'} · {pax} Pax
            </span>
            <span style={{ fontSize: '11px', color: '#6b7280' }}>
              · {(trip.destinations || []).map(d => d.destination).filter(Boolean).join(' → ') || '—'}
            </span>
          </div>
        </div>

        {/* RIGHT: Grand Total + Divider + Note + Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>

          {/* Grand total amount */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px' }}>
            <span style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
              Grand Total
            </span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#166534', whiteSpace: 'nowrap' }}>
              {grandTotal > 0 ? fmt(grandTotal) : '—'}
            </span>
          </div>

          {/* Vertical divider */}
          <div style={{ width: '1px', height: '40px', background: '#e5e7eb', flexShrink: 0 }} />

          {/* Note textarea */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            style={{
              width: '180px', fontSize: '11px', border: '1px solid #e5e7eb',
              borderRadius: '8px', padding: '6px 8px', outline: 'none',
              resize: 'none', fontFamily: 'inherit', color: '#111827',
              background: '#fafafa', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = 'rgb(247,190,57)'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />

          {/* Approve + Reject stacked */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => onApprove(trip._id, note)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: 'rgb(247,190,57)', color: '#1a1a1a', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e6ad2a'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgb(247,190,57)'}
            >
              Approve
            </button>
            <button
              onClick={() => onReject(trip._id, note)}
              style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Reject
            </button>
          </div>

        </div>
      </div>

      {/* Plan items toggle */}
      {planItems.length > 0 && (
        <>
          <div
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 16px', background: '#f9fafb',
              borderTop: '1px solid #f3f4f6', cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280' }}>
              🗒 Review {planItems.length} plan item{planItems.length !== 1 ? 's' : ''}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>
          {expanded && (
            <div style={{ padding: '12px 14px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              {planItems.map((item, i) => (
                <PlanCard key={item.id || i} item={item} readOnlyPlan={true} onRemove={() => {}} onReorder={() => {}} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
// ── Main ManagerApprovalsSection ──────────────────────────────────────────────
export default function ManagerApprovalsSection({
  budgetApprovals = [],
  tripReviews     = [],
  historyItems    = [],   // 👈 naya prop
  approvalsLoading,
  onApprove,
  onReject,
  onTripApprove,
  onTripReject,
}) {
  const [tab, setTab] = useState('approvals');

  if (approvalsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontWeight: 600, fontSize: '13px' }}>
        Loading approvals…
      </div>
    );
  }

 // ❌ PURANA tabs array aur pura return block hatao, NAYA yeh lagao:

  const totalPending = budgetApprovals.length + tripReviews.length;

  const tabs = [
    { id: 'approvals', label: '🔔 Approvals', count: totalPending },
    { id: 'history',   label: '📋 History',   count: historyItems.length },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: 700, transition: 'all 0.15s',
              background: tab === t.id ? '#fff' : 'transparent',
              color: tab === t.id ? '#111827' : '#6b7280',
              boxShadow: tab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.label}
            {t.count > 0 && (
              <span style={{
                marginLeft: '6px', fontSize: '10px', fontWeight: 800,
                padding: '1px 6px', borderRadius: '20px',
                background: tab === t.id ? 'rgb(247,190,57)' : '#e5e7eb',
                color: tab === t.id ? '#1a1a1a' : '#6b7280',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── APPROVALS TAB — Budget + Trip dono ── */}
      {tab === 'approvals' && (
        <div>
          {totalPending === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed #e5e7eb' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎉</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>No pending approvals</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>All caught up!</div>
            </div>
          ) : (
            <>
              {/* Budget Approvals */}
              {budgetApprovals.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💰 Budget Approvals</span>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '1px 7px', borderRadius: '20px', fontSize: '10px' }}>{budgetApprovals.length}</span>
                  </div>
                  {budgetApprovals.map(approval => (
                    <BudgetApprovalCard key={approval._id} approval={approval} onApprove={onApprove} onReject={onReject} />
                  ))}
                </>
              )}

              {/* Trip Reviews */}
              {tripReviews.length > 0 && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', marginTop: budgetApprovals.length > 0 ? '20px' : '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✈️ Trip Reviews</span>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '1px 7px', borderRadius: '20px', fontSize: '10px' }}>{tripReviews.length}</span>
                  </div>
                  {tripReviews.map(trip => (
                    <TripReviewCard key={trip._id} trip={trip} onApprove={onTripApprove} onReject={onTripReject} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === 'history' && (
        <div>
          {historyItems.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', border: '1.5px dashed #e5e7eb' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>No history yet</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Approved/Rejected items will appear here</div>
            </div>
          ) : (
            historyItems.map((item, i) => (
              <div key={item._id || i} style={{
                background: '#fff', borderRadius: '12px', border: '1.5px solid #e5e7eb',
                padding: '14px 18px', marginBottom: '10px',
                display: 'flex', alignItems: 'center', gap: '14px',
              }}>
                {/* Status Icon */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: item.status === 'approved' ? '#dcfce7' : '#fee2e2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {item.status === 'approved' ? '✅' : '❌'}
                </div>

                {/* Trip Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                      {item.tripName || 'Untitled Trip'}
                    </span>
                    {/* Type badge */}
                    <span style={{
                      fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '5px',
                      background: item.type === 'budget' ? '#fef3c7' : '#dbeafe',
                      color: item.type === 'budget' ? '#92400e' : '#1e40af',
                      border: `1px solid ${item.type === 'budget' ? '#fde68a' : '#bfdbfe'}`,
                    }}>
                      {item.type === 'budget' ? '💰 BUDGET' : '✈️ TRIP REVIEW'}
                    </span>
                    {item.rfqId && (
                      <span style={{ fontSize: '10px', fontWeight: 700, background: '#f3f4f6', color: '#6b7280', padding: '2px 6px', borderRadius: '4px' }}>
                        ID: {item.rfqId}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <span>🕐 {fmtDate(item.resolvedAt || item.updatedAt)}</span>
                    {item.managerComment && <span>💬 "{item.managerComment}"</span>}
                    {item.approvedBudget && <span>💰 {fmt(item.approvedBudget)}</span>}
                  </div>
                </div>

                {/* Status badge */}
                <span style={{
                  fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '8px', flexShrink: 0,
                  background: item.status === 'approved' ? '#dcfce7' : '#fee2e2',
                  color: item.status === 'approved' ? '#166534' : '#991b1b',
                }}>
                  {item.status === 'approved' ? 'Approved' : 'Rejected'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}