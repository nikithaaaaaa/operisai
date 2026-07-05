import { useState, useEffect, useCallback } from 'react';

let _showToast = null;
export const showToast = (msg, type = 'default', duration = 2200) => _showToast?.(msg, type, duration);

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _showToast = (msg, type, duration) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    };
    return () => { _showToast = null; };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast${t.type !== 'default' ? ` toast-${t.type}` : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
