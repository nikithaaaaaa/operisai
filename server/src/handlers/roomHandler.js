import { redis } from '../services/redis.js';
import { getRoomState, hydrateFromRedis } from '../services/yjsPersistence.js';

// ── Validation helpers ────────────────────────────────────────────────────
const isValidRoomId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
const isValidString = (s, maxLen = 200) => typeof s === 'string' && s.length > 0 && s.length <= maxLen;

export function registerRoomHandlers(io, socket) {
  socket.on('room:join', async ({ roomId, user }) => {
    if (!isValidRoomId(roomId)) return;
    if (!isValidString(user?.name, 50)) return;
    if (!isValidString(user?.id, 64)) return;

    socket.join(roomId);
    console.log(`[Room] ${user.name} joined room ${roomId}`);

    socket.data.user    = user;
    socket.data.roomId  = roomId;
    socket.data.userId  = user.id;
    socket.data.userName = user.name;
    socket.data.userColor = user.color;

    // TASK-A1: Hydrate server-side Y.Doc from Redis (no-op if already in memory)
    await hydrateFromRedis(roomId, redis);

    // Send persisted Yjs state to the joining user so they converge to the
    // last known document state even if all previous users had disconnected.
    const state = await getRoomState(roomId, redis);
    if (state) {
      socket.emit('room:state:sync', { state });
      console.log(`[Room] Sent persisted state to ${user.name} in room ${roomId}`);
    }

    // Notify room of new user list
    const sockets = await io.in(roomId).fetchSockets();
    const activeUsers = sockets.map(s => s.data.user ? { ...s.data.user, socketId: s.id } : null).filter(Boolean);
    io.to(roomId).emit('room:users', activeUsers);
  });

  socket.on('disconnect', async () => {
    const { roomId } = socket.data;
    if (roomId) {
      const sockets = await io.in(roomId).fetchSockets();
      const activeUsers = sockets.map(s => s.data.user ? { ...s.data.user, socketId: s.id } : null).filter(Boolean);
      io.to(roomId).emit('room:users', activeUsers);
    }
  });
}
