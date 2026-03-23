import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rfqRoutes    from './routes/rfq.js';
import flightRoutes from './routes/flights.js';   // ← YEH ADD KARO

dotenv.config();
console.log('GOOGLE KEY:', process.env.GOOGLE_PLACES_API_KEY?.slice(0, 10));
const app = express();
const PORT = process.env.PORT || 5003;             // ← 5000 se 5003

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/rfqs', rfqRoutes);
app.use('/api',      flightRoutes);               // ← YEH ADD KARO

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });