import crypto from 'crypto';
import { redis } from '../services/redis.js';

const CHAT_KEY   = (r) => `chat:${r}`;
const isValidId  = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
const isValidStr = (s, max = 2000) => typeof s === 'string' && s.length > 0 && s.length <= max;

export function registerChatHandlers(io, socket) {

  // ── Send chat history when user joins a room ─────────────────────────────
  socket.on('room:join', async ({ roomId }) => {
    if (!isValidId(roomId)) return;
    try {
      const raw = await redis.lrange(CHAT_KEY(roomId), 0, 99);
      // lrange returns newest-first (lpush), so reverse to get chronological order
      const history = raw.map(r => {
        try { return JSON.parse(r); } catch { return null; }
      }).filter(Boolean).reverse();
      socket.emit('chat:history', history);
    } catch (e) {
      console.warn('[chat] Failed to load history:', e.message);
      socket.emit('chat:history', []);
    }
  });

  // ── Receive and broadcast a chat message ─────────────────────────────────
  socket.on('chat:message', async ({ message, roomId }) => {
    if (!isValidId(roomId)) return;
    if (!message || !isValidStr(message.text)) return;

    const entry = {
      id:        message.id || crypto.randomUUID(),
      userId:    socket.data?.userId    || message.userId || socket.id,
      userName:  socket.data?.userName  || message.sender || 'Anonymous',
      userColor: socket.data?.userColor || message.color  || 'var(--cs-accent)',
      sender:    message.sender,   // preserve for ChatPanel compatibility
      color:     message.color,
      text:      message.text.trim(),
      time:      message.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: message.timestamp || Date.now(),
    };

    // Persist to Redis
    try {
      await redis.lpush(CHAT_KEY(roomId), JSON.stringify(entry));
      await redis.ltrim(CHAT_KEY(roomId), 0, 99);   // keep last 100 messages
      await redis.expire(CHAT_KEY(roomId), 86400 * 7); // 7-day TTL
    } catch (e) {
      console.warn('[chat] Redis persist failed:', e.message);
    }

    // Broadcast to everyone else in the room
    socket.to(roomId).emit('chat:message', entry);
  });

  // ── Typing indicator ──────────────────────────────────────────────────────
  socket.on('chat:typing', ({ isTyping, user, roomId }) => {
    if (!isValidId(roomId)) return;
    if (typeof isTyping !== 'boolean') return;
    socket.to(roomId).emit('chat:typing', { isTyping, user });
  });

  // ── Emoji reactions ───────────────────────────────────────────────────────
  socket.on('chat:react', ({ roomId, messageId, emoji }) => {
    if (!isValidId(roomId)) return;
    if (typeof messageId !== 'string' || typeof emoji !== 'string') return;
    io.to(roomId).emit('chat:reaction', {
      messageId,
      emoji,
      userId: socket.data?.userId || socket.id,
    });
  });
}
