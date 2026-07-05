import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { CustomYjsProvider } from '../utils/crdt';
import { socket } from './useRoom';

export const useCollaboration = (roomId, user, editorRef, activeFileId, monacoRef) => {
  const [language, setLanguage] = useState('javascript');
  const [yjsState, setYjsState] = useState({ doc: null, provider: null });

  const providerRef = useRef(null);
  const docRef = useRef(null);
  const bindingsRef = useRef(new Map());
  const modelsRef = useRef(new Map());

  // FIX-7: Track previous fileId to distinguish file-switch from language-only change
  const prevFileIdRef = useRef(null);

  // ── Effect 1: Initialise Y.Doc and Provider once per room ─────────────────
  useEffect(() => {
    if (!roomId || !user) return;

    const doc = new Y.Doc();
    const provider = new CustomYjsProvider(doc, user, roomId);

    docRef.current = doc;
    providerRef.current = provider;
    setYjsState({ doc, provider });

    if (socket) {
      socket.on('room:language:change', ({ language: newLang }) => {
        setLanguage(newLang);
      });
    }

    return () => {
      if (socket) socket.off('room:language:change');
      bindingsRef.current.forEach((b) => b.destroy());
      bindingsRef.current.clear();
      modelsRef.current.forEach((m) => m.dispose());
      modelsRef.current.clear();
      provider.destroy();
      doc.destroy();
      docRef.current = null;
      providerRef.current = null;
      setYjsState({ doc: null, provider: null });
    };
  }, [roomId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: Bind active file's Yjs text to Monaco ───────────────────────
  // FIX-7: Guard so editor.setModel() only fires when the FILE changes,
  // not when just the language changes (prevents editor flicker on lang switch).
  useEffect(() => {
    if (!docRef.current || !activeFileId || !editorRef.current || !monacoRef.current) return;

    const doc = docRef.current;
    const monaco = monacoRef.current;
    const editor = editorRef.current;

    const isFileSwitch = prevFileIdRef.current !== activeFileId;
    prevFileIdRef.current = activeFileId;

    let model = modelsRef.current.get(activeFileId);

    if (!model) {
      // New file — create model + binding
      model = monaco.editor.createModel('', language);
      modelsRef.current.set(activeFileId, model);

      const type = doc.getText(`file:${activeFileId}`);
      const binding = new MonacoBinding(
        type,
        model,
        new Set([editor]),
        providerRef.current.awareness
      );
      bindingsRef.current.set(activeFileId, binding);
    }

    if (isFileSwitch) {
      // Only call setModel when actually switching files to avoid flicker
      editor.setModel(model);
    }

    // Always sync language on the model
    monaco.editor.setModelLanguage(model, language);
  }, [activeFileId, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    if (activeFileId && modelsRef.current.has(activeFileId) && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(modelsRef.current.get(activeFileId), newLang);
    }
    if (socket) socket.emit('room:language:change', { language: newLang, roomId });
  };

  const setLocalLanguage = (newLang) => {
    setLanguage(newLang);
    if (activeFileId && modelsRef.current.has(activeFileId) && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(modelsRef.current.get(activeFileId), newLang);
    }
  };

  return {
    language,
    changeLanguage,
    setLocalLanguage,
    provider: yjsState.provider,
    doc: yjsState.doc,
  };
};
