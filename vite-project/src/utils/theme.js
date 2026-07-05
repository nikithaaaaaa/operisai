const KEY = 'codesync_theme';

export const PRESET_THEMES = [
  { id: 'midnight',   label: 'Midnight',  dark: true  },
  { id: 'dracula',    label: 'Dracula',   dark: true  },
  { id: 'nord',       label: 'Nord',      dark: true  },
  { id: 'mocha',      label: 'Mocha',     dark: true  },
  { id: 'solarized',  label: 'Solarized', dark: true  },
  { id: 'rose-pine',  label: 'Rose Piné', dark: true  },
  { id: 'light',      label: 'Light',     dark: false },
  { id: 'sand',       label: 'Sand',      dark: false },
];

// Hardcoded preview swatches for theme cards in SettingsPanel
export const THEME_PREVIEWS = {
  midnight:   { bg: '#0d1117', surface: '#161b22', accent: '#58a6ff' },
  dracula:    { bg: '#282a36', surface: '#21222c', accent: '#bd93f9' },
  nord:       { bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0' },
  mocha:      { bg: '#1e1e2e', surface: '#181825', accent: '#cba6f7' },
  solarized:  { bg: '#002b36', surface: '#073642', accent: '#268bd2' },
  'rose-pine':{ bg: '#191724', surface: '#1f1d2e', accent: '#eb6f92' },
  light:      { bg: '#ffffff', surface: '#f6f8fa', accent: '#0969da' },
  sand:       { bg: '#fdf6ec', surface: '#f5ebe0', accent: '#9c6644' },
};

export function applyTheme(themeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  // Remove any custom inline tokens so preset CSS takes over
  const customTokens = ['--cs-bg-base','--cs-bg-surface','--cs-bg-elevated','--cs-accent',
    '--cs-accent-hover','--cs-accent-muted','--cs-accent-fg','--cs-syn-keyword',
    '--cs-syn-string','--cs-syn-function','--cs-syn-comment'];
  customTokens.forEach(t => document.documentElement.style.removeProperty(t));
  localStorage.setItem(KEY, themeId);
  window.dispatchEvent(new CustomEvent('cs:theme-change', { detail: { themeId } }));
}

/** Apply individual CSS token overrides without changing the preset */
export function applyCustomTheme(tokens) {
  document.documentElement.removeAttribute('data-theme');
  Object.entries(tokens).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
  localStorage.setItem(KEY, 'custom');
  window.dispatchEvent(new CustomEvent('cs:theme-change', { detail: { themeId: 'custom' } }));
}

export function loadSavedTheme() {
  const saved = localStorage.getItem(KEY) || 'midnight';
  if (saved !== 'custom') applyTheme(saved);
}
