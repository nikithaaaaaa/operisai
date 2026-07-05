import { Router } from 'express';
import { redis } from '../services/redis.js';
import { v4 as uuidv4 } from 'uuid';

const historyRouter = Router();

// ── Validation helpers ────────────────────────────────────────────────────
const isValidRoomId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
const isValidSnapshotId = (id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(id);
const MAX_CONTENT_BYTES = 100 * 1024; // 100 KB

// Save snapshot
historyRouter.post('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidRoomId(roomId)) return res.status(400).json({ error: 'Invalid roomId' });

    const { content, language, authorUsername, authorColor } = req.body;

    if (content && Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
      return res.status(413).json({ error: 'Content too large (max 100 KB)' });
    }

    const snapshot = {
      id: `v_${uuidv4().substring(0, 6)}`,
      timestamp: new Date().toISOString(),
      author: (typeof authorUsername === 'string' && authorUsername.slice(0, 50)) || 'Unknown',
      color: authorColor || '#7c3aed',
      language: (typeof language === 'string' && language.slice(0, 32)) || 'javascript', // ← TASK-Q3: persist language
      lines: content ? content.split('\n').length : 0,
      code: content || ''
    };

    const key = `room:${roomId}:history`;
    let historyStr = await redis.get(key);
    let history = historyStr ? JSON.parse(historyStr) : [];
    
    history.unshift(snapshot);

    // Keep max 20 snapshots
    if (history.length > 20) {
      history = history.slice(0, 20);
    }

    await redis.set(key, JSON.stringify(history));

    res.json({ success: true, snapshot });
  } catch (error) {
    console.error('Snapshot save error:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Load snapshots
historyRouter.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!isValidRoomId(roomId)) return res.status(400).json({ error: 'Invalid roomId' });

    const key = `room:${roomId}:history`;
    const historyStr = await redis.get(key);
    const history = historyStr ? JSON.parse(historyStr) : [];

    res.json(history);
  } catch (error) {
    console.error('History load error:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// Delete snapshot
historyRouter.delete('/:roomId/:snapshotId', async (req, res) => {
  try {
    const { roomId, snapshotId } = req.params;
    if (!isValidRoomId(roomId)) return res.status(400).json({ error: 'Invalid roomId' });
    if (!isValidSnapshotId(snapshotId)) return res.status(400).json({ error: 'Invalid snapshotId' });

    const key = `room:${roomId}:history`;
    
    let historyStr = await redis.get(key);
    if (!historyStr) return res.status(404).json({ error: 'Not found' });
    
    let history = JSON.parse(historyStr);
    history = history.filter(s => s.id !== snapshotId);

    await redis.set(key, JSON.stringify(history));

    res.json({ success: true });
  } catch (error) {
    console.error('Snapshot delete error:', error);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

export default historyRouter;
export function registerHistoryHandlers(io, socket) {
  // REST API is sufficient for history — no socket event needed for blob payloads
}
