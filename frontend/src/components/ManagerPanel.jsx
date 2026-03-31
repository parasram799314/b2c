// ─── ManagerApprovalsSection.jsx ─────────────────────────────────────────────
// Drop-in replacement for the approvals section in HomePage.jsx
// Props: budgetApprovals, tripReviews, approvalsLoading, onApprove, onReject, onTripApprove, onTripReject

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
  const over     = approval.grandTotal - approval.budget;
  const overBudget = over > 0;
  const destList =
    (approval.destinations || []).map(d => d.destination).filter(Boolean).join(', ') || '—';
  const pax =
    (approval.numberOfAdults || 1) +
    (approval.numberOfChildren || 0) +
    (approval.numberOfInfants || 0);

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: '1.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px',
    }}>
      {/* Header row */}
      <div style={{ padding: '14px 16px' }}>
        {/* Top: name + date + action buttons */}
       

        {/* Budget vs Grand Total */}
        {/* 1. Header: Trip Name, ID, User, Pax और Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              {approval.tripName || 'Untitled Trip'}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280' }}>
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '10px', border: '1px solid #fde68a' }}>
                ID: {approval.rfqId || (approval.tripId ? approval.tripId.slice(-6).toUpperCase() : 'N/A')}
              </span>
              <span>•</span>
              <span>{fmtDate(approval.sentAt || approval.createdAt)}</span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                👤 <span style={{ fontWeight: 600, color: '#374151' }}>{approval.requestedBy || 'User'}</span>
              </span>
              <span>•</span>
              <span style={{ fontWeight: 600 }}>{pax} Pax</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => onReject(approval.tripId)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid #fecaca', background: '#fff', color: '#dc2626', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              Reject
            </button>
            <button onClick={() => onApprove(approval.tripId)} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
              Approve
            </button>
          </div>
        </div>

        {/* 2. 3-Box Stats: Requested, Total, Difference */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '12px', textAlign: 'center', border: '1px solid #dbeafe' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: '#1e40af', opacity: 0.8, textTransform: 'uppercase', marginBottom: '4px' }}>Requested Budget</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#1e40af' }}>{fmt(approval.budget)}</div>
          </div>
          <div style={{ background: overBudget ? '#fef2f2' : '#f0fdf4', borderRadius: '12px', padding: '12px', textAlign: 'center', border: overBudget ? '1px solid #fee2e2' : '1px solid #dcfce7' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: overBudget ? '#b91c1c' : '#166534', opacity: 0.8, textTransform: 'uppercase', marginBottom: '4px' }}>Grand Total</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: overBudget ? '#b91c1c' : '#166534' }}>{fmt(approval.grandTotal)}</div>
          </div>
          <div style={{ background: overBudget ? '#fef2f2' : '#f0fdf4', borderRadius: '12px', padding: '12px', textAlign: 'center', border: overBudget ? '1px solid #fee2e2' : '1px solid #dcfce7' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, color: overBudget ? '#b91c1c' : '#166534', opacity: 0.8, textTransform: 'uppercase', marginBottom: '4px' }}>{overBudget ? 'Over By' : 'Within By'}</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: overBudget ? '#b91c1c' : '#166534' }}>{fmt(Math.abs(over))}</div>
          </div>
        </div>

        {/* Destinations row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>📍 Destinations:</span>
          {(approval.destinations || []).map((d, i) => (
            <span key={i} style={{
              fontSize: '10px', fontWeight: 600, padding: '2px 9px', borderRadius: '20px',
              background: '#f3f4f6', color: '#374151',
            }}>
              {d.destination}
            </span>
          ))}
        </div>
      </div>

      {/* Plan items toggle */}
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
              🗒 View {approval.planItems.length} plan items
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
              strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {expanded && (
            <div style={{ padding: '12px 14px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              {approval.planItems.map((item, i) => (
                <PlanItemRow key={item.id || i} item={item} />
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
  const payload   = trip.reviewPayload || {};
  const planItems = payload.planItems || [];
  const grandTotal = payload.grandTotal || 0;

  const destList =
    (trip.destinations || []).map(d => d.destination).filter(Boolean).join(' → ') || '—';

  const pax =
    (trip.numberOfAdults || 1) +
    (trip.numberOfChildren || 0) +
    (trip.numberOfInfants || 0);

  // Count by type
  const counts = planItems.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{
      background: '#fff', borderRadius: '14px',
      border: '1.5px solid #e5e7eb', overflow: 'hidden', marginBottom: '12px',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px' }}>
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827', marginBottom: '3px' }}>
              {trip.tripName || 'Untitled Trip'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {trip.rfqId && (
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '2px 7px', borderRadius: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ID: {trip.rfqId}
                </span>
              )}
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                {fmtDate(trip.reviewSentAt || trip.updatedAt)}
              </span>
              <span style={{ fontSize: '10px', color: '#9ca3af' }}>·</span>
              <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600 }}>{pax} Pax</span>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => onReject(trip._id)}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid #fca5a5',
                background: '#fff', color: '#dc2626', fontSize: '11px', fontWeight: 700,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Reject
            </button>
            <button
              onClick={() => onApprove(trip._id)}
              style={{
                padding: '7px 14px', borderRadius: '8px', border: 'none',
                background: 'rgb(247,190,57)', color: '#1a1a1a',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e6ad2a'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgb(247,190,57)'}
            >
              Approve Trip
            </button>
          </div>
        </div>

        {/* Route + Grand Total */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1, background: '#f9fafb', borderRadius: '9px', padding: '9px 12px',
            fontSize: '11px', fontWeight: 600, color: '#374151',
          }}>
            📍 {destList}
          </div>
          {grandTotal > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: '9px', padding: '9px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '2px' }}>Total</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#166534' }}>{fmt(grandTotal)}</div>
            </div>
          )}
        </div>

        {/* Item type summary chips */}
        {Object.keys(counts).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {Object.entries(counts).map(([type, count]) => {
              const meta = TYPE_META[type] || TYPE_META.other;
              return (
                <span key={type} style={{
                  fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                  background: meta.bg, color: meta.color,
                }}>
                  {meta.icon} {count} {meta.label}{count > 1 ? 's' : ''}
                </span>
              );
            })}
          </div>
        )}
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
              🗒 Review {planItems.length} items in detail
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
              strokeWidth="2.5" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
            >
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </div>

          {expanded && (
            <div style={{ padding: '12px 14px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
              {/* Group by type */}
              {Object.entries(
                planItems.reduce((acc, item) => {
                  const t = item.type || 'other';
                  if (!acc[t]) acc[t] = [];
                  acc[t].push(item);
                  return acc;
                }, {})
              ).map(([type, items]) => {
                const meta = TYPE_META[type] || TYPE_META.other;
                return (
                  <div key={type} style={{ marginBottom: '14px' }}>
                    <div style={{
                      fontSize: '10px', fontWeight: 700, color: '#6b7280',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px',
                    }}>
                      <span>{meta.icon}</span> {meta.label}s ({items.length})
                    </div>
                    {items.map((item, i) => (
                      <PlanItemRow key={item.id || i} item={item} />
                    ))}
                  </div>
                );
              })}
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
  approvalsLoading,
  onApprove,
  onReject,
  onTripApprove,
  onTripReject,
}) {
  const [tab, setTab] = useState('budget');

  if (approvalsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af', fontWeight: 600, fontSize: '13px' }}>
        Loading approvals…
      </div>
    );
  }

  const tabs = [
    { id: 'budget', label: '💰 Budget Approvals', count: budgetApprovals.length },
    { id: 'trip',   label: '✈️ Trip Reviews',      count: tripReviews.length    },
  ];

  return (
    <div>
      {/* Sub-tabs */}
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
                marginLeft: '6px', fontSize: '10px', fontWeight: 800, padding: '1px 6px',
                borderRadius: '20px',
                background: tab === t.id ? 'rgb(247,190,57)' : '#e5e7eb',
                color: tab === t.id ? '#1a1a1a' : '#6b7280',
              }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Budget Approvals tab */}
      {tab === 'budget' && (
        <div>
          {budgetApprovals.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '40px 20px',
              textAlign: 'center', border: '1.5px dashed #e5e7eb',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>🎉</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>No pending budget requests</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>All caught up!</div>
            </div>
          ) : (
            budgetApprovals.map(approval => (
              <BudgetApprovalCard
                key={approval._id}
                approval={approval}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))
          )}
        </div>
      )}

      {/* Trip Reviews tab */}
      {tab === 'trip' && (
        <div>
          {tripReviews.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: '12px', padding: '40px 20px',
              textAlign: 'center', border: '1.5px dashed #e5e7eb',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '10px' }}>✅</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>No pending trip reviews</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>All trips reviewed!</div>
            </div>
          ) : (
            tripReviews.map(trip => (
              <TripReviewCard
                key={trip._id}
                trip={trip}
                onApprove={onTripApprove}
                onReject={onTripReject}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}