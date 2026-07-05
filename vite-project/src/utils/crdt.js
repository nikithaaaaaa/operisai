import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
} from 'y-protocols/awareness';
import { transport } from './transport';
import { socket } from '../hooks/useRoom';

export class CustomYjsProvider {
  constructor(doc, user, roomId) {
    this.doc = doc;
    this.awareness = new Awareness(doc);
    this.user = user;
    this.roomId = roomId;

    // Publish local user identity so peers can render name labels / cursor colours
    this.awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color,
      id: user.id,
    });

    // ── TASK-A1: Apply persisted server state on join ─────────────────────
    // The server emits 'room:state:sync' when a user joins a room that has
    // existing persisted state. Applying this update converges the local doc
    // to the last known state even after all users have disconnected.
    if (socket) {
      this._stateSyncHandler = ({ state }) => {
        try {
          // atob() is the browser-native base64 decoder (Buffer is Node.js only)
          const binary = atob(state);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          Y.applyUpdate(this.doc, bytes, 'server-sync');
          console.log('[CRDT] Applied persisted room state from server');
        } catch (err) {
          console.error('[CRDT] Failed to apply room:state:sync:', err);
        }
      };
      socket.on('room:state:sync', this._stateSyncHandler);
    }

    // ── Incoming message routing ────────────────────────────────────────────
    // transport.triggerMessage delivers the raw payload object:
    //   { channel: string, data: any }
    this._unsubscribe = transport.onMessage((msg) => {
      if (msg.channel === 'yjs:update') {
        const update = new Uint8Array(msg.data.update);
        Y.applyUpdate(this.doc, update, this); // origin = this → won't re-echo
      } else if (msg.channel === 'yjs:awareness') {
        const update = new Uint8Array(msg.data.update);
        applyAwarenessUpdate(this.awareness, update, this);
      }
    });

    // ── Outgoing: document changes ─────────────────────────────────────────
    this._docHandler = (update, origin) => {
      if (origin !== this && origin !== 'server-sync') {
        transport.send('yjs:update', { update: Array.from(update) });
      }
    };
    this.doc.on('update', this._docHandler);

    // ── Outgoing: awareness changes ────────────────────────────────────────
    this._awarenessHandler = ({ added, updated, removed }, origin) => {
      if (origin !== this) {
        const changedClients = added.concat(updated).concat(removed);
        const update = encodeAwarenessUpdate(this.awareness, changedClients);
        transport.send('yjs:awareness', { update: Array.from(update) });
      }
    };
    this.awareness.on('update', this._awarenessHandler);
  }

  destroy() {
    this._unsubscribe?.();
    if (socket && this._stateSyncHandler) {
      socket.off('room:state:sync', this._stateSyncHandler);
    }
    this.doc.off('update', this._docHandler);
    this.awareness.off('update', this._awarenessHandler);
    this.awareness.destroy();
  }
}
