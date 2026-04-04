import { useState, useEffect } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';

import './utils/axiosConfig'
import HRDashboard from './pages/HRDashboard'


// ── Role Auth Imports ─────────────────────────────────────────
import { AuthProvider, useAuth }   from './role-auth/role-auth/src/context/AuthContext';
import { TripReviewProvider }      from './role-auth/role-auth/src/context/TripReviewContext';
import LoginPage                   from './role-auth/role-auth/src/pages/LoginPage';
import ManagerPage                 from './role-auth/role-auth/src/pages/ManagerPage';

// ─────────────────────────────────────────────────────────────
//  Main App Logic (original — kuch nahi badla)
// ─────────────────────────────────────────────────────────────
function UserApp({ onOpenHRDashboard, onOpenManagerPanel }) {
  const [page, setPage] = useState('home');
  const { user } = useAuth(); 
  const [loading, setLoading] = useState(false);
  const [currentRfq, setCurrentRfq] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState('');

  // 1. Initial Load — MongoDB Atlas se itineraries fetch karo
  useEffect(() => {
    const loadData = async () => {
      try {
        const r = await axios.get('/api/rfqs');
        if (r.data && r.data.data) {
          setItineraries(r.data.data);
        }
      } catch (err) {
        console.error('Failed to load itineraries:', err.message);
        setError('Could not load itineraries. Is the backend running?');
      }
    };
    loadData();
  }, []);

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
    setItineraries(prev => [newRfq, ...prev]);
    setCurrentRfq(newRfq);
    setPage('detail');
  } catch (err) {
    console.error('RFQ creation failed:', err.message);
    setError('Failed to create itinerary. Please try again.');
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

  if (page === 'detail' && currentRfq) {
    return (
      <DetailPage
        rfq={currentRfq}
        onUpdate={(updated) => {
          setCurrentRfq(updated);
          setItineraries(prev =>
            prev.map(item => item._id === updated._id ? updated : item)
          );
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
      currentUser={user}
      onOpenHRDashboard={onOpenHRDashboard}
      onOpenManagerPanel={onOpenManagerPanel}
    />
  );
}

// ─────────────────────────────────────────────────────────────
//  Role Router — login check + role ke hisaab se page dikhao
// ─────────────────────────────────────────────────────────────
function AppInner() {
  const { user } = useAuth();
  const [view, setView] = useState('app'); // 'app', 'hr', or 'manager'

  if (!user) return <LoginPage />;
  
  // HR user view switch
  if (user.role === 'hr' && view === 'hr') {
    return <HRDashboard onBack={() => setView('app')} />;
  }

  // Manager user view switch
  if (user.role === 'manager' && view === 'manager') {
    return <ManagerPage onBack={() => setView('app')} />;
  }

  return (
    <UserApp 
      onOpenHRDashboard={() => setView('hr')} 
      onOpenManagerPanel={() => setView('manager')} 
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