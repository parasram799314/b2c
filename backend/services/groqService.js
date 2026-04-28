// services/groqService.js
// ═══════════════════════════════════════════════════════════════════════════════
//  AI Travel Genie  —  v5  (Zero-friction single-message extraction)
//
//  WHAT'S NEW IN v5:
//  ✅ Smart defaults  — trip_type=one_way, cabin=economy, pax=1 adult (never asked)
//  ✅ normaliseRawDate — parses any date format user types
//  ✅ RFQ pre-fill    — if user just says "show flights", uses RFQ form data directly
//  ✅ Short replies   — bot replies in 1–2 lines only
//  ✅ Aggressive IDLE — extracts dest+origin+date+pax in one shot
//  ✅ No hallucination — LLM never invents data; shows "tap Search" if no live data
// ═══════════════════════════════════════════════════════════════════════════════

import Groq from 'groq-sdk';

// ── Singleton ────────────────────────────────────────────────────────────────
let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

// ── Constants ─────────────────────────────────────────────────────────────────
const MODEL            = 'llama-3.3-70b-versatile';
const TEMP_EXTRACT     = 0.0;
const TEMP_REPLY       = 0.4;
const TEMP_ITINERARY   = 0.65;
const MAX_HISTORY      = 20;
const MAX_RETRY_BUDGET = 3;
const MAX_FLIGHTS_SHOW = 6;
const MAX_HOTELS_SHOW  = 5;
const MAX_ATTRACT_SHOW = 6;
const BACKOFF_BASE_MS  = 500;
const BACKOFF_MAX_MS   = 8000;

// ════════════════════════════════════════════════════════════════════════════
//  FLOW STEP CONSTANTS
// ════════════════════════════════════════════════════════════════════════════
export const FLOW_STEP = Object.freeze({
  IDLE:             'IDLE',
  NEED_DEST:        'NEED_DEST',
  NEED_ORIGIN:      'NEED_ORIGIN',
  NEED_DATE:        'NEED_DATE',
  NEED_RETURN_DATE: 'NEED_RETURN_DATE',
  NEED_HOTEL_STARS: 'NEED_HOTEL_STARS',
  NEED_ATTRACT_CAT: 'NEED_ATTRACT_CAT',
  SHOW_RESULTS:     'SHOW_RESULTS',
  DEAD_END:         'DEAD_END',
});

// Clarify sub-modes (reply variants only — do NOT assign to state.step)
const CLARIFY = Object.freeze({
  DATE_MONTH:    'CLARIFY_DATE_MONTH',
  DATE_YEAR:     'CLARIFY_DATE_YEAR',
  DEST_UNCLEAR:  'DESTINATION_UNCLEAR',
  ORIGIN_UNCLEAR:'ORIGIN_UNCLEAR',
  STARS_UNCLEAR: 'STARS_UNCLEAR',
  ATTRACT_UNCLEAR:'ATTRACT_UNCLEAR',
});

export const INTENT = Object.freeze({
  FLIGHT:      'flight_search',
  HOTEL:       'hotel_search',
  ATTRACTION:  'attraction_search',
  ITINERARY:   'itinerary_query',
  GREETING:    'greeting',
  MODIFY:      'modify_search',
  ADD_TO_PLAN: 'add_to_plan',
  CANCEL:      'cancel',
  OTHER:       'other',
});

export const CABIN = Object.freeze({
  ECONOMY:  'economy',
  BUSINESS: 'business',
  FIRST:    'first',
});

// ── City alias map ────────────────────────────────────────────────────────────
const CITY_ALIASES = {
  'bombay': 'Mumbai', 'calcutta': 'Kolkata', 'madras': 'Chennai',
  'bengaluru': 'Bangalore', 'dilli': 'Delhi', 'new delhi': 'Delhi',
  'dxb': 'Dubai', 'bom': 'Mumbai', 'del': 'Delhi', 'blr': 'Bangalore',
  'maa': 'Chennai', 'hyd': 'Hyderabad', 'ccu': 'Kolkata',
  'goa': 'Goa', 'goi': 'Goa', 'lhr': 'London', 'lon': 'London',
  'jfk': 'New York', 'nyc': 'New York', 'sfo': 'San Francisco',
  'bkk': 'Bangkok', 'sin': 'Singapore', 'cdg': 'Paris', 'par': 'Paris',
};

/** Normalise city: alias resolve + title-case */
function normaliseCity(raw = '') {
  if (!raw) return '';
  const lower = raw.trim().toLowerCase();
  return CITY_ALIASES[lower] ?? raw.trim().replace(/\b\w/g, c => c.toUpperCase());
}

/** Parse any date string → DD-MMM-YYYY or null */
function normaliseRawDate(raw = '') {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Already in correct format
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(trimmed)) return trimmed;
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // Try native parse (handles "20 April 2026", "2026-04-20", "04/20/2026", etc.)
  const d = new Date(trimmed);
  if (!isNaN(d) && d.getFullYear() > 2000) {
    return `${String(d.getDate()).padStart(2,'0')}-${MONTHS[d.getMonth()]}-${d.getFullYear()}`;
  }
  // Try "20 apr", "apr 20" without year — attach current or next year
  const monthMatch = trimmed.match(/(\d{1,2})\s*([a-zA-Z]+)/) || trimmed.match(/([a-zA-Z]+)\s*(\d{1,2})/);
  if (monthMatch) {
    const day  = parseInt(monthMatch[1]) || parseInt(monthMatch[2]);
    const mStr = (monthMatch[2] || monthMatch[1]).toLowerCase().slice(0, 3);
    const mIdx = MONTHS.findIndex(m => m.toLowerCase() === mStr);
    if (mIdx !== -1 && day >= 1 && day <= 31) {
      const yr = new Date().getFullYear();
      const candidate = new Date(yr, mIdx, day);
      const finalYr = candidate < new Date() ? yr + 1 : yr;
      return `${String(day).padStart(2,'0')}-${MONTHS[mIdx]}-${finalYr}`;
    }
  }
  return null; // couldn't parse
}

