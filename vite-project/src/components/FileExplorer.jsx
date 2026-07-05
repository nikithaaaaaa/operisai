import React, { useState } from 'react';
import { X, FolderOpen, FileCode2, Plus, Trash2, Pencil, Check } from 'lucide-react';

export const FileExplorer = ({ 
  isOpen, 
  onClose, 
  files = [], 
  activeFileId, 
  onSelectFile, 
  onCreateFile, 
  onDeleteFile,
  onRenameFile,
}) => {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const detectLang = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const map = { js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript', py: 'python', rs: 'rust', go: 'go', html: 'html', css: 'css', json: 'json', md: 'markdown', sql: 'sql' };
    return map[ext] || 'javascript';
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim(), detectLang(newFileName.trim()));
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const startRename = (file, e) => {
    e.stopPropagation();
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const commitRename = (id) => {
    if (renameValue.trim()) {
      onRenameFile?.(id, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleRenameKey = (e, id) => {
    if (e.key === 'Enter') commitRename(id);
    if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
  };

  return (
    <div 
      className={`h-full bg-[var(--color-editor-surface)] border-r border-[var(--color-editor-border)] flex flex-col transition-all duration-200 shrink-0 ${isOpen ? 'w-[280px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0'}`}
    >
      <div className="w-[280px] h-full flex flex-col shrink-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-editor-border)] shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-[var(--color-accent-primary)]" />
            <h2 className="font-heading font-bold">Explorer</h2>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsCreating(true)}
              className="p-1 text-[var(--color-text-secondary)] hover:text-white rounded-md hover:bg-[var(--color-editor-elevated)] transition-colors"
              title="New File"
            >
              <Plus size={18} />
            </button>
            <button 
              onClick={onClose}
              className="p-1 text-[var(--color-text-secondary)] hover:text-white rounded-md hover:bg-[var(--color-editor-elevated)] transition-colors active:scale-[0.97]"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar flex flex-col gap-0.5">
          {isCreating && (
            <form onSubmit={handleCreate} className="px-3 py-1 flex items-center gap-2">
              <FileCode2 size={14} className="text-gray-400 shrink-0" />
              <input 
                autoFocus
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => { if (!newFileName) setIsCreating(false); }}
                placeholder="filename.js"
                className="w-full bg-[var(--color-editor-base)] border border-[var(--color-accent-primary)] rounded px-2 py-1 text-xs text-white focus:outline-none"
              />
            </form>
          )}

          {files.map((file) => (
            <div 
              key={file.id}
              onClick={() => renamingId !== file.id && onSelectFile(file.id)}
              className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer select-none transition-colors border-l-2 ${activeFileId === file.id ? 'bg-[var(--color-editor-elevated)] border-[var(--color-accent-primary)] text-white' : 'border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-editor-surface)] hover:text-white'}`}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <FileCode2 size={14} className={`shrink-0 ${activeFileId === file.id ? 'text-[var(--color-accent-primary)]' : 'text-gray-500 group-hover:text-gray-400'}`} />
                
                {/* FEATURE-4: Inline rename input */}
                {renamingId === file.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(file.id)}
                    onKeyDown={(e) => handleRenameKey(e, file.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-[var(--color-editor-base)] border border-[var(--color-accent-primary)] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none min-w-0"
                  />
                ) : (
                  <span className="text-sm truncate">{file.name}</span>
                )}
              </div>
              
              {renamingId !== file.id && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                  <button 
                    onClick={(e) => startRename(file, e)}
                    className="p-1 hover:bg-[var(--color-editor-base)] rounded text-[var(--color-text-muted)] hover:text-white transition-all"
                    title="Rename"
                  >
                    <Pencil size={11} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}
                    className="p-1 hover:bg-[var(--color-editor-base)] rounded text-red-400 hover:text-red-300 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {files.length === 0 && !isCreating && (
            <div className="px-4 py-8 text-center text-xs text-[var(--color-text-muted)] italic">
              No files yet. Click + to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExplorer;
