import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  eyebrow?: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ open, eyebrow, title, onClose, children }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-ink-950/60 backdrop-blur-md animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass-strong rounded-3xl w-full max-w-lg max-h-[88vh] overflow-y-auto animate-fade-up shadow-glass-lg">
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h3 className="font-display text-3xl font-medium text-pearl">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-pearl/40 hover:text-champagne-300 hover:bg-white/[0.05] transition-all duration-300"
            aria-label="Close"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="gold-divider mx-8" />
        <div className="px-8 py-7">{children}</div>
      </div>
    </div>
  );
}
