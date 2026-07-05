import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PRESET_THEMES, THEME_PREVIEWS, applyTheme } from '../utils/theme';

const FONT_FAMILIES = [
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code',      value: '"Fira Code", monospace' },
  { label: 'Cascadia Code',  value: '"Cascadia Code", monospace' },
  { label: 'Courier New',    value: '"Courier New", monospace' },
];

export default function SettingsPanel({ isOpen, onClose, editorRef }) {
  const [fontSize,    setFontSize]   = useState(() => parseInt(localStorage.getItem('cs_font_size')  || '13'));
  const [fontFamily,  setFontFamily] = useState(() => localStorage.getItem('cs_font_family') || FONT_FAMILIES[0].value);
  const [tabSize,     setTabSize]    = useState(() => parseInt(localStorage.getItem('cs_tab_size')   || '2'));
  const [wordWrap,    setWordWrap]   = useState(() => localStorage.getItem('cs_word_wrap') === 'on');
  const [minimap,     setMinimap]    = useState(() => localStorage.getItem('cs_minimap') !== 'false');
  const [activeTheme, setActiveTheme]= useState(() => document.documentElement.getAttribute('data-theme') || 'midnight');

  // Track external theme changes (e.g. via menu bar)
  useEffect(() => {
    const handler = (e) => setActiveTheme(e.detail?.themeId || 'midnight');
    window.addEventListener('cs:theme-change', handler);
    return () => window.removeEventListener('cs:theme-change', handler);
  }, []);

  // Apply stored settings when editor reference becomes available
  useEffect(() => {
    if (!editorRef?.current) return;
    editorRef.current.updateOptions({
      fontSize,
      fontFamily,
      tabSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
    });
  }, [editorRef?.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const apply = (opts) => editorRef?.current?.updateOptions(opts);

  const changeFont    = (v) => { setFontSize(v);   localStorage.setItem('cs_font_size', v);           apply({ fontSize: v }); };
  const changeFamily  = (v) => { setFontFamily(v); localStorage.setItem('cs_font_family', v);         apply({ fontFamily: v }); };
  const changeTab     = (v) => { setTabSize(v);    localStorage.setItem('cs_tab_size', v);            apply({ tabSize: v }); };
  const changeWrap    = (v) => { setWordWrap(v);   localStorage.setItem('cs_word_wrap', v ? 'on':'off'); apply({ wordWrap: v ? 'on' : 'off' }); };
  const changeMinimap = (v) => { setMinimap(v);    localStorage.setItem('cs_minimap', String(v));     apply({ minimap: { enabled: v } }); };

  const handleThemeSelect = (id) => {
    setActiveTheme(id);
    applyTheme(id);
  };

  return (
    <div className="settings-backdrop" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <span>Settings</span>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ── Appearance ── */}
          <div className="settings-section">
            <div className="settings-label">Theme</div>
            <div className="menu-theme-grid" style={{ padding: 0, gridTemplateColumns: '1fr 1fr' }}>
              {PRESET_THEMES.map(t => {
                const p = THEME_PREVIEWS[t.id];
                return (
                  <button
                    key={t.id}
                    className="menu-theme-btn"
                    style={{
                      border: activeTheme === t.id
                        ? '1px solid var(--cs-accent)'
                        : '0.5px solid var(--cs-border-subtle)',
                      display: 'flex', flexDirection: 'column', gap: 4, padding: '6px 8px',
                    }}
                    onClick={() => handleThemeSelect(t.id)}
                  >
                    {p && (
                      <div style={{ display:'flex', height:14, borderRadius:3, overflow:'hidden', width:'100%' }}>
                        <span style={{ flex:1, background: p.bg }} />
                        <span style={{ flex:1, background: p.surface }} />
                        <span style={{ flex:1, background: p.accent }} />
                      </div>
                    )}
                    <span style={{ fontSize: 10 }}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Editor ── */}
          <div className="settings-section">
            <div className="settings-label">Editor</div>

            <div className="settings-row">
              <span className="settings-row-label">Font size</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input type="range" min={10} max={24} value={fontSize}
                  onChange={e => changeFont(Number(e.target.value))} style={{ width: 80 }} />
                <span style={{ fontSize:11, color:'var(--cs-text-muted)', width:24, textAlign:'right' }}>{fontSize}</span>
              </div>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Font family</span>
              <select value={fontFamily} onChange={e => changeFamily(e.target.value)}
                style={{ fontSize:11, background:'var(--cs-bg-base)', color:'var(--cs-text-secondary)', border:'0.5px solid var(--cs-border-default)', borderRadius:'var(--cs-radius-sm)', padding:'2px 6px' }}>
                {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Tab size</span>
              <select value={tabSize} onChange={e => changeTab(Number(e.target.value))}
                style={{ fontSize:11, background:'var(--cs-bg-base)', color:'var(--cs-text-secondary)', border:'0.5px solid var(--cs-border-default)', borderRadius:'var(--cs-radius-sm)', padding:'2px 6px' }}>
                {[2,4,8].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Word wrap</span>
              <input type="checkbox" checked={wordWrap} onChange={e => changeWrap(e.target.checked)} />
            </div>

            <div className="settings-row">
              <span className="settings-row-label">Minimap</span>
              <input type="checkbox" checked={minimap} onChange={e => changeMinimap(e.target.checked)} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
