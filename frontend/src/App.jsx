import { useState, useEffect } from 'react';
import axios from './utils/axiosConfig';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';

import './utils/axiosConfig'
import HRDashboard from './pages/HRDashboard'
import AdminDashboard from './pages/AdminDashboard';

// ── Role Auth Imports ─────────────────────────────────────────
import { AuthProvider, useAuth }   from './role-auth/role-auth/src/context/AuthContext';
import { TripReviewProvider }      from './role-auth/role-auth/src/context/TripReviewContext';
import ManagerPage                 from './role-auth/role-auth/src/pages/ManagerPage';

// ─────────────────────────────────────────────────────────────
//  Main App Logic (original — kuch nahi badla)
// ─────────────────────────────────────────────────────────────
function UserApp({ onOpenHRDashboard, onOpenManagerPanel, onOpenAdminDashboard }) {
  const [page, setPage] = useState('home');
 const { user, authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentRfq, setCurrentRfq] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState('');
  const [showTripsPage, setShowTripsPage] = useState(false);
  const [lastMergedId, setLastMergedId] = useState(null);
  const [undoVisible, setUndoVisible]   = useState(false);

  console.log('[App] Rendering with itineraries:', itineraries.map(r => ({_id: r._id, planItems: r.planItems?.length || 0})));

// ── JOIN TRIP HANDLER ──
useEffect(() => {
  if (authLoading || !user) return;
  
  const path = window.location.pathname;
  if (path.startsWith('/join/')) {
    const inviteCode = path.split('/join/')[1];
    if (inviteCode) {
      const joinTrip = async () => {
        try {
          const res = await axios.post(`/api/rfqs/join/${inviteCode}`);
          if (res.data?.success) {
            const joinedRfq = res.data.data;
            setItineraries(prev => {
              if (prev.find(it => it._id === joinedRfq._id)) return prev;
              return [joinedRfq, ...prev];
            });
            setCurrentRfq(joinedRfq);
            setPage('detail');
            // Clean up URL
            window.history.replaceState(null, '', '/');
          }
        } catch (err) {
          console.error('Join failed:', err);
          alert('Failed to join trip: ' + (err.response?.data?.message || 'Invalid or expired link'));
          window.history.replaceState(null, '', '/');
        }
      };
      joinTrip();
    }
  }
}, [user, authLoading]);

// 1. Initial Load from MongoDB Atlas
useEffect(() => {
  if (authLoading) return;
  if (!user) {
    setItineraries([]);
    return;
  }
  const loadData = async () => {
    try {
      const r = await axios.get('/api/rfqs');
      if (r.data?.data) {
        setItineraries(r.data.data);
      }
    } catch (err) {
      console.error('Failed to load:', err.message);
    }
  };
  loadData();
}, [user, authLoading]);

// 2. Form Submit — Atlas mein save karo
const handleSubmit = async (formData) => {
  setLoading(true);
  setError('');
  try {
    const res = await axios.post('/api/rfqs', formData);
    const newRfq = {
      ...formData,
      ...res.data.data,
    };
    console.log(`[App.handleSubmit] Created new RFQ ${newRfq._id} with planItems:`, newRfq.planItems);
    setItineraries(prev => [newRfq, ...prev]);
    setCurrentRfq(newRfq);
    setPage('detail');
  } catch (err) {
    console.error('RFQ creation failed:', err);
    const backendMsg = err.response?.data?.message || err.message;
    setError(`Failed to create itinerary: ${backendMsg}`);
  }
  setLoading(false);
};

const handleDelete = async (id) => {
  try {
    await axios.delete(`/api/rfqs/${id}`);
    setItineraries(prev => prev.filter(it => it._id !== id));
  } catch (err) {
    console.error('Delete failed:', err.message);
    setItineraries(prev => prev.filter(it => it._id !== id));
  }
};

// ── Merge handler ─────────────────────────────────────────────────────────
const handleMerge = async ({ rfqIds, mergedTripName, undoId, deleteOriginals }) => {
  // Undo: delete the merged itinerary
  if (undoId) {
    await axios.delete(`/api/rfqs/${undoId}`);
    setItineraries(prev => prev.filter(it => it._id !== undoId));
    setUndoVisible(false);
    setLastMergedId(null);
    return;
  }
  // Merge: call backend
  const res = await axios.post('/api/rfqs/merge', { rfqIds, mergedTripName, deleteOriginals });
  const newRfq = res.data.data;
  
  setItineraries(prev => {
    let filtered = prev;
    if (deleteOriginals) {
      filtered = prev.filter(it => !rfqIds.includes(it._id));
    }
    return [newRfq, ...filtered];
  });

  setLastMergedId(newRfq._id);
  setUndoVisible(true);
  setTimeout(() => setUndoVisible(false), 8000);
  
  return newRfq;
};


  if (page === 'detail' && currentRfq) {
    return (
      <DetailPage
        rfq={currentRfq}
        onUpdate={(updated) => {
          console.log(`[App.onUpdate] Received updated RFQ ${updated._id} with ${updated.planItems?.length || 0} items`);
          if (updated._id === currentRfq?._id) {
            setCurrentRfq(updated);
          }
          setItineraries(prev => {
            const newArray = prev.map(item => {
              if (item._id === updated._id) {
                console.log(`[App.onUpdate] Updated itinerary in array with ${updated.planItems?.length || 0} items`);
                return updated;
              }
              return item;
            });
            console.log(`[App.onUpdate] New itineraries array:`, newArray.map(r => ({_id: r._id, planItems: r.planItems?.length || 0})));
            return newArray;
          });
        }}
        onBack={() => setPage('home')}
      />
    );
  }

  return (
    <HomePage
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      itineraries={itineraries}
      onOpenItinerary={rfq => {
        setCurrentRfq(rfq);
        setPage('detail');
      }}
      onDeleteItinerary={handleDelete}
       onMerge={handleMerge}   
      currentUser={user}
      onOpenHRDashboard={onOpenHRDashboard}
      onOpenManagerPanel={onOpenManagerPanel}
      onOpenAdminDashboard={onOpenAdminDashboard}
      showTripsPage={showTripsPage}
      setShowTripsPage={setShowTripsPage}
      undoVisible={undoVisible}
      setUndoVisible={setUndoVisible}
      lastMergedId={lastMergedId}
      setLastMergedId={setLastMergedId}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  Role Router — login check + role ke hisaab se page dikhao
// ─────────────────────────────────────────────────────────────
function AppInner() {
  const { user, authLoading } = useAuth();  // ← authLoading ADD KARO
  const [view, setView] = useState('app');

  // ── SSO REDIRECTION LOGIC (PART 1) ──
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
      const storedToken = localStorage.getItem('fb_token');
      const hasUrlToken = window.location.href.includes('token=');

      // If no token at all, redirect to B2B Login immediately
      if (!storedToken && !hasUrlToken) {
        const currentUrl = window.location.href;
        const b2bLoginUrl = `https://b2b-backup.vercel.app/login?redirect=${encodeURIComponent(currentUrl)}`;
        console.log('[App] Guest user on join route, redirecting to B2B SSO:', b2bLoginUrl);
        window.location.href = b2bLoginUrl;
      }
    }
  }, []); // Run once on mount

  // ← YEH BLOCK ADD KARO — sabse pehle
  if (authLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#fff', flexDirection: 'column', gap: '12px'
      }}>
        <div style={{
          width: '36px', height: '36px', border: '3px solid #f3f3f3',
          borderTop: '3px solid rgb(247,190,57)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}/>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>Syncing with Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    // If we're here and not loading, it means we don't have a valid session
    // Redirect /join/ users who might have an expired token
    const path = window.location.pathname;
    if (path.startsWith('/join/')) {
       window.location.href = `https://b2b-backup.vercel.app/login?redirect=${encodeURIComponent(window.location.href)}`;
       return null;
    }

    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#f9fafb', flexDirection: 'column', textAlign: 'center', padding: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ margin: '0 0 8px', color: '#111827' }}>Access Denied</h2>
        <p style={{ margin: 0, color: '#6b7280', maxWidth: '300px', lineHeight: '1.5' }}>
          Please log in through the main Dashboard to access the Trip Planner.
        </p>
      </div>
    );
  }

  // Admin role: only dashboard, no back button functionality
  if (user.role === 'admin') {
    return <AdminDashboard onBack={() => {}} />;
  }

  if (user.role === 'hr' && view === 'hr') {
    return <HRDashboard onBack={() => setView('app')} />;
  }

  if (user.role === 'hr' && view === 'admin') {
    return <AdminDashboard onBack={() => setView('app')} />;
  }
  if (user.role === 'manager' && view === 'manager') {
    return <ManagerPage onBack={() => setView('app')} />;
  }

  return (
    <UserApp
      onOpenHRDashboard={() => setView('hr')}
      onOpenManagerPanel={() => setView('manager')}
      onOpenAdminDashboard={() => setView('admin')}
    />
  );
}
// ─────────────────────────────────────────────────────────────
//  Root Export
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}