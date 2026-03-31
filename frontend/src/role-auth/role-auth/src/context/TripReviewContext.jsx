// ============================================================
//  TripReviewContext.jsx  —  User → Manager Bridge
//
//  User jab "Send to Manager" click kare → submitTrip() call karo
//  Manager ke page pe woh trip turant appear ho jaayegi.
//  Abhi in-memory hai; production mein WebSocket/DB se replace karna.
// ============================================================
import { createContext, useContext, useState } from 'react';

const TripReviewContext = createContext(null);

export function TripReviewProvider({ children }) {
  const [trips, setTrips] = useState([]);

  // ── User calls this when triggering anything for manager ──
  // rfq      = the rfq object from your existing app
  // userName = currently logged-in user's name
  const submitTrip = (rfq, userName) => {
    const entry = {
      id:          'tr_' + Date.now(),
      rfqId:       rfq._id || rfq.id || null,
      from:        rfq.from || rfq.origin      || '—',
      to:          rfq.to   || rfq.destination || '—',
      travelDate:  rfq.departureDate || rfq.travelDate || '—',
      passengers:  rfq.passengers || rfq.adults || 1,
      budget:      rfq.budget || '',
      notes:       rfq.notes || rfq.specialRequests || '',
      submittedBy: userName,
      submittedAt: new Date().toISOString(),
      status:      'pending',   // pending | approved | rejected
    };
    setTrips(prev => [entry, ...prev]);
    return entry.id;
  };

  // Manager actions
  const approveTrip = id =>
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'approved' } : t));

  const rejectTrip = id =>
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'rejected' } : t));

  // User can check status of a specific rfq
  const getStatus = rfqId => trips.find(t => t.rfqId === rfqId)?.status ?? null;

  return (
    <TripReviewContext.Provider value={{ trips, submitTrip, approveTrip, rejectTrip, getStatus }}>
      {children}
    </TripReviewContext.Provider>
  );
}

export const useTripReview = () => useContext(TripReviewContext);
