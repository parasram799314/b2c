import { useState } from 'react';

// ─── Icons ───────────────────────────────────────────────────────────────────
const ArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const PlaneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 3 16.5 4.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
  </svg>
);
const HotelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="1"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const CarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0zm10 0a2 2 0 1 0 4 0 2 2 0 0 0-4 0z"/>
  </svg>
);
const BookmarkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6"/>
  </svg>
);
const MergeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6l4-4 4 4M12 2v10.3M8 18l4 4 4-4M12 22v-5.7M3 12h7m4 0h7"/>
  </svg>
);
const UndoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

const DEST_IMAGES = {
  london:    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
  paris:     'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  barcelona: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  dubai:     'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
  tokyo:     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  bali:      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  rome:      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  istanbul:  'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=600&q=80',
  bangkok:   'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
  default:   'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=600&q=80',
};

function getImg(rfq) {
  const d = (rfq.destinations?.[0]?.destination || '').toLowerCase();
  for (const k of Object.keys(DEST_IMAGES)) {
    if (d.includes(k)) return DEST_IMAGES[k];
  }
  return DEST_IMAGES.default;
}

// ─── TripCard ─────────────────────────────────────────────────────────────────
function TripCard({ rfq, onOpen, selectMode, selected, onToggleSelect }) {
  const img = getImg(rfq);
  const title = rfq.tripName || rfq.destinations?.[0]?.destination || 'Unnamed Trip';
  const traveler = rfq.travelerName || 'Guest Traveler';
  const initials = traveler.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Calculate dynamic nights/dates strictly from planItems ───────────────
  const allDates = (rfq.planItems || []).flatMap(item => {
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

  const startD = allDates[0] || '';
  const endD   = allDates[allDates.length - 1] || '';

  let dateRangeStr = 'Flexible';
  let nightsCount  = 0;

  if (startD && endD) {
    try {
      const s = new Date(startD + 'T00:00:00');
      const e = new Date(endD + 'T00:00:00');
      const diff = Math.round((e - s) / 86400000);
      nightsCount = diff > 0 ? diff : 0;
      const fmt = { month: 'short', day: 'numeric' };
      dateRangeStr = diff > 0 
        ? `${s.toLocaleDateString('en-US', fmt)} - ${e.toLocaleDateString('en-US', fmt)}`
        : s.toLocaleDateString('en-US', fmt);
    } catch { }
  }

  const handleCardClick = () => {
    if (selectMode) { onToggleSelect(rfq._id); return; }
    onOpen(rfq);
  };

  return (
    <div
      style={{
        display: 'flex', background: '#fff', borderRadius: '16px',
        border: selected ? '2px solid #7c3aed' : '1px solid #e5e7eb',
        overflow: 'hidden', transition: 'box-shadow 0.2s, border 0.15s',
        boxShadow: selected ? '0 0 0 3px rgba(124,58,237,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
        cursor: 'pointer', position: 'relative',
      }}
      onClick={handleCardClick}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
      {/* Select checkbox overlay */}
      {selectMode && (
        <div style={{
          position: 'absolute', top: '10px', left: '10px', zIndex: 10,
          width: '22px', height: '22px', borderRadius: '6px',
          background: selected ? '#7c3aed' : 'rgba(255,255,255,0.9)',
          border: selected ? '2px solid #7c3aed' : '2px solid #9ca3af',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        }}>
          {selected && <CheckIcon />}
        </div>
      )}

      {/* Merged tag */}
      {rfq.isMerged && (
        <div style={{
          position: 'absolute', top: '10px', right: selectMode ? '10px' : '130px',
          zIndex: 10, background: '#7c3aed', color: '#fff',
          fontSize: '10px', fontWeight: 700, padding: '3px 8px',
          borderRadius: '20px', letterSpacing: '0.5px',
        }}>
          MERGED
        </div>
      )}

      {/* Thumbnail */}
      <div style={{ width: '130px', minHeight: '120px', flexShrink: 0, overflow: 'hidden' }}>
        <img src={img} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', fontWeight: 500 }}>{dateRangeStr} · {nightsCount} nights</p>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 10px' }}>{title}</h3>

          {/* Traveler */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: '#7c3aed', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 700, flexShrink: 0,
            }}>{initials}</div>
            <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{traveler}</span>
          </div>

          {/* Icons row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {[
              { icon: <PlaneIcon />, count: 1 },
              { icon: <HotelIcon />, count: rfq.requireHotels ? 1 : 0 },
              { icon: <CarIcon />, count: 0 },
              { icon: <BookmarkIcon />, count: 0 },
            ].map(({ icon, count }, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: '#6b7280' }}>
                {icon}{count}
              </span>
            ))}
          </div>
        </div>

        {/* Action — hide in select mode */}
        {!selectMode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
            <button
              style={{
                padding: '8px 16px', border: '1.5px solid #7c3aed', borderRadius: '10px 0 0 10px',
                background: '#fff', color: '#7c3aed', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
              onClick={e => { e.stopPropagation(); onOpen(rfq); }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              View detail
            </button>
            <button
              style={{
                padding: '8px 10px', border: '1.5px solid #7c3aed', borderLeft: 'none',
                borderRadius: '0 10px 10px 0', background: '#fff', color: '#7c3aed',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f0ff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              <ChevronDown />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Merge Modal ───────────────────────────────────────────────────────────────
function MergeModal({ selectedRFQs, onCancel, onConfirm, merging }) {
  const [deleteOriginals, setDeleteOriginals] = useState(false);

  const [tripName, setTripName] = useState(
    `Merged: ${selectedRFQs.map(r => r.tripName || r.destinations?.[0]?.destination || 'Trip').join(' + ')}`
  );

  const totalNights = selectedRFQs.reduce((s, r) =>
    s + (r.destinations || []).reduce((n, d) => n + (d.numberOfNights || 0), 0), 0
  );
  const allDests = selectedRFQs.flatMap(r => (r.destinations || []).map(d => d.destination)).filter(Boolean);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.45)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '32px',
        width: '480px', maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Merge Itineraries</h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
              {selectedRFQs.length} trips · {totalNights} total nights · {allDests.length} destinations
            </p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
            <CloseIcon />
          </button>
        </div>

        {/* Merge preview — day flow */}
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#9ca3af', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Day-wise merge order
          </p>
          {(() => {
            let day = 1;
            return selectedRFQs.map((rfq, ri) => (
              <div key={rfq._id} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#7c3aed', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0,
                  }}>{ri + 1}</div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                    {rfq.tripName || rfq.destinations?.[0]?.destination || 'Trip'}
                  </span>
                </div>
                {(rfq.destinations || []).map((d, di) => {
                  const currentDay = day;
                  day += d.numberOfNights || 0;
                  return (
                    <div key={di} style={{
                      marginLeft: '30px', marginTop: '4px',
                      fontSize: '12px', color: '#6b7280',
                      display: 'flex', gap: '8px',
                    }}>
                      <span style={{ color: '#7c3aed', fontWeight: 600 }}>Day {currentDay}–{currentDay + (d.numberOfNights || 1) - 1}</span>
                      <span>{d.destination}</span>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* Trip name input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
            Merged trip name
          </label>
          <input
            type="text"
            value={tripName}
            onChange={e => setTripName(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid #e5e7eb', borderRadius: '10px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box', color: '#111827',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>
 
<div style={{ 
  marginBottom: '24px', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '10px',
  padding: '12px',
  background: '#fff7ed', 
  borderRadius: '10px',
  border: '1px solid #ffedd5'
}}>
  <input
    type="checkbox"
    id="delete-originals"
    checked={deleteOriginals}
    onChange={e => setDeleteOriginals(e.target.checked)}
    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
  />
  <label htmlFor="delete-originals" style={{ fontSize: '13px', color: '#9a3412', fontWeight: 600, cursor: 'pointer' }}>
    Delete original trips after merging? (Only the merged trip will remain)
  </label>
</div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={merging}
            style={{
              padding: '10px 22px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
              background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 600,
              cursor: merging ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(tripName, deleteOriginals)}
            disabled={merging || !tripName.trim()}
            style={{
              padding: '10px 22px', border: 'none', borderRadius: '10px',
              background: merging ? '#c4b5fd' : '#7c3aed', color: '#fff',
              fontSize: '14px', fontWeight: 700,
              cursor: merging ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <MergeIcon />
            {merging ? 'Merging…' : 'Create Merged Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TripsPage ─────────────────────────────────────────────────────────────────
export default function TripsPage({ onClose, itineraries = [], onOpen, onMerge }) {
  const [activeTab, setActiveTab]       = useState('upcoming');
  const [search, setSearch]             = useState('');
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [merging, setMerging]           = useState(false);
  const [mergeError, setMergeError]     = useState('');
  // Undo: remember the new merged RFQ id so user can undo
  const [lastMergedId, setLastMergedId] = useState(null);
  const [undoVisible, setUndoVisible]   = useState(false);

  const tabs = ['upcoming', 'past', 'canceled'];

  const filtered = itineraries.filter(rfq => {
    let status = 'upcoming';
    if (rfq.reviewStatus === 'cancelled' || rfq.reviewStatus === 'rejected') status = 'canceled';

    const matchesTab = status === activeTab;
    const title = (rfq.tripName || rfq.destinations?.[0]?.destination || '').toLowerCase();
    const traveler = (rfq.travelerName || '').toLowerCase();
    const query = search.toLowerCase();
    const matchesSearch = search === '' || title.includes(query) || traveler.includes(query);

    return matchesTab && matchesSearch;
  });

  const selectedRFQs = itineraries.filter(r => selectedIds.includes(r._id));

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setMergeError('');
  };

  const handleMergeClick = () => {
    if (selectedIds.length < 2) {
      setMergeError('Please select at least 2 trips to merge.');
      return;
    }
    setMergeError('');
    setShowMergeModal(true);
  };

  const handleConfirmMerge = async (mergedTripName, deleteOriginals) => {
    setMerging(true);
    setMergeError('');
    try {
      const newRfq = await onMerge({ rfqIds: selectedIds, mergedTripName,deleteOriginals });
      setLastMergedId(newRfq._id);
      setUndoVisible(true);
      setShowMergeModal(false);
      exitSelectMode();
      // Auto-hide undo banner after 8 seconds
      setTimeout(() => setUndoVisible(false), 8000);
    } catch (err) {
      setMergeError('Merge failed: ' + (err.message || 'Please try again.'));
    }
    setMerging(false);
  };

 const handleUndo = async () => {
    if (!lastMergedId) return;
    try {
      // Merged trip ko directly delete karo
      const res = await fetch(`/api/rfqs/${lastMergedId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setUndoVisible(false);
      setLastMergedId(null);
      // Page refresh karke latest trips lo
      window.location.reload();
    } catch (err) {
      console.error('Undo failed:', err);
      alert('Undo failed: ' + err.message);
    }
  };
  

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#f9fafb', display: 'flex', flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* Merge Modal */}
      {showMergeModal && (
        <MergeModal
          selectedRFQs={selectedRFQs}
          onCancel={() => setShowMergeModal(false)}
          onConfirm={handleConfirmMerge}
          merging={merging}
        />
      )}

      {/* ── Header ── */}
      <header style={{
        background: 'rgb(247, 190, 57)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height: '30px', objectFit: 'contain' }} />
      </header>

      {/* ── Tabs ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 32px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'transparent', border: '1px solid #e5e7eb',
              borderRadius: '10px', padding: '6px 12px',
              cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
              height: '34px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft /> Back
          </button>
          <div style={{ display: 'flex', gap: '0' }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '16px 22px', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: '15px',
                  fontWeight: activeTab === tab ? 700 : 500,
                  color: activeTab === tab ? '#111827' : '#6b7280',
                  borderBottom: activeTab === tab ? '3px solid #111827' : '3px solid transparent',
                  textTransform: 'capitalize', transition: 'all 0.15s',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#7c3aed', color: '#fff', border: 'none',
          borderRadius: '10px', padding: '9px 18px',
          cursor: 'pointer', fontSize: '13px', fontWeight: 700,
        }}>
          <PlusIcon /> New trip
        </button>
      </div>

      {/* ── Filters row ── */}
      <div style={{
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '12px',
        background: '#fff', borderBottom: '1px solid #f3f4f6',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 280px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search trips"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 38px',
              border: '1px solid #e5e7eb', borderRadius: '10px',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box', color: '#111827',
            }}
            onFocus={e => e.target.style.borderColor = '#7c3aed'}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        {/* Dropdowns */}
        {['Browse by trips', 'All trips'].map(label => (
          <button key={label} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '10px',
            background: '#fff', fontSize: '13px', fontWeight: 500, color: '#374151', cursor: 'pointer',
          }}>
            {label} <ChevronDown />
          </button>
        ))}

        {/* Merge / Cancel select */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectMode ? (
            <>
              <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                {selectedIds.length} selected
              </span>
              <button
                onClick={handleMergeClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 16px', border: 'none', borderRadius: '10px',
                  background: selectedIds.length >= 2 ? '#7c3aed' : '#d1d5db',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <MergeIcon /> Merge {selectedIds.length >= 2 ? `(${selectedIds.length})` : ''}
              </button>
              <button
                onClick={exitSelectMode}
                style={{
                  padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px',
                  background: '#fff', fontSize: '13px', fontWeight: 600, color: '#374151', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => { setSelectMode(true); setSelectedIds([]); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 16px', border: '1.5px solid #7c3aed', borderRadius: '10px',
                background: '#fff', fontSize: '13px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer',
              }}
            >
              <MergeIcon /> Merge trips
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {mergeError && (
        <div style={{
          background: '#fef2f2', borderBottom: '1px solid #fecaca',
          padding: '10px 32px', fontSize: '13px', color: '#dc2626', fontWeight: 500,
        }}>
          {mergeError}
        </div>
      )}

      {/* ── Undo banner ── */}
      {undoVisible && (
        <div style={{
          background: '#f5f0ff', borderBottom: '1px solid #ddd6fe',
          padding: '12px 32px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '13px', color: '#5b21b6', fontWeight: 500 }}>
            ✅ Trips merged successfully!
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleUndo}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', border: '1.5px solid #7c3aed', borderRadius: '8px',
                background: '#fff', color: '#7c3aed', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <UndoIcon /> Undo Merge
            </button>
            <button
              onClick={() => setUndoVisible(false)}
              style={{
                padding: '7px 12px', border: 'none', borderRadius: '8px',
                background: 'none', color: '#9ca3af', cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Trip list ── */}
      <main style={{
        flex: 1, overflowY: 'auto', padding: '28px 32px',
        maxWidth: '900px', width: '100%', margin: '0 auto', boxSizing: 'border-box',
      }}>
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filtered.map(rfq => (
              <TripCard
                key={rfq._id}
                rfq={rfq}
                onOpen={onOpen}
                selectMode={selectMode}
                selected={selectedIds.includes(rfq._id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: '80px', color: '#9ca3af' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#374151' }}>No {activeTab} trips</p>
            <p style={{ fontSize: '13px' }}>Start a new trip from the homepage.</p>
          </div>
        )}
      </main>
    </div>
  );
}