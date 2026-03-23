// services/groqService.js
import Groq from 'groq-sdk';

let _groq = null;
const getGroq = () => {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
};

export async function generateItinerary(rfqData) {
  const {
    destinations,
    requireHotels,
    rooms,
    numberOfRooms,
    hotelRatings,
    numberOfAdults,
    numberOfChildren,
    guestCountry,
  } = rfqData;

  const destSummary = destinations
    .map((d, i) =>
      `Destination ${i + 1}: ${d.destination}, arriving ${d.dateOfArrival}, staying ${d.numberOfNights} night(s)`
    )
    .join('\n');

  const guestInfo = requireHotels
    ? `Hotel rooms: ${numberOfRooms}, preferred ratings: ${hotelRatings?.join(', ') || 'any'} stars
Rooms: ${rooms?.map((r, i) =>
        `Room ${i + 1}: ${r.adults} adult(s), ${r.childrenWithBed} child(ren) with bed, ${r.childrenNoBed} child(ren) no bed`
      ).join(' | ')}`
    : `No hotel required. Adults: ${numberOfAdults}, Children: ${numberOfChildren}`;

  const totalNights = destinations.reduce((s, d) => s + (d.numberOfNights || 1), 0);
  const mainDest    = destinations[0]?.destination || 'destination';

  const prompt = `You are an expert travel planner. Create a detailed day-by-day itinerary based on this travel request.

TRIP DETAILS:
${destSummary}

GUEST INFO:
Guest Country / Origin: ${guestCountry || 'India'}
${guestInfo}
Total trip duration: ${totalNights + 1} days, ${totalNights} nights

FORMAT YOUR RESPONSE EXACTLY LIKE THIS:

## Travel Type: [leisure/family/adventure/honeymoon/business/cultural]
## Recommended Transport: [flight/train/car — mention 9AM reachability from ${guestCountry || 'India'}]

## Day 1 · Journey from ${guestCountry || 'India'} to ${mainDest}
[Travel day details — flight timing, airport, arrival, check-in, evening plan]

## Day 2 · [Title describing main attractions/theme]
Morning:
1. **Attraction Name** - description, opening hours, tips, entry fee if any
2. **Attraction Name** - description

Afternoon:
3. **Attraction Name** - description
4. **Lunch Spot** - restaurant suggestion with cuisine type

Evening:
5. **Attraction or Activity** - description
6. **Dinner Recommendation** - restaurant name, cuisine, price range (£/££/£££)

[Continue same format for all days...]

## Day ${totalNights + 1} · Departure Day
[Checkout time, last minute activities, airport transfer, departure tips]

## Practical Tips:
- Visa: [requirement for ${guestCountry || 'India'} passport holders visiting ${mainDest}]
- Best time to visit: [season/month recommendation]
- Local transport: [metro/cab/bus tips for getting around]
- Currency: [local currency, exchange tips, ATM availability]  
- Language: [local language, useful phrases]
- Emergency numbers: [local police, ambulance, tourist helpline]
- Food safety: [tap water, street food advice]
- Cultural tips: [dress code, customs, etiquette]
- Packing essentials: [weather-specific items, must-carry]

Make each day VERY detailed with real place names, actual opening hours where known, honest entry fees, and practical insider tips. Include morning/afternoon/evening breakdown for every day. Suggest specific restaurants with cuisine types and approximate price ranges.`;

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model:       'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens:  4000,
  });

  const content      = completion.choices[0]?.message?.content || '';
  const travelType   = content.match(/## Travel Type:\s*(.+)/i)?.[1]?.trim()        || 'General';
  const modeOfTransport = content.match(/## Recommended Transport:\s*(.+)/i)?.[1]?.trim() || 'Flight';

  return { itinerary: content, travelType, modeOfTransport };
}

export async function chatWithItinerary({ itinerary, destinations, message }) {
  const destNames = destinations?.map(d => d.destination).filter(Boolean).join(', ') || 'the destination';

  const prompt = `You are a helpful and friendly travel assistant for a trip to ${destNames}.

CURRENT ITINERARY SUMMARY:
${itinerary?.slice(0, 2500) || 'No itinerary available yet'}

USER MESSAGE: "${message}"

INSTRUCTIONS:
- Answer helpfully and concisely (under 200 words)
- If the user asks about flights, hotels, restaurants, or attractions → recommend options and say they can tap Add to add to their plan
- If the user asks about visa/documents → mention the Checklist tab
- If the user asks about weather/packing → mention the Weather tab
- If the user asks about transport/cab → mention the Transport tab
- If suggesting specific places, use real names
- Be conversational and friendly
- If you don't know something specific, say so honestly`;

  const completion = await getGroq().chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model:       'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens:  500,
  });

  return completion.choices[0]?.message?.content || 'Sorry, I could not process that.';
}