// ════════════════════════════════════════════════════════════════════════════
//  EXPONENTIAL BACKOFF
// ════════════════════════════════════════════════════════════════════════════
async function withBackoff(fn, maxAttempts = 4) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      const isRate = err?.status === 429 || err?.error?.type === 'rate_limit_exceeded';
      if (!isRate || attempt >= maxAttempts) throw err;
      const delay = Math.min(BACKOFF_BASE_MS * 2 ** (attempt - 1), BACKOFF_MAX_MS);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  1. ITINERARY GENERATOR
// ════════════════════════════════════════════════════════════════════════════
export async function generateItinerary(rfqData) {
  const {
    destinations = [], requireHotels = false, rooms = [],
    numberOfRooms = 1, hotelRatings = [],
    numberOfAdults = 1, numberOfChildren = 0, guestCountry = 'India',
  } = rfqData;

  const destSummary = destinations.map((d, i) =>
    `Destination ${i + 1}: ${d.destination} | Arrival: ${d.dateOfArrival} | Nights: ${d.numberOfNights}`
  ).join('\n');

  const guestInfo = requireHotels
    ? `Hotel rooms: ${numberOfRooms}, preferred: ${hotelRatings?.join(', ') || 'any'}★\n` +
      `Rooms: ${rooms.map((r, i) =>
        `Room ${i + 1}: ${r.adults} adult(s), ${r.childrenWithBed} child(ren) with bed, ${r.childrenNoBed} without`
      ).join(' | ')}`
    : `No hotel. Adults: ${numberOfAdults}, Children: ${numberOfChildren}`;

  const totalNights = destinations.reduce((s, d) => s + (Number(d.numberOfNights) || 1), 0);
  const totalDays   = totalNights + 1;
  const mainDest    = destinations[0]?.destination || 'destination';

  const middleDays = Array.from({ length: Math.max(0, totalDays - 2) }, (_, i) =>
    `## Day ${i + 2} · [Theme]\n` +
    `Morning:\n1. **[Place]** - details, hours, tip, fee\n2. **[Place]** - …\n` +
    `Afternoon:\n3. **[Place]** - …\n4. **Lunch: [Restaurant]** - cuisine, price range\n` +
    `Evening:\n5. **[Activity]** - …\n6. **Dinner: [Restaurant]** - cuisine, price range`
  ).join('\n\n');

  const system = `You are an expert travel planner. Output ONLY factual, verifiable content.
- Use real place names, real restaurants, real transport.
- Write "verify locally" if hours/prices are uncertain — never invent figures.
- Never fabricate hotel names or flight numbers.`;

  const userPrompt = `Create a day-by-day itinerary.

TRIP:
${destSummary}
Origin: ${guestCountry}
${guestInfo}
Duration: ${totalDays} days / ${totalNights} nights

FORMAT:
## Travel Type: [leisure|family|adventure|honeymoon|business|cultural]
## Recommended Transfer: [flight|train|car — reason]

## Day 1 · Journey from ${guestCountry} to ${mainDest}
[Flight timing, airport, check-in, evening]

${middleDays}

## Day ${totalDays} · Departure
[Checkout, last tips, airport, departure]

## Practical Tips:
- Visa, Best season, Local transport, Currency, Language, Emergency numbers`;

  const completion = await withBackoff(() =>
    getGroq().chat.completions.create({
      messages:    [{ role: 'system', content: system }, { role: 'user', content: userPrompt }],
      model:       MODEL, temperature: TEMP_ITINERARY, max_tokens: 4000,
    })
  );

  const content         = completion.choices[0]?.message?.content || '';
  const travelType      = content.match(/## Travel Type:\s*(.+)/i)?.[1]?.trim()         || 'General';
  const modeOfTransport = content.match(/## Recommended Transfer:\s*(.+)/i)?.[1]?.trim() || 'Flight';
  return { itinerary: content, travelType, modeOfTransport };
}

// ════════════════════════════════════════════════════════════════════════════
//  2. ENTITY EXTRACTOR
// ════════════════════════════════════════════════════════════════════════════
async function extractEntity(step, userMessage, conversationHistory) {
  const recentCtx = conversationHistory
    .slice(-MAX_HISTORY)
    .map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
    .join('\n');

  const TODAY = new Date().toDateString();

  const schemas = {
    [FLOW_STEP.IDLE]: `{
  "intent": "flight_search"|"hotel_search"|"attraction_search"|"itinerary_query"|"greeting"|"modify_search"|"add_to_plan"|"cancel"|"other",
  "rawDestination": "<city user wants to TRAVEL TO, null if not mentioned>",
  "rawOrigin": "<city user will FLY FROM / depart from, null if not mentioned>",
  "rawDate": "<travel date exactly as user wrote, e.g. '20 april 2026', '20/4/2026', null if not mentioned>",
  "adults": <number of adults as integer, 1 if not mentioned>,
  "children": <number of children as integer, 0 if not mentioned>,
  "tripType": "one_way"|"return"|null,
  "cabin": "economy"|"business"|"first"|null,
  "hotelStars": <1-5 integer if user mentioned hotel star preference, null otherwise>,
  "wantsReturnFlights": <true only if user explicitly asks for round-trip or return>
}
IMPORTANT: Extract ALL fields from the message in one pass. If user says "1 adult" set adults:1. If user says "economy" set cabin:"economy".`,

    [FLOW_STEP.NEED_DEST]: `{
  "city": "<city user wants to TRAVEL TO, null if unclear>",
  "confidence": "high"|"medium"|"low"
}
RULE: Destination = where they GO TO. Not where they depart from.`,

    [FLOW_STEP.NEED_ORIGIN]: `{
  "city": "<city user will FLY FROM, null if unclear>",
  "confidence": "high"|"medium"|"low"
}
RULE: Origin = departure city. NOT the destination already set.`,

    [FLOW_STEP.NEED_DATE]: `{
  "date": "<normalized DD-MMM-YYYY if complete, null otherwise>",
  "needsMonth": <true if only day number given>,
  "needsYear": <true if day+month given but no year>,
  "isPast": <true if date is in the past>,
  "rawInput": "<exactly what user typed>"
}
TODAY is ${TODAY}. Past dates are INVALID.`,

    [FLOW_STEP.NEED_RETURN_DATE]: `{
  "date": "<return date as DD-MMM-YYYY if complete, null otherwise>",
  "needsMonth": <true if only day number given>,
  "needsYear": <true if day+month given but no year>,
  "isPast": <true if date is in the past>,
  "isBeforeOutbound": <true if this date is earlier than outbound date>,
  "rawInput": "<exactly what user typed>"
}
TODAY is ${TODAY}.`,

    [FLOW_STEP.NEED_HOTEL_STARS]: `{
  "stars": <1-5 integer, null if not clear>,
  "anyRating": <true if user says "any", "doesn't matter", "koi bhi", "sab chalega">
}`,

    [FLOW_STEP.NEED_ATTRACT_CAT]: `{
  "categories": ["adventure"|"culture"|"food"|"family"|"nightlife"|"nature"|"shopping"|"religious"],
  "wantsAll": <true if user says "all", "everything", "sab kuch", "any">
}`,

    [FLOW_STEP.SHOW_RESULTS]: `{
  "intent": "flight_search"|"hotel_search"|"attraction_search"|"modify_search"|"add_to_plan"|"cancel"|"other",
  "rawDestination": "<new destination if user wants to change, null otherwise>",
  "rawOrigin": "<new origin if user wants to change, null otherwise>",
  "rawDate": "<new date if user wants to change, null otherwise>",
  "modifyField": "date"|"origin"|"destination"|"pax"|"cabin"|"stars"|null,
  "adults": <new passenger count if mentioned, null otherwise>,
  "cabin": "economy"|"business"|"first"|null
}`,
  };

  const schema = schemas[step] || schemas[FLOW_STEP.IDLE];

  const prompt = `You are a JSON extraction engine. Output ONLY valid JSON. No markdown. No explanation.

Conversation so far:
${recentCtx || '(none)'}

User's latest message: "${userMessage}"

Extract exactly this schema:
${schema}`;

  try {
    const completion = await withBackoff(() =>
      getGroq().chat.completions.create({
        messages:        [{ role: 'user', content: prompt }],
        model:           MODEL, temperature: TEMP_EXTRACT,
        max_tokens:      250, response_format: { type: 'json_object' },
      })
    );
    return JSON.parse(completion.choices[0]?.message?.content || '{}');
  } catch {
    return {};
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  3. REPLY GENERATOR — short, warm, 1-2 lines
// ════════════════════════════════════════════════════════════════════════════
async function generateReply({
  state, effectiveStep, userMessage,
  availableFlights, availableHotels, availableAttractions,
  conversationHistory, retryCount,
}) {
  const confirmed = [
    `Destination : ${state.confirmedDestination || '—'}`,
    `Origin      : ${state.confirmedOrigin      || '—'}`,
    `Date        : ${state.confirmedDate         || '—'}`,
    `Return date : ${state.confirmedReturnDate   || '—'}`,
    `Passengers  : ${state.confirmedPax ? `${state.confirmedPax.adults}A ${state.confirmedPax.children || 0}C` : '—'}`,
    `Cabin       : ${state.confirmedCabin        || 'economy'}`,
    `Hotel stars : ${state.preferredHotelStars != null ? state.preferredHotelStars + '★' : '—'}`,
    `Search mode : ${state.searchMode            || '—'}`,
  ].join('\n');

  const flightLines = availableFlights.length
    ? availableFlights.slice(0, 3).map(f =>
        `• ${f.airline || ''} ${f.flightNumber || ''} | ${f.from || f.origin || ''}→${f.to || f.destination || ''} | ${f.depTime || f.departureTime || ''} | ₹${f.price || '?'} | ${Number(f.stops) === 0 ? 'Non-stop' : f.stops + ' stop'}`
      ).join('\n')
    : null;

  const hotelLines = availableHotels.length
    ? availableHotels.slice(0, 3).map(h =>
        `• ${h.name} (${h.stars}★) | ${h.currency || '₹'}${h.price || '?'}/night`
      ).join('\n')
    : null;

  const attractLines = availableAttractions.length
    ? availableAttractions.slice(0, 3).map(a =>
        `• ${a.name} | ${a.category || ''} | ${a.rating ? a.rating + '★' : ''}`
      ).join('\n')
    : null;

  const taskMap = {
    [FLOW_STEP.IDLE]:
      `Greet warmly in 1 line. Ask what they need — flights, hotels, or attractions.`,

    [FLOW_STEP.NEED_DEST]:
      retryCount > 0
        ? `They didn't understand. Ask differently in 1 short line: which city do they want to visit?`
        : `Ask in 1 line: which city do you want to travel to? ✈️`,

    [FLOW_STEP.NEED_ORIGIN]:
      `Destination is "${state.confirmedDestination}". Ask in 1 line: which city will you fly FROM?`,

    [FLOW_STEP.NEED_DATE]:
      retryCount > 0
        ? `Date was unclear. Ask again in 1 line with an example like "20-Apr-2026".`
        : `Ask in 1 line: what's your travel date? (e.g. 20-Apr-2026) 📅`,

    [FLOW_STEP.NEED_RETURN_DATE]:
      `Outbound is ${state.confirmedDate}. Ask in 1 line: what's your return date?`,

    [FLOW_STEP.NEED_HOTEL_STARS]:
      `Ask in 1 line: preferred hotel stars — 3★, 4★, 5★, or any? 🏨`,

    [FLOW_STEP.NEED_ATTRACT_CAT]:
      `Ask in 1 line: what type — adventure, culture, food, shopping, or all? 🗺️`,

    [FLOW_STEP.SHOW_RESULTS]:
      `Results are ready. Write 1 warm line summarising what you found, then offer to add to plan.\n\n` +
      (flightLines   ? `Available flights:\n${flightLines}\n\n`     : '') +
      (hotelLines    ? `Available hotels:\n${hotelLines}\n\n`       : '') +
      (attractLines  ? `Top attractions:\n${attractLines}\n\n`      : '') +
      (!flightLines && !hotelLines && !attractLines
        ? `No cached data found. Tell user in 1 line to tap the Search button for live results.` : ''),

    [FLOW_STEP.DEAD_END]:
      `Say in 1 line you couldn't understand. Offer to start fresh.`,

    [CLARIFY.DATE_MONTH]:  `Ask in 1 line: which month and year? e.g. "April 2026"`,
    [CLARIFY.DATE_YEAR]:   `Ask in 1 line: which year?`,
    [CLARIFY.DEST_UNCLEAR]:`Ask in 1 line: which city do you want to travel to?`,
    [CLARIFY.ORIGIN_UNCLEAR]: `Ask in 1 line: which city will you depart from?`,
    [CLARIFY.STARS_UNCLEAR]:  `Ask in 1 line: 3★, 4★, 5★, or any hotel is fine?`,
    [CLARIFY.ATTRACT_UNCLEAR]:`Ask in 1 line: what type of attractions interest you?`,
  };

  const task = taskMap[effectiveStep] || taskMap[FLOW_STEP.IDLE];

  const system = `You are AI Travel Genie. Be warm, helpful, and VERY concise.

STRICT RULES:
1. Reply in same language as user (Hindi/English/Hinglish — match exactly).
2. MAXIMUM 2 lines per reply. Questions must be 1 line. Results can be 2 lines max intro.
3. NEVER ask for info already confirmed in state.
4. NEVER invent prices, flight numbers, hotel names, or attractions.
5. If data unavailable, say "tap Search for live results" — nothing else.
6. Echo 1 confirmed detail before asking next question.
7. No long paragraphs. No bullet lists in replies. Cards handle the data display.
8. Use max 1 emoji per reply.`;

  const userContent = `CONFIRMED STATE:\n${confirmed}\n\nTASK: ${task}\n\nUser said: "${userMessage}"`;

  const completion = await withBackoff(() =>
    getGroq().chat.completions.create({
      messages: [
        { role: 'system', content: system },
        ...conversationHistory.slice(-MAX_HISTORY),
        { role: 'user', content: userContent },
      ],
      model: MODEL, temperature: TEMP_REPLY, max_tokens: 120,
    })
  );

  return completion.choices[0]?.message?.content?.trim()
    || 'Thodi technical dikkat aa gayi, please retry karein. 🙏';
}

// ════════════════════════════════════════════════════════════════════════════
//  4. STATE MACHINE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Given current state, find the first missing required field.
 * Smart defaults: trip_type=one_way, cabin=economy, pax={adults:1}
 * These are NEVER asked — set automatically.
 */
function _nextMissingStep(state) {
  const mode = state.searchMode;

  // Attraction flow
  if (mode === 'attraction') {
    if (!state.confirmedDestination)          return FLOW_STEP.NEED_DEST;
    if (!state.preferredAttractionCategories) return FLOW_STEP.NEED_ATTRACT_CAT;
    return FLOW_STEP.SHOW_RESULTS;
  }

  // Flight / hotel shared required steps
  if (!state.confirmedDestination) return FLOW_STEP.NEED_DEST;
  if (!state.confirmedOrigin)      return FLOW_STEP.NEED_ORIGIN;
  if (!state.confirmedDate)        return FLOW_STEP.NEED_DATE;

  // Auto-set trip type (never ask)
  if (!state.confirmedTripType) state.confirmedTripType = 'one_way';

  if (state.confirmedTripType === 'return' && !state.confirmedReturnDate)
    return FLOW_STEP.NEED_RETURN_DATE;

  // Auto-set pax (never ask unless user explicitly needs it changed)
  if (!state.confirmedPax) state.confirmedPax = { adults: 1, children: 0 };

  // Auto-set cabin (never ask)
  if (!state.confirmedCabin) state.confirmedCabin = CABIN.ECONOMY;

  // Hotel-only: ask stars
  if (mode === 'hotel') {
    if (state.preferredHotelStars === undefined) return FLOW_STEP.NEED_HOTEL_STARS;
  }

  return FLOW_STEP.SHOW_RESULTS;
}

/**
 * Apply state transition. Pure JS — zero LLM for routing.
 */
function applyTransition(state, extracted) {
  let effectiveStep   = state.step;
  let showFlights     = false;
  let showHotels      = false;
  let showAttractions = false;
  let stepAdvanced    = false;

  const bumpRetry = () => {
    state.retryCount[state.step] = (state.retryCount[state.step] || 0) + 1;
    if (state.retryCount[state.step] >= MAX_RETRY_BUDGET) {
      state.step = effectiveStep = FLOW_STEP.DEAD_END;
    }
  };

  // ── Helper: pre-fill everything the user provided in one message ──────────
  const prefillFromExtracted = () => {
    if (extracted.rawDestination)
      state.confirmedDestination = normaliseCity(extracted.rawDestination);
    if (extracted.rawOrigin && extracted.rawOrigin !== extracted.rawDestination)
      state.confirmedOrigin = normaliseCity(extracted.rawOrigin);
    if (extracted.rawDate) {
      const nd = normaliseRawDate(extracted.rawDate);
      if (nd) state.confirmedDate = nd;
    }
    if (extracted.adults > 0)
      state.confirmedPax = { adults: extracted.adults, children: extracted.children ?? 0 };
    if (extracted.tripType) state.confirmedTripType = extracted.tripType;
    if (extracted.cabin)    state.confirmedCabin    = extracted.cabin;
    if (extracted.hotelStars >= 1 && extracted.hotelStars <= 5)
      state.preferredHotelStars = extracted.hotelStars;
    // Smart defaults — set immediately so _nextMissingStep can skip them
    if (!state.confirmedTripType) state.confirmedTripType = 'one_way';
    if (!state.confirmedCabin)    state.confirmedCabin    = CABIN.ECONOMY;
    if (!state.confirmedPax)      state.confirmedPax      = { adults: 1, children: 0 };
  };

  // ── Helper: use RFQ pre-fill as fallback if user provided nothing ─────────
  const applyRfqFallback = () => {
    if (!state.confirmedDestination && state._rfqDestination)
      state.confirmedDestination = state._rfqDestination;
    if (!state.confirmedOrigin && state._rfqOrigin)
      state.confirmedOrigin = state._rfqOrigin;
    if (!state.confirmedDate && state._rfqDate)
      state.confirmedDate = state._rfqDate;
    if (!state.confirmedPax && state._rfqPax)
      state.confirmedPax = state._rfqPax;
  };

  switch (state.step) {

    // ── IDLE ──────────────────────────────────────────────────────────────────
    case FLOW_STEP.IDLE: {
      const intent = extracted.intent || INTENT.OTHER;

      if (intent === INTENT.GREETING) {
        effectiveStep = FLOW_STEP.IDLE;
        break;
      }

      if (intent === INTENT.ITINERARY) {
        effectiveStep = FLOW_STEP.IDLE;
        break;
      }

      if (intent === INTENT.FLIGHT || intent === INTENT.HOTEL) {
        state.searchMode = intent === INTENT.FLIGHT ? 'flight' : 'hotel';
        prefillFromExtracted();   // fill what user said
        applyRfqFallback();       // fill gaps from RFQ form data
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        stepAdvanced  = true;
        break;
      }

      if (intent === INTENT.ATTRACTION) {
        state.searchMode = 'attraction';
        prefillFromExtracted();
        applyRfqFallback();
        if (!state.confirmedDestination) {
          state.step = effectiveStep = FLOW_STEP.NEED_DEST;
        } else if (!state.preferredAttractionCategories) {
          state.step = effectiveStep = FLOW_STEP.NEED_ATTRACT_CAT;
        } else {
          state.step = effectiveStep = FLOW_STEP.SHOW_RESULTS;
        }
        stepAdvanced = true;
        break;
      }

      // Generic "show me flights/hotels" without explicit intent but keywords present
      const msgLower = (extracted._rawMessage || '').toLowerCase();
      const hasFlightKeyword = /flight|fly|ticket|uda/.test(msgLower);
      const hasHotelKeyword  = /hotel|stay|room|acco/.test(msgLower);
      if (hasFlightKeyword || hasHotelKeyword) {
        state.searchMode = hasFlightKeyword ? 'flight' : 'hotel';
        prefillFromExtracted();
        applyRfqFallback();
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        stepAdvanced  = true;
        break;
      }

      effectiveStep = FLOW_STEP.IDLE;
      break;
    }

    // ── NEED_DEST ─────────────────────────────────────────────────────────────
    case FLOW_STEP.NEED_DEST: {
      if (extracted.city && ['high', 'medium'].includes(extracted.confidence)) {
        state.confirmedDestination = normaliseCity(extracted.city);
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        stepAdvanced  = true;
      } else {
        effectiveStep = CLARIFY.DEST_UNCLEAR;
        bumpRetry();
      }
      break;
    }

    // ── NEED_ORIGIN ───────────────────────────────────────────────────────────
    case FLOW_STEP.NEED_ORIGIN: {
      if (extracted.city && ['high', 'medium'].includes(extracted.confidence)) {
        const norm = normaliseCity(extracted.city);
        if (norm.toLowerCase() === (state.confirmedDestination || '').toLowerCase()) {
          effectiveStep = CLARIFY.ORIGIN_UNCLEAR;
          bumpRetry();
        } else {
          state.confirmedOrigin = norm;
          state.step    = _nextMissingStep(state);
          effectiveStep = state.step;
          stepAdvanced  = true;
        }
      } else {
        effectiveStep = CLARIFY.ORIGIN_UNCLEAR;
        bumpRetry();
      }
      break;
    }

    // ── NEED_DATE ─────────────────────────────────────────────────────────────
    case FLOW_STEP.NEED_DATE: {
      if (extracted.needsMonth) {
        effectiveStep = CLARIFY.DATE_MONTH;
        bumpRetry();
      } else if (extracted.needsYear) {
        effectiveStep = CLARIFY.DATE_YEAR;
        bumpRetry();
      } else if (extracted.isPast) {
        effectiveStep = FLOW_STEP.NEED_DATE;
        bumpRetry();
      } else if (extracted.date) {
        state.confirmedDate = extracted.date;
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        stepAdvanced  = true;
      } else {
        effectiveStep = FLOW_STEP.NEED_DATE;
        bumpRetry();
      }
      break;
    }

    // ── NEED_RETURN_DATE ──────────────────────────────────────────────────────
    case FLOW_STEP.NEED_RETURN_DATE: {
      if (extracted.needsMonth) {
        effectiveStep = CLARIFY.DATE_MONTH; bumpRetry();
      } else if (extracted.needsYear) {
        effectiveStep = CLARIFY.DATE_YEAR; bumpRetry();
      } else if (extracted.isPast || extracted.isBeforeOutbound) {
        effectiveStep = FLOW_STEP.NEED_RETURN_DATE; bumpRetry();
      } else if (extracted.date) {
        state.confirmedReturnDate = extracted.date;
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        stepAdvanced  = true;
      } else {
        effectiveStep = FLOW_STEP.NEED_RETURN_DATE; bumpRetry();
      }
      break;
    }

    // ── NEED_HOTEL_STARS ──────────────────────────────────────────────────────
    case FLOW_STEP.NEED_HOTEL_STARS: {
      if (extracted.anyRating) {
        state.preferredHotelStars = null;
        state.step = effectiveStep = FLOW_STEP.SHOW_RESULTS;
        showHotels = stepAdvanced = true;
      } else if (extracted.stars >= 1 && extracted.stars <= 5) {
        state.preferredHotelStars = extracted.stars;
        state.step = effectiveStep = FLOW_STEP.SHOW_RESULTS;
        showHotels = stepAdvanced = true;
      } else {
        effectiveStep = CLARIFY.STARS_UNCLEAR;
        bumpRetry();
      }
      break;
    }

    // ── NEED_ATTRACT_CAT ─────────────────────────────────────────────────────
    case FLOW_STEP.NEED_ATTRACT_CAT: {
      if (extracted.wantsAll || extracted.categories?.length > 0) {
        state.preferredAttractionCategories = extracted.wantsAll
          ? ['adventure','culture','food','family','nightlife','nature','shopping','religious']
          : extracted.categories;
        state.step = effectiveStep = FLOW_STEP.SHOW_RESULTS;
        showAttractions = stepAdvanced = true;
      } else {
        effectiveStep = CLARIFY.ATTRACT_UNCLEAR;
        bumpRetry();
      }
      break;
    }

    // ── SHOW_RESULTS ──────────────────────────────────────────────────────────
    case FLOW_STEP.SHOW_RESULTS: {
      const intent = extracted.intent || INTENT.OTHER;

      if (intent === INTENT.MODIFY) {
        const field = extracted.modifyField;
        const fieldMap = {
          date:        () => { state.confirmedDate        = null; state.step = FLOW_STEP.NEED_DATE; },
          origin:      () => { state.confirmedOrigin      = null; state.step = FLOW_STEP.NEED_ORIGIN; },
          destination: () => { state.confirmedDestination = null; state.step = FLOW_STEP.NEED_DEST; },
          pax:         () => { state.confirmedPax         = null; state.step = FLOW_STEP.NEED_DATE; }, // re-flow
          cabin:       () => { state.confirmedCabin       = CABIN.ECONOMY; },
          stars:       () => { state.preferredHotelStars  = undefined; state.step = FLOW_STEP.NEED_HOTEL_STARS; },
        };
        // Handle inline modifications from message (e.g. "change date to 25 April")
        if (extracted.rawDate) {
          const nd = normaliseRawDate(extracted.rawDate);
          if (nd) { state.confirmedDate = nd; state.step = FLOW_STEP.SHOW_RESULTS; }
        }
        if (extracted.rawDestination) state.confirmedDestination = normaliseCity(extracted.rawDestination);
        if (extracted.rawOrigin)      state.confirmedOrigin      = normaliseCity(extracted.rawOrigin);
        if (extracted.adults > 0)     state.confirmedPax         = { adults: extracted.adults, children: 0 };
        if (extracted.cabin)          state.confirmedCabin       = extracted.cabin;
        if (field && fieldMap[field]) fieldMap[field]();
        effectiveStep = state.step;
        break;
      }

      if (intent === INTENT.FLIGHT || intent === INTENT.HOTEL || intent === INTENT.ATTRACTION) {
        // New search — preserve RFQ fallback data
        const rfqDest   = state._rfqDestination;
        const rfqOrigin = state._rfqOrigin;
        const rfqDate   = state._rfqDate;
        const rfqPax    = state._rfqPax;
        Object.assign(state, createFlowState());
        state._rfqDestination = rfqDest;
        state._rfqOrigin      = rfqOrigin;
        state._rfqDate        = rfqDate;
        state._rfqPax         = rfqPax;
        state.searchMode      = intent === INTENT.FLIGHT ? 'flight'
                              : intent === INTENT.HOTEL  ? 'hotel' : 'attraction';
        prefillFromExtracted();
        applyRfqFallback();
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
        break;
      }

      if (intent === INTENT.ADD_TO_PLAN) {
        effectiveStep   = FLOW_STEP.SHOW_RESULTS;
        showFlights     = state.searchMode === 'flight';
        showHotels      = state.searchMode === 'hotel';
        showAttractions = state.searchMode === 'attraction';
        break;
      }

      if (intent === INTENT.CANCEL) {
        const rfqDest = state._rfqDestination;
        const rfqOrigin = state._rfqOrigin;
        const rfqDate = state._rfqDate;
        const rfqPax = state._rfqPax;
        Object.assign(state, createFlowState());
        state._rfqDestination = rfqDest;
        state._rfqOrigin = rfqOrigin;
        state._rfqDate = rfqDate;
        state._rfqPax = rfqPax;
        effectiveStep = FLOW_STEP.IDLE;
        break;
      }

      // Default: re-show current results
      showFlights     = state.searchMode === 'flight';
      showHotels      = state.searchMode === 'hotel';
      showAttractions = state.searchMode === 'attraction';
      effectiveStep   = FLOW_STEP.SHOW_RESULTS;
      break;
    }

    // ── DEAD_END ──────────────────────────────────────────────────────────────
    case FLOW_STEP.DEAD_END: {
      const intent = extracted.intent || INTENT.OTHER;
      if ([INTENT.FLIGHT, INTENT.HOTEL, INTENT.ATTRACTION].includes(intent)) {
        const rfqDest = state._rfqDestination;
        const rfqOrigin = state._rfqOrigin;
        const rfqDate = state._rfqDate;
        const rfqPax = state._rfqPax;
        Object.assign(state, createFlowState());
        state._rfqDestination = rfqDest;
        state._rfqOrigin = rfqOrigin;
        state._rfqDate = rfqDate;
        state._rfqPax = rfqPax;
        state.searchMode = intent === INTENT.FLIGHT ? 'flight'
                         : intent === INTENT.HOTEL  ? 'hotel' : 'attraction';
        prefillFromExtracted();
        applyRfqFallback();
        state.step    = _nextMissingStep(state);
        effectiveStep = state.step;
      } else {
        effectiveStep = FLOW_STEP.DEAD_END;
      }
      break;
    }

    default:
      effectiveStep = FLOW_STEP.IDLE;
  }

  // If stepAdvanced landed on SHOW_RESULTS, set show flags
  if (stepAdvanced && state.step === FLOW_STEP.SHOW_RESULTS) {
    showFlights     = state.searchMode === 'flight';
    showHotels      = state.searchMode === 'hotel';
    showAttractions = state.searchMode === 'attraction';
    effectiveStep   = FLOW_STEP.SHOW_RESULTS;
  }

  return { newState: state, effectiveStep, showFlights, showHotels, showAttractions };
}

// ════════════════════════════════════════════════════════════════════════════
//  5. DATA FILTERING
// ════════════════════════════════════════════════════════════════════════════
function cityMatches(a = '', b = '') {
  if (!a || !b) return false;
  const norm = s => s.toLowerCase().trim();
  const aL = norm(a), bL = norm(b);
  return aL === bL || aL.split(/[\s,]+/).includes(bL) || bL.split(/[\s,]+/).includes(aL);
}

function filterFlights(flights, state) {
  const dest   = state.confirmedDestination || '';
  const origin = state.confirmedOrigin      || '';
  const cabin  = state.confirmedCabin       || '';
  if (!dest) return [];
  return flights
    .filter(f => {
      const fDest = [f.destination, f.destinationCity, f.to, f.toAirport].filter(Boolean);
      const fOrig = [f.origin, f.originCity, f.from, f.fromAirport].filter(Boolean);
      const destMatch   = fDest.some(d => cityMatches(d, dest));
      const originMatch = !origin || fOrig.some(o => cityMatches(o, origin));
      const cabinMatch  = !cabin || (f.cabin || '').toLowerCase() === cabin.toLowerCase();
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
//  6. MAIN CHAT FUNCTION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Main entry point for AI Travel Genie chat.
 *
 * @param {object} params
 * @param {string} params.message
 * @param {Array}  params.conversationHistory
 * @param {object} params.flowState
 * @param {object} params.rfqContext           - { availableFlights, availableHotels, availableAttractions, availableRestaurants, numberOfAdults }
 * @param {object} params.rfqPreFill           - { destination, origin, date, adults, children } from RFQ form
 * @param {string} params.itinerary
 */
export async function chatWithItinerary({
  itinerary           = '',
  rfqContext          = {},
  rfqPreFill          = {},   // ← NEW: pre-fill from RFQ form data
  message             = '',
  conversationHistory = [],
  flowState           = createFlowState(),
}) {
  const startTime = Date.now();

  const {
    numberOfAdults       = 1,
    availableFlights     = [],
    availableHotels      = [],
    availableAttractions = [],
    availableRestaurants = [],
  } = rfqContext;

  // Deep-clone to avoid mutation
  let state = JSON.parse(JSON.stringify(flowState));

  // ── Inject RFQ pre-fill into state (used as fallback when user says nothing) ─
  // Only inject at session start (IDLE) or if fields are empty
  if (rfqPreFill.destination)
    state._rfqDestination = normaliseCity(rfqPreFill.destination);
  if (rfqPreFill.origin)
    state._rfqOrigin = normaliseCity(rfqPreFill.origin);
  if (rfqPreFill.date) {
    const nd = normaliseRawDate(rfqPreFill.date);
    if (nd) state._rfqDate = nd;
  }
  if (rfqPreFill.adults > 0)
    state._rfqPax = { adults: rfqPreFill.adults, children: rfqPreFill.children || 0 };

  // ── 1. Extract ─────────────────────────────────────────────────────────────
  const extracted = await extractEntity(state.step, message, conversationHistory);
  // Pass raw message for keyword fallback
  extracted._rawMessage = message;

  // ── 2. Transition ──────────────────────────────────────────────────────────
  const { newState, effectiveStep, showFlights, showHotels, showAttractions } =
    applyTransition(state, extracted);
  state = newState;

  // showRestaurants when searchMode is 'restaurant'
  const showRestaurants = state.step === FLOW_STEP.SHOW_RESULTS && state.searchMode === 'restaurant';

  // ── 3. Filter ──────────────────────────────────────────────────────────────
  const filteredFlights     = showFlights     ? filterFlights(availableFlights, state)           : [];
  const filteredHotels      = showHotels      ? filterHotels(availableHotels, state)             : [];
  const filteredAttractions = showAttractions ? filterAttractions(availableAttractions, state)   : [];
  const filteredRestaurants = showRestaurants ? filterRestaurants(availableRestaurants, state)   : [];

  // ── 4. Reply ───────────────────────────────────────────────────────────────
  const reply = await generateReply({
    state, effectiveStep,
    userMessage:          message,
    availableFlights:     filteredFlights,
    availableHotels:      filteredHotels,
    availableAttractions: filteredAttractions,
    conversationHistory,
    retryCount:           state.retryCount[state.step] || 0,
  });

  // ── 5. Analytics ───────────────────────────────────────────────────────────
  const analytics = {
    currentStep:  state.step,
    effectiveStep,
    searchMode:   state.searchMode,
    confirmedFields: {
      destination: !!state.confirmedDestination,
      origin:      !!state.confirmedOrigin,
      date:        !!state.confirmedDate,
      pax:         !!state.confirmedPax,
      cabin:       !!state.confirmedCabin,
    },
    resultsReturned: {
      flights:     filteredFlights.length,
      hotels:      filteredHotels.length,
      attractions: filteredAttractions.length,
      restaurants: filteredRestaurants.length,
    },
    latencyMs: Date.now() - startTime,
  };

  return {
    reply,
    updatedFlowState: state,
    showFlights,
    showHotels,
    showAttractions,
    showRestaurants,
    flights:     filteredFlights,
    hotels:      filteredHotels,
    attractions: filteredAttractions,
    restaurants: filteredRestaurants,
    analytics,
  };
}

// ════════════════════════════════════════════════════════════════════════════
//  7. HELPERS
// ════════════════════════════════════════════════════════════════════════════

export function createFlowState(overrides = {}) {
  return {
    step:                          FLOW_STEP.IDLE,
    searchMode:                    null,
    confirmedDestination:          null,
    confirmedOrigin:               null,
    confirmedTripType:             null,
    confirmedDate:                 null,
    confirmedReturnDate:           null,
    confirmedPax:                  null,
    confirmedCabin:                null,
    preferredHotelStars:           undefined,
    preferredAttractionCategories: null,
    retryCount:                    {},
    // RFQ pre-fill cache (internal — never shown to user)
    _rfqDestination:               null,
    _rfqOrigin:                    null,
    _rfqDate:                      null,
    _rfqPax:                       null,
    ...overrides,
  };
}

export function appendToHistory(history = [], role, content) {
  return [...history, { role, content }].slice(-MAX_HISTORY);
}

export function resetFlowState() {
  return createFlowState();
}

export function getFlowProgress(state) {
  const fields = ['confirmedDestination','confirmedOrigin','confirmedDate','confirmedPax','confirmedCabin'];
  const filled = fields.filter(k => state[k] != null).length;
  return Math.round((filled / fields.length) * 100);
}