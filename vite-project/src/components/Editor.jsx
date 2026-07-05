import React, { useEffect, useRef } from 'react';
import MonacoEditor from '@monaco-editor/react';

function registerMonacoTheme(monaco) {
  const s = getComputedStyle(document.documentElement);
  const cv = (k) => s.getPropertyValue(k).trim();
  const hex = (k) => cv(k).replace('#', '');

  monaco.editor.defineTheme('cs-dynamic', {
    base: cv('--cs-bg-base') === '#ffffff' || cv('--cs-bg-base') === '#fdf6ec' ? 'vs' : 'vs-dark',
    inherit: false,
    rules: [
      { token: 'keyword',    foreground: hex('--cs-syn-keyword') },
      { token: 'string',     foreground: hex('--cs-syn-string') },
      { token: 'string.sql', foreground: hex('--cs-syn-string') },
      { token: 'identifier', foreground: hex('--cs-text-secondary').replace('#', '') },
      { token: 'type',       foreground: hex('--cs-syn-type') },
      { token: 'number',     foreground: hex('--cs-syn-number') },
      { token: 'comment',    foreground: hex('--cs-syn-comment'), fontStyle: 'italic' },
      { token: 'delimiter',  foreground: hex('--cs-text-muted').replace('#', '') },
      { token: '',           foreground: hex('--cs-text-secondary').replace('#', '') },
    ],
    colors: {
      'editor.background':               cv('--cs-bg-base'),
      'editor.foreground':               cv('--cs-text-secondary'),
      'editorLineNumber.foreground':     cv('--cs-text-disabled'),
      'editorLineNumber.activeForeground': cv('--cs-text-muted'),
      'editor.selectionBackground':      cv('--cs-accent-muted'),
      'editor.lineHighlightBackground':  cv('--cs-bg-surface'),
      'editorCursor.foreground':         cv('--cs-accent'),
      'editorWhitespace.foreground':     cv('--cs-border-subtle'),
      'editorWidget.background':         cv('--cs-bg-elevated'),
      'editorWidget.border':             cv('--cs-border-default'),
      'editorSuggestWidget.background':  cv('--cs-bg-elevated'),
      'editorSuggestWidget.border':      cv('--cs-border-default'),
      'editorSuggestWidget.selectedBackground': cv('--cs-bg-surface'),
      'input.background':                cv('--cs-bg-elevated'),
      'input.border':                    cv('--cs-border-default'),
      'focusBorder':                     cv('--cs-accent'),
      'scrollbarSlider.background':      cv('--cs-border-subtle'),
      'scrollbarSlider.hoverBackground': cv('--cs-border-default'),
    },
  });
  monaco.editor.setTheme('cs-dynamic');
}

export const Editor = ({ onMount, language }) => {
  const monacoRef = useRef(null);

  const handleMount = (editor, monaco) => {
    monacoRef.current = monaco;

    editor.updateOptions({
      fontFamily:              '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
      fontSize:                13,
      lineHeight:              20,
      minimap:                 { enabled: true, scale: 1 },
      scrollbar:               { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      renderLineHighlight:     'line',
      cursorBlinking:          'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling:         true,
      bracketPairColorization: { enabled: true },
      guides:                  { bracketPairs: true, indentation: true },
      padding:                 { top: 12, bottom: 12 },
      overviewRulerBorder:     false,
      hideCursorInOverviewRuler: true,
      renderWhitespace:        'selection',
      tabSize:                 2,
      wordWrap:                'off',
      scrollBeyondLastLine:    false,
    });

    registerMonacoTheme(monaco);

    const handler = () => registerMonacoTheme(monaco);
    window.addEventListener('cs:theme-change', handler);
    editor._csThemeCleanup = () => window.removeEventListener('cs:theme-change', handler);

    onMount?.(editor, monaco);
  };

  // Clean up theme listener when component unmounts
  useEffect(() => {
    return () => {
      // cleanup is stored on the editor instance
    };
  }, []);

  return (
    <div className="w-full h-full absolute inset-0 text-left">
      <MonacoEditor
        height="100%"
        width="100%"
        theme="cs-dynamic"
        language={language || 'javascript'}
        onMount={handleMount}
        options={{ padding: { top: 12 } }}
      />
    </div>
  );
};

export default Editor;
