import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';

export const ChatPanel = ({ isOpen, onClose, messages = [], typingUsers = [], onSendMessage, onNotifyTyping }) => {
  const [inputValue, setInputValue] = useState('');
  const [lastReadCount, setLastReadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const unread = isOpen ? 0 : Math.max(0, messages.length - lastReadCount);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when panel opens
  React.useEffect(() => {
    if (isOpen) setLastReadCount(messages.length);
  }, [isOpen, messages.length]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div 
      className={`h-full bg-[var(--color-editor-surface)] border-l border-[var(--color-editor-border)] flex flex-col transition-all duration-200 shrink-0 ${isOpen ? 'w-[320px] opacity-100' : 'w-0 opacity-0 overflow-hidden border-l-0'}`}
    >
      <div className="w-[320px] h-full flex flex-col shrink-0">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-editor-border)] shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-[var(--color-text-primary)]" />
            <h2 className="font-heading font-bold">Room Chat</h2>
            {unread > 0 && (
              <div className="bg-[var(--color-accent-primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                {unread}
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--color-text-secondary)] hover:text-white rounded-md hover:bg-[var(--color-editor-elevated)] transition-colors active:scale-[0.97]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message List */}
        <div 
          className="flex-1 flex flex-col min-h-0 custom-scrollbar"
          style={{ padding: '8px 4px', overflowY: 'auto', overflowX: 'hidden', width: '100%', boxSizing: 'border-box' }}
        >
          <div className="mt-auto space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2 w-full ${msg.isMe ? 'flex-row-reverse' : ''}`}
                style={{ animation: 'var(--animate-scale-in)' }}
              >
                {!msg.isMe && (
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-1"
                    style={{ backgroundColor: msg.color }}
                  >
                    {msg.sender.charAt(0)}
                  </div>
                )}
                
                <div className={`flex flex-col w-full`}>
                  {!msg.isMe && (
                    <span 
                      className="text-[10px] font-medium mb-1 pl-1" 
                      style={{ color: msg.color, marginLeft: '8px' }}
                    >
                      {msg.sender}
                    </span>
                  )}
                  
                  <div 
                    className={`text-sm ${msg.isMe ? 'bg-[var(--color-accent-primary)] text-white rounded-tr-[2px]' : 'bg-[var(--color-editor-elevated)] text-[var(--color-text-primary)] rounded-tl-[2px]'}`}
                    style={{
                      maxWidth: '75%',
                      width: 'fit-content',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      boxSizing: 'border-box',
                      marginLeft: msg.isMe ? 'auto' : '8px',
                      marginRight: msg.isMe ? '8px' : 'auto'
                    }}
                  >
                    {msg.text}
                  </div>
                  
                  <span 
                    style={{
                      fontSize: '10px',
                      textAlign: msg.isMe ? 'right' : 'left',
                      padding: '0 4px',
                      opacity: 0.5,
                      marginLeft: msg.isMe ? 'auto' : '8px',
                      marginRight: msg.isMe ? '8px' : 'auto',
                      marginTop: '4px',
                      display: 'block'
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        {/* Typing Indicator (Moved from input area to bottom of list) */}
        {typingUsers.length > 0 && (
          <div className="text-xs text-[var(--color-text-muted)] pb-2 px-4 flex items-center gap-1 h-4 shrink-0">
            <span className="font-medium" style={{ color: 'var(--color-accent-primary)' }}>
              {typeof typingUsers[0] === 'string' ? typingUsers[0] : typingUsers[0]?.name ?? 'Someone'}
            </span> is typing
            <span className="flex items-center gap-0.5 mt-1 ml-0.5">
              <span className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div 
        className="chat-composer-wrapper"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: 'var(--cs-surface, #1e1e2e)',
          borderTop: '1px solid var(--cs-border, rgba(255,255,255,0.08))',
          flexShrink: 0,
          minHeight: '56px'
        }}
      >
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); onNotifyTyping(); }}
          onKeyDown={handleKeyDown}
          placeholder="Message room..."
          className="chat-composer-input"
        />
        <button 
          onClick={handleSend}
          disabled={!inputValue.trim()}
          className="chat-composer-send"
        >
          <Send size={16} />
        </button>
      </div>

      </div>
    </div>
  );
};

export default ChatPanel;
