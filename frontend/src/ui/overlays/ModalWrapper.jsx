// ui/overlays/ModalWrapper.jsx
import { useEffect } from 'react';

export function ModalWrapper({ open = true, onClose, children, maxWidth = 'max-w-sm' }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (open === false) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}