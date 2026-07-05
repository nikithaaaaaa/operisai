import { useState, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.VITE_SOCKET_URL || `http://${window.location.hostname}:3001`;

export const useVersionHistory = (roomId, user) => {
  const [snapshots, setSnapshots] = useState([]);
  const [previewContent, setPreviewContent] = useState('');

  const loadSnapshots = useCallback(async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`${API_URL}/api/history/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data);
      }
    } catch (e) {
      console.error('Failed to load snapshots:', e);
    }
  }, [roomId]);

  const saveSnapshot = useCallback(async (content, language) => {
    if (!roomId || !content) return;
    try {
      const res = await fetch(`${API_URL}/api/history/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          language,
          authorUsername: user.name,
          authorColor: user.color,
        }),
      });
      if (res.ok) {
        loadSnapshots();
      }
    } catch (e) {
      console.error('Failed to save snapshot:', e);
    }
  }, [roomId, user, loadSnapshots]);

  const previewSnapshot = useCallback((id) => {
    const snap = snapshots.find((s) => s.id === id);
    if (snap) {
      setPreviewContent(snap.code);
    }
  }, [snapshots]);

  /**
   * Restore a snapshot by writing its content directly into the Yjs shared text type
   * for the currently active file. This propagates the change to all collaborators
   * through Yjs sync — unlike editor.setValue() which is local-only.
   *
   * @param {string} id  — snapshot ID
   * @param {import('yjs').Doc} doc  — the live Yjs document
   * @param {string} activeFileId  — the file key currently open in the editor
   */
  const restoreSnapshot = useCallback((id, doc, activeFileId) => {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap || !doc || !activeFileId) {
      console.warn('[useVersionHistory] restoreSnapshot: missing snap/doc/fileId');
      return;
    }
    const yText = doc.getText(`file:${activeFileId}`);
    // Write inside a transaction so peers receive a single atomic update
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, snap.code);
    });
  }, [snapshots]);

  // Load snapshots on mount and whenever roomId changes
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  return {
    snapshots,
    previewContent,
    loadSnapshots,
    saveSnapshot,
    previewSnapshot,
    restoreSnapshot,
  };
};
