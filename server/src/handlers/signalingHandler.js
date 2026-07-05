import { applyAndPersistUpdate } from '../services/yjsPersistence.js';
import { redis } from '../services/redis.js';

// ── Validation helpers ────────────────────────────────────────────────────
const isValidRoomId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
const isValidSocketId = (id) => typeof id === 'string' && id.length > 0 && id.length <= 128;

export function registerSignalingHandlers(io, socket) {
  // WebRTC Signaling
  socket.on('rtc:offer', ({ offer, target, roomId }) => {
    if (!isValidSocketId(target) || !isValidRoomId(roomId) || !offer) return;
    socket.to(target).emit('rtc:offer', { offer, sender: socket.id });
  });

  socket.on('rtc:answer', ({ answer, target, roomId }) => {
    if (!isValidSocketId(target) || !isValidRoomId(roomId) || !answer) return;
    socket.to(target).emit('rtc:answer', { answer, sender: socket.id });
  });

  socket.on('rtc:ice', ({ candidate, target, roomId }) => {
    if (!isValidSocketId(target) || !isValidRoomId(roomId) || !candidate) return;
    socket.to(target).emit('rtc:ice', { candidate, sender: socket.id });
  });

  // Fallback Relay (Yjs Sync)
  // The transport always uses the 'yjs:update' socket event for both document
  // and awareness updates, discriminating by payload.channel ('yjs:update' or
  // 'yjs:awareness'). We relay it and persist document updates server-side.
  socket.on('yjs:update', async ({ update, roomId }) => {
    if (!isValidRoomId(roomId) || !update) return;

    // Broadcast to all other peers in the room
    socket.to(roomId).emit('yjs:update', { update, sender: socket.id });

    // TASK-A1: Persist document updates (skip awareness-only payloads)
    if (update?.channel === 'yjs:update' && Array.isArray(update?.data?.update)) {
      try {
        const bytes = new Uint8Array(update.data.update);
        await applyAndPersistUpdate(roomId, bytes, redis);
      } catch (err) {
        console.error('[Signaling] Yjs persistence error:', err);
      }
    }
  });

  // Language sync
  socket.on('room:language:change', ({ language, roomId }) => {
    if (!isValidRoomId(roomId) || typeof language !== 'string' || language.length > 32) return;
    socket.to(roomId).emit('room:language:change', { language, sender: socket.id });
  });
}
