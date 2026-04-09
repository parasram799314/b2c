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
import { verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';


const router = express.Router();

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
router.post('/', verifyToken, async (req, res) => {
  try {
    // _id aur __v frontend se aa sakta hai — strip karo warna Mongoose crash karega
    const createdBy = req.uid;
    const userDoc = await User.findOne({ uid: req.uid });
    const assignedTo = userDoc?.managerId || '';
    const { _id, __v, ...rfqData } = req.body;
    
    // Ensure rfqId is present (backend generated if missing)
    const finalRfqId = rfqData.rfqId || generateStandardId();

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
      rfqId: finalRfqId,
      createdBy,
assignedTo,
      requireHotels: true, // ✅ FIX: DB mein bhi true save karo
      itinerary: `Trip ID: ${finalRfqId}\n\n` + itinerary,
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
const DAILY_TOKEN_LIMIT = 2000;
const TOKENS_PER_CHAR_IN  = 0.25;
const TOKENS_PER_CHAR_OUT = 0.25;

// routes/rfqs.js mein /chat route ko pura replace karein:
// routes/rfqs.js mein /chat route ko pura replace karein:
// ── POST /api/rfqs/merge ──────────────────────────────────────────────────
router.post('/merge', verifyToken, async (req, res) => {
  try {
    const { rfqIds, mergedTripName, deleteOriginals } = req.body;
    if (!rfqIds || rfqIds.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 trips required to merge' });
    }

    // Fetch all source RFQs
    const sourceRFQs = await RFQ.find({ _id: { $in: rfqIds } });
    if (sourceRFQs.length !== rfqIds.length) {
      return res.status(404).json({ success: false, message: 'One or more trips not found' });
    }

    // ── Day-wise merge logic ─────────────────────────────────────────────
    // Collect all destinations in order
    const mergedDestinations = [];
    const mergedDestinationData = [];
    const mergedPlanItems = [];
    let dayOffset = 0;

    sourceRFQs.forEach(rfq => {
      // destinations re-numbering not strictly needed but destinations themselves are
      (rfq.destinations || []).forEach(dest => {
        mergedDestinations.push({ ...dest.toObject() });
      });
      (rfq.destinationData || []).forEach(dd => {
        mergedDestinationData.push({ ...dd.toObject() });
      });
      // Re-number planItems day numbers with offset
      (rfq.planItems || []).forEach(item => {
        const cloned = { ...item };
        if (cloned.day != null) cloned.day = Number(cloned.day) + dayOffset;
        mergedPlanItems.push(cloned);
      });
      const nights = (rfq.destinations || []).reduce((s, d) => s + (d.numberOfNights || 0), 0);
      dayOffset += nights;
    });

    // Build merged RFQ document
    const firstRfq = sourceRFQs[0];
    const generatedRfqId = generateStandardId();

    // Merge itinerary text
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
      guestCountry:    firstRfq.guestCountry || 'India',
      numberOfAdults:  firstRfq.numberOfAdults || 1,
      numberOfChildren:firstRfq.numberOfChildren || 0,
      travelType:      firstRfq.travelType || '',
      modeOfTransport: firstRfq.modeOfTransport || '',
      weather:         firstRfq.weather || null,
      checklist:       firstRfq.checklist || [],
      checklistStats:  firstRfq.checklistStats || {},
      createdBy:       req.uid,
      reviewStatus:    'draft',
      isMerged:        true,
      mergedFrom:      rfqIds,
    });

    await newRfq.save();

    // Delete originals if requested
    if (deleteOriginals) {
      await RFQ.deleteMany({ _id: { $in: rfqIds } });
    }

    res.status(201).json({ 
      success: true, 
      data: newRfq,
      originalsDeleted: !!deleteOriginals 
    });
  } catch (err) {
    console.error('[rfqs/merge] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { itinerary, destinations, message } = req.body;
    const user = await User.findOne({ uid: req.uid });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // --- 1. RESET LOGIC (Sahi Tarika) ---
    const now = new Date();
    const last = new Date(user.chatTokens.lastReset || now);
    
    // Agar dates match nahi karti (toDateString use karne se time ka lafda khatam)
    if (now.toDateString() !== last.toDateString()) {
      user.chatTokens.used = 0;
      user.chatTokens.lastReset = now;
      await user.save();
    }

    if (user.chatTokens.used >= DAILY_TOKEN_LIMIT) {
      return res.status(403).json({ success: false, message: 'Daily limit reached' });
    }

    // --- 2. AI REPLY ---
    const result = await chatWithItinerary({ itinerary, destinations, message });
    const reply = result.reply;

    // --- 3. TOKEN CALCULATION ---
    // Char count ke basis par (0.25 tokens per character)
    const totalMsgTokens = Math.ceil((message.length + reply.length) * 0.25);
    
    // DB Update
    user.chatTokens.used = Math.min(user.chatTokens.used + totalMsgTokens, DAILY_TOKEN_LIMIT);
    await user.save();

    // Frontend ko fresh data wapas bhejo
    res.json({
      success: true,
      reply,
      used: user.chatTokens.used, // Backend se fresh count
      remaining: Math.max(0, DAILY_TOKEN_LIMIT - user.chatTokens.used)
    });
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
router.get('/', verifyToken, async (req, res) => {
  try {
    const { pendingTripReview, reviewStatus } = req.query;
    const filter = {};
   const currentUser = await User.findOne({ uid: req.uid });
if (currentUser?.role === 'manager' || currentUser?.role === 'hr') {
  // Manager/HR ko khud ki banai trips + assigned trips jo 'sent' status mein hain
  filter.$or = [
    { createdBy: req.uid },
    { assignedTo: req.uid, reviewStatus: 'sent' }
  ];
} else {
  // Employee ko sirf apni trips
  filter.createdBy = req.uid;
}
    
    if (pendingTripReview === 'true') {
      filter.reviewStatus = 'sent';
    } else if (typeof reviewStatus === 'string' && reviewStatus.length > 0) {
      if (reviewStatus.includes(',')) {
        filter.reviewStatus = { $in: reviewStatus.split(',').map(s => s.trim()) };
      } else {
        filter.reviewStatus = reviewStatus;
      }
    }
    
    const rfqs = await RFQ.find(filter).sort({ createdAt: -1 });

    // Manually join with User to get names
    const uids = [...new Set(rfqs.map(r => r.createdBy))];
    const users = await User.find({ uid: { $in: uids } }, 'uid name email');
    const userMap = users.reduce((acc, u) => {
      acc[u.uid] = u.name || u.email;
      return acc;
    }, {});

    const dataWithNames = rfqs.map(r => ({
      ...r.toObject(),
      createdByName: userMap[r.createdBy] || 'Unknown User'
    }));

    res.json({ success: true, data: dataWithNames });
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

    const finalRfqId = rfq.rfqId || generateStandardId();
    rfq.rfqId           = finalRfqId;
    rfq.itinerary       = `Trip ID: ${finalRfqId}\n\n` + itinerary;
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