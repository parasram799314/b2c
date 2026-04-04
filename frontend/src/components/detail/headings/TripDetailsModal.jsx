// TripDetailsModal.jsx
// Sidebar timeline UI — matches the provided screenshot design
// Alerts & Approval Status section removed; approval info shown on timeline hover tooltips

import React, { useState } from 'react';

// ─── fmt helpers ─────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
};

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return d; }
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch { return d; }
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const UsersIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const CheckMark = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
    <path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Reusable components ──────────────────────────────────────────────────────
const SectionCard = ({ children }) => (
  <div style={{
    background: '#fff',
    border: '0.5px solid #e5e7eb',
    borderRadius: '10px',
    marginBottom: '12px',
    overflow: 'visible',
  }}>
    {children}
  </div>
);

const SectionHeader = ({ icon, label }) => (
  <div style={{
    padding: '10px 18px',
    borderBottom: '0.5px solid #e5e7eb',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '10px 10px 0 0',
  }}>
    <span style={{ color: '#6b7280' }}>{icon}</span>
    <span style={{
      fontSize: '11px',
      fontWeight: 600,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      {label}
    </span>
  </div>
);

const Badge = ({ children, bg, color, border }) => (
  <span style={{
    background: bg || '#f3f4f6',
    color: color || '#374151',
    fontSize: '11px',
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: '6px',
    border: `0.5px solid ${border || '#e5e7eb'}`,
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

// ─── Timeline Step (Sidebar) ──────────────────────────────────────────────────
const TimelineStep = ({ label, dateMain, dateSub, status, comment, commenter, isLast }) => {
  const [hovered, setHovered] = useState(false);

  // status: 'done' | 'active' | 'pending' | 'not-yet'
  const dotColor =
    status === 'done'    ? '#185FA5' :
    status === 'active'  ? '#EF9F27' :
    status === 'pending' ? '#EF9F27' : '#d1d5db';

  const dotBorder =
    status === 'done'    ? '#185FA5' :
    status === 'active'  ? '#EF9F27' :
    status === 'pending' ? '#EF9F27' : '#d1d5db';

  const lineColor = (status === 'done' || status === 'active') ? '#185FA5' : '#e5e7eb';

  return (
    <div style={{ display: 'flex', gap: '14px', position: 'relative' }}>
      {/* Dot + vertical line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '16px' }}>
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: status === 'not-yet' ? '#fff' : dotColor,
            border: `2px solid ${dotBorder}`,
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
            zIndex: 2,
            transition: 'transform 0.15s',
            transform: hovered ? 'scale(1.3)' : 'scale(1)',
          }}
        >
          {/* Hover Tooltip */}
          {hovered && (comment || dateMain) && (
            <div style={{
              position: 'absolute',
              left: '22px',
              top: '-8px',
              zIndex: 9999,
              background: '#1f2937',
              color: '#fff',
              borderRadius: '8px',
              padding: '10px 13px',
              minWidth: '200px',
              maxWidth: '240px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
              pointerEvents: 'none',
            }}>
              <p style={{ margin: '0 0 2px', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9ca3af' }}>{label}</p>
              {dateMain && <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 600, color: '#fff' }}>{dateMain}</p>}
              {dateSub && <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#9ca3af' }}>{dateSub}</p>}
              {comment && (
                <div style={{ background: '#374151', borderRadius: '5px', padding: '6px 8px', marginTop: '4px' }}>
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#e5e7eb', fontStyle: 'italic', lineHeight: 1.5 }}>"{comment}"</p>
                  {commenter && <p style={{ margin: 0, fontSize: '10px', color: '#9ca3af' }}>{commenter}</p>}
                </div>
              )}
              {/* Arrow */}
              <div style={{
                position: 'absolute',
                left: '-6px',
                top: '14px',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: '6px solid #1f2937',
              }} />
            </div>
          )}
        </div>
        {!isLast && (
          <div style={{ width: '2px', flex: 1, minHeight: '36px', background: lineColor, marginTop: '2px' }} />
        )}
      </div>

      {/* Text */}
      <div style={{ paddingBottom: isLast ? 0 : '20px' }}>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</p>
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 600,
          color: status === 'active' || status === 'pending' ? '#EF9F27' : status === 'not-yet' ? '#9ca3af' : '#111827',
          marginBottom: '1px',
        }}>
          {dateMain || (status === 'not-yet' ? 'Not yet' : status === 'pending' ? 'Pending' : '—')}
        </p>
        {dateSub && <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{dateSub}</p>}
        {status === 'pending' && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>Awaiting review</p>}
      </div>
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function TripDetailsModal({
  rfq,
  planItems = [],
  grandTotal = 0,
  approvalStatus = null,
  onClose,
}) {
  if (!rfq) return null;

  // ── Derived data ──
  const displayTripId =
    (rfq?.rfqId && String(rfq.rfqId).trim()) ||
    (rfq?._id && String(rfq._id).replace(/: /g, '').trim()) ||
    'J2WWI3';

  const planFrozen = rfq.reviewStatus === 'approved';

  const createdAt      = rfq.createdAt    || rfq.created_at    || null;
  const budgetSubmit   = rfq.budgetSubmittedAt || approvalStatus?.createdAt || null;
  const budgetApproved = approvalStatus?.status === 'approved'
    ? (approvalStatus?.updatedAt || null) : null;
  const tripApproved   = planFrozen ? (rfq.approvedAt || rfq.updatedAt || null) : null;

  const destinations   = rfq.destinations || [];
  const rfqTotalNights = destinations.reduce(
    (s, d) => s + (Number(d.nights || d.numberOfNights) || 0), 0,
  );
  const totalPax = (rfq.numberOfAdults || 1) + (rfq.numberOfChildren || 0) + (rfq.numberOfInfants || 0);

  const flightTotal     = planItems.filter(p => p.type === 'flight'     && p.status !== 'cancelled').reduce((s, f) => s + (parseFloat(f.price) || 0), 0);
  const hotelTotal      = planItems.filter(p => p.type === 'hotel'      && p.status !== 'cancelled' && !p._isHotelContinuation).reduce((s, h) => s + (parseFloat(h.price || 0) * (Number(h.nights) || 1)), 0);
  const attractionTotal = planItems.filter(p => p.type === 'attraction' && p.status !== 'cancelled').reduce((s, a) => s + (parseFloat(a.price) || 0), 0);
  const transferTotal   = planItems.filter(p => p.type === 'transfer'   && p.status !== 'cancelled').reduce((s, t) => s + (parseFloat(t.price?.replace?.(/[^\d]/g, '') || t.price || 0) || 0), 0);

  const budget        = Number(rfq.budget || rfq.tripBudget || approvalStatus?.approvedBudget || 0);
  const budgetUsedPct = budget > 0 ? Math.min(100, Math.round((grandTotal / budget) * 100)) : 0;

  // Demo destinations fallback
  const demoDestinations = [
    { name: 'Indore, India', date: '18 Feb 2025', dot: '#EF9F27', transit: false },
    { name: 'Dubai, UAE',    date: '18 Feb — 21 Feb 2025', dot: '#1D9E75', transit: false },
  ];

  // Participants
  const participants = [
    { initial: 'TS', name: rfq.travelerName || 'Trushant Shah', role: 'Trip organiser', permission: 'Admin',    avatarBg: '#AFA9EC', avatarColor: '#26215C', permBg: '#EEEDFE', permColor: '#3C3489' },
  ];

  // Travellers
  const travellers = rfq.travellers || [
    { initial: 'TS', name: rfq.travelerName || 'Trushant Shah', passport: 'A1234567', dob: '14 Mar 1990', type: 'Adult', avatarBg: '#AFA9EC', avatarColor: '#26215C' },
    { initial: 'RM', name: 'Rahul Mehta',   passport: 'B9876543', dob: '22 Jul 1988', type: 'Adult', avatarBg: '#85B7EB', avatarColor: '#042C53' },
    { initial: 'PN', name: 'Priya Nair',    passport: '—',        dob: '05 Sep 2016', type: 'Child', avatarBg: '#FAC775', avatarColor: '#412402' },
  ];

  // Cost centres
  const costCentres = rfq.costCentres || [
    { dept: 'Sales — EMEA', code: 'CC-4021', gl: '6100-TRV', pct: 60, color: '#EF9F27' },
    { dept: 'Marketing',    code: 'CC-3017', gl: '6200-TRV', pct: 30, color: '#1D9E75' },
    { dept: 'Operations',   code: 'CC-5002', gl: '6300-TRV', pct: 10, color: '#AFA9EC' },
  ];

  // ── Timeline steps ──
  const timelineSteps = [
    {
      label: 'Created on',
      dateMain: createdAt ? fmtDate(createdAt) : '01 Apr 2026',
      dateSub: createdAt ? fmtDateTime(createdAt).split(', ').slice(-1)[0] : '10:24 pm',
      status: 'done',
      comment: null,
    },
    {
      label: 'Budget submitted',
      dateMain: budgetSubmit ? fmtDate(budgetSubmit) : '01 Apr 2026',
      dateSub: budgetSubmit ? fmtDateTime(budgetSubmit).split(', ').slice(-1)[0] : '10:24 pm',
      status: budgetSubmit ? 'done' : 'pending',
      comment: null,
    },
    {
      label: 'Budget approved',
      dateMain: budgetApproved ? fmtDate(budgetApproved) : '01 Apr 2026',
      dateSub: budgetApproved ? fmtDateTime(budgetApproved).split(', ').slice(-1)[0] : '10:30 pm',
      status: budgetApproved ? 'done' : 'active',
      comment: 'Looks good, approved for Dubai business trip.',
      commenter: `${rfq.reviewer || 'Tushar Mehta'} · Manager`,
    },
    {
      label: 'Trip plan submitted',
      dateMain: null,
      dateSub: null,
      status: 'pending',
      comment: null,
    },
    {
      label: 'Trip approved',
      dateMain: planFrozen ? (tripApproved ? fmtDate(tripApproved) : null) : null,
      dateSub: planFrozen && tripApproved ? fmtDateTime(tripApproved).split(', ').slice(-1)[0] : null,
      status: planFrozen ? 'done' : 'not-yet',
      comment: planFrozen ? 'Proceed with the booking.' : null,
      commenter: planFrozen ? `${rfq.reviewer || 'Tushar Mehta'} · Manager` : null,
    },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '14px',
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
        }}
      >

        {/* ── Modal Header ── */}
        <div style={{
          background: '#fff',
          borderBottom: '0.5px solid #e5e7eb',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>Trip details</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Last updated 2 hours ago</p>
            </div>
            <Badge bg="#FAEEDA" color="#633806" border="#FAC775">
              TRIP-ID: {displayTripId}
            </Badge>
            {planFrozen && (
              <Badge bg="#EAF3DE" color="#27500A" border="#C0DD97">APPROVED</Badge>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Badge bg="#E6F1FB" color="#0C447C" border="transparent">
              {rfq.travelerName || 'Trushant Shah'}
            </Badge>
            <button
              onClick={onClose}
              style={{
                width: '30px', height: '30px',
                borderRadius: '8px',
                background: '#f3f4f6',
                border: '0.5px solid #e5e7eb',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', color: '#6b7280',
              }}
            >✕</button>
          </div>
        </div>

        {/* ── Body: Sidebar + Main ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── LEFT SIDEBAR — Timeline ── */}
          <div style={{
            width: '220px',
            minWidth: '220px',
            background: '#f9fafb',
            borderRight: '0.5px solid #e5e7eb',
            padding: '20px 18px',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <p style={{
              margin: '0 0 18px',
              fontSize: '10px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              Approval Timeline
            </p>

            {timelineSteps.map((step, idx) => (
              <TimelineStep
                key={idx}
                label={step.label}
                dateMain={step.dateMain}
                dateSub={step.dateSub}
                status={step.status}
                comment={step.comment}
                commenter={step.commenter}
                isLast={idx === timelineSteps.length - 1}
              />
            ))}
          </div>

          {/* ── RIGHT — Scrollable Main Content ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

            {/* ── 1. TRIP SUMMARY ── */}
            <SectionCard>
              <SectionHeader icon={<MapPinIcon />} label="Trip summary" />
              <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                {/* Left: Itinerary */}
                <div>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Itinerary</p>
                  {destinations.length > 0
                    ? destinations.map((dest, i) => {
                        const isFirst = i === 0;
                        const isLast  = i === destinations.length - 1;
                        const dot = isFirst ? '#EF9F27' : isLast ? '#1D9E75' : '#85B7EB';
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: '4px' }}>
                              <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: dot }} />
                              {!isLast && <div style={{ width: '1px', height: '22px', background: '#e5e7eb', marginTop: '2px' }} />}
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                                {dest.destination}
                                {dest.isTransit && <span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>transit</span>}
                              </p>
                              <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                                {dest.dateOfArrival && fmtDate(dest.dateOfArrival)}
                                {dest.dateOfDeparture && dest.dateOfDeparture !== dest.dateOfArrival
                                  ? ` — ${fmtDate(dest.dateOfDeparture)}` : ''}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    : demoDestinations.map((d, i, arr) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, marginTop: '4px' }}>
                            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: d.dot }} />
                            {i < arr.length - 1 && <div style={{ width: '1px', height: '22px', background: '#e5e7eb', marginTop: '2px' }} />}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                              {d.name}
                              {d.transit && <span style={{ fontSize: '10px', fontWeight: 400, color: '#9ca3af', marginLeft: '4px' }}>transit</span>}
                            </p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{d.date}</p>
                          </div>
                        </div>
                      ))
                  }
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <Badge bg="#FAEEDA" color="#633806" border="#FAC775">{rfqTotalNights || 3} nights</Badge>
                    <Badge bg="#E6F1FB" color="#0C447C" border="#B5D4F4">{totalPax || 1} pax</Badge>
                  </div>
                </div>

                {/* Right: Cost breakdown */}
                <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px 16px', border: '0.5px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 12px', fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cost Breakdown</p>
                  {[
                    { label: 'Flights',     val: flightTotal     || 124000 },
                    { label: 'Hotels',      val: hotelTotal      || 98400  },
                    { label: 'Attractions', val: attractionTotal || 14200  },
                    { label: 'Transfers',   val: transferTotal   || 8600   },
                  ].map((row, i) => (
                    <div key={i} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>{row.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{fmt(row.val)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '0.5px solid #e5e7eb', paddingTop: '10px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>Grand total</span>
                      <span style={{ fontSize: '17px', fontWeight: 700, color: '#185FA5' }}>{fmt(grandTotal || 245200)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>Used of {fmt(budget || 250000)} budget</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{budgetUsedPct || 98}%</span>
                    </div>
                    <div style={{ height: '5px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${budgetUsedPct || 98}%`,
                        background: (budgetUsedPct || 98) > 95 ? '#EF9F27' : '#1D9E75',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 2. PARTICIPANTS & MANAGERS ── */}
            <SectionCard>
              <SectionHeader icon={<UsersIcon />} label="Participants & managers" />
              <div style={{ padding: '14px 18px' }}>
                {/* Trip organiser + co-travellers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                  {[
                    { initial: 'TS', name: rfq.travelerName || 'Trushant Shah', role: 'Trip organiser', permission: 'Admin',    avatarBg: '#AFA9EC', avatarColor: '#26215C', permBg: '#EEEDFE', permColor: '#3C3489' },
                    { initial: 'RM', name: 'Rahul Mehta',                       role: 'Co-traveller',  permission: 'Can edit',  avatarBg: '#85B7EB', avatarColor: '#042C53', permBg: '#E6F1FB', permColor: '#0C447C' },
                    { initial: 'PN', name: 'Priya Nair',                        role: 'Co-traveller',  permission: 'View only', avatarBg: '#FAC775', avatarColor: '#412402', permBg: '#EAF3DE', permColor: '#27500A' },
                  ].map((p, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      border: '0.5px solid #e5e7eb',
                      borderRadius: '8px',
                      background: '#fafafa',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: p.avatarBg, color: p.avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '12px', fontWeight: 600, flexShrink: 0,
                        }}>{p.initial}</div>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111827' }}>{p.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{p.role}</p>
                        </div>
                      </div>
                      <span style={{
                        background: p.permBg, color: p.permColor,
                        fontSize: '11px', fontWeight: 500, padding: '4px 10px',
                        borderRadius: '6px',
                      }}>{p.permission}</span>
                    </div>
                  ))}
                </div>

                {/* Approving manager */}
                <div style={{
                  border: '0.5px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#fafafa',
                }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>Approving manager</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: '#AFA9EC', color: '#26215C',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 600,
                    }}>TM</div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                      {rfq.reviewer || 'Tushar Mehta'}
                    </span>
                    <span style={{
                      background: planFrozen ? '#EAF3DE' : '#FAEEDA',
                      color: planFrozen ? '#27500A' : '#633806',
                      fontSize: '11px', fontWeight: 500, padding: '3px 9px',
                      borderRadius: '6px',
                      border: `0.5px solid ${planFrozen ? '#C0DD97' : '#FAC775'}`,
                    }}>
                      {planFrozen ? 'Approved 15 Jan' : 'Approved 14 Jan'}
                    </span>
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ── 3. TRAVELLER DETAILS ── */}
            <SectionCard>
              <SectionHeader icon={<BriefcaseIcon />} label="Traveller details" />
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr', gap: 0, marginBottom: '6px' }}>
                  {['Name', 'Passport', 'Date of birth', 'Type'].map(col => (
                    <span key={col} style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {col}
                    </span>
                  ))}
                </div>
                {travellers.map((t, i) => (
                  <div key={i} style={{
                    borderTop: '0.5px solid #e5e7eb',
                    padding: '10px 0',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr 0.8fr',
                    alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: t.avatarBg, color: t.avatarColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 600, flexShrink: 0,
                      }}>{t.initial}</div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{t.passport}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{t.dob}</span>
                    <span style={{
                      background: t.type === 'Adult' ? '#FAEEDA' : '#E6F1FB',
                      color:      t.type === 'Adult' ? '#633806' : '#0C447C',
                      fontSize: '10px', fontWeight: 500, padding: '2px 8px',
                      borderRadius: '6px', display: 'inline-block',
                    }}>{t.type}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── 4. COST CENTRE ── */}
            <SectionCard>
              <SectionHeader icon={<HomeIcon />} label="Cost centre & departmental allocation" />
              <div style={{ padding: '14px 18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.8fr 0.9fr', gap: 0, marginBottom: '6px' }}>
                  {['Department', 'Cost centre', 'GL code', 'Allocation', 'Amount'].map(col => (
                    <span key={col} style={{ fontSize: '10px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {col}
                    </span>
                  ))}
                </div>
                {costCentres.map((cc, i) => {
                  const amount = Math.round(((grandTotal || 245200) * cc.pct) / 100);
                  return (
                    <div key={i} style={{
                      borderTop: '0.5px solid #e5e7eb',
                      padding: '10px 0',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1.8fr 0.9fr',
                      alignItems: 'center',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cc.color, flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{cc.dept}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{cc.code}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{cc.gl}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#6b7280', minWidth: '30px' }}>{cc.pct}%</span>
                        <div style={{ flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${cc.pct}%`, height: '100%', background: cc.color, borderRadius: '4px' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827', textAlign: 'right' }}>{fmt(amount)}</span>
                    </div>
                  );
                })}
                <div style={{ borderTop: '0.5px solid #e5e7eb', paddingTop: '10px', marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>Total allocated</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{fmt(grandTotal || 245200)}</span>
                </div>
              </div>
            </SectionCard>

          </div>{/* End right content */}
        </div>{/* End body */}
      </div>
    </div>
  );
}