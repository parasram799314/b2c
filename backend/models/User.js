// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String, default: '' },
  role: {
    type: String,
    enum: ['hr', 'manager', 'employee'],
    default: 'employee',
  },
  managerId: { type: String, default: null },
  companyId: { type: String, default: '' },

  // ── Daily Chat Token Limit ─────────────────────────────
  chatTokens: {
    used:      { type: Number, default: 0 },
    lastReset: { type: Date,   default: Date.now }, // jis din reset hua
  },
  // ──────────────────────────────────────────────────────

}, { timestamps: true });

export default mongoose.model('User', userSchema);