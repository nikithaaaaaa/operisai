import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FolderOpen, Sparkles, Settings2 } from 'lucide-react';

import Toolbar from './Toolbar';
import MenuBar from './MenuBar';
import AIPanel from './AIPanel';
import ChatPanel from './ChatPanel';
import CursorOverlay from './CursorOverlay';
import VersionHistoryModal from './VersionHistoryModal';
import FileExplorer from './FileExplorer';
import Editor from './Editor';
import ShortcutsModal from './ShortcutsModal';
import SettingsPanel from './SettingsPanel';
import ToastContainer, { showToast } from './Toast';

import { useWebRTC } from '../hooks/useWebRTC';
import { useCollaboration } from '../hooks/useCollaboration';
import { useChat } from '../hooks/useChat';
import { useVersionHistory } from '../hooks/useVersionHistory';
import { useAI } from '../hooks/useAI';
import { useFileSystem } from '../hooks/useFileSystem';
import { useCursors } from '../hooks/useCursors';

export const AppShell = ({ roomCode, user, activeUsers }) => {
  const navigate = useNavigate();

  // ── Panel visibility state ────────────────────────────────────────────────
  const [showSidebar,   setShowSidebar]   = useState(true);
  const [showAI,        setShowAI]        = useState(false);
  const [showChat,      setShowChat]      = useState(true);
  const [zenMode,       setZenMode]       = useState(false);
  const [showHistory,   setShowHistory]   = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);

  // ── Editor toggle state (tracked here so menu can flip without EditorOption) ─
  const [wordWrap,  setWordWrap]  = useState(false);
  const [minimapOn, setMinimapOn] = useState(true);

  // ── File tabs state ───────────────────────────────────────────────────────
  const [openTabs, setOpenTabs] = useState([]);

  // ── Editor cursor position for status bar ─────────────────────────────────
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // ── Inline AI prompt state ────────────────────────────────────────────────
  const [inlineAI, setInlineAI] = useState(null); // { position, selectedCode, range }

  // ── Lifted state for Yjs binding ─────────────────────────────────────────
  const [bindFileId, setBindFileId] = useState(null);

  // Monaco editor and monaco-instance refs
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  // ── Hooks ─────────────────────────────────────────────────────────────────
  const { connectionMode } = useWebRTC(roomCode, activeUsers, user);
  const colab = useCollaboration(roomCode, user, editorRef, bindFileId, monacoRef);
  const fs = useFileSystem(colab.doc);
  const { cursors } = useCursors(colab.provider, editorRef);
  const { messages, typingUsers, sendMessage, notifyTyping } = useChat(roomCode, user);
  const { snapshots, previewContent, saveSnapshot, previewSnapshot, restoreSnapshot } =
    useVersionHistory(roomCode, user);
  const { isLoading, response, explain, fix, generate } = useAI(
    fs.files.find(f => f.id === fs.activeFileId)?.language || colab.language
  );

  // Sync FS active file into Yjs binding
  useEffect(() => {
    if (fs.activeFileId) setBindFileId(fs.activeFileId);
  }, [fs.activeFileId]);

  // Sync language when active file changes
  useEffect(() => {
    const file = fs.files.find(f => f.id === fs.activeFileId);
    if (file?.language && file.language !== colab.language) {
      colab.setLocalLanguage(file.language);
    }
  }, [fs.activeFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open a tab whenever activeFileId changes
  useEffect(() => {
    if (!fs.activeFileId) return;
    setOpenTabs(prev =>
      prev.includes(fs.activeFileId) ? prev : [...prev, fs.activeFileId]
    );
  }, [fs.activeFileId]);

  // Ctrl+? shortcut to open shortcuts modal
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const safeLanguage  = colab.language;
  const activeFile    = fs.files.find(f => f.id === fs.activeFileId);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getFullContent  = () => editorRef.current?.getValue() || '';
  const getSelectedCode = () => {
    if (!editorRef.current) return '';
    const sel = editorRef.current.getSelection();
    if (!sel || sel.isEmpty()) return '';
    return editorRef.current.getModel()?.getValueInRange(sel) || '';
  };

  const handleInsertCode = (code) => {
    if (!editorRef.current) return;
    const sel = editorRef.current.getSelection();
    editorRef.current.executeEdits('ai', [{ range: sel, text: code, forceMoveMarkers: true }]);
  };

  const handleDownload = () => {
    const content  = getFullContent();
    const filename = activeFile?.name || 'code.txt';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleLanguageChange = (lang) => {
    colab.changeLanguage(lang);
    if (fs.activeFileId) fs.updateFileLanguage(fs.activeFileId, lang);
  };

  // ── Tab management ────────────────────────────────────────────────────────
  const closeTab = useCallback((tabId, e) => {
    e?.stopPropagation();
    setOpenTabs(prev => {
      const next = prev.filter(id => id !== tabId);
      if (tabId === fs.activeFileId) {
        fs.setActiveFileId(next[next.length - 1] ?? null);
      }
      return next;
    });
  }, [fs.activeFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── handleMenuAction — central dispatcher ─────────────────────────────────
  const handleMenuAction = useCallback((action) => {
    const ed = editorRef.current;
    switch (action) {
      // ── File ──────────────────────────────────────────────────────────────
      case 'file:new':
        fs.createFile?.('untitled.js', 'javascript');
        break;
      case 'file:save-snapshot':
        saveSnapshot(getFullContent(), activeFile?.language || safeLanguage);
        showToast('Snapshot saved', 'success');
        break;
      case 'file:download':
        handleDownload();
        break;
      case 'file:close':
        if (fs.activeFileId) closeTab(fs.activeFileId);
        break;

      // ── Edit ──────────────────────────────────────────────────────────────
      case 'edit:undo':
        ed?.trigger('menu', 'undo', null);
        break;
      case 'edit:redo':
        ed?.trigger('menu', 'redo', null);
        break;
      case 'edit:find':
        ed?.getAction('actions.find')?.run();
        break;
      case 'edit:replace':
        ed?.getAction('editor.action.startFindReplaceAction')?.run();
        break;
      case 'edit:format':
        ed?.getAction('editor.action.formatDocument')?.run();
        break;
      case 'edit:comment':
        ed?.getAction('editor.action.commentLine')?.run();
        break;
      case 'edit:select-all':
        ed?.trigger('menu', 'selectAll', null);
        break;

      // ── View ──────────────────────────────────────────────────────────────
      case 'view:explorer':
        setShowSidebar(v => !v);
        break;
      case 'view:ai':
        setShowAI(v => !v);
        break;
      case 'view:chat':
        setShowChat(v => !v);
        break;
      case 'view:word-wrap': {
        const next = !wordWrap;
        setWordWrap(next);
        ed?.updateOptions({ wordWrap: next ? 'on' : 'off' });
        break;
      }
      case 'view:minimap': {
        const next = !minimapOn;
        setMinimapOn(next);
        ed?.updateOptions({ minimap: { enabled: next } });
        break;
      }
      case 'view:zen':
        setZenMode(v => !v);
        break;
      case 'view:fullscreen':
        document.fullscreenElement
          ? document.exitFullscreen()
          : document.documentElement.requestFullscreen();
        break;
      case 'view:settings':
        setShowSettings(true);
        break;

      // ── Collaboration ──────────────────────────────────────────────────────
      case 'collab:copy-link':
        navigator.clipboard.writeText(window.location.href);
        showToast('Room link copied!', 'success');
        break;
      case 'collab:history':
        setShowHistory(true);
        break;
      case 'collab:snapshot':
        saveSnapshot(getFullContent(), activeFile?.language || safeLanguage);
        showToast('Snapshot saved', 'success');
        break;
      case 'collab:leave':
        navigate('/');
        break;
      case 'collab:close-room':
        if (window.confirm('Close this room? All unsaved changes will be lost.')) navigate('/');
        break;

      // ── Help ──────────────────────────────────────────────────────────────
      case 'help:shortcuts':
        setShowShortcuts(true);
        break;
      case 'help:about':
        showToast('OperisAI — P2P Collaborative IDE', 'default', 3000);
        break;

      default:
        console.warn('[MenuBar] Unknown action:', action);
    }
  }, [editorRef, fs, activeFile, safeLanguage, saveSnapshot, handleDownload, closeTab, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inline AI submit ──────────────────────────────────────────────────────
  const handleInlineAISubmit = async (instruction, selectedCode, range) => {
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'inline', instruction, code: selectedCode, language: safeLanguage, roomId: roomCode }),
      });
      if (!res.ok) throw new Error('AI request failed');
      const { result } = await res.json();
      if (result) {
        editorRef.current?.executeEdits('ai-inline', [{
          range, text: result, forceMoveMarkers: true,
        }]);
        showToast('AI applied changes', 'success');
      }
    } catch {
      showToast('AI request failed', 'error');
    }
  };

  // ── Determine left-panel active tab for legacy activity bar ───────────────
  const activeLeftTab = showSidebar ? 'explorer' : showAI ? 'ai' : null;
  const setActiveLeftTab = (tab) => {
    setShowSidebar(tab === 'explorer');
    setShowAI(tab === 'ai');
  };

  return (
    <div className={`app-shell${zenMode ? ' zen' : ''}`}>

      {/* ── Menu Bar ────────────────────────────────────────────────────── */}
      <MenuBar onAction={handleMenuAction} activeUsers={activeUsers} />

      {/* ── Main Workspace (Middle Row) ─────────────────────────────────── */}
      <div className="workspace-area">

        {/* 1. Activity Bar */}
        <div className="activity-bar shrink-0">
          <button
            className={`activity-btn${activeLeftTab === 'explorer' ? ' active' : ''}`}
            onClick={() => setActiveLeftTab(activeLeftTab === 'explorer' ? null : 'explorer')}
            title="Explorer (Ctrl B)"
          >
            <FolderOpen size={20} />
          </button>
          <button
            className={`activity-btn${activeLeftTab === 'ai' ? ' active' : ''}`}
            onClick={() => setActiveLeftTab(activeLeftTab === 'ai' ? null : 'ai')}
            title="AI Assistant (Ctrl Shift A)"
          >
            <Sparkles size={20} />
          </button>
          <div className="activity-spacer" />
          <button
            className="activity-btn"
            onClick={() => setShowSettings(true)}
            title="Settings"
          >
            <Settings2 size={20} />
          </button>
        </div>

        {/* 2. Left Panels */}
        <div className="left-panels shrink-0">
          <FileExplorer
            isOpen={activeLeftTab === 'explorer'}
            onClose={() => setActiveLeftTab(null)}
            files={fs.files}
            activeFileId={fs.activeFileId}
            onSelectFile={fs.setActiveFileId}
            onCreateFile={fs.createFile}
            onDeleteFile={fs.deleteFile}
            onRenameFile={fs.renameFile}
          />
        </div>

        {/* 3. Editor Area */}
        <div className={`editor-area flex flex-col min-w-[200px] flex-1 ${activeLeftTab ? ' has-left-panel' : ''}${showChat ? ' has-right-panel' : ''}`}>
          
          <Toolbar
            roomCode={roomCode}
            connectionStatus={connectionMode}
            onOpenVersionHistory={() => setShowHistory(true)}
            selectedLang={activeFile?.language || safeLanguage}
            onLanguageChange={handleLanguageChange}
            activeUsers={activeUsers}
            onDownload={handleDownload}
            editorRef={editorRef}
            onOpenSettings={() => setShowSettings(true)}
          />

          <div className="tabs-bar shrink-0" style={{ height: '36px' }}>
            {openTabs.map(tabId => {
              const file = fs.files.find(f => f.id === tabId);
              if (!file) return null;
              return (
                <div
                  key={tabId}
                  className={`file-tab${tabId === fs.activeFileId ? ' active' : ''}`}
                  onClick={() => fs.setActiveFileId(tabId)}
                >
                  <span className="tab-name">{file.name}</span>
                  <button className="tab-close" onClick={(e) => closeTab(tabId, e)}>×</button>
                </div>
              );
            })}
            {openTabs.length === 0 && (
              <div className="tabs-empty">No files open — select a file from the explorer</div>
            )}
          </div>

          <div className="flex-1 relative min-h-0">
            <CursorOverlay remoteCursors={cursors}>
              <Editor
                language={activeFile?.language || safeLanguage}
                onMount={(editor, monacoInst) => {
                  editorRef.current   = editor;
                  monacoRef.current   = monacoInst;
                  editor.onDidChangeCursorPosition((e) => {
                    setCursorPos({ line: e.position.lineNumber, col: e.position.column });
                  });
                  editor.addCommand(
                    monacoInst.KeyMod.CtrlCmd | monacoInst.KeyCode.KeyK,
                    () => {
                      const selection = editor.getSelection();
                      if (!selection || selection.isEmpty()) return;
                      const selectedText = editor.getModel()?.getValueInRange(selection);
                      if (!selectedText) return;
                      const domNode = editor.getDomNode();
                      const rect    = domNode?.getBoundingClientRect();
                      const pos     = editor.getScrolledVisiblePosition(selection.getStartPosition());
                      setInlineAI({
                        position: {
                          top:  (rect?.top ?? 0) + (pos?.top ?? 40) - 80,
                          left: (rect?.left ?? 0) + (pos?.left ?? 40),
                        },
                        selectedCode: selectedText,
                        range: selection,
                      });
                    }
                  );
                  const storedFontSize   = parseInt(localStorage.getItem('cs_font_size')  || '13');
                  const storedFontFamily = localStorage.getItem('cs_font_family') || '"JetBrains Mono", monospace';
                  const storedTabSize    = parseInt(localStorage.getItem('cs_tab_size')   || '2');
                  const storedWordWrap   = localStorage.getItem('cs_word_wrap') === 'on' ? 'on' : 'off';
                  editor.updateOptions({
                    fontSize:   storedFontSize,
                    fontFamily: storedFontFamily,
                    tabSize:    storedTabSize,
                    wordWrap:   storedWordWrap,
                  });
                }}
              />
            </CursorOverlay>

            {inlineAI && (
              <div
                className="inline-ai-prompt"
                style={{ top: inlineAI.position.top, left: inlineAI.position.left }}
              >
                <div className="iap-header">
                  <span className="iap-icon">✦</span>
                  <span className="iap-label">
                    {inlineAI.selectedCode.split('\n').length} line{inlineAI.selectedCode.split('\n').length !== 1 ? 's' : ''} selected
                  </span>
                  <button className="modal-close" style={{ fontSize: 14, marginLeft: 'auto' }} onClick={() => setInlineAI(null)}>×</button>
                </div>
                <InlineAIForm
                  onSubmit={async (instruction) => {
                    await handleInlineAISubmit(instruction, inlineAI.selectedCode, inlineAI.range);
                    setInlineAI(null);
                  }}
                  onClose={() => setInlineAI(null)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. Right Panels */}
        <div className="right-panels shrink-0 flex">
          <AIPanel
            isOpen={activeLeftTab === 'ai'}
            onClose={() => setActiveLeftTab(null)}
            isLoading={isLoading}
            aiResponse={response}
            selectedCode={getSelectedCode()}
            language={activeFile?.language || safeLanguage}
            roomId={roomCode}
            editorRef={editorRef}
            onExplain={() => explain(getSelectedCode(), getFullContent())}
            onFix={() => fix(getSelectedCode(), getFullContent())}
            onGenerate={(prompt) => generate(prompt, getFullContent())}
            onInsertCode={handleInsertCode}
          />
          {!showChat && (
            <button
              className="chat-reveal-btn"
              onClick={() => setShowChat(true)}
              title="Open chat"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <ChatPanel
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            messages={messages}
            typingUsers={typingUsers}
            onSendMessage={sendMessage}
            onNotifyTyping={notifyTyping}
          />
        </div>
      </div>

      {/* ── Status Bar ──────────────────────────────────────────────────── */}
      <div className="statusbar">
        <div className="sb-left">
          <div className={`sb-item${connectionMode === 'p2p' ? ' sb-p2p' : connectionMode === 'relay' ? ' sb-relay' : ''}`}>
            <span className="sb-dot" />
            {connectionMode === 'p2p' ? 'P2P' : connectionMode === 'relay' ? 'Relay' : 'Connecting'}
            &nbsp;·&nbsp;{activeUsers.length} {activeUsers.length === 1 ? 'user' : 'users'}
          </div>
          {fs.activeFileId && (
            <div className="sb-item">
              <span>main</span>
            </div>
          )}
        </div>
        <div className="sb-right">
          <div className="sb-item">{activeFile?.language || safeLanguage || 'Plain text'}</div>
          <div className="sb-item">Ln {cursorPos.line}, Col {cursorPos.col}</div>
          <div className="sb-item">UTF-8</div>
          <div className="sb-item sb-clickable" onClick={() => setShowSettings(true)}>Spaces: 2</div>
        </div>
      </div>

      {/* ── Modals & Panels ─────────────────────────────────────────────── */}
      <VersionHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        snapshots={snapshots}
        previewContent={previewContent}
        onPreviewSnapshot={previewSnapshot}
        onRestoreSnapshot={(id) => {
          restoreSnapshot(id, colab.doc, fs.activeFileId);
          setShowHistory(false);
        }}
        onSaveSnapshot={() => saveSnapshot(getFullContent(), activeFile?.language || safeLanguage)}
      />

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}

      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          editorRef={editorRef}
        />
      )}

      <ToastContainer />
    </div>
  );
};

// ── Tiny inline form component (avoids prop-drilling ref) ─────────────────────
function InlineAIForm({ onSubmit, onClose }) {
  const [value, setValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    setLoading(true);
    try { await onSubmit(value.trim()); }
    finally { setLoading(false); }
  };

  return (
    <form className="iap-form" onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        className="iap-input"
        placeholder="Describe what to do (e.g. add types, refactor, explain)"
        value={value}
        onChange={e => setValue(e.target.value)}
        disabled={loading}
      />
      <button className="iap-submit" type="submit" disabled={loading || !value.trim()}>
        {loading ? '·' : '↵'}
      </button>
    </form>
  );
}

export default AppShell;
