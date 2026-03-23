// services/checklistService.js
// Pure logic — no API needed
// Generates travel checklist based on origin + destination country

// ─── Countries that need visa from India ─────────────────────────────────
const VISA_REQUIRED_FROM_INDIA = [
  'united states', 'usa', 'united kingdom', 'uk', 'canada', 'australia',
  'new zealand', 'germany', 'france', 'italy', 'spain', 'netherlands',
  'switzerland', 'austria', 'belgium', 'sweden', 'norway', 'denmark',
  'finland', 'portugal', 'greece', 'czech republic', 'poland', 'hungary',
  'russia', 'china', 'japan', 'south korea', 'saudi arabia', 'uae',
  'dubai', 'qatar', 'kuwait', 'bahrain', 'oman', 'egypt', 'south africa',
  'brazil', 'argentina', 'mexico', 'turkey', 'iran', 'iraq',
];

// ─── Visa on arrival countries for India ────────────────────────────────
const VISA_ON_ARRIVAL_FROM_INDIA = [
  'thailand', 'indonesia', 'bali', 'cambodia', 'laos', 'myanmar',
  'maldives', 'mauritius', 'seychelles', 'fiji', 'kenya', 'ethiopia',
  'zimbabwe', 'tanzania', 'mozambique', 'madagascar', 'cape verde',
  'jordan', 'bahrain',
];

// ─── Visa free countries for India ──────────────────────────────────────
const VISA_FREE_FROM_INDIA = [
  'nepal', 'bhutan', 'sri lanka', 'malaysia', 'vietnam', 'hong kong',
  'macau', 'ecuador', 'el salvador', 'micronesia', 'niue',
  'trinidad and tobago', 'vanuatu',
];

// ─── Get visa requirement ────────────────────────────────────────────────
function getVisaInfo(guestCountry = 'India', destinationCountry = '') {
  const origin = guestCountry.toLowerCase().trim();
  const dest = destinationCountry.toLowerCase().trim();

  // Same country
  if (origin === dest) return { required: false, type: 'domestic', label: 'Domestic travel — no visa needed' };

  // Check from India rules
  if (origin.includes('india')) {
    if (VISA_FREE_FROM_INDIA.some(c => dest.includes(c))) {
      return { required: false, type: 'visa_free', label: 'Visa free for Indian passport holders' };
    }
    if (VISA_ON_ARRIVAL_FROM_INDIA.some(c => dest.includes(c))) {
      return { required: true, type: 'visa_on_arrival', label: 'Visa on arrival available — apply at airport' };
    }
    if (VISA_REQUIRED_FROM_INDIA.some(c => dest.includes(c))) {
      return { required: true, type: 'visa_required', label: 'Visa required — apply in advance' };
    }
  }

  // Default — assume visa required
  return { required: true, type: 'visa_required', label: 'Check visa requirements for your nationality' };
}

