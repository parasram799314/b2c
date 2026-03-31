// routes/rfqs.js
import express from 'express';
import RFQ from '../models/RFQ.js';
import BudgetApproval from '../models/BudgetApproval.js';
import { generateItinerary, chatWithItinerary } from '../services/groqService.js';
import { searchFlights }      from '../services/flightService.js';
import { searchHotels }       from '../services/hotelService.js';
import { searchAttractions }  from '../services/attractionService.js';
import { searchRestaurants }  from '../services/restaurantService.js';
import { getWeatherForecast } from '../services/weatherService.js';
import { buildChecklist }     from '../services/checklistService.js';

const router = express.Router();

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

async function buildDestinationData(rfqData) {
  const {
    destinations   = [],
    guestCountry   = '',
    requireHotels  = true,  // ✅ FIX: hamesha true — hotels hamesha fetch honge
    hotelRatings   = [],
    numberOfAdults = 1,
  } = rfqData;

  console.log(`[rfqs] requireHotels = ${requireHotels}`);

  const results = await Promise.all(
    destinations.map(async (dest, idx) => {
      const destination = dest.destination;
      const checkInDate = toYMD(dest.dateOfArrival);
      const nights      = dest.numberOfNights || 1;

      const checkOut = new Date(checkInDate);
      checkOut.setDate(checkOut.getDate() + nights);
      const checkOutDate = checkOut.toISOString().slice(0, 10);

      const originCity = idx === 0
        ? (guestCountry || 'India')
        : destinations[idx - 1].destination;

      const [flights, hotels, attractions, restaurants] = await Promise.all([
        searchFlights({
          originCity,
          destinationCity: destination,
          date: checkInDate,
          adults: numberOfAdults || 1,
        }).catch(err => {
          console.warn(`[rfqs] flights failed for ${destination}:`, err.message);
          return [];
        }),

        // ✅ requireHotels hamesha true hai ab
        searchHotels({
          destinationCity: destination,
          checkInDate,
          checkOutDate,
          adults: numberOfAdults || 1,
          hotelRatings,
        }).catch(err => {
          console.warn(`[rfqs] hotels failed for ${destination}:`, err.message);
          return [];
        }),

        searchAttractions({
          destinationCity: destination,
        }).catch(err => {
          console.warn(`[rfqs] attractions failed for ${destination}:`, err.message);
          return [];
        }),

        searchRestaurants({
          destinationCity: destination,
        }).catch(err => {
          console.warn(`[rfqs] restaurants failed for ${destination}:`, err.message);
          return [];
        }),
      ]);

      console.log(`[rfqs] ${destination}: flights=${flights.length}, hotels=${hotels.length}, attractions=${attractions.length}, restaurants=${restaurants.length}`);

      return { destination, flights, hotels, attractions, restaurants };
    })
  );

  return results;
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

// ── POST /api/rfqs ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // _id aur __v frontend se aa sakta hai — strip karo warna Mongoose crash karega
    const { _id, __v, ...rfqData } = req.body;
    console.log('[rfqs] Creating RFQ, destination:', rfqData.destinations?.[0]?.destination);

    const [
      { itinerary, travelType, modeOfTransport },
      destinationData,
      weather,
    ] = await Promise.all([
      generateItinerary(rfqData),
      buildDestinationData(rfqData),
      buildWeatherData(rfqData),
    ]);

    const checklistResult = buildChecklist({
      guestCountry:  rfqData.guestCountry || 'India',
      destinations:  rfqData.destinations || [],
      requireHotels: true, // ✅ FIX: hamesha true
    });

    const rfq = new RFQ({
      ...rfqData,
      requireHotels: true, // ✅ FIX: DB mein bhi true save karo
      itinerary,
      travelType,
      modeOfTransport,
      destinationData,
      weather,
      checklist:      checklistResult.checklist,
      checklistStats: checklistResult.stats,
      visaInfo:       mapVisaInfo(checklistResult.visaInfo),
    });

    await rfq.save();
    res.status(201).json({ success: true, data: rfq });
  } catch (error) {
    console.error('RFQ creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/chat ───────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { itinerary, destinations, message } = req.body;
    const reply = await chatWithItinerary({ itinerary, destinations, message });
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/:id/flights ────────────────────────────────────────────
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

    console.log(`[rfqs/flights] Searching: ${originCity} → ${dest.destination} on ${date}`);

    const flights = await searchFlights({
      originCity,
      destinationCity: dest.destination,
      date,
      adults: rfq.numberOfAdults || 1,
    }).catch(err => {
      console.warn(`[rfqs/flights] searchFlights failed:`, err.message);
      return [];
    });

    console.log(`[rfqs/flights] Found ${flights.length} flights`);
    res.json({ success: true, data: flights });
  } catch (error) {
    console.error('[rfqs/flights] error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PATCH /api/rfqs/:id/checklist ─────────────────────────────────────────
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
      }
    }
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/rfqs ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { pendingTripReview, reviewStatus } = req.query;
    const filter = {};
    if (pendingTripReview === 'true') {
      filter.reviewStatus = 'sent';
    } else if (typeof reviewStatus === 'string' && reviewStatus.length > 0) {
      filter.reviewStatus = reviewStatus;
    }
    const rfqs = await RFQ.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: rfqs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/rfqs/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/:id/send-to-review ─────────────────────────────────────
// Sirf tab jab budget approval manager ne approve kar di ho
router.post('/:id/send-to-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });

    const tripKey = String(rfq._id);
    const ba = await BudgetApproval.findOne({ tripId: tripKey });
    if (!ba || ba.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Pehle “Send Budget Approval” bhejo aur manager se budget approve karwao. Uske baad hi trip review bhej sakte ho.',
      });
    }

    if (rfq.reviewStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Trip pehle se manager-approved (locked) hai.',
      });
    }

    const payload = req.body || {};
    rfq.reviewStatus = 'sent';
    rfq.reviewSentAt = new Date().toISOString();
    rfq.reviewPayload = payload;
    rfq.markModified('reviewPayload');
    await rfq.save();

    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/:id/approve-review ────────────────────────────────────
router.post('/:id/approve-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    if (rfq.reviewStatus !== 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Is trip par abhi koi pending review request nahi.',
      });
    }
    rfq.reviewStatus = 'approved';
    rfq.reviewApprovedAt = new Date().toISOString();
    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/:id/reject-review ─────────────────────────────────────
router.post('/:id/reject-review', async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    if (rfq.reviewStatus !== 'sent') {
      return res.status(400).json({ success: false, message: 'Pending review nahi.' });
    }
    rfq.reviewStatus = 'rejected';
    rfq.reviewSentAt = '';
    await rfq.save();
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/rfqs/:id ─────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const rfq = await RFQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rfq) return res.status(404).json({ success: false, message: 'RFQ not found' });
    res.json({ success: true, data: rfq });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/rfqs/:id/regenerate ─────────────────────────────────────────
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
      requireHotels: true, // ✅ FIX: regenerate mein bhi hamesha true
    });

    rfq.itinerary       = itinerary;
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

// ── DELETE /api/rfqs/:id ──────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await RFQ.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;