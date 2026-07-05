import React, { useState, useRef, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  ChevronDown,
  History,
  Settings,
  Link,
  Download,
} from 'lucide-react';

// Supported languages — FEATURE-7: expanded from 4 to 10
const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', color: 'bg-yellow-400' },
  { id: 'typescript', label: 'TypeScript', color: 'bg-blue-500' },
  { id: 'python', label: 'Python', color: 'bg-blue-400' },
  { id: 'rust', label: 'Rust', color: 'bg-orange-500' },
  { id: 'go', label: 'Go', color: 'bg-cyan-400' },
  { id: 'html', label: 'HTML', color: 'bg-red-400' },
  { id: 'css', label: 'CSS', color: 'bg-purple-400' },
  { id: 'json', label: 'JSON', color: 'bg-gray-400' },
  { id: 'markdown', label: 'Markdown', color: 'bg-green-400' },
  { id: 'sql', label: 'SQL', color: 'bg-pink-400' },
];

export const Toolbar = ({
  roomCode,
  connectionStatus,
  onOpenVersionHistory,
  selectedLang,
  onLanguageChange,
  activeUsers = [],
  onDownload,
  editorRef,
}) => {
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const settingsRef = useRef(null);

  // Close settings popover when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Apply font size to Monaco editor
  useEffect(() => {
    editorRef?.current?.updateOptions({ fontSize });
  }, [fontSize, editorRef]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // FEATURE-1: Copy full shareable room URL
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getStatusColor = () => {
    if (connectionStatus === 'webrtc') return 'bg-[var(--color-status-success)]';
    if (connectionStatus === 'relay') return 'bg-[var(--color-status-warning)]';
    return 'bg-[var(--color-status-danger)]';
  };

  const getStatusText = () => {
    if (connectionStatus === 'webrtc') return 'P2P';
    if (connectionStatus === 'relay') return 'Relay';
    return 'Offline';
  };

  const activeLang = LANGUAGES.find(l => l.id === selectedLang) || LANGUAGES[0];

  return (
    <>
      <div className="h-12 w-full bg-[var(--color-editor-surface)] border-b border-[var(--color-editor-border)] flex items-center justify-between px-4 select-none shrink-0 z-50 gap-3">
        
        {/* LEFT: Brand + Room Code */}
        <div className="flex items-center gap-3 shrink-0 overflow-hidden">
          <div className="flex items-center gap-2 shrink-0">
            <Code2 size={24} className="text-[var(--color-accent-primary)] shrink-0" strokeWidth={2.5} />
            <span className="font-heading font-bold text-lg tracking-tight shrink-0">OperisAI</span>
          </div>

          {/* Room Code chip — click to copy code */}
          <div 
            onClick={handleCopyCode}
            className="flex items-center gap-2 bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] rounded-full px-3 py-1 cursor-pointer hover:border-[var(--color-text-muted)] group transition-colors duration-200 active:scale-[0.97] min-w-[80px] shrink overflow-hidden"
            title="Click to copy room code"
          >
            <span className="font-mono text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors overflow-hidden text-ellipsis whitespace-nowrap">
              {roomCode}
            </span>
            {copied ? (
              <Check size={14} className="text-[var(--color-status-success)]" />
            ) : (
              <Copy size={14} className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)] transition-colors" />
            )}
          </div>

          {/* FEATURE-1: Copy full URL button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] text-[var(--color-text-secondary)] hover:text-white hover:border-[var(--color-text-muted)] text-xs font-medium transition-colors duration-200 active:scale-[0.97] min-w-[90px] shrink-0"
            title="Copy shareable room link"
          >
            {linkCopied ? <Check size={12} className="text-[var(--color-status-success)]" /> : <Link size={12} />}
            {linkCopied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* CENTER: Language Selector */}
        <div className="relative shrink-0">
          <div 
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className="flex items-center gap-2 bg-transparent hover:bg-[var(--color-editor-elevated)] px-3 py-1.5 rounded-md cursor-pointer transition-colors duration-200 min-w-[110px]"
          >
            <span className={`w-2 h-2 rounded-full ${activeLang.color}`} />
            <span className="text-sm font-medium">{activeLang.label}</span>
            <ChevronDown size={14} className="text-[var(--color-text-muted)]" />
          </div>

          {isLangDropdownOpen && (
            <div className="absolute top-[120%] left-1/2 -translate-x-1/2 bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] rounded-lg shadow-xl py-1 w-40 z-50 animate-[scaleIn_0.15s_ease-out_forwards] max-h-64 overflow-y-auto custom-scrollbar">
              {LANGUAGES.map((lang) => (
                <div 
                  key={lang.id}
                  onClick={() => { onLanguageChange(lang.id); setIsLangDropdownOpen(false); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-[var(--color-editor-surface)] flex items-center gap-2 ${selectedLang === lang.id ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${lang.color}`} />
                  {lang.label}
                  {selectedLang === lang.id && <Check size={12} className="ml-auto text-[var(--color-accent-primary)]" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Users + Status + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* User Avatars */}
          <div className="flex items-center gap-1 shrink-0">
            {activeUsers.slice(0, 4).map((user, i) => (
              <div 
                key={user.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-heading text-white border border-[var(--color-editor-surface)] relative group"
                style={{ backgroundColor: user.color, zIndex: 10 - i }}
              >
                {user.name.charAt(0)}
                <div className="absolute top-10 whitespace-nowrap bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {user.name}
                </div>
              </div>
            ))}
            {activeUsers.length > 4 && (
              <div 
                className="w-7 h-7 rounded-full bg-[var(--color-editor-elevated)] flex items-center justify-center text-[10px] font-bold text-white border border-[var(--color-editor-surface)]"
                style={{ zIndex: 1 }}
              >
                +{activeUsers.length - 4}
              </div>
            )}
          </div>

          {/* TASK-M5: Connection Status — shows relay warning for >2 users */}
          <div className="flex items-center gap-2 bg-[var(--color-editor-base)] px-2 py-1 rounded border border-[var(--color-editor-border)]" title={activeUsers.length > 2 ? 'WebRTC P2P only supports 2 users. All users are on relay.' : undefined}>
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} style={{ animation: 'var(--animate-pulse-subtle)' }} />
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {activeUsers.length > 2 ? 'Relay (3+ users)' : getStatusText()}
            </span>
          </div>

          <div className="w-[1px] h-6 bg-[var(--color-editor-border)]" />

          {/* Action Buttons */}
          {/* FEATURE-3: Download current file */}
          <button 
            onClick={onDownload}
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-editor-elevated)] rounded transition-all duration-200 active:scale-[0.97] min-w-[32px] flex items-center justify-center shrink-0"
            title="Download current file"
          >
            <Download size={18} />
          </button>

          <button 
            onClick={onOpenVersionHistory}
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-editor-elevated)] rounded transition-all duration-200 active:scale-[0.97] min-w-[32px] flex items-center justify-center shrink-0"
            title="Version History"
          >
            <History size={18} />
          </button>
          
          {/* TASK-Q4: Settings button — font size control */}
          <div className="relative" ref={settingsRef}>
            <button 
              onClick={() => setIsSettingsOpen(o => !o)}
              className={`p-1.5 rounded transition-all duration-200 active:scale-[0.97] min-w-[32px] flex items-center justify-center shrink-0 ${isSettingsOpen ? 'bg-[var(--color-editor-elevated)] text-white' : 'text-[var(--color-text-secondary)] hover:text-white hover:bg-[var(--color-editor-elevated)]'}`}
              title="Settings"
            >
              <Settings size={18} />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] rounded-xl shadow-2xl p-4 w-56 z-50 animate-[scaleIn_0.15s_ease-out_forwards]">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Editor Settings</p>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-[var(--color-text-primary)]">Font Size</label>
                    <span className="text-xs font-mono text-[var(--color-accent-primary)] font-bold">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={11}
                    max={22}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-[var(--color-accent-primary)] h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
                    <span>11</span><span>22</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toasts */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-[var(--color-status-success)] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 font-medium text-sm animate-[scaleIn_0.2s_ease-out_forwards] z-[100]">
          <Check size={16} />
          Room Code Copied!
        </div>
      )}
      {linkCopied && (
        <div className="fixed bottom-6 right-6 bg-[var(--color-accent-primary)] text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 font-medium text-sm animate-[scaleIn_0.2s_ease-out_forwards] z-[100]">
          <Check size={16} />
          Room Link Copied!
        </div>
      )}
    </>
  );
};

export default Toolbar;