// ─── Build checklist ─────────────────────────────────────────────────────
export function buildChecklist({ guestCountry = 'India', destinations = [], requireHotels = false }) {
  const destNames = destinations.map(d => d.destination).filter(Boolean);
  const mainDest = destNames[0] || '';
  const visaInfo = getVisaInfo(guestCountry, mainDest);

  const checklist = [
    // ── DOCUMENTS ──────────────────────────────────────────────────
    {
      category: 'Documents',
      emoji: '📄',
      items: [
        {
          id: 'passport',
          label: 'Passport valid (6+ months)',
          description: 'Check expiry — must be valid for at least 6 months from travel date',
          priority: 'high',
          checked: false,
        },
        {
          id: 'visa',
          label: visaInfo.type === 'domestic'
            ? 'Domestic ID / Aadhar Card'
            : visaInfo.type === 'visa_free'
            ? `Visa — Not required ✅ (${visaInfo.label})`
            : visaInfo.type === 'visa_on_arrival'
            ? `Visa on arrival — Confirm details before travel`
            : `Visa for ${mainDest} — Apply in advance`,
          description: visaInfo.label,
          priority: visaInfo.required ? 'high' : 'low',
          checked: visaInfo.type === 'visa_free' || visaInfo.type === 'domestic',
          tag: visaInfo.type === 'visa_free' ? 'not_required'
            : visaInfo.type === 'visa_on_arrival' ? 'on_arrival'
            : visaInfo.type === 'domestic' ? 'not_required'
            : 'required',
        },
        {
          id: 'travel_insurance',
          label: 'Travel Insurance',
          description: 'Covers medical emergencies, trip cancellation, lost baggage',
          priority: 'high',
          checked: false,
        },
        {
          id: 'photocopies',
          label: 'Photocopies / Digital copies of documents',
          description: 'Keep copies of passport, visa, insurance in email/cloud',
          priority: 'medium',
          checked: false,
        },
      ],
    },

    // ── BOOKINGS ────────────────────────────────────────────────────
    {
      category: 'Bookings',
      emoji: '🎫',
      items: [
        {
          id: 'flight_booked',
          label: 'Flight tickets confirmed',
          description: 'Download e-tickets and save offline',
          priority: 'high',
          checked: false,
        },
        requireHotels && {
          id: 'hotel_booked',
          label: 'Hotel booking confirmed',
          description: 'Save confirmation number and hotel address',
          priority: 'high',
          checked: false,
        },
        {
          id: 'airport_transfer',
          label: 'Airport transfer arranged',
          description: 'Cab / taxi booked for airport pickup and drop',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'attraction_tickets',
          label: 'Pre-book attraction tickets',
          description: 'Popular attractions sell out — book online in advance',
          priority: 'medium',
          checked: false,
        },
      ].filter(Boolean),
    },

    // ── MONEY ───────────────────────────────────────────────────────
    {
      category: 'Money & Finance',
      emoji: '💰',
      items: [
        {
          id: 'foreign_exchange',
          label: 'Foreign currency exchanged',
          description: `Get local currency for ${mainDest} — keep some cash for small purchases`,
          priority: 'high',
          checked: false,
        },
        {
          id: 'forex_card',
          label: 'Forex card / International debit card',
          description: 'Activate international transactions on your card',
          priority: 'high',
          checked: false,
        },
        {
          id: 'bank_notified',
          label: 'Bank notified about travel',
          description: 'Inform your bank to avoid card being blocked abroad',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'emergency_funds',
          label: 'Emergency fund kept separately',
          description: 'Keep extra cash/card separate from main wallet',
          priority: 'medium',
          checked: false,
        },
      ],
    },

    // ── HEALTH ──────────────────────────────────────────────────────
    {
      category: 'Health & Safety',
      emoji: '🏥',
      items: [
        {
          id: 'medicines',
          label: 'Personal medicines packed',
          description: 'Carry prescription + extra supply for trip duration',
          priority: 'high',
          checked: false,
        },
        {
          id: 'first_aid',
          label: 'Basic first aid kit',
          description: 'Band-aids, pain relievers, antacids, anti-diarrhea medicine',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'vaccinations',
          label: 'Check vaccination requirements',
          description: `Some countries require specific vaccines — check for ${mainDest}`,
          priority: 'medium',
          checked: false,
        },
        {
          id: 'emergency_contacts',
          label: 'Emergency contacts noted',
          description: 'Embassy number, local emergency number, insurance helpline',
          priority: 'medium',
          checked: false,
        },
      ],
    },

    // ── TECH & CONNECTIVITY ─────────────────────────────────────────
    {
      category: 'Tech & Connectivity',
      emoji: '📱',
      items: [
        {
          id: 'sim_card',
          label: 'International SIM / Roaming activated',
          description: `Get local SIM in ${mainDest} or activate international roaming`,
          priority: 'high',
          checked: false,
        },
        {
          id: 'power_adapter',
          label: 'Universal power adapter',
          description: 'Check plug type for destination country',
          priority: 'high',
          checked: false,
        },
        {
          id: 'power_bank',
          label: 'Power bank (max 20,000 mAh for flights)',
          description: 'Most airlines allow max 100Wh / 20,000 mAh in cabin',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'offline_maps',
          label: 'Offline maps downloaded',
          description: 'Download Google Maps offline for destination',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'translation_app',
          label: 'Translation app downloaded',
          description: 'Google Translate with offline language pack',
          priority: 'low',
          checked: false,
        },
      ],
    },

    // ── PACKING ─────────────────────────────────────────────────────
    {
      category: 'Packing',
      emoji: '🧳',
      items: [
        {
          id: 'luggage_check',
          label: 'Luggage within airline limits',
          description: 'Check cabin bag (7kg) and check-in bag limits for your airline',
          priority: 'high',
          checked: false,
        },
        {
          id: 'liquids_rule',
          label: 'Liquids rule followed (100ml in cabin)',
          description: 'All liquids in 100ml containers, in 1L clear zip-lock bag',
          priority: 'high',
          checked: false,
        },
        {
          id: 'valuables',
          label: 'Valuables in cabin bag',
          description: 'Laptop, camera, medicines — always carry in cabin, not check-in',
          priority: 'medium',
          checked: false,
        },
        {
          id: 'clothes_packed',
          label: 'Clothes packed (weather appropriate)',
          description: 'Check weather forecast and pack accordingly',
          priority: 'medium',
          checked: false,
        },
      ],
    },
  ];

  // Calculate total items and completion stats
  const allItems = checklist.flatMap(c => c.items);
  const total = allItems.length;
  const completed = allItems.filter(i => i.checked).length;
  const highPriority = allItems.filter(i => i.priority === 'high' && !i.checked).length;

  return {
    checklist,
    stats: { total, completed, highPriority },
    visaInfo,
    destination: mainDest,
    guestCountry,
  };
}