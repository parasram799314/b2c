import { useState, useRef, useEffect } from 'react';
import RFQForm from '../components/RFQForm';
import { ItineraryCard } from '../ui';
import heroBg from '../assets/hero-bg.png';

// ─── TP Profile Form Popup ────────────────────────────────────────────────────
function TpProfilePopup({ onClose }) {
  const STORAGE_KEY = 'tp_profile';
  const saved = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; } })();
  const [form, setForm] = useState({
    fullName: saved.fullName || '',
    phone:    saved.phone    || '',
    passport: saved.passport || '',
    budget:   saved.budget   || '',
    reviewer: saved.reviewer || '',
  });
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const field = (label, key, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '10px' }}>
      <label style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>{label}</label>
      <input
        type={type}
        value={form[key] || ''}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: '100%', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '7px 10px', outline: 'none', boxSizing: 'border-box', color: '#111827', background: '#fafafa' }}
        onFocus={e => e.target.style.borderColor = 'rgb(247,190,57)'}
        onBlur={e => e.target.style.borderColor = '#e5e7eb'}
      />
    </div>
  );

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    onClose();
  };

  return (
    <div ref={ref} style={{
      position: 'absolute', top: '46px', right: '0', zIndex: 2000,
      background: '#fff', borderRadius: '16px', padding: '18px', width: '270px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.18)', border: '1px solid #f3f4f6',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>👤 My Profile</div>
        <button onClick={onClose} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {field('Full Name',    'fullName', 'text',   'Trushant Shah')}
      {field('Phone',        'phone',    'tel',    '+91 98765 43210')}
      {field('Passport No.', 'passport', 'text',   'A1234567')}
      {field('Budget (₹)',   'budget',   'number', '50000')}
      {field('Reviewer',     'reviewer', 'text',   'tushar')}

      <button
        onClick={handleSave}
        style={{ width: '100%', padding: '10px', background: 'rgb(247,190,57)', color: '#1a1a1a', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
        onMouseEnter={e => e.target.style.background = '#e6ad2a'}
        onMouseLeave={e => e.target.style.background = 'rgb(247,190,57)'}
      >
        Save Profile ✓
      </button>

      {saved.fullName && (
        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
          Last saved: {saved.fullName}
        </div>
      )}
    </div>
  );
}

// ─── HomePage ──────────────────────────────────────────────────────────────────
export default function HomePage({
  onSubmit,
  loading,
  error,
  itineraries = [],
  onOpenItinerary,
  onDeleteItinerary,
  onAddToPlan,
}) {
  console.log('HomePage - Props received:', { 
    itinerariesLength: itineraries.length, 
    itineraries,
    hasOnSubmit: !!onSubmit,
    hasOnOpenItinerary: !!onOpenItinerary,
    hasOnDeleteItinerary: !!onDeleteItinerary 
  });
  
  const [page, setPage]         = useState(1);
  const [showTpForm, setShowTpForm] = useState(false);

  const pageSize     = 6;
  const totalPages   = Math.max(1, Math.ceil(itineraries.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const visibleItins = itineraries.slice((safePage - 1) * pageSize, safePage * pageSize);
  
  console.log('HomePage - Calculated values:', { 
    pageSize, 
    totalPages, 
    safePage, 
    visibleItinsLength: visibleItins.length,
    visibleItins 
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] text-gray-900">

      {/* ── HEADER ── */}
      <header className="w-full z-30 sticky top-0" style={{ backgroundColor: 'rgb(247, 190, 57)' }}>
        <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="https://travplatforms.com/images/logo3.png" alt="TravPlatforms" style={{ height: '35px', objectFit: 'contain' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowTpForm(v => !v)}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#fff', border: '2px solid rgba(0,0,0,0.08)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#374151',
                boxShadow: showTpForm ? '0 0 0 3px rgba(247,190,57,0.4)' : 'none',
                transition: 'box-shadow 0.2s',
              }}
            >
              TP
            </button>
            {showTpForm && <TpProfilePopup onClose={() => setShowTpForm(false)} />}
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div
        className="relative w-full"
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '420px' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.40) 0%, rgba(0,0,0,0.20) 45%, rgba(0,0,0,0.40) 100%)' }} />
        <div className="absolute inset-x-0 top-0 flex flex-col items-center justify-center text-center px-4" style={{ height: '58%' }}>
          <h1 className="text-white font-extrabold leading-tight mb-3"
            style={{ fontSize: 'clamp(26px, 3.8vw, 50px)', textShadow: '0 2px 20px rgba(0,0,0,0.55)', fontFamily: "'Georgia', serif" }}>
            Discover the World with Luxury
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
            Experience premium travel at its finest.
          </p>
        </div>
      </div>

      {/* ── SEARCH CARD ──
           Now always compact — the RFQForm handles its own fixed-center modal when expanded
      ── */}
      <div
        className="relative mx-auto w-full px-4 sm:px-6"
        style={{ maxWidth: '520px', marginTop: '-36px', zIndex: 20 }}
      >
        <div
          className="bg-white rounded-2xl"
          style={{ padding: '18px 22px 22px', boxShadow: '0 8px 40px rgba(0,0,0,0.16)' }}
        >
          <RFQForm
            onSubmit={onSubmit}
            loading={loading}
            onExpandChange={() => {}}
            onAddToPlan={onAddToPlan}
            onOpenDetail={onOpenItinerary}
          />
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-start gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ITINERARIES ── */}
      <main className="flex-1 bg-[#F9FAFB] mt-8">
        {/* Debug Info */}
        {console.log('HomePage - itineraries:', itineraries.length, itineraries)}
        {console.log('HomePage - visibleItins:', visibleItins.length, visibleItins)}
        
        {itineraries.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ paddingBottom: '60px' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg text-gray-800" style={{ borderBottom: '2px solid #9e8240', paddingBottom: '8px' }}>Recent Itineraries</h2>
              <span className="text-sm text-gray-400">({itineraries.length})</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visibleItins.map(rfq => (
                <ItineraryCard key={rfq._id} rfq={rfq} onOpen={onOpenItinerary} onDelete={onDeleteItinerary} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 text-xs">
                <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
                  className={`px-3 py-1.5 rounded-full border ${safePage === 1 ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-500'}`}>Prev</button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1, active = p === safePage;
                  return (
                    <button key={p} type="button" onClick={() => setPage(p)}
                      className={`w-7 h-7 rounded-full text-xs font-semibold border ${active ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:opacity-80'}`}
                      style={active ? { background: 'linear-gradient(135deg,#c9a227,#9e8240)', borderColor: '#9e8240' } : {}}>
                      {p}
                    </button>
                  );
                })}
                <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
                  className={`px-3 py-1.5 rounded-full border ${safePage === totalPages ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-500'}`}>Next</button>
              </div>
            )}
          </section>
        ) : (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ paddingBottom: '60px' }}>
            <div className="text-center py-16">
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>No Itineraries Yet</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>Create your first trip to see it here!</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}