// ============================================================
//  App.jsx  —  ROLE-BASED VERSION
//
//  YEH FILE tumhare original  frontend/src/App.jsx  ko
//  REPLACE karegi.  Bas 3 kaam karta hai:
//    1. Providers wrap karta hai (Auth + TripReview)
//    2. Not logged in  → LoginPage
//    3. manager role   → ManagerPage
//    4. user role      → original app logic (unchanged)
//
//  Original App.jsx ka sara logic neeche "user" block mein
//  copy-paste hai — kuch bhi change nahi kiya.
// ============================================================
import { useState, useEffect }  from 'react';
import axios                     from 'axios';

// ── New imports (role-auth folder se) ────────────────────────
import { AuthProvider, useAuth }            from './role-auth/src/context/AuthContext';
import { TripReviewProvider }               from './role-auth/src/context/TripReviewContext';
import LoginPage                            from './role-auth/src/pages/LoginPage';
import ManagerPage                          from './role-auth/src/pages/ManagerPage';

// ── Original page imports (unchanged) ────────────────────────
import HomePage   from './pages/HomePage';
import DetailPage from './pages/DetailPage';

// ─────────────────────────────────────────────────────────────
//  Inner component — runs AFTER providers are mounted
// ─────────────────────────────────────────────────────────────
function AppInner() {
  const { user } = useAuth();

  // ── 1. Not logged in ────────────────────────────────────────
  if (!user) return <LoginPage />;

  // ── 2. Manager ──────────────────────────────────────────────
  if (user.role === 'manager') return <ManagerPage />;

  // ── 3. Regular user — original App.jsx logic (untouched) ───
  return <UserApp />;
}

// ─────────────────────────────────────────────────────────────
//  UserApp — exact copy of original App.jsx logic
//  (Only difference: logout button in navbar — optional)
// ─────────────────────────────────────────────────────────────
function UserApp() {
  const { user, logout } = useAuth();   // logout ko navbar mein use kar sakte ho

  const [page, setPage]               = useState('home');
  const [loading, setLoading]         = useState(false);
  const [currentRfq, setCurrentRfq]   = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError]             = useState('');

  // 1. Initial Load
  useEffect(() => {
    const loadData = async () => {
      try {
        const r = await axios.get('/api/rfqs');
        if (r.data?.data) {
          setItineraries(r.data.data);
          localStorage.setItem('itineraries', JSON.stringify(r.data.data));
        }
      } catch {
        const saved = JSON.parse(localStorage.getItem('itineraries') || '[]');
        setItineraries(saved);
      }
    };
    loadData();
  }, []);

  // 2. Form Submit
  const handleSubmit = async formData => {
    setLoading(true);
    setError('');
    let finalRfq = null;
    try {
      const res = await axios.post('/api/rfqs', formData);
      finalRfq = res.data.data;
    } catch {
      finalRfq = {
        _id: 'trip_' + Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'draft',
      };
    }
    if (finalRfq) {
      const updated = [finalRfq, ...itineraries];
      setItineraries(updated);
      localStorage.setItem('itineraries', JSON.stringify(updated));
      setCurrentRfq(finalRfq);
      setPage('detail');
    }
    setLoading(false);
  };

  // 3. Delete
  const handleDelete = async id => {
    try { await axios.delete(`/api/rfqs/${id}`); } catch { /* deleted locally */ }
    const filtered = itineraries.filter(it => it._id !== id);
    setItineraries(filtered);
    localStorage.setItem('itineraries', JSON.stringify(filtered));
  };

  // ── Render ─────────────────────────────────────────────────
  if (page === 'detail' && currentRfq) {
    return (
      <DetailPage
        rfq={currentRfq}
        onUpdate={updated => {
          setCurrentRfq(updated);
          const newList = itineraries.map(item =>
            item._id === updated._id ? updated : item
          );
          setItineraries(newList);
          localStorage.setItem('itineraries', JSON.stringify(newList));
        }}
        onBack={() => setPage('home')}
        // Optional: pass currentUser so DetailPage can show SendToManagerButton
        currentUser={user}
        onLogout={logout}
      />
    );
  }

  return (
    <HomePage
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      itineraries={itineraries}
      onOpenItinerary={rfq => { setCurrentRfq(rfq); setPage('detail'); }}
      onDeleteItinerary={handleDelete}
      // Optional: pass so HomePage can show user name / logout
      currentUser={user}
      onLogout={logout}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  Root export — wraps everything in providers
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <TripReviewProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </TripReviewProvider>
  );
}
