import { useState, useEffect, useRef } from 'react';
import { socket } from './useRoom';

export const useChat = (roomId, user) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket || !roomId) return;

    // Store handler references so we remove exactly these listeners on cleanup,
    // not all listeners for these events (socket.off('event') without a ref
    // would also remove listeners registered by other parts of the app).
    const handleMessage = (msg) => {
      setMessages((prev) => {
        // Prevent duplicates (our own optimistic messages have same id)
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, { ...msg, isMe: false }];
      });
    };

    const handleTyping = ({ isTyping, user: typingUser }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.find((u) => u.id === typingUser?.id)) return [...prev, typingUser];
          return prev;
        } else {
          return prev.filter((u) => u.id !== typingUser?.id);
        }
      });
    };

    // Chat history on room join (Phase 6 persistence)
    const handleHistory = (history) => {
      setMessages(prev => {
        const ids = new Set(prev.map(m => m.id));
        const incoming = history.filter(m => m.id && !ids.has(m.id));
        if (!incoming.length) return prev;
        return [...incoming, ...prev];
      });
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:typing',  handleTyping);
    socket.on('chat:history', handleHistory);

    const handleUnload = () => {
      socket.emit('chat:typing', { isTyping: false, user, roomId });
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:typing',  handleTyping);
      socket.off('chat:history', handleHistory);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [roomId]);

  const sendMessage = (text) => {
    if (!text.trim() || !socket) return;
    const msg = {
      id: Date.now(),
      text: text.trim(),
      sender: user.name,
      userId: user.id,
      color: user.color,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('chat:message', { message: msg, roomId });
    setMessages((prev) => [...prev, { ...msg, isMe: true }]);
  };

  const notifyTyping = () => {
    if (!socket) return;
    socket.emit('chat:typing', { isTyping: true, user, roomId });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { isTyping: false, user, roomId });
    }, 2000);
  };

  return {
    messages,
    typingUsers,
    sendMessage,
    notifyTyping,
  };
};
