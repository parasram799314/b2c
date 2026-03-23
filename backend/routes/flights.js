// routes/flights.js
import express from 'express';
import { searchFlights } from '../services/flightService.js';

const router = express.Router();

// ── Helper: minutes → "2h 25m" ────────────────────────────────────────────
const fmtMins = (min) => {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m}m` : `${h}h ${m > 0 ? m + 'm' : ''}`.trim();
};

const isPastDate = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
};

// ── POST /api/search — FlightsTab se aata hai ──────────────────────────────
router.post('/search', async (req, res) => {
  try {
    const { searchQuery } = req.body || {};
    const route    = searchQuery?.routeInfos?.[0] || {};
    const fromCode = route.fromCityOrAirport?.code || '';
    const toCode   = route.toCityOrAirport?.code   || '';
    const date     = route.travelDate || new Date().toISOString().slice(0, 10);
    const adults   = parseInt(searchQuery?.paxInfo?.ADULT || 1);

    if (!fromCode || !toCode) {
      return res.status(400).json({ onward: [], return: [] });
    }

    const rawFlights = await searchFlights({
      originCity:      fromCode,
      destinationCity: toCode,
      date,
      adults,
    });

    // Normalize for frontend FlightCard
    const onward = (rawFlights || []).map((f, idx) => ({
      id:             f.id            || `fl_${idx}_${Date.now()}`,
      airline:        f.airline       || f.carrierCode || 'Unknown',
      flightNumber:   f.flightNumber  || f.number      || '',
      logo:           f.logo          || null,
      from:           f.from          || fromCode,
      to:             f.to            || toCode,
      departureTime:  f.departureTime || f.depTime     || '',
      arrivalTime:    f.arrivalTime   || f.arrTime     || '',
      duration:       f.duration      || fmtMins(f.durationMinutes) || '',
      stops:          f.stops         ?? 0,
      price:          parseFloat(f.price || f.total || 0),
      currency:       f.currency      || 'INR',
      baggage:        f.baggage       || { iB: '15 Kg', cB: '7 Kg' },
      isMealIncluded: f.isMealIncluded || false,
      nextDayArrival: f.nextDayArrival || false,
      terminalFrom:   f.terminalFrom  || '',
      terminalTo:     f.terminalTo    || '',
    }));

    return res.json({ onward, return: [] });
  } catch (err) {
    console.error('POST /api/search error:', err.message);
    return res.json({ onward: [], return: [] });
  }
});

// ── GET /api/flights/prices?from=Delhi&to=Mumbai&date=2025-04-10&adults=1 ──
router.get('/prices', async (req, res) => {
  try {
    const { from, to, date, adults = 1 } = req.query;
    if (!from || !to || !date)
      return res.status(400).json({ success: false, message: 'from, to, date required' });

    const base  = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      if (d >= today) dates.push(d.toISOString().slice(0, 10));
    }

    const results = await Promise.allSettled(
      dates.map(d => searchFlights({
        originCity:      from,
        destinationCity: to,
        date:            d,
        adults:          Number(adults),
      }))
    );

    const data = dates.map((d, i) => {
      const r = results[i];
      if (r.status === 'fulfilled' && r.value?.length > 0) {
        const prices = r.value.map(f => parseFloat(f.price)).filter(p => !isNaN(p));
        return { date: d, price: prices.length ? Math.min(...prices) : null, currency: r.value[0].currency || 'INR' };
      }
      return { date: d, price: null, currency: 'INR' };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;