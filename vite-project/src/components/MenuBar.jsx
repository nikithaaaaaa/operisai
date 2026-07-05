import { useState, useEffect, useRef } from 'react';
import { PRESET_THEMES, applyTheme } from '../utils/theme';

const MENUS = {
  File: [
    { label: 'New file',         shortcut: 'Ctrl N',       action: 'file:new' },
    { label: 'New room',         shortcut: 'Ctrl Shift N', action: 'file:new-room' },
    { separator: true },
    { label: 'Open folder',      shortcut: 'Ctrl O',       action: 'file:open-folder' },
    { separator: true },
    { label: 'Save snapshot',    shortcut: 'Ctrl S',       action: 'file:save-snapshot' },
    { label: 'Download file',    shortcut: 'Ctrl Shift S', action: 'file:download' },
    { separator: true },
    { label: 'Close tab',        shortcut: 'Ctrl W',       action: 'file:close' },
  ],
  Edit: [
    { label: 'Undo',             shortcut: 'Ctrl Z',       action: 'edit:undo' },
    { label: 'Redo',             shortcut: 'Ctrl Y',       action: 'edit:redo' },
    { separator: true },
    { label: 'Find',             shortcut: 'Ctrl F',       action: 'edit:find' },
    { label: 'Find & Replace',   shortcut: 'Ctrl H',       action: 'edit:replace' },
    { separator: true },
    { label: 'Format document',  shortcut: 'Shift Alt F',  action: 'edit:format' },
    { label: 'Toggle comment',   shortcut: 'Ctrl /',       action: 'edit:comment' },
  ],
  View: [
    { label: 'Explorer',         shortcut: 'Ctrl B',       action: 'view:explorer' },
    { label: 'AI assistant',     shortcut: 'Ctrl Shift A', action: 'view:ai' },
    { label: 'Chat',             shortcut: 'Ctrl Shift C', action: 'view:chat' },
    { separator: true },
    { label: 'Toggle word wrap', shortcut: 'Alt Z',        action: 'view:word-wrap' },
    { label: 'Toggle minimap',                             action: 'view:minimap' },
    { separator: true },
    { label: 'Zen mode',         shortcut: 'Ctrl K Z',     action: 'view:zen' },
    { label: 'Full screen',      shortcut: 'F11',          action: 'view:fullscreen' },
    { separator: true },
    { label: '── Themes ──',     isHeader: true },
    { label: '__themes__' },
  ],
  Run: [
    { label: 'Run file',         shortcut: 'F5',           action: 'run:run',  badge: 'soon' },
    { label: 'Stop',             shortcut: 'Shift F5',     action: 'run:stop', disabled: true },
  ],
  Collaboration: [
    { label: 'Copy room link',   shortcut: 'Ctrl Shift L', action: 'collab:copy-link' },
    { separator: true },
    { label: 'Version history',  shortcut: 'Ctrl Shift H', action: 'collab:history' },
    { label: 'Save snapshot now',                          action: 'collab:snapshot' },
    { separator: true },
    { label: 'Leave room',                                 action: 'collab:leave' },
  ],
  Help: [
    { label: 'Keyboard shortcuts', shortcut: 'Ctrl ?',     action: 'help:shortcuts' },
    { separator: true },
    { label: 'About OperisAI',                             action: 'help:about' },
  ],
};

export default function MenuBar({ onAction, activeUsers = [] }) {
  const [openMenu, setOpenMenu] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleAction = (action) => {
    setOpenMenu(null);
    onAction?.(action);
  };

  const renderItems = (items) => items.map((item, i) => {
    if (item.separator) return <div key={i} className="menu-sep" />;
    if (item.isHeader)  return <div key={i} style={{ padding:'4px 12px', fontSize:10, color:'var(--cs-text-disabled)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{item.label}</div>;
    if (item.label === '__themes__') {
      return (
        <div key="themes" className="menu-theme-grid">
          {PRESET_THEMES.map(t => (
            <button key={t.id} className="menu-theme-btn" onClick={() => { applyTheme(t.id); setOpenMenu(null); }}>
              {t.label}
            </button>
          ))}
        </div>
      );
    }
    return (
      <div
        key={i}
        className={`menu-dd-item${item.disabled ? ' disabled' : ''}`}
        onClick={() => !item.disabled && item.action && handleAction(item.action)}
      >
        <span className="menu-dd-label">{item.label}</span>
        {item.badge    && <span className="menu-dd-badge">{item.badge}</span>}
        {item.shortcut && <span className="menu-dd-key">{item.shortcut}</span>}
      </div>
    );
  });

  return (
    <div className="menubar" ref={barRef}>
      {/* Logo */}
      <div className="menubar-logo">
        <svg width="16" height="10" viewBox="0 0 18 11">
          <circle cx="6"  cy="5.5" r="5.5" fill="var(--cs-accent)" opacity=".9"/>
          <circle cx="12" cy="5.5" r="5.5" fill="var(--cs-accent)" opacity=".55"/>
        </svg>
        <span className="menubar-logo-text">OperisAI</span>
      </div>

      {/* Menu items */}
      {Object.entries(MENUS).map(([name, items]) => (
        <div
          key={name}
          className={`menubar-item${openMenu === name ? ' open' : ''}`}
          onClick={() => setOpenMenu(openMenu === name ? null : name)}
        >
          {name}
          {openMenu === name && (
            <div className="menu-dropdown" onClick={e => e.stopPropagation()}>
              {renderItems(items)}
            </div>
          )}
        </div>
      ))}

      <div className="menubar-spacer" />
      <div className="menubar-title">OperisAI — P2P IDE</div>
    </div>
  );
}
