/**
 * yjsPersistence.js — TASK-A1: Server-side Yjs document persistence
 *
 * Maintains one in-memory Y.Doc per active room, applies incoming updates to it,
 * and persists the full document state to Redis (base64-encoded binary).
 *
 * On join, the persisted state is sent to the joining client via room:state:sync.
 * The client applies it to its local Y.Doc, converging to the last known state
 * even if all previous users had already disconnected.
 *
 * Redis key: room:state:<roomId>  — TTL: 7 days (604800 seconds)
 */

import * as Y from 'yjs';

// In-memory per-room Y.Docs (lives as long as the server process)
const roomDocs = new Map();

/**
 * Apply a Yjs binary update to the server-side Y.Doc and persist to Redis.
 *
 * @param {string} roomId
 * @param {Uint8Array} updateBytes   — raw Yjs binary update
 * @param {object} redis             — the redis abstraction from services/redis.js
 */
export async function applyAndPersistUpdate(roomId, updateBytes, redis) {
  if (!roomDocs.has(roomId)) {
    roomDocs.set(roomId, new Y.Doc());
  }
  const doc = roomDocs.get(roomId);

  try {
    Y.applyUpdate(doc, updateBytes);
    const stateUpdate = Y.encodeStateAsUpdate(doc);
    const encoded = Buffer.from(stateUpdate).toString('base64');
    // TTL 7 days — rooms that haven't been touched in a week are cleaned up
    await redis.set(`room:state:${roomId}`, encoded, 'EX', 604800);
  } catch (err) {
    console.error(`[yjsPersistence] Failed to apply/persist update for room ${roomId}:`, err);
  }
}

/**
 * Retrieve the persisted Yjs state for a room.
 * Returns a base64-encoded string (ready to send over JSON) or null.
 *
 * @param {string} roomId
 * @param {object} redis
 * @returns {Promise<string|null>}
 */
export async function getRoomState(roomId, redis) {
  try {
    return await redis.get(`room:state:${roomId}`);
  } catch (err) {
    console.error(`[yjsPersistence] Failed to get state for room ${roomId}:`, err);
    return null;
  }
}

/**
 * Seed the in-memory doc from Redis on first access (after server restart).
 *
 * @param {string} roomId
 * @param {object} redis
 */
export async function hydrateFromRedis(roomId, redis) {
  if (roomDocs.has(roomId)) return; // already hydrated
  const raw = await getRoomState(roomId, redis);
  if (!raw) return;
  const doc = new Y.Doc();
  try {
    Y.applyUpdate(doc, new Uint8Array(Buffer.from(raw, 'base64')));
    roomDocs.set(roomId, doc);
  } catch (err) {
    console.error(`[yjsPersistence] Failed to hydrate room ${roomId}:`, err);
  }
}
