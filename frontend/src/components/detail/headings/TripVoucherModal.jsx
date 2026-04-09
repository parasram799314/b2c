// components/detail/TripVoucherModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Yeh file DetailPage.jsx mein import karni hai.
// BOOK NOW ke right side mein ek "🎫 Voucher" button add karna hai (instructions neeche hain).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtVoucherDate(d) {
  if (!d) return '—';
  try {
    const dt = new Date(d + 'T00:00:00');
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return d; }
}

function fmtVoucherPrice(price, currency) {
  if (!price) return null;
  const num = parseFloat(price);
  if (isNaN(num)) return null;
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
  return `${sym}${num.toLocaleString('en-IN')}`;
}

// ── Day grouping (same logic as DetailPage) ──────────────────────────────────
function buildDayGroups(planItems) {
  const dayGroupsMap = {};

  planItems.forEach(item => {
    let d = item.depDate || item.checkIn || item.visitDate || item.date || '';
    if (item.type === 'hotel' && item.checkIn) d = item.checkIn;
    if (!d) d = 'No Date';

    if (item.type === 'hotel' && item.nights) {
      const nights = Number(item.nights) || 1;
      // Loop from 0 to 'nights' to include the checkout day
      for (let n = 0; n <= nights; n++) {
        const base = new Date(d + 'T00:00:00');
        base.setDate(base.getDate() + n);
        const dk = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`;
        
        if (!dayGroupsMap[dk]) dayGroupsMap[dk] = [];

        if (n === 0) {
          // Check-in day
          dayGroupsMap[dk].push({ ...item, _isCheckIn: true, _totalNights: nights });
        } else if (n === nights) {
          // Check-out day
          dayGroupsMap[dk].push({ ...item, _isCheckOut: true, _totalNights: nights, date: dk });
        } else {
          // Intermediate nights
          dayGroupsMap[dk].push({
            ...item,
            id: `${item.id}_night_${n}`,
            _isHotelContinuation: true,
            _nightNumber: n + 1,
            _totalNights: nights,
            date: dk,
            checkIn: dk,
          });
        }
      }
    } else {
      if (!dayGroupsMap[d]) dayGroupsMap[d] = [];
      dayGroupsMap[d].push(item);
    }
  });

  return Object.entries(dayGroupsMap).sort(([a], [b]) => {
    if (a === 'No Date') return 1;
    if (b === 'No Date') return -1;
    return new Date(a) - new Date(b);
  });
}

// ── Item Row ─────────────────────────────────────────────────────────────────
function VoucherItemRow({ item, dayNum }) {
  const isContinuation = item._isHotelContinuation;

  // Flight
  if (item.type === 'flight') {
    return (
      <div style={rowStyle}>
        <div style={iconBox('✈️')} />
        <div style={{ flex: 1 }}>
          <div style={itemTitle}>
            {item.from || item.fromAirport || '?'} → {item.to || item.toAirport || '?'}
          </div>
          <div style={itemMeta}>
            {[item.airline, item.flightNumber, item.class].filter(Boolean).join(' · ')}
            {item.depTime ? ` · Dep: ${item.depTime}` : ''}
            {item.arrTime ? ` · Arr: ${item.arrTime}` : ''}
          </div>
          {item.pnr && <div style={itemMeta}>PNR: <b>{item.pnr}</b></div>}
        </div>
        {fmtVoucherPrice(item.price, item.currency) && (
          <div style={priceTag}>{fmtVoucherPrice(item.price, item.currency)}</div>
        )}
      </div>
    );
  }

  // Hotel
  if (item.type === 'hotel') {
    return (
      <div style={rowStyle}>
        <div style={iconBox('🏨')} />
        <div style={{ flex: 1 }}>
          <div style={itemTitle}>
            {isContinuation
              ? `${item.hotelName || item.name || 'Hotel'} (Night ${item._nightNumber} of ${item._totalNights})`
              : item.hotelName || item.name || 'Hotel'}
          </div>
          <div style={itemMeta}>
            {item.address || item.cityName || ''}
            {item.roomType ? ` · Room: ${item.roomType}` : ''}
            {item.mealPlan ? ` · Meal: ${item.mealPlan}` : ''}
            {item.stars ? ` · ${item.stars}⭐` : ''}
          </div>
          {!isContinuation && item.checkIn && (
            <div style={itemMeta}>
              Check-in: <b>{fmtVoucherDate(item.checkIn)}</b>
              {item.nights ? ` · ${item.nights} Night${item.nights > 1 ? 's' : ''}` : ''}
            </div>
          )}
        </div>
        {!isContinuation && fmtVoucherPrice(item.price, item.currency) && (
          <div style={priceTag}>{fmtVoucherPrice(item.price, item.currency)}</div>
        )}
      </div>
    );
  }

  // Attraction / Activity
  if (item.type === 'attraction') {
    return (
      <div style={rowStyle}>
        <div style={iconBox('🗺️')} />
        <div style={{ flex: 1 }}>
          <div style={itemTitle}>{item.name || 'Activity'}</div>
          <div style={itemMeta}>
            {[item.category, item.cityName, item.duration ? `${item.duration} hrs` : ''].filter(Boolean).join(' · ')}
          </div>
        </div>
        {fmtVoucherPrice(item.price, item.currency) && (
          <div style={priceTag}>{fmtVoucherPrice(item.price, item.currency)}</div>
        )}
      </div>
    );
  }

  // Transfer
  if (item.type === 'transfer') {
    return (
      <div style={rowStyle}>
        <div style={iconBox('🚗')} />
        <div style={{ flex: 1 }}>
          <div style={itemTitle}>{item.type_label || item.name || 'Transfer'}</div>
          <div style={itemMeta}>
            {[item.from, item.to].filter(Boolean).join(' → ')}
            {item.provider ? ` · ${item.provider}` : ''}
          </div>
        </div>
      </div>
    );
  }

  // Other
  return (
    <div style={rowStyle}>
      <div style={iconBox('📌')} />
      <div style={{ flex: 1 }}>
        <div style={itemTitle}>{item.name || item.item_name || 'Item'}</div>
        {item.description && <div style={itemMeta}>{item.description}</div>}
      </div>
      {fmtVoucherPrice(item.price, item.currency) && (
        <div style={priceTag}>{fmtVoucherPrice(item.price, item.currency)}</div>
      )}
    </div>
  );
}

// ── Inline styles ─────────────────────────────────────────────────────────────
const rowStyle = {
  display: 'flex', alignItems: 'flex-start', gap: '10px',
  padding: '10px 0', borderBottom: '1px solid #f3f4f6',
};
const iconBox = (emoji) => ({
  width: '32px', height: '32px', borderRadius: '8px',
  background: '#f9fafb', border: '1px solid #e5e7eb',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '16px', flexShrink: 0,
  content: emoji,  // just a label carrier
  // We render emoji as text inside a span below, so this is just for sizing
});
const itemTitle = { fontSize: '13px', fontWeight: 700, color: '#111827', marginBottom: '2px' };
const itemMeta  = { fontSize: '11px', color: '#6b7280', lineHeight: 1.5 };
const priceTag  = {
  fontSize: '12px', fontWeight: 800, color: '#92400e',
  background: '#fef9c3', padding: '2px 8px', borderRadius: '6px',
  border: '1px solid #fde68a', whiteSpace: 'nowrap', flexShrink: 0,
  alignSelf: 'flex-start',
};

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function TripVoucherModal({ open, onClose, rfq, planItems, userName }) {
  const printRef = useRef(null);

  if (!open) return null;

  const dayGroups   = buildDayGroups(planItems);
  const tripTitle   = (rfq?.tripName || 'MY TRIP').toUpperCase();
  const traveler    = rfq?.travelerName || rfq?.preparedFor || rfq?.customerName || rfq?.createdByName || userName || '—';
  const destination = rfq?.destinations?.map(d => d.destination).filter(Boolean).join(', ') || '—';
  const adults      = rfq?.numberOfAdults || 1;
  const children    = rfq?.numberOfChildren || 0;

  // ── Calculate actual span from planItems ─────────────────────────────────
  const allPlanDates = planItems.flatMap(item => {
    const d = item.depDate || item.checkIn || item.visitDate || item.date || '';
    if (!d || d === 'No Date') return [];
    if (item.type === 'hotel' && item.nights) {
      try {
        const ci = new Date(d + 'T00:00:00');
        const co = new Date(ci);
        co.setDate(co.getDate() + (Number(item.nights) || 0));
        return [d, co.toISOString().split('T')[0]];
      } catch { return [d]; }
    }
    return [d];
  }).filter(Boolean).sort();

  const startDate = allPlanDates[0] || rfq?.destinations?.[0]?.dateOfArrival || rfq?.startDate || '';
  let endDate     = allPlanDates[allPlanDates.length - 1] || rfq?.destinations?.[rfq?.destinations?.length - 1]?.dateOfDeparture || rfq?.endDate || '';

  let durationText = '—';
  if (startDate && endDate) {
    try {
      const s = new Date(startDate + 'T00:00:00');
      const e = new Date(endDate + 'T00:00:00');
      const diff = Math.round((e - s) / 86400000);
      if (diff >= 0) {
        durationText = `${diff + 1} Day${diff + 1 > 1 ? 's' : ''} / ${diff} Night${diff !== 1 ? 's' : ''}`;
      }
    } catch(err) { console.error("Duration calc error", err); }
  }

  // Grand total
  const grandTotal = planItems
    .filter(p => p.status !== 'cancelled' && !p._isHotelContinuation)
    .reduce((sum, item) => {
      const price = parseFloat(item.price || 0);
      if (item.type === 'hotel') return sum + price * (Number(item.nights) || 1);
      return sum + price;
    }, 0);

  // ── Download as PDF ──────────────────────────────────────────────────────
const handleDownload = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    @media print {
      /* Sab kuch hide karo */
      body * { visibility: hidden !important; }

      /* Sirf voucher content dikhao */
      #voucher-print-area,
      #voucher-print-area * {
        visibility: visible !important;
      }

      /* voucher-print-area ko normal flow mein rakho — fixed nahi */
      #voucher-print-area {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 20px !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        max-height: none !important;
      }

      /* Yellow banner background print mein dikhao */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      @page {
        margin: 8mm;
        size: A4;
      }
    }
  `;
  document.head.appendChild(style);
  window.print();
  setTimeout(() => document.head.removeChild(style), 1500);
};

  // ── Baseline for Day numbers ─────────────────────────────────────────────
  const planDates = planItems
    .map(i => i.depDate || i.checkIn || i.visitDate || i.date || '')
    .filter(Boolean).sort();
  const baselineStr = planDates[0] || startDate;
  const baseline    = baselineStr ? new Date(baselineStr + 'T00:00:00') : null;

  const getDayNum = (rawDate) => {
    if (rawDate === 'No Date' || !baseline) return null;
    const diff = Math.round((new Date(rawDate + 'T00:00:00') - baseline) / 86400000);
    return diff + 1;
  };

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 99998, backdropFilter: 'blur(3px)',
        }}
      />

      {/* ── Modal Shell ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '24px 16px', overflowY: 'auto',
      }}>
        <div style={{
          background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '700px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>

          {/* ── Top Action Bar (NOT printed) ── */}
          <div className="no-print" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderBottom: '1px solid #f3f4f6',
            background: '#fff', flexShrink: 0,
          }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>
              🎫 Trip Voucher
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Download PDF button */}
              <button
                onClick={handleDownload}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '10px',
                  background: 'rgb(247,190,57)', border: 'none',
                  fontSize: '12px', fontWeight: 800, color: '#1a1a1a',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(247,190,57,0.4)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#f3f4f6', border: 'none', cursor: 'pointer',
                  fontSize: '16px', color: '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── Voucher Content (this part gets printed) ── */}
          <div
            id="voucher-print-area"
            ref={printRef}
            style={{ overflowY: 'auto', maxHeight: '80vh', padding: '28px 28px 36px' }}
          >
            {/* Header Banner */}
            <div style={{
              background: 'rgb(247,190,57)', borderRadius: '12px',
              padding: '20px 24px', marginBottom: '24px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
                  {tripTitle}
                </div>
                <div style={{ fontSize: '12px', color: '#78350f', fontWeight: 600, marginTop: '4px' }}>
                  Trip Voucher · Trav Platforms
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Booking Ref
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#1a1a1a', marginTop: '2px' }}>
                  {rfq?.rfqId || rfq?._id?.slice(-8)?.toUpperCase() || 'TBD'}
                </div>
              </div>
            </div>

            {/* Trip Summary Strip */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px', marginBottom: '24px',
            }}>
              {[
                { label: 'Traveler',    value: traveler },
                { label: 'Destination', value: destination },
                { label: 'Travelers',   value: `${adults} Adult${adults > 1 ? 's' : ''}${children ? `, ${children} Child` : ''}` },
                { label: 'Duration',    value: durationText },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: '#f9fafb', borderRadius: '10px', padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div style={{ borderTop: '2px dashed #e5e7eb', marginBottom: '24px' }} />

            {/* Day-wise Itinerary */}
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#374151', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📅 Day-wise Itinerary
            </div>

            {dayGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '13px' }}>
                No items in plan yet.
              </div>
            ) : (
              dayGroups.map(([rawDate, items], gi) => {
                const dayNum = getDayNum(rawDate) ?? (gi + 1);
                return (
                  <div key={rawDate} style={{
                    marginBottom: '20px', borderRadius: '12px',
                    border: '1.5px solid #e5e7eb', overflow: 'hidden',
                  }}>
                    {/* Day Header */}
                    <div style={{
                      padding: '10px 16px', background: '#f9fafb',
                      borderBottom: '1px solid #e5e7eb',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <span style={{
                        background: '#1a1a1a', color: '#fff',
                        fontSize: '10px', fontWeight: 800, padding: '3px 10px',
                        borderRadius: '6px', textTransform: 'uppercase',
                      }}>
                        DAY {dayNum}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                        {rawDate === 'No Date' ? 'Unscheduled' : fmtVoucherDate(rawDate)}
                      </span>
                    </div>

                    {/* Items */}
                    <div style={{ padding: '4px 16px 8px' }}>
                      {items.map((item) => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                          {/* Icon */}
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#f3f4f6', border: '1px solid #e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '15px', flexShrink: 0,
                          }}>
                            {item.type === 'flight' ? '✈️' : item.type === 'hotel' ? '🏨' : item.type === 'attraction' ? '🗺️' : item.type === 'transfer' ? '🚗' : '📌'}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {/* Flight */}
                            {item.type === 'flight' && (
                              <>
                                <div style={itemTitle}>{item.from || item.fromAirport || '?'} → {item.to || item.toAirport || '?'}</div>
                                <div style={itemMeta}>
                                  {[item.airline, item.flightNumber, item.class].filter(Boolean).join(' · ')}
                                  {item.depTime ? ` · Dep: ${item.depTime}` : ''}
                                  {item.arrTime ? ` · Arr: ${item.arrTime}` : ''}
                                </div>
                                {item.pnr && <div style={itemMeta}>PNR: <b>{item.pnr}</b></div>}
                              </>
                            )}
                            {/* Hotel */}
                            {item.type === 'hotel' && (
                              <>
                                <div style={itemTitle}>
                                  {item._isHotelContinuation
                                    ? `${item.hotelName || item.name || 'Hotel'} (Night ${item._nightNumber}/${item._totalNights})`
                                    : item.hotelName || item.name || 'Hotel'}
                                  {item._isCheckOut && ' (Check-out)'}
                                </div>
                                <div style={itemMeta}>
                                  {[item.address || item.cityName, item.roomType ? `Room: ${item.roomType}` : '', item.mealPlan ? `Meal: ${item.mealPlan}` : '', item.stars ? `${item.stars}⭐` : ''].filter(Boolean).join(' · ')}
                                </div>
                                
                                {item._isCheckIn && (
                                  <div style={{ marginTop: '6px' }}>
                                    <div style={{ display: 'inline-block', fontSize: '10px', background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '4px', border: '1px solid #bbf7d0', fontWeight: 700 }}>
                                      CHECK-IN: {fmtVoucherDate(item.checkIn)}
                                    </div>
                                  </div>
                                )}

                                {item._isCheckOut && (
                                  <div style={{ marginTop: '6px' }}>
                                    <div style={{ display: 'inline-block', fontSize: '10px', background: '#fff1f2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', border: '1px solid #fecaca', fontWeight: 700 }}>
                                      CHECK-OUT: {fmtVoucherDate(item.date)}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            {/* Attraction */}
                            {item.type === 'attraction' && (
                              <>
                                <div style={itemTitle}>{item.name || 'Activity'}</div>
                                <div style={itemMeta}>
                                  {[item.category, item.cityName, item.duration ? `${item.duration} hrs` : ''].filter(Boolean).join(' · ')}
                                </div>
                              </>
                            )}
                            {/* Transfer */}
                            {item.type === 'transfer' && (
                              <>
                                <div style={itemTitle}>{item.name || 'Transfer'}</div>
                                <div style={itemMeta}>
                                  {[item.from, item.to].filter(Boolean).join(' → ')}
                                  {item.provider ? ` · ${item.provider}` : ''}
                                </div>
                              </>
                            )}
                            {/* Other */}
                            {item.type === 'other' && (
                              <>
                                <div style={itemTitle}>{item.name || item.item_name || 'Item'}</div>
                                {item.description && <div style={itemMeta}>{item.description}</div>}
                              </>
                            )}
                          </div>

                          {/* Price */}
                          {!item._isHotelContinuation && fmtVoucherPrice(item.price, item.currency) && (
                            <div style={priceTag}>{fmtVoucherPrice(item.price, item.currency)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}

            {/* Grand Total */}
            {grandTotal > 0 && (
              <div style={{
                marginTop: '8px', padding: '16px 20px', borderRadius: '12px',
                background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Total Package Cost
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                    Inclusive of all taxes
                  </div>
                </div>
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '10px', color: '#9ca3af' }}>
              Generated by Trav Platforms · This is a booking voucher for reference purposes.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}