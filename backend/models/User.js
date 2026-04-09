// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, default: '' },
  role: {
    type: String,
    enum: ['hr', 'manager', 'employee', 'admin'],
    default: 'employee',
  },
  managerId: { type: String, default: null },
  companyId: { type: String, default: '' },


 // --- New Profile Fields ---
  profile: {
    // Personal & Identity
    gender: { type: String, default: '' },
    phone: { type: String, default: '' },
    passportNo: { type: String, default: '' },
    passportExpiry: { type: String, default: '' },
    nationality: { type: String, default: 'Indian' },
    dob: { type: String, default: '' },
    
    // Travel Preferences
    flightClass: { type: String, default: 'Economy' },
    seatPreference: { type: String, default: 'Window' },
    mealPreference: { type: String, default: 'Vegetarian' },
    flightKeywords: { type: String, default: '' },
    hotelType: { type: String, default: 'Standard' },
    roomType: { type: String, default: 'Non-Smoking' },
    hotelOtherPrefs: { type: String, default: '' },
    carRental: { type: String, default: 'No Preference' },
    knownTravelerNo: { type: String, default: '' },
    frequentFlyer: { type: String, default: '' },
    hotelLoyalty: { type: String, default: '' },

    // Emergency
    emergencyName: { type: String, default: '' },
    emergencyPhone: { type: String, default: '' },

    // Business (Default Profile)
    employeeId: { type: String, default: '' },
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    reportingManager: { type: String, default: '' },
    costCenter: { type: String, default: '' },
    annualBudget: { type: Number, default: 0 },
    perTripLimit: { type: Number, default: 0 },
  },


  // ── Daily Chat Token Limit ─────────────────────────────
  chatTokens: {
    used:      { type: Number, default: 0 },
    lastReset: { type: Date,   default: Date.now }, // jis din reset hua
  },
  // ──────────────────────────────────────────────────────

}, { timestamps: true });

export default mongoose.model('User', userSchema);