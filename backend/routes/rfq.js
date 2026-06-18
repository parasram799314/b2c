// routes/rfqs.js
import express from 'express';
import RFQ from '../models/RFQ.js';
import BudgetApproval from '../models/BudgetApproval.js';

import {
  chatWithItinerary,
  createFlowState,
  appendToHistory,
  resetFlowState,
  getFlowProgress,
  FLOW_STEP,
  INTENT,
  CABIN,
  generateItinerary,
} from '../services/groqService.js';

import { searchFlights }      from '../services/flightService.js';
import { searchHotels }       from '../services/hotelService.js';
import { searchAttractions }  from '../services/attractionService.js';
import { searchRestaurants }  from '../services/restaurantService.js';
import { getWeatherForecast } from '../services/weatherService.js';
import { buildChecklist }     from '../services/checklistService.js';
import { verifyToken }        from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// RFQ Router Internal Logger
router.use((req, res, next) => {
  console.log(`[RFQ Router] ${req.method} ${req.url}`);
  next();
});

// ════════════════════════════════════════════════════════════════════════════
//  COLLABORATION ROUTES
// ════════════════════════════════════════════════════════════════════════════

router.get('/ping', (req, res) => {
  console.log('[RFQ/Ping] Hit!');
  res.json({ success: true, message: 'pong from RFQ router' });
});

