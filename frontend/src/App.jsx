import { useState, useEffect } from 'react';
import axios from 'axios';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [currentRfq, setCurrentRfq] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [error, setError] = useState('');

  // 1. Initial Load: Data fetch karna
  useEffect(() => {
    const loadData = async () => {
      console.log('App.jsx - Initial load started');
      try {
        const r = await axios.get('/api/rfqs');
        if (r.data && r.data.data) {
          console.log('App.jsx - API data loaded:', r.data.data);
          setItineraries(r.data.data);
          localStorage.setItem('itineraries', JSON.stringify(r.data.data));
        }
      } catch (err) {
        console.log('App.jsx - API failed, loading from localStorage');
        // Agar API fail ho jaye toh LocalStorage se uthao
        const saved = JSON.parse(localStorage.getItem('itineraries') || '[]');
        console.log('App.jsx - localStorage data:', saved);
        setItineraries(saved);
      }
    };
    loadData();
  }, []);

  // 2. Form Submit Handler
  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    let finalRfq = null;

    try {
      const res = await axios.post('/api/rfqs', formData);
      finalRfq = res.data.data;
    } catch (err) {
      // Fallback: API fail hone par local object banao
      finalRfq = {
        _id: 'trip_' + Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'draft'
      };
    }

    if (finalRfq) {
      const updatedItineraries = [finalRfq, ...itineraries];
      setItineraries(updatedItineraries);
      localStorage.setItem('itineraries', JSON.stringify(updatedItineraries));
      setCurrentRfq(finalRfq);
      setPage('detail');
    }
    
    setLoading(false);
  };

  // 3. Delete Handler (LocalStorage ko bhi update karega)
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/rfqs/${id}`);
    } catch (e) {
      console.log("Deleted locally");
    }
    const filtered = itineraries.filter(it => it._id !== id);
    setItineraries(filtered);
    localStorage.setItem('itineraries', JSON.stringify(filtered));
  };

  if (page === 'detail' && currentRfq) {
    return (
      <DetailPage
        rfq={currentRfq}
        onUpdate={(updated) => {
            setCurrentRfq(updated);
            // Optional: update in list too
            const newList = itineraries.map(item => item._id === updated._id ? updated : item);
            setItineraries(newList);
            localStorage.setItem('itineraries', JSON.stringify(newList));
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
    />
  );
}