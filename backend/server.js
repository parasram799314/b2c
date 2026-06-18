import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rfqRoutes from './routes/rfq.js';
import flightRoutes from './routes/flights.js';
import budgetApprovalRoutes from './routes/budgetApprovals.js';
import adminRoutes from './routes/admin.js';
import userRoutes from './routes/users.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Pass IO instance to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request Logger
app.use((req, res, next) => {
  console.log(`[Incoming] ${req.method} ${req.url}`);
  next();
});

// Socket.io Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);
  
  socket.on('join_trip', (tripId) => {
    socket.join(tripId);
    console.log(`[Socket] User ${socket.id} joined trip: ${tripId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

// ── Specific API Routes First ──────────────────────────────────────────────
app.use('/api/users', userRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/budget-approvals', budgetApprovalRoutes);

// ── General Flight API ─────────────────────────────────────────────────────
app.use('/api', flightRoutes);

app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  if (connected) {
    return res.json({ status: 'ok', mongo: 'connected' });
  }
  return res.status(503).json({
    status: 'degraded',
    mongo: 'disconnected',
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rfq_db')
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB:', err.message));