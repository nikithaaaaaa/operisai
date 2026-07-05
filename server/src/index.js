import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: true,
  credentials: true,
}));
// Limit request body to 100 KB to prevent oversized payload attacks
app.use(express.json({ limit: '100kb' }));

// Rate limit the AI endpoint — 10 requests per IP per minute
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests. Please wait a moment and try again.' },
});

const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ── Import handlers and services ──────────────────────────────────────────
import { registerRoomHandlers } from './handlers/roomHandler.js';
import { registerSignalingHandlers } from './handlers/signalingHandler.js';
import { registerChatHandlers } from './handlers/chatHandler.js';
import { aiRouter } from './services/aiProxy.js';
import historyRouter from './handlers/historyHandler.js';

// ── REST API routes ───────────────────────────────────────────────────────
app.use('/api/ai', aiLimiter, aiRouter);
app.use('/api/history', historyRouter);

// ── Socket.io connection ──────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.id}`);

  registerRoomHandlers(io, socket);
  registerSignalingHandlers(io, socket);
  registerChatHandlers(io, socket);

  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
