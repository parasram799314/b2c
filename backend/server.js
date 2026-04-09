import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rfqRoutes from './routes/rfq.js';
import flightRoutes from './routes/flights.js';
import budgetApprovalRoutes from './routes/budgetApprovals.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';

dotenv.config();
console.log('GOOGLE KEY:', process.env.GOOGLE_PLACES_API_KEY?.slice(0, 10));
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Specific API Routes First ──────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/budget-approvals', budgetApprovalRoutes);

// ── General Flight API ─────────────────────────────────────────────────────
// Mounted at /api so /api/search and /api/prices still work
app.use('/api', flightRoutes);

app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  if (connected) {
    return res.json({ status: 'ok', mongo: 'connected' });
  }
  return res.status(503).json({
    status: 'degraded',
    mongo: 'disconnected',
    hint: 'Set MONGO_URI in backend/.env and ensure MongoDB is running.',
  });
});

// 404 Debug Handler
app.use((req, res) => {
  console.log(`[404] Missing Route: ${req.method} ${req.url}`);
  res.status(404).json({ 
    success: false, 
    message: `Backend route not found: ${req.method} ${req.url}. Check server.js mounting.` 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

if (!process.env.MONGO_URI) {
  console.warn('⚠️  MONGO_URI missing — copy backend/.env.example → backend/.env');
}

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rfq_db')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB:', err.message);
    console.error('   Fix MONGO_URI in backend/.env — /api/* DB calls tab tak fail ho sakte hain.');
  });
