import React, { useState } from 'react';
import { X, Sparkles, Wand2, Play, Check, Copy, BookOpen, Wrench, Eye, ChevronRight } from 'lucide-react';
import { showToast } from './Toast';

export const AIPanel = ({ isOpen, onClose, isLoading, aiResponse, onExplain, onFix, onGenerate, onInsertCode, selectedCode, language, roomId, editorRef }) => {
  const [activeTab, setActiveTab] = useState('explain');
  const [inputText, setInputText] = useState('');
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const tabs = [
    { id: 'explain',  label: 'Explain',  icon: BookOpen },
    { id: 'fix',      label: 'Fix',      icon: Wrench },
    { id: 'generate', label: 'Generate', icon: Wand2 },
    { id: 'review',   label: 'Review',   icon: Eye },
  ];

  const handleAction = () => {
    if (activeTab === 'explain') onExplain();
    else if (activeTab === 'fix') onFix();
    else if (activeTab === 'generate') onGenerate(inputText);
    else if (activeTab === 'review') handleReview();
  };

  const handleReview = async () => {
    setReviewLoading(true);
    setReviewItems([]);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'review', code: selectedCode || '', language, roomId }),
      });
      if (!res.ok) throw new Error('Review failed');
      const { result, response } = await res.json();
      const raw = (result || response || '').replace(/```json|```/g, '').trim();
      const items = JSON.parse(raw);
      setReviewItems(Array.isArray(items) ? items : []);
    } catch (e) {
      showToast('Review failed — check console', 'error');
      console.error('[Review]', e);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div 
      className={`absolute top-0 right-0 z-50 h-full bg-[var(--color-editor-surface)]/95 backdrop-blur-xl border-l border-[var(--color-editor-border)] flex flex-col transition-all duration-200 shrink-0 ${isOpen ? 'w-[320px] opacity-100 shadow-2xl' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}
    >
      <div className="w-[320px] h-full flex flex-col shrink-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-editor-border)] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-accent-primary)] animate-pulse" />
            <h2 className="font-heading font-bold text-sm text-[var(--color-text-primary)]">AI Assistant</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[var(--color-text-secondary)] hover:text-white rounded-lg hover:bg-[var(--color-editor-elevated)] transition-colors active:scale-[0.97] bg-transparent border-0 outline-none cursor-pointer"
            style={{ background: 'transparent', border: 'none' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="p-4 shrink-0 pb-2">
          <div className="flex items-center relative bg-[var(--color-editor-base)] p-1 rounded-xl border border-[var(--color-editor-border)] shadow-inner">
            {/* Sliding Indicator */}
            <div 
              className="absolute top-1 bottom-1 bg-[var(--color-editor-surface)] rounded-lg shadow-sm border border-[rgba(255,255,255,0.06)] transition-all duration-300 ease-out"
              style={{
                width: 'calc(25% - 2px)',
                left: `calc(${tabs.findIndex(t => t.id === activeTab) * 25}% + 1px)`,
              }}
            />
            
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-1.5 text-xs font-medium z-10 transition-all duration-200 rounded-lg flex flex-col items-center gap-0.5 bg-transparent border-0 outline-none cursor-pointer hover:bg-transparent ${activeTab === tab.id ? 'text-[var(--color-accent-primary)] font-semibold' : 'text-[var(--color-text-secondary)] hover:text-white'}`}
                  style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
                >
                  <TabIcon size={14} className={activeTab === tab.id ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'} />
                  <span className="text-[10px] tracking-wide mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-b border-[var(--color-editor-border)] shrink-0 space-y-4">
          {(activeTab === 'explain' || activeTab === 'fix' || activeTab === 'review') ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] flex items-center justify-between tracking-wide">
                <span>{activeTab === 'review' ? 'REVIEW TARGET' : 'SELECTED SNIPPET'}</span>
                {selectedCode && (
                  <span className="text-[10px] opacity-75 font-semibold bg-[var(--color-editor-base)] px-2 py-0.5 rounded-md border border-[var(--color-editor-border)] uppercase tracking-wider text-[var(--color-text-secondary)]">
                    {language}
                  </span>
                )}
              </div>
              
              {selectedCode ? (
                <div className="bg-[var(--color-editor-base)] border border-[var(--color-editor-border)] rounded-lg font-mono text-[11px] text-[var(--color-text-primary)] max-h-32 overflow-hidden relative shadow-inner group">
                  <pre className="p-3 opacity-90 whitespace-pre-wrap break-all pr-8 select-all leading-relaxed">
                    {selectedCode}
                  </pre>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCode);
                      showToast('Snippet copied!', 'success');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded bg-[var(--color-editor-surface)] hover:bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] text-[var(--color-text-secondary)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-transparent cursor-pointer"
                    style={{ background: 'var(--cs-bg-surface)', border: '1px solid var(--cs-border-default)' }}
                    title="Copy selection"
                  >
                    <Copy size={12} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[var(--color-editor-base)] to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-5 border border-dashed border-[var(--color-editor-border)] rounded-lg bg-[var(--color-editor-base)]/20 text-center gap-1 min-h-[80px]">
                  <span className="text-[11px] text-[var(--color-text-secondary)] font-semibold tracking-wide">No Selection Active</span>
                  <p className="text-[10px] text-[var(--color-text-muted)] max-w-[220px] leading-normal opacity-70">Highlight code in the editor to target this action.</p>
                </div>
              )}

              <button
                onClick={handleAction}
                disabled={!selectedCode && activeTab !== 'explain'}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all duration-150 shadow-md ${
                  (!selectedCode && activeTab !== 'explain')
                    ? 'bg-[var(--color-editor-elevated)] border border-[var(--color-editor-border)] text-[var(--color-text-muted)] opacity-60 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer shadow-[var(--color-accent-primary)]/10'
                }`}
                style={{ border: (!selectedCode && activeTab !== 'explain') ? '1px solid var(--color-editor-border)' : 'none' }}
              >
                <Play size={13} fill="currentColor" className={(!selectedCode && activeTab !== 'explain') ? 'text-[var(--color-text-muted)]' : 'text-white'} />
                <span>{activeTab === 'explain' ? 'Run Explanation' : activeTab === 'fix' ? 'Run Fix' : 'Run Review'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
               <div className="relative">
                 <textarea
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   placeholder="Describe what you want to build (e.g. 'a function to parse CSV files'...)"
                   className="w-full bg-[var(--color-editor-base)] border border-[var(--color-editor-border)] rounded-lg p-3 text-sm text-[var(--color-text-primary)] focus:focus-ring-accent min-h-[110px] resize-none outline-none transition-all duration-200 pr-8"
                 />
                 {inputText && (
                   <button 
                     onClick={() => setInputText('')}
                     className="absolute top-2 right-2 text-[var(--color-text-secondary)] hover:text-white text-xs bg-transparent border-0 outline-none cursor-pointer"
                     style={{ background: 'transparent', border: 'none' }}
                   >
                     <X size={12} />
                   </button>
                 )}
               </div>
               <button
                 onClick={handleAction}
                 disabled={!inputText.trim()}
                 className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] hover:opacity-90 text-white rounded-lg py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 shadow-md shadow-[var(--color-accent-primary)]/10 cursor-pointer"
                 style={{ border: 'none' }}
               >
                 <Wand2 size={14} />
                 <span>Generate Code</span>
               </button>
            </div>
          )}
        </div>

        {/* Response Area */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Review tab content */}
          {activeTab === 'review' ? (
            reviewLoading ? (
              <div className="space-y-4 py-2 animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-editor-border)]" />
                  <div className="h-3 w-1/3 bg-[var(--color-editor-border)] rounded" />
                </div>
                <div className="space-y-3 pl-6">
                  <div className="h-16 w-full bg-[var(--color-editor-border)] rounded-lg" />
                  <div className="h-16 w-full bg-[var(--color-editor-border)] rounded-lg" />
                </div>
              </div>
            ) : reviewItems.length > 0 ? (
              <div className="space-y-2.5 pb-6">
                {reviewItems.map((item, i) => {
                  const ICONS   = { error: '✕', warning: '▲', info: 'ℹ' };
                  const COLORS  = { error: 'var(--cs-error)', warning: 'var(--cs-warning)', info: 'var(--cs-info)' };
                  const BG_COLORS = { error: 'rgba(248,81,73,0.08)', warning: 'rgba(210,153,34,0.08)', info: 'rgba(88,166,255,0.08)' };
                  const BORDER_COLORS = { error: 'rgba(248,81,73,0.2)', warning: 'rgba(210,153,34,0.2)', info: 'rgba(88,166,255,0.2)' };
                  
                  return (
                    <div 
                      key={i} 
                      className="p-3 rounded-lg border flex gap-3 text-xs leading-relaxed transition-all duration-150 hover:translate-x-0.5"
                      style={{ 
                        backgroundColor: BG_COLORS[item.severity] || 'rgba(88,166,255,0.08)',
                        borderColor: BORDER_COLORS[item.severity] || 'rgba(88,166,255,0.2)'
                      }}
                    >
                      <span 
                        className="font-bold shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px]" 
                        style={{ 
                          color: '#fff', 
                          backgroundColor: COLORS[item.severity] || 'var(--cs-info)' 
                        }}
                      >
                        {ICONS[item.severity] || 'ℹ'}
                      </span>
                      <div className="flex-1 space-y-1.5">
                        <p className="text-[var(--color-text-primary)] font-medium">{item.message}</p>
                        {item.line && (
                          <button 
                            className="text-[10px] font-semibold text-[var(--color-accent-primary)] hover:underline flex items-center gap-0.5 bg-transparent border-0 outline-none cursor-pointer"
                            style={{ background: 'transparent', border: 'none' }}
                            onClick={() => {
                              editorRef?.current?.revealLineInCenter(item.line);
                              editorRef?.current?.setPosition({ lineNumber: item.line, column: 1 });
                            }}
                          >
                            <span>Jump to Line {item.line}</span>
                            <ChevronRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] text-center pb-12">
                <Sparkles size={32} className="mb-4 opacity-20 text-[var(--color-accent-primary)] animate-pulse" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Static Code Analysis</p>
                <p className="text-xs opacity-75 mt-1 max-w-[200px]">Select code and click Review to inspect styling and security issues.</p>
              </div>
            )
          ) : isLoading ? (
            <div className="space-y-4 py-2 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[var(--color-editor-border)]" />
                <div className="h-3 w-1/4 bg-[var(--color-editor-border)] rounded" />
              </div>
              <div className="space-y-2 pl-6">
                <div className="h-4 w-full bg-[var(--color-editor-border)] rounded" />
                <div className="h-4 w-5/6 bg-[var(--color-editor-border)] rounded" />
                <div className="h-4 w-4/5 bg-[var(--color-editor-border)] rounded" />
              </div>
              <div className="h-24 w-full bg-[var(--color-editor-border)] rounded-lg mt-4" />
            </div>
          ) : aiResponse ? (
            <div className="space-y-4 animate-[fadeIn_0.3s_ease-out] pb-6">
              <div className="flex gap-2.5 items-start text-[13px] leading-relaxed text-[var(--color-text-primary)]">
                 <Sparkles size={15} className="text-[var(--color-accent-primary)] shrink-0 mt-1" />
                 <div className="flex-1 space-y-3">
                   {aiResponse.split('```').map((block, index) => {
                     if (index % 2 === 1) {
                       const lines = block.split('\n');
                       const codeLang = lines[0]?.trim() || 'code';
                       const code = lines.slice(1, -1).join('\n');
                       return (
                         <div key={index} className="my-3 bg-[var(--color-editor-base)] border border-[var(--color-editor-border)] rounded-lg overflow-hidden shadow-md group/code">
                           <div className="bg-[var(--color-editor-elevated)] px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)] flex justify-between items-center border-b border-[var(--color-editor-border)]">
                             <span className="font-mono text-[10px] tracking-wider uppercase opacity-80">{codeLang}</span>
                             <button 
                               className="text-[var(--color-text-secondary)] hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer"
                               style={{ background: 'transparent', border: 'none' }}
                               onClick={() => {
                                 navigator.clipboard.writeText(code);
                                 showToast('Code copied!', 'success');
                               }}
                               title="Copy code"
                             >
                               <Copy size={12}/>
                             </button>
                           </div>
                           <pre className="p-3.5 font-mono text-xs overflow-x-auto custom-scrollbar" style={{ color: 'var(--cs-syn-string)' }}>
                             <code>{code}</code>
                           </pre>
                         </div>
                       );
                     }
                     return <p key={index} className="whitespace-pre-wrap leading-relaxed opacity-95">{block}</p>;
                   })}
                 </div>
              </div>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] text-center pb-12">
               <Sparkles size={32} className="mb-4 opacity-20 text-[var(--color-accent-primary)] animate-pulse" />
               <p className="text-sm font-medium text-[var(--color-text-secondary)] font-sans">AI Ready</p>
               <p className="text-xs opacity-75 mt-1 max-w-[200px]">Select code and choose an action above to get started.</p>
             </div>
          )}
        </div>

        {/* Bottom CTA (if generated or fixed) */}
        {aiResponse && activeTab !== 'explain' && (
          <div className="p-4 border-t border-[var(--color-editor-border)] shrink-0 bg-[var(--color-editor-surface)] animate-[fadeIn_0.3s_ease-out]">
            <button 
              onClick={() => {
                const codeBlocks = aiResponse.split('```').filter((_, i) => i % 2 === 1).map(block => block.split('\n').slice(1, -1).join('\n'));
                if (codeBlocks.length) onInsertCode(codeBlocks[0]);
              }}
              className="w-full bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] hover:opacity-90 text-white font-semibold rounded-lg py-3 flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] hover-glow shadow-lg shadow-[var(--color-accent-primary)]/10 cursor-pointer animate-[fadeIn_0.3s_ease-out]"
              style={{ border: 'none' }}
            >
               <Check size={16} />
               <span>Insert at Cursor</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIPanel;

