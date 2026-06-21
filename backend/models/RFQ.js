// models/RFQ.js
import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  adults:          { type: Number, default: 1 },
  childrenWithBed: { type: Number, default: 0 },
  childrenNoBed:   { type: Number, default: 0 },
});

const destinationSchema = new mongoose.Schema({
  destination:    { type: String, required: true },
  dateOfArrival:  { type: String, required: true },
  numberOfNights: { type: Number, default: 1 },
});

// ── Flight shape ──────────────────────────────────────────────────────────
const flightSchema = new mongoose.Schema({
  airline:      String,
  flightNumber: String,
  from:         String,
  fromAirport:  String,
  fromTerminal: String,
  to:           String,
  toAirport:    String,
  depTime:      String,
  arrTime:      String,
  nextDay:      Boolean,
  duration:     String,
  stops:        Number,
  stopCodes:    String,
  price:        String,
  currency:     String,
}, { _id: false });

// ── Hotel shape ───────────────────────────────────────────────────────────
const hotelSchema = new mongoose.Schema({
  hotelId:     String,
  name:        String,
  cityName:    String,
  stars:       Number,
  address:     String,
  lat:         Number,
  lng:         Number,
  image:       String,
  rating:      Number,
  ratingCount: Number,
  price:       String,
  currency:    String,
  roomType:    String,
  available:   Boolean,
}, { _id: false });

// ── Attraction shape ──────────────────────────────────────────────────────
const attractionSchema = new mongoose.Schema({
  attractionId: String,
  name:         String,
  cityName:     String,
  category:     String,
  address:      String,
  lat:          Number,
  lng:          Number,
  image:        String,
  rating:       Number,
  ratingCount:  Number,
  openingHours: String,
  website:      String,
  description:  String,
  entryFee:     String,
  available:    Boolean,
}, { _id: false });

// ── Restaurant shape ──────────────────────────────────────────────────────
const restaurantSchema = new mongoose.Schema({
  restaurantId: String,
  name:         String,
  cityName:     String,
  cuisine:      String,
  address:      String,
  lat:          Number,
  lng:          Number,
  image:        String,
  rating:       Number,
  ratingCount:  Number,
  priceLevel:   String,
  openingHours: String,
  website:      String,
  phone:        String,
  description:  String,
  available:    Boolean,
}, { _id: false });

// ── Weather forecast day shape ────────────────────────────────────────────
const weatherDaySchema = new mongoose.Schema({
  date:        String,
  dayName:     String,
  displayDate: String,
  dayLabel:    String,
  condition:   String,
  emoji:       String,
  temp:        Number,
  tempMin:     Number,
  tempMax:     Number,
  humidity:    Number,
  windSpeed:   Number,
  isReal:      Boolean,
}, { _id: false });

const weatherSchema = new mongoose.Schema({
  city:               String,
  forecasts:          [weatherDaySchema],
  packingSuggestions: [String],
  summary:            String,
  isPlaceholder:      Boolean,
}, { _id: false });

// ── Checklist item shape ──────────────────────────────────────────────────
const checklistItemSchema = new mongoose.Schema({
  id:          String,
  label:       String,
  description: String,
  priority:    String,
  checked:     { type: Boolean, default: false },
  tag:         String,
}, { _id: false });

const checklistCategorySchema = new mongoose.Schema({
  category: String,
  emoji:    String,
  items:    [checklistItemSchema],
}, { _id: false });

// ── Per-destination bundle ────────────────────────────────────────────────
const destDataSchema = new mongoose.Schema({
  destination:  String,
  flights:      [flightSchema],
  hotels:       [hotelSchema],
  attractions:  [attractionSchema],
  restaurants:  [restaurantSchema],
}, { _id: false });

// ── Main RFQ schema ───────────────────────────────────────────────────────
const rfqSchema = new mongoose.Schema(
  {
    rfqId: { type: String, default: '' },
    tripName: { type: String, default: '' },
    budget:   { type: Number, default: 0  },
    destinations: [destinationSchema],

    requireHotels: { type: Boolean, default: false },

    // When hotels = YES
    numberOfRooms: { type: Number, default: 1 },
    rooms:         [roomSchema],
    hotelRatings:  [{ type: Number }],

    // When hotels = NO
    numberOfAdults:   { type: Number, default: 1 },
    numberOfChildren: { type: Number, default: 0 },

    guestCountry: { type: String, default: '' },

    // AI generated
    itinerary:       { type: String, default: '' },
    travelType:      { type: String, default: '' },
    modeOfTransport: { type: String, default: '' },

    // Per destination: flights + hotels + attractions + restaurants
    destinationData: [destDataSchema],

    // Global weather (for main destination)
    weather: { type: weatherSchema, default: null },

    // Checklist (generated once per trip)
    checklist: [checklistCategorySchema],

    // Checklist stats
    checklistStats: {
      total:        { type: Number, default: 0 },
      completed:    { type: Number, default: 0 },
      highPriority: { type: Number, default: 0 },
    },

    reviewStatus:     { type: String, default: 'draft' }, // draft | sent | approved | rejected
    reviewSentAt:     { type: String, default: '' },
    reviewApprovedAt: { type: String, default: '' },
    reviewPayload:    { type: mongoose.Schema.Types.Mixed, default: null },
    planItems:        { type: [mongoose.Schema.Types.Mixed], default: [] },
    tripType:         { type: String, enum: ['business', 'personal'], default: 'personal' },
    
    // Collaboration
    collaborators: [{
      uid: { type: String },
      email: { type: String },
      name: { type: String },
      role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
      joinedAt: { type: Date, default: Date.now }
    }],
    inviteCode: { type: String, unique: true, sparse: true },
    chatMessages: [{
      senderId:   { type: String },
      senderName: { type: String },
      text:       { type: String },
      time:       { type: String },
      timestamp:  { type: Date, default: Date.now }
    }],

    createdBy:  { type: String, default: '' },
    assignedTo: { type: String, default: '' },
    companyId:  { type: String, default: '' },

    // Merged Trips
    isMerged:   { type: Boolean, default: false },
    mergedFrom: { type: [String], default: [] },

    // Visa info
    visaInfo: {
      required: { type: Boolean },
      visaType: { type: String },
      label:    { type: String },
    },
  },
  { timestamps: true }
);

export default mongoose.model('RFQ', rfqSchema);