import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ── sessionStorage handoff for folder import (TASK-M3) ────────────────────
export const setInitialFiles = (files) => {
  try {
    sessionStorage.setItem('codesync_initial_files', JSON.stringify(files));
  } catch (_) {}
};

export const useFileSystem = (doc) => {
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(null);

  // FIX-4: Track activeFileId in a ref so the Yjs observer closure always
  // sees the current value — not the stale initial null.
  const activeFileIdRef = useRef(null);
  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    if (!doc) return;

    const fileMap = doc.getMap('fileMetadata');
    const metaMap = doc.getMap('meta');

    const updateFilesFromYjs = () => {
      const currentFiles = [];
      for (const [id, meta] of fileMap.entries()) {
        currentFiles.push({ id, ...meta });
      }
      currentFiles.sort((a, b) => a.name.localeCompare(b.name));
      setFiles(currentFiles);

      // FIX-4: Use the ref (always current) instead of the stale closure value
      const currentActive = activeFileIdRef.current;
      const stillExists = currentFiles.find(f => f.id === currentActive);
      if (!currentActive || !stillExists) {
        // Only auto-select if we don't have a valid active file
        setActiveFileId(currentFiles[0]?.id ?? null);
      }
    };

    fileMap.observe(updateFilesFromYjs);
    metaMap.observe(updateFilesFromYjs);
    updateFilesFromYjs();

    // Seed files (TASK-M3 + TASK-A2)
    if (!metaMap.get('seeded')) {
      doc.transact(() => {
        if (metaMap.get('seeded')) return;
        metaMap.set('seeded', true);

        let imported = null;
        try {
          const raw = sessionStorage.getItem('codesync_initial_files');
          if (raw) {
            imported = JSON.parse(raw);
            sessionStorage.removeItem('codesync_initial_files');
          }
        } catch (_) {}

        if (imported && imported.length > 0) {
          imported.forEach((f) => {
            const fileId = uuidv4();
            fileMap.set(fileId, { name: f.name, language: f.language || 'javascript' });
            doc.getText(`file:${fileId}`).insert(0, f.content || '');
          });
        } else {
          const defaultId = uuidv4();
          fileMap.set(defaultId, { name: 'index.js', language: 'javascript' });
          doc.getText(`file:${defaultId}`).insert(0, '// Start coding here...\n');
        }
      });
    }

    return () => {
      fileMap.unobserve(updateFilesFromYjs);
      metaMap.unobserve(updateFilesFromYjs);
    };
  }, [doc]);

  const createFile = useCallback((name, language = 'javascript') => {
    if (!doc || !name) return;
    const fileId = uuidv4();
    doc.getMap('fileMetadata').set(fileId, { name, language });
    setActiveFileId(fileId);
  }, [doc]);

  const deleteFile = useCallback((id) => {
    if (!doc) return;
    doc.getMap('fileMetadata').delete(id);
    if (activeFileIdRef.current === id) {
      setActiveFileId(null);
    }
  }, [doc]);

  const renameFile = useCallback((id, newName) => {
    if (!doc || !newName?.trim()) return;
    const fileMap = doc.getMap('fileMetadata');
    const current = fileMap.get(id);
    if (!current) return;
    let language = current.language;
    const ext = newName.split('.').pop()?.toLowerCase();
    const extMap = { js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', py: 'python', rs: 'rust', go: 'go', html: 'html', css: 'css', json: 'json', md: 'markdown', sql: 'sql' };
    if (ext && extMap[ext]) language = extMap[ext];
    fileMap.set(id, { ...current, name: newName.trim(), language });
  }, [doc]);

  const updateFileLanguage = useCallback((id, language) => {
    if (!doc || !id) return;
    const fileMap = doc.getMap('fileMetadata');
    const current = fileMap.get(id);
    if (current) fileMap.set(id, { ...current, language });
  }, [doc]);

  return { files, activeFileId, setActiveFileId, createFile, deleteFile, renameFile, updateFileLanguage };
};
