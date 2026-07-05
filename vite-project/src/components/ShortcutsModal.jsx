const SHORTCUTS = [
  { category: 'File', keys: [
    ['Ctrl N',       'New file'],
    ['Ctrl S',       'Save snapshot'],
    ['Ctrl W',       'Close tab'],
    ['Ctrl Shift S', 'Download file'],
  ]},
  { category: 'Edit', keys: [
    ['Ctrl Z',       'Undo'],
    ['Ctrl Y',       'Redo'],
    ['Ctrl F',       'Find'],
    ['Ctrl H',       'Find & Replace'],
    ['Shift Alt F',  'Format document'],
    ['Ctrl /',       'Toggle comment'],
  ]},
  { category: 'View', keys: [
    ['Ctrl B',       'Toggle explorer'],
    ['Ctrl Shift A', 'Toggle AI panel'],
    ['Ctrl Shift C', 'Toggle chat'],
    ['Alt Z',        'Word wrap'],
    ['Ctrl K Z',     'Zen mode'],
    ['F11',          'Full screen'],
  ]},
  { category: 'Collaboration', keys: [
    ['Ctrl Shift L', 'Copy room link'],
    ['Ctrl Shift H', 'Version history'],
    ['Ctrl K',       'AI inline prompt'],
  ]},
];

export default function ShortcutsModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box shortcuts-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span>Keyboard shortcuts</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="shortcuts-grid">
          {SHORTCUTS.map(section => (
            <div key={section.category} className="shortcut-section">
              <div className="shortcut-category">{section.category}</div>
              {section.keys.map(([key, label]) => (
                <div key={key} className="shortcut-row">
                  <span className="shortcut-label">{label}</span>
                  <kbd className="shortcut-key">{key}</kbd>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
