import { useState, useRef, useEffect } from 'react';
import RFQForm from '../components/RFQForm';
import { ItineraryCard } from '../ui';
import { Icons } from '../ui/icons';
import heroBg from '../assets/hero-bg.png';
import axios from '../utils/axiosConfig';
import { useAuth } from '../role-auth/role-auth/src/context/AuthContext';
import ManagerApprovalsSection from '../components/ManagerPanel';
import HeaderProfileMenu from '../components/detail/headings/HeaderProfileMenu';
import TripsPage from '../components/detail/headings/TripsPage'

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
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize: '13px', fontWeight: 800, color: '#111827' }}>
          <Icons.User size={15} />
          My Profile
        </div>
        <button onClick={onClose} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icons.X size={14} />
        </button>
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
    onMerge, 
  currentUser,
  onOpenHRDashboard,
  onOpenAdminDashboard,
  showTripsPage,
  setShowTripsPage,
  undoVisible,
  setUndoVisible,
  lastMergedId,
  setLastMergedId
}) {
  const { user, logout } = useAuth();
  const isManager = user?.role === 'manager';
  const isHR = user?.role === 'hr';
  const [budgetApprovals, setBudgetApprovals] = useState([]);
  const [tripReviews, setTripReviews] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);

  // Load both budget approvals and trip reviews when manager clicks Approvals tab
  // Load both budget approvals and trip reviews when manager clicks Approvals tab
  // ─── LIVE SYNC: हर 5 सेकंड में मैनेजर का डेटा ऑटोमैटिक अपडेट होगा ───
  useEffect(() => {
    if (!isManager) return;
    
    const fetchData = async (isFirstLoad = false) => {
      // सिर्फ पहली बार लोडिंग स्पिनर दिखाओ, बार-बार नहीं
      if (isFirstLoad) setApprovalsLoading(true);
      
      try {
        // दोनों API को एक साथ कॉल करें (Faster Performance)
      const [budgetRes, tripRes, historyBudgetRes, historyTripRes] = await Promise.all([
  axios.get('/api/budget-approvals?status=pending'),
  axios.get('/api/rfqs?pendingTripReview=true'),
  axios.get('/api/budget-approvals?status=resolved'),   // approved/rejected budget
  axios.get('/api/rfqs?reviewStatus=approved,rejected'), // approved/rejected trips
]);
        if (budgetRes.data?.success) {
          setBudgetApprovals(budgetRes.data.data || []);
        }

        if (tripRes.data?.success) {
          setTripReviews(tripRes.data.data || []);
        }
      } catch (err) {
        console.error('Auto-sync failed:', err);
      } finally {
        if (isFirstLoad) setApprovalsLoading(false);
      }
    };

    
    fetchData(true);

    
    const syncInterval = setInterval(() => {
      fetchData(false);
    }, 5000); 

    // 3. सफाई (Cleanup): जब मैनेजर पेज छोड़ेगा तो चेकिंग बंद हो जाएगी
    return () => clearInterval(syncInterval);
  }, [isManager]);

  const handleApprove = async (tripId, note = '') => {
    try {
      await axios.patch(`/api/budget-approvals/${tripId}`, {
        status: 'approved',
        approvedBudget: null, // Use original budget
        managerComment: note
      });
      // Refresh list
      setBudgetApprovals(prev => prev.filter(a => a.tripId !== tripId));
    } catch (err) {
      alert('Failed to approve: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (tripId, note = '') => {
    try {
      await axios.patch(`/api/budget-approvals/${tripId}`, {
        status: 'rejected',
        managerComment: note
      });
      // Refresh list
      setBudgetApprovals(prev => prev.filter(a => a.tripId !== tripId));
    } catch (err) {
      alert('Failed to reject: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTripApprove = async (tripId, note = '') => {
    try {
      await axios.post(`/api/rfqs/${tripId}/approve-review`, { managerNote: note });
      setTripReviews(prev => prev.filter(t => t._id !== tripId));
    } catch (err) {
      alert('Failed to approve trip: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleTripReject = async (tripId, note = '') => {
    try {
      await axios.post(`/api/rfqs/${tripId}/reject-review`, { managerNote: note });
      setTripReviews(prev => prev.filter(t => t._id !== tripId));
    } catch (err) {
      alert('Failed to reject trip: ' + (err.response?.data?.message || err.message));
    }
  };

  const [page, setPage]             = useState(1);
  const [activeProfile, setActiveProfile] = useState('business');
  const [showApprovals, setShowApprovals] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pageSize     = 6;
  const totalPages   = Math.max(1, Math.ceil(itineraries.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const visibleItins = itineraries.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

{showTripsPage && (
  <TripsPage
    onClose={() => setShowTripsPage(false)}
    itineraries={itineraries}
    onOpen={onOpenItinerary}
    onMerge={onMerge}
    undoVisible={undoVisible}
    setUndoVisible={setUndoVisible}
    lastMergedId={lastMergedId}
    setLastMergedId={setLastMergedId}
  />
)}
      {/* ── HEADER ── */}
      <header 
        className="w-full z-[100] sticky top-0 transition-all duration-300 py-3 shadow-sm"
        style={{ backgroundColor: 'rgb(247, 190, 57)' }}
      >
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://travplatforms.com/images/logo3.png" 
              alt="TravPlatforms" 
              style={{ height: '35px', objectFit: 'contain' }} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* My Trips button */}
            <button
              onClick={() => setShowTripsPage(true)}
              className="group relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-gray-800 border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <Icons.Map size={16} className="text-[#F7BE39] group-hover:scale-110 transition-transform" />
              <span>My Trips</span>
              {itineraries.length > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#F7BE39] text-[10px] text-gray-900 font-black shadow-sm">
                  {itineraries.length}
                </span>
              )}
            </button>
            
            <HeaderProfileMenu
              user={user}
              onLogout={logout}
              onOpenHRDashboard={onOpenHRDashboard}
              onOpenAdminDashboard={onOpenAdminDashboard}  
              activeProfile={activeProfile}
              onSwitchProfile={(type) => setActiveProfile(type)}
            />
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <div
        className="relative w-full h-[300px] sm:h-[380px] md:h-[450px]"
        style={{ 
          backgroundImage: `url(${heroBg})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.5) 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-white font-extrabold leading-tight mb-2 animate-fade-in-up"
              style={{ fontSize: 'clamp(28px, 4vw, 52px)', textShadow: '0 4px 24px rgba(0,0,0,0.4)', fontFamily: "'Outfit', sans-serif" }}>
              The Art of <span className="text-[#F7BE39]">Luxury</span> Travel
            </h1>
            <p className="max-w-xl mx-auto font-medium animate-fade-in-up delay-100" 
               style={{ fontSize: 'clamp(14px, 1vw, 18px)', color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
              Tailored itineraries and seamless planning.
            </p>
          </div>
        </div>
      </div>

      {/* ── SEARCH CARD ── */}
      <div
        className="relative mx-auto w-full px-4 sm:px-6"
        style={{ maxWidth: '900px', marginTop: '-80px', zIndex: 40 }}
      >
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-[#F7BE39]/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#F7BE39]/10 flex items-center justify-center">
                <Icons.MapPin size={18} className="text-[#F7BE39]" />
              </span>
              Plan Your Next Masterpiece
            </h2>
          </div>
          <RFQForm
            onSubmit={onSubmit}
            loading={loading}
            onExpandChange={() => {}}
            onAddToPlan={onAddToPlan}
            onOpenDetail={onOpenItinerary}
          />
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex items-start gap-2">
              <span className="mt-0.5"><Icons.Warning size={16} /></span><span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── ITINERARIES ── */}
{/* ── ITINERARIES ── */}
      <main className="flex-1 bg-white mt-8">
        {itineraries.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8" style={{ paddingBottom: '60px' }}>

            {/* Tab row */}
            <div className="flex items-center justify-between mb-6">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <h2
                  onClick={() => setShowApprovals(false)}
                  className="font-bold text-lg cursor-pointer"
                  style={{
                    color: !showApprovals ? '#111827' : '#6b7280',
                    paddingBottom: '8px',
                    borderBottom: !showApprovals ? '3px solid #F7BE39' : '3px solid transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  Recent Itineraries
                </h2>

                {isManager && (
                  <button
                    onClick={() => setShowApprovals(true)} // यहाँ true किया गया है
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: showApprovals ? '#111827' : '#6b7280',
                      paddingBottom: '8px',
                      borderBottom: showApprovals ? '3px solid #F7BE39' : '3px solid transparent',
                      transition: 'all 0.2s',
                    }}
                  >
                    Approvals
                  </button>
                )}
              </div>
              <span className="text-sm text-gray-400">({itineraries.length})</span>
            </div>

            {/* Content Area */}
         {showApprovals ? (
  <ManagerApprovalsSection
    budgetApprovals={budgetApprovals}
    tripReviews={tripReviews}
    historyItems={historyItems}
    approvalsLoading={approvalsLoading}
    onApprove={handleApprove}
    onReject={handleReject}
    onTripApprove={handleTripApprove}
    onTripReject={handleTripReject}
  />
) : (
              // Normal Itineraries View
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleItins.map(rfq => (
                    <ItineraryCard key={rfq._id} rfq={rfq} onOpen={onOpenItinerary} onDelete={onDeleteItinerary} />
                  ))}
                </div>
                {/* Pagination logic here */}
              </>
            )}
          </section>
        ) : (
          // Empty State (When no itineraries at all)
          <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <div className="text-center py-16">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                <Icons.MapPin size={26} className="text-gray-400" />
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>No Itineraries Yet</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>Create your first trip to see it here!</p>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}