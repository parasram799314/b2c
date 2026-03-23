import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [currentRfq, setCurrentRfq] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState('');

  // Initial load: Purani itineraries fetch karna
  useEffect(() => {
    axios.get('/api/rfqs')
      .then(r => setItineraries(r.data.data || []))
      .catch(() => {});
  }, []);

  // RFQ Form submit handler
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/rfqs', formData);
      const rfq = res.data.data;
      setCurrentRfq(rfq);
      setItineraries(prev => [rfq, ...prev]);
      setPage('detail');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  // Detail Page — DetailPage handles its own plan via localStorage per rfq._id
  if (page === 'detail' && currentRfq) {
    return (
      <DetailPage
        rfq={currentRfq}
        onUpdate={setCurrentRfq}
        onBack={() => setPage('home')}
      />
    );
  }

  // Home Page
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
      onDeleteItinerary={(id) => {
        axios.delete(`/api/rfqs/${id}`).then(() => {
          setItineraries(prev => prev.filter(it => it._id !== id));
        });
      }}
    />
  );
}