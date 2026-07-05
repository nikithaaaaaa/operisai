import { useState, useEffect } from 'react';

/**
 * useCursors — reads remote cursor positions from Yjs Awareness and converts
 * them to pixel coordinates using the Monaco Editor API.
 *
 * @param {import('../utils/crdt').CustomYjsProvider | null} provider
 * @param {{ current: import('monaco-editor').editor.IStandaloneCodeEditor | null }} editorRef
 * @returns {{ cursors: Array<{ id: number, name: string, color: string, x: number, y: number, active: boolean }> }}
 */
export const useCursors = (provider, editorRef) => {
  const [cursors, setCursors] = useState([]);

  useEffect(() => {
    if (!provider?.awareness) return;

    const awareness = provider.awareness;
    const localClientId = awareness.clientID;

    const updateCursors = () => {
      const states = awareness.getStates();
      const remoteCursors = [];

      states.forEach((state, clientId) => {
        // Skip local user
        if (clientId === localClientId) return;
        // Skip states without user identity
        if (!state.user) return;

        const cursor = {
          id: clientId,
          name: state.user.name,
          color: state.user.color,
          active: false,
          x: 0,
          y: 0,
        };

        // y-monaco sets state.cursor = { anchor, head } where anchor/head are
        // Monaco RelativePosition objects decoded to { line, ch } or { lineNumber, column }.
        // We try to resolve these to pixel coordinates.
        if (state.cursor && editorRef?.current) {
          try {
            const anchor = state.cursor.anchor;
            if (anchor) {
              const lineNumber = anchor.line ?? anchor.lineNumber ?? 1;
              const column = (anchor.ch ?? anchor.column ?? 1);
              const pixelPos = editorRef.current.getScrolledVisiblePosition({
                lineNumber,
                column,
              });
              if (pixelPos) {
                cursor.x = pixelPos.left;
                cursor.y = pixelPos.top;
                cursor.active = true;
              }
            }
          } catch (_) {
            // Editor not ready or position is outside the visible viewport — leave as inactive
          }
        }

        remoteCursors.push(cursor);
      });

      setCursors(remoteCursors);
    };

    awareness.on('change', updateCursors);
    updateCursors(); // Populate immediately on mount

    return () => {
      awareness.off('change', updateCursors);
    };
  }, [provider, editorRef]);

  return { cursors };
};