// Generate or get invite link
router.post('/:id/invite', verifyToken, async (req, res) => {
  try {
    console.log(`[RFQ/Invite] Request for ID: ${req.params.id} by user: ${req.uid}`);
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) {
      console.log(`[RFQ/Invite] RFQ not found in DB: ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    if (!rfq.inviteCode) {
      rfq.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      await rfq.save();
    }

    console.log(`[RFQ/Invite] Success! inviteCode=${rfq.inviteCode}`);
    res.json({ success: true, inviteCode: rfq.inviteCode });
  } catch (error) {
    console.error('[RFQ/Invite] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Join trip via invite code
router.post('/join/:inviteCode', verifyToken, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    console.log(`[RFQ/Join] User ${req.uid} joining with code: ${inviteCode}`);
    const userDoc = await User.findOne({ uid: req.uid });
    if (!userDoc) return res.status(404).json({ success: false, message: 'User not found' });

    const rfq = await RFQ.findOne({ inviteCode });
    if (!rfq) return res.status(404).json({ success: false, message: 'Invalid invite code' });

    // Check if already a collaborator
    const isCollaborator = rfq.collaborators.some(c => c.uid === req.uid);
    if (!isCollaborator) {
      rfq.collaborators.push({
        uid: userDoc.uid,
        email: userDoc.email,
        name: userDoc.name || 'Collaborator',
        role: 'editor'
      });
      await rfq.save();
    }

    res.json({ success: true, data: rfq });
  } catch (error) {
    console.error('[RFQ/Join] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  SOCKET BROADCAST HELPER
// ════════════════════════════════════════════════════════════════════════════
function broadcastUpdate(req, rfqId, data) {
  if (req.io) {
    req.io.to(String(rfqId)).emit('itinerary_updated', data);
    console.log(`[Socket] Broadcasted update for trip: ${rfqId}`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  UTILITY HELPERS
// ════════════════════════════════════════════════════════════════════════════

function generateStandardId() {
  return Date.now().toString(36).toUpperCase().slice(-6);
}

function toYMD(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

function mapVisaInfo(visaInfo) {
  if (!visaInfo) return undefined;
  return {
    required: visaInfo.required,
    visaType: visaInfo.type || visaInfo.visaType || '',
    label:    visaInfo.label || '',
  };
}

function cityMatches(a = '', b = '') {
  if (!b) return false;
  const norm = s => s.toLowerCase().trim();
  const aL = norm(a), bL = norm(b);
  return aL === bL ||
    aL.split(/[\s,]+/).includes(bL) ||
    bL.split(/[\s,]+/).includes(aL);
}

function hasMatch(item, city) {
  if (!item || !city) return false;
  return cityMatches(item.city, city) ||
         cityMatches(item.cityName, city) ||
         cityMatches(item.location, city) ||
         cityMatches(item.toAirport, city) ||
         cityMatches(item.to, city) ||
         cityMatches(item.destination, city);
}

// ════════════════════════════════════════════════════════════════════════════
//  FILTER HELPERS
// ════════════════════════════════════════════════════════════════════════════

const MAX_FLIGHTS_SHOW = 6;
const MAX_HOTELS_SHOW  = 5;
const MAX_ATTRACT_SHOW = 6;

function filterFlights(flights, state) {
  const dest   = (state.confirmedDestination || '').toLowerCase().trim();
  const origin = (state.confirmedOrigin      || '').toLowerCase().trim();
  const cabin  = state.confirmedCabin || '';
  if (!dest) return [];
  return flights
    .filter(f => {
      const fDest = [f.destination, f.destinationCity, f.to, f.toAirport].filter(Boolean).map(s => s.toLowerCase());
      const fOrig = [f.origin, f.originCity, f.from, f.fromAirport].filter(Boolean).map(s => s.toLowerCase());
      const destMatch   = fDest.some(d => cityMatches(d, dest));
      const originMatch = !origin || fOrig.some(o => cityMatches(o, origin));
      const cabinMatch  = !cabin  || (f.cabin || '').toLowerCase() === cabin.toLowerCase();
      return destMatch && originMatch && cabinMatch;
    })
    .sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0))
    .slice(0, MAX_FLIGHTS_SHOW);
}

function filterHotels(hotels, state) {
  const dest  = state.confirmedDestination || '';
  const stars = state.preferredHotelStars;
  if (!dest) return [];
  return hotels
    .filter(h => {
      const destMatch  = cityMatches(h.city, dest) || cityMatches(h.location, dest) || cityMatches(h.cityName, dest);
      const starsMatch = stars == null || h.stars === stars;
      return destMatch && starsMatch;
    })
    .sort((a, b) => (b.stars || 0) - (a.stars || 0))
    .slice(0, MAX_HOTELS_SHOW);
}

function filterAttractions(attractions, state) {
  const dest = state.confirmedDestination || '';
  const cats = state.preferredAttractionCategories || [];
  if (!dest) return [];
  return attractions
    .filter(a => {
      const destMatch = cityMatches(a.city, dest) || cityMatches(a.location, dest) || cityMatches(a.cityName, dest);
      const catMatch  = cats.length === 0 || cats.includes((a.category || '').toLowerCase());
      return destMatch && catMatch;
    })
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, MAX_ATTRACT_SHOW);
}

function filterRestaurants(restaurants, state) {
  const dest = state.confirmedDestination || '';
  if (!dest) return [];
  return restaurants
    .filter(r => cityMatches(r.city, dest) || cityMatches(r.location, dest) || cityMatches(r.cityName, dest))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, MAX_ATTRACT_SHOW);
}

// ════════════════════════════════════════════════════════════════════════════
//  BUILD HELPERS
// ════════════════════════════════════════════════════════════════════════════

async function buildDestinationData(rfqData) {
  const {
    destinations = [], guestCountry = '',
    hotelRatings = [], numberOfAdults = 1,
  } = rfqData;

  return Promise.all(destinations.map(async (dest, idx) => {
    const destination = dest.destination;
    const checkInDate = toYMD(dest.dateOfArrival);
    const nights      = dest.numberOfNights || 1;
    const checkOut    = new Date(checkInDate);
    checkOut.setDate(checkOut.getDate() + nights);
    const checkOutDate = checkOut.toISOString().slice(0, 10);
    const originCity   = idx === 0 ? (guestCountry || 'India') : destinations[idx - 1].destination;

    const [flights, hotels, attractions, restaurants] = await Promise.all([
      searchFlights({ originCity, destinationCity: destination, date: checkInDate, adults: numberOfAdults || 1 })
        .catch(err => { console.warn(`[rfqs] flights failed:`, err.message); return []; }),
      searchHotels({ destinationCity: destination, checkInDate, checkOutDate, adults: numberOfAdults || 1, hotelRatings })
        .catch(err => { console.warn(`[rfqs] hotels failed:`, err.message); return []; }),
      searchAttractions({ destinationCity: destination })
        .catch(err => { console.warn(`[rfqs] attractions failed:`, err.message); return []; }),
      searchRestaurants({ destinationCity: destination })
        .catch(err => { console.warn(`[rfqs] restaurants failed:`, err.message); return []; }),
    ]);

    return { destination, flights, hotels, attractions, restaurants };
  }));
}

async function buildWeatherData(rfqData) {
  try {
    const { destinations = [] } = rfqData;
    if (!destinations.length) return null;
    const mainDest    = destinations[0];
    const checkInDate = toYMD(mainDest.dateOfArrival);
    const totalNights = destinations.reduce((s, d) => s + (d.numberOfNights || 1), 0);
    if (!checkInDate) return null;
    return await getWeatherForecast({
      destinationCity: mainDest.destination,
      checkInDate,
      numberOfNights: totalNights,
    });
  } catch (err) {
    console.warn('[rfqs] weather failed:', err.message);
    return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  EXTRACT RFQ PRE-FILL
// ════════════════════════════════════════════════════════════════════════════
function extractRfqPreFill(rfq) {
  if (!rfq) return {};
  const firstDest = rfq.destinations?.[0];
  return {
    destination: firstDest?.destination   || null,
    origin:      rfq.guestCountry         || 'India',
    date:        firstDest?.dateOfArrival  || null,
    adults:      rfq.numberOfAdults       || 1,
    children:    rfq.numberOfChildren     || 0,
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs  — create new RFQ
// ════════════════════════════════════════════════════════════════════════════
router.post('/', verifyToken, async (req, res) => {
  try {
    const createdBy  = req.uid;
    const userDoc    = await User.findOne({ uid: req.uid });
    const assignedTo = userDoc?.managerId || '';
    const { _id, __v, ...rfqData } = req.body;
    const finalRfqId = rfqData.rfqId || generateStandardId();

    console.log(`[RFQ/Create] User ${createdBy} creating trip ${finalRfqId}`);

    // Filter out empty destinations to avoid Mongoose validation errors
    const validDestinations = (rfqData.destinations || []).filter(d => d.destination && d.dateOfArrival);
    const cleanRfqData = { ...rfqData, destinations: validDestinations };

    // Run AI and data tasks with individual error handling
    const [
      itineraryResult,
      destinationData,
      weather,
    ] = await Promise.all([
      generateItinerary(cleanRfqData).catch(err => {
        console.error('[RFQ/Create] AI Itinerary failed:', err.message);
        return { itinerary: 'AI generation failed. Please try "Regenerate" or update manually.', travelType: 'personal', modeOfTransport: 'Flight' };
      }),
      buildDestinationData(cleanRfqData).catch(err => {
        console.error('[RFQ/Create] Destination data failed:', err.message);
        return [];
      }),
      buildWeatherData(cleanRfqData).catch(err => {
        console.error('[RFQ/Create] Weather failed:', err.message);
        return null;
      }),
    ]);

    const checklistResult = buildChecklist({
      guestCountry:  rfqData.guestCountry || 'India',
      destinations:  validDestinations,
      requireHotels: rfqData.requireHotels ?? true,
    });

    const rawTripType = (rfqData.tripType || rfqData.travelType || itineraryResult.travelType || 'personal').toLowerCase();
    const normalizedTripType = rawTripType.includes('business') ? 'business' : 'personal';

    const rfq = new RFQ({
      ...cleanRfqData,
      rfqId:          finalRfqId,
      createdBy,
      assignedTo,
      requireHotels:  rfqData.requireHotels ?? true,
      itinerary:      `Trip ID: ${finalRfqId}\n\n` + itineraryResult.itinerary,
      travelType:     rfqData.travelType || itineraryResult.travelType,
      tripType:       normalizedTripType,
      modeOfTransport: itineraryResult.modeOfTransport,
      destinationData,
      weather,
      checklist:      checklistResult.checklist,
      checklistStats: checklistResult.stats,
      visaInfo:       mapVisaInfo(checklistResult.visaInfo),
      collaborators: [{
        uid: userDoc?.uid || createdBy,
        email: userDoc?.email || '',
        name: userDoc?.name || 'Creator',
        role: 'admin'
      }]
    });

    await rfq.save();
    console.log(`[RFQ/Create] Success! Created trip ${rfq._id}`);
    
    // Broadcast update
    broadcastUpdate(req, rfq._id, rfq);

    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    console.error('[RFQ/Create] Fatal Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/chat  — main AI chat endpoint
// ════════════════════════════════════════════════════════════════════════════

const DAILY_TOKEN_LIMIT = 2000;

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, rfqId, conversationHistory = [], flowState } = req.body;

    // ── 1. User token check ────────────────────────────────────────────────
    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const now  = new Date();
    const last = new Date(user.chatTokens.lastReset || now);
    if (now.toDateString() !== last.toDateString()) {
      user.chatTokens.used      = 0;
      user.chatTokens.lastReset = now;
      await user.save();
    }
    if (user.chatTokens.used >= DAILY_TOKEN_LIMIT) {
      return res.status(403).json({ success: false, message: 'Daily limit reached' });
    }

    // ── 2. Load RFQ ────────────────────────────────────────────────────────
    const rfq = await RFQ.findOne({ rfqId });
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    // ── 3. Flatten all cached data from destinationData ───────────────────
    let flights     = (rfq.destinationData || []).flatMap(d => d.flights     || []);
    let hotels      = (rfq.destinationData || []).flatMap(d => d.hotels      || []);
    let attractions = (rfq.destinationData || []).flatMap(d => d.attractions || []);
    let restaurants = (rfq.destinationData || []).flatMap(d => d.restaurants || []);
    const adults    = rfq.numberOfAdults || 1;

    // ── 4. Build RFQ pre-fill (destination, origin, date from form data) ──
    //     This lets "show me flights" work without user typing anything extra.
    const rfqPreFill = extractRfqPreFill(rfq);

    // ── 5. Flow state ──────────────────────────────────────────────────────
    const currentFlowState = flowState || createFlowState();

    // ── 6. Call AI ─────────────────────────────────────────────────────────
    const result = await chatWithItinerary({
      message,
      conversationHistory,
      flowState: currentFlowState,
      rfqPreFill,                  // ← inject RFQ form data as fallback
      rfqContext: {
        availableFlights:     flights,
        availableHotels:      hotels,
        availableAttractions: attractions,
        availableRestaurants: restaurants,
        numberOfAdults:       adults,
      },
      itinerary: rfq.itinerary || '',
    });

    const {
      reply,
      updatedFlowState: newState,
      showFlights,
      showHotels,
      showAttractions,
      showRestaurants,
    } = result;

    // ── 7. Dynamic live search at SHOW_RESULTS ────────────────────────────
    if (newState.step === FLOW_STEP.SHOW_RESULTS) {
      const dest   = newState.confirmedDestination;
      const origin = newState.confirmedOrigin;
      const date   = newState.confirmedDate;
      const pax    = newState.confirmedPax?.adults || adults;

      const searchTasks = [];

      // Flights: always re-fetch for confirmed route + date
      if (showFlights && dest && origin && date) {
        searchTasks.push(
          searchFlights({ originCity: origin, destinationCity: dest, date, adults: pax })
            .then(newFlights => {
              if (newFlights?.length) {
                const normalised = newFlights.map(f => ({
                  ...f,
                  destination:     f.destination     || f.to          || dest,
                  destinationCity: f.destinationCity  || f.toAirport  || dest,
                  origin:          f.origin           || f.from        || origin,
                  originCity:      f.originCity       || f.fromAirport || origin,
                }));
                flights = normalised;
                const existing = rfq.destinationData.find(d => cityMatches(d.destination, dest));
                if (!existing) rfq.destinationData.push({ destination: dest, flights: normalised });
                else existing.flights = normalised;
              }
            })
            .catch(e => console.warn('[chat/search] flight failed:', e.message))
        );
      }

      // Hotels: fetch if not already cached for this destination
      if (showHotels && dest && !hotels.some(h => hasMatch(h, dest))) {
        const checkIn  = date ? new Date(date) : new Date();
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3);
        searchTasks.push(
          searchHotels({
            destinationCity: dest,
            checkInDate:  toYMD(checkIn),
            checkOutDate: toYMD(checkOut),
            adults:       pax,
          })
            .then(newHotels => {
              if (newHotels?.length) {
                hotels = [...hotels, ...newHotels];
                const existing = rfq.destinationData.find(d => cityMatches(d.destination, dest));
                if (!existing) rfq.destinationData.push({ destination: dest, hotels: newHotels });
                else existing.hotels = [...(existing.hotels || []), ...newHotels];
              }
            })
            .catch(e => console.warn('[chat/search] hotel failed:', e.message))
        );
      }

      // Attractions + Restaurants: fetch if not cached
      if ((showAttractions || showRestaurants) && dest) {
        const needsA = !attractions.some(a => hasMatch(a, dest));
        const needsR = !restaurants.some(r => hasMatch(r, dest));
        if (needsA || needsR) {
          searchTasks.push(
            Promise.all([
              needsA ? searchAttractions({ destinationCity: dest }) : Promise.resolve([]),
              needsR ? searchRestaurants({ destinationCity: dest }) : Promise.resolve([]),
            ]).then(([newA, newR]) => {
              const existing = rfq.destinationData.find(d => cityMatches(d.destination, dest));
              if (newA?.length) {
                attractions = [...attractions, ...newA];
                if (!existing) rfq.destinationData.push({ destination: dest, attractions: newA });
                else existing.attractions = [...(existing.attractions || []), ...newA];
              }
              if (newR?.length) {
                restaurants = [...restaurants, ...newR];
                if (existing) existing.restaurants = [...(existing.restaurants || []), ...newR];
              }
            }).catch(e => console.warn('[chat/search] attract/rest failed:', e.message))
          );
        }
      }

      if (searchTasks.length > 0) {
        await Promise.all(searchTasks);
        rfq.markModified('destinationData');
        await rfq.save();
      }
    }

    // ── 8. Final filter ────────────────────────────────────────────────────
    const finalFlights     = showFlights     ? filterFlights(flights, newState)         : [];
    const finalHotels      = showHotels      ? filterHotels(hotels, newState)           : [];
    const finalAttractions = showAttractions ? filterAttractions(attractions, newState) : [];
    const finalRestaurants = showRestaurants ? filterRestaurants(restaurants, newState) : [];

    // ── 9. Token accounting ────────────────────────────────────────────────
    const totalMsgTokens = Math.ceil((message.length + reply.length) * 0.25);
    user.chatTokens.used = Math.min(user.chatTokens.used + totalMsgTokens, DAILY_TOKEN_LIMIT);
    await user.save();

    // ── 10. Respond ────────────────────────────────────────────────────────
    res.json({
      success:          true,
      reply,
      updatedFlowState: newState,
      flights:          finalFlights,
      hotels:           finalHotels,
      attractions:      finalAttractions,
      restaurants:      finalRestaurants,
      used:             user.chatTokens.used,
      remaining:        Math.max(0, DAILY_TOKEN_LIMIT - user.chatTokens.used),
    });

  } catch (error) {
    console.error('[rfq/chat] error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/merge
// ════════════════════════════════════════════════════════════════════════════
router.post('/merge', verifyToken, async (req, res) => {
  try {
    const { rfqIds, mergedTripName, deleteOriginals } = req.body;
    if (!rfqIds || rfqIds.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 trips required to merge' });
    }

    const sourceRFQs = await RFQ.find({ _id: { $in: rfqIds } });
    if (sourceRFQs.length !== rfqIds.length) {
      return res.status(404).json({ success: false, message: 'One or more trips not found' });
    }

    const mergedDestinations    = [];
    const mergedDestinationData = [];
    const mergedPlanItems       = [];
    let dayOffset = 0;

    sourceRFQs.forEach(rfq => {
      (rfq.destinations    || []).forEach(d    => mergedDestinations.push({ ...d.toObject() }));
      (rfq.destinationData || []).forEach(dd   => mergedDestinationData.push({ ...dd.toObject() }));
      (rfq.planItems       || []).forEach(item => {
        const cloned = { ...item };
        if (cloned.day != null) cloned.day = Number(cloned.day) + dayOffset;
        mergedPlanItems.push(cloned);
      });
      dayOffset += (rfq.destinations || []).reduce((s, d) => s + (d.numberOfNights || 0), 0);
    });

    const firstRfq       = sourceRFQs[0];
    const generatedRfqId = generateStandardId();
    const mergedItinerary = `Trip ID: ${generatedRfqId}\n\n` + sourceRFQs
      .map((rfq, i) => `=== Trip ${i + 1}: ${rfq.tripName || rfq.destinations?.[0]?.destination || 'Trip'} ===\n${rfq.itinerary || ''}`)
      .join('\n\n');

    const newRfq = new RFQ({
      rfqId:           generatedRfqId,
      tripName:        mergedTripName || `Merged Trip (${sourceRFQs.map(r => r.tripName || r.destinations?.[0]?.destination || 'Trip').join(' + ')})`,
      destinations:    mergedDestinations,
      destinationData: mergedDestinationData,
      planItems:       mergedPlanItems,
      itinerary:       mergedItinerary,
      requireHotels:   true,
      guestCountry:    firstRfq.guestCountry    || 'India',
      numberOfAdults:  firstRfq.numberOfAdults   || 1,
      numberOfChildren:firstRfq.numberOfChildren || 0,
      travelType:      firstRfq.travelType       || '',
      modeOfTransport: firstRfq.modeOfTransport  || '',
      weather:         firstRfq.weather          || null,
      checklist:       firstRfq.checklist        || [],
      checklistStats:  firstRfq.checklistStats   || {},
      createdBy:       req.uid,
      reviewStatus:    'draft',
      isMerged:        true,
      mergedFrom:      rfqIds,
    });

    await newRfq.save();
    if (deleteOriginals) await RFQ.deleteMany({ _id: { $in: rfqIds } });

    res.status(201).json({ success: true, data: newRfq, originalsDeleted: !!deleteOriginals });
  } catch (err) {
    console.error('[rfqs/merge] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/:id/flights  — manual flight search for a destination
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/flights', async (req, res) => {
  try {
    const { destinationIndex, date } = req.body;
    if (!date) return res.status(400).json({ success: false, message: 'Date required' });

    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    const dest = rfq.destinations?.[destinationIndex];
    if (!dest) return res.status(400).json({ success: false, message: 'Destination not found' });

    const originCity = destinationIndex === 0
      ? (rfq.guestCountry || 'India')
      : rfq.destinations[destinationIndex - 1].destination;

    const flights = await searchFlights({
      originCity, destinationCity: dest.destination, date, adults: rfq.numberOfAdults || 1,
    }).catch(err => { console.warn('[rfqs/flights] failed:', err.message); return []; });

    res.json({ success: true, data: flights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PATCH /api/rfqs/:id/checklist
// ════════════════════════════════════════════════════════════════════════════
router.patch('/:id/checklist', async (req, res) => {
  try {
    const { categoryIndex, itemId, checked } = req.body;
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    const category = rfq.checklist[categoryIndex];
    if (category) {
      const item = category.items.find(i => i.id === itemId);
      if (item) {
        item.checked = checked;
        const allItems = rfq.checklist.flatMap(c => c.items);
        rfq.checklistStats = {
          total:        allItems.length,
          completed:    allItems.filter(i => i.checked).length,
          highPriority: allItems.filter(i => i.priority === 'high' && !i.checked).length,
        };
        rfq.markModified('checklist');
        rfq.markModified('checklistStats');
        await rfq.save();
        broadcastUpdate(req, rfq._id, rfq);
      }
    }
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  GET /api/rfqs
// ════════════════════════════════════════════════════════════════════════════
router.get('/', verifyToken, async (req, res) => {
  try {
    const { pendingTripReview, reviewStatus } = req.query;
    const filter      = {};
    const currentUser = await User.findOne({ uid: req.uid });

    if (currentUser?.role === 'manager' || currentUser?.role === 'hr') {
      filter.$or = [
        { createdBy: req.uid },
        { assignedTo: req.uid, reviewStatus: 'sent' },
        { 'collaborators.uid': req.uid }
      ];
    } else {
      filter.$or = [
        { createdBy: req.uid },
        { 'collaborators.uid': req.uid }
      ];
    }

    if (pendingTripReview === 'true') {
      filter.reviewStatus = 'sent';
    } else if (typeof reviewStatus === 'string' && reviewStatus.length > 0) {
      filter.reviewStatus = reviewStatus.includes(',')
        ? { $in: reviewStatus.split(',').map(s => s.trim()) }
        : reviewStatus;
    }

    const rfqs  = await RFQ.find(filter).sort({ createdAt: -1 });
    const uids  = [...new Set(rfqs.map(r => r.createdBy))];
    const users = await User.find({ uid: { $in: uids } }, 'uid name email');
    const userMap = users.reduce((acc, u) => { acc[u.uid] = u.name || u.email; return acc; }, {});

    const dataWithNames = rfqs.map(r => ({
      ...r.toObject(),
      createdByName: userMap[r.createdBy] || 'Unknown User',
    }));

    res.json({ success: true, data: dataWithNames });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  GET /api/rfqs/:id
// ════════════════════════════════════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/:id/send-to-review
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/send-to-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    const ba = await BudgetApproval.findOne({ tripId: String(rfq._id) });
    if (!ba || ba.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Pehle "Send Budget Approval" bhejo aur manager se budget approve karwao.',
      });
    }

    if (rfq.reviewStatus === 'approved') {
      return res.status(400).json({ success: false, message: 'Trip pehle se approved hai.' });
    }

    rfq.reviewStatus  = 'sent';
    rfq.reviewSentAt  = new Date().toISOString();
    rfq.reviewPayload = req.body || {};
    rfq.markModified('reviewPayload');
    await rfq.save();

    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/:id/approve-review
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/approve-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    rfq.reviewStatus     = 'approved';
    rfq.reviewApprovedAt = new Date().toISOString();
    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/:id/reject-review
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/reject-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    rfq.reviewStatus = 'rejected';
    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  PUT /api/rfqs/:id
// ════════════════════════════════════════════════════════════════════════════
router.put('/:id', async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    
    // Broadcast update
    broadcastUpdate(req, rfq._id, rfq);
    
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  POST /api/rfqs/:id/regenerate
// ════════════════════════════════════════════════════════════════════════════
router.post('/:id/regenerate', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    const rfqObj = rfq.toObject();
    const [
      { itinerary, travelType, modeOfTransport },
      destinationData,
      weather,
    ] = await Promise.all([
      generateItinerary(rfqObj),
      buildDestinationData(rfqObj),
      buildWeatherData(rfqObj),
    ]);

    const checklistResult = buildChecklist({
      guestCountry:  rfqObj.guestCountry || 'India',
      destinations:  rfqObj.destinations || [],
      requireHotels: true,
    });

    rfq.itinerary       = `Trip ID: ${rfq.rfqId}\n\n` + itinerary;
    rfq.travelType      = travelType;
    rfq.modeOfTransport = modeOfTransport;
    rfq.destinationData = destinationData;
    rfq.weather         = weather;
    rfq.checklist       = checklistResult.checklist;
    rfq.checklistStats  = checklistResult.stats;
    rfq.visaInfo        = mapVisaInfo(checklistResult.visaInfo);

    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ════════════════════════════════════════════════════════════════════════════
//  DELETE /api/rfqs/:id
// ════════════════════════════════════════════════════════════════════════════
router.delete('/:id', async (req, res) => {
  try {
    await RFQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;