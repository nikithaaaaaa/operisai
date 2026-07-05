import React, { useState } from 'react';
import { X, Clock, RotateCcw, Eye } from 'lucide-react';

export const VersionHistoryModal = ({ isOpen, onClose, snapshots = [], previewContent, onPreviewSnapshot, onRestoreSnapshot, onSaveSnapshot }) => {
  const [selectedVersion, setSelectedVersion] = useState(null);

  if (!isOpen) return null;

  const activeSnapshot = snapshots.find(s => s.id === selectedVersion);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-[840px] h-[600px] max-h-[90vh] bg-[var(--color-editor-surface)] border border-[var(--color-editor-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-[scaleIn_0.2s_ease-out]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-editor-border)] shrink-0">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <Clock size={20} className="text-[var(--color-accent-primary)]" />
            <h2 className="font-heading font-bold text-lg">Version History</h2>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onSaveSnapshot}
              className="px-3 py-1.5 bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] text-xs font-medium rounded text-[var(--color-text-primary)] hover:bg-[var(--color-editor-surface)] hover:text-white transition-colors"
            >
              Take Snapshot
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 text-[var(--color-text-secondary)] hover:text-white rounded-md hover:bg-[var(--color-editor-elevated)] transition-colors active:scale-[0.97]"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content (Split View) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left: Snapshot List */}
          <div className="w-[320px] border-r border-[var(--color-editor-border)] flex flex-col overflow-y-auto custom-scrollbar bg-[var(--color-editor-base)]">
            {snapshots.map((snap) => {
              const isActive = selectedVersion === snap.id;
              return (
                <div 
                  key={snap.id}
                  onClick={() => { setSelectedVersion(snap.id); onPreviewSnapshot(snap.id); }}
                  className={`p-4 border-b border-[var(--color-editor-border)] cursor-pointer transition-colors duration-150 group flex flex-col gap-2 relative ${isActive ? 'bg-[var(--color-editor-elevated)]' : 'hover:bg-[var(--color-editor-surface)]'}`}
                >
                  {/* Active Indicator Left Border */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-accent" />}
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       <span className="text-[var(--color-text-primary)] font-mono text-sm font-bold">{snap.id}</span>
                       <span className="bg-[var(--color-editor-base)] border border-[var(--color-editor-border)] text-[var(--color-text-secondary)] text-[10px] px-1.5 py-0.5 rounded font-mono">
                         {(snap.language || 'txt').toUpperCase()}
                       </span>
                    </div>
                    <span className="text-[var(--color-text-muted)] text-[11px]">{snap.timestamp}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: snap.color }}>
                        {snap.author.charAt(0)}
                      </div>
                      <span className="text-xs text-[var(--color-text-secondary)]">{snap.author}</span>
                    </div>
                    
                    {/* Hover Actions */}
                    <div className={`flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1 rounded hover:bg-[var(--color-editor-elevated)]" title="Preview">
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Preview Pane */}
          <div className="flex-1 flex flex-col bg-[var(--color-editor-base)] overflow-hidden">
            <div className="px-4 py-2 bg-[var(--color-editor-elevated)] border-b border-[var(--color-editor-border)] flex justify-between items-center shrink-0">
              <span className="text-xs font-mono text-[var(--color-text-secondary)]">Previewing {activeSnapshot?.id}</span>
              <span className="text-xs text-[var(--color-text-muted)]">{activeSnapshot?.lines} lines</span>
            </div>
            
            {/* Mock Editor Area */}
            <div className="flex-1 overflow-auto p-4 custom-scrollbar font-mono text-sm">
              <pre className="text-blue-300">
                {(previewContent || activeSnapshot?.code || '').split('\n').map((line, i) => (
                   <div key={i} className="flex">
                     <span className="w-8 shrink-0 text-[var(--color-text-muted)] select-none text-right pr-4">{i + 1}</span>
                     <span className={`${line.includes('//') ? 'text-green-600' : line.includes('function') ? 'text-pink-500' : 'text-blue-200'}`}>
                       {line}
                     </span>
                   </div>
                ))}
              </pre>
            </div>
          </div>
          
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-[var(--color-editor-border)] bg-[var(--color-editor-surface)] shrink-0 flex justify-end items-center gap-4">
          <button 
            onClick={onClose}
            className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={!selectedVersion}
            onClick={() => onRestoreSnapshot(selectedVersion)}
            className="bg-gradient-accent text-white font-medium rounded-xl px-6 py-2.5 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.97] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <RotateCcw size={16} />
            Restore This Version
          </button>
        </div>

      </div>
    </div>
  );
};

export default VersionHistoryModal;
