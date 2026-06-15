import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDeleteModalProps {
  open: boolean;
  /** Modal heading, e.g. "Delete Staff Member" */
  title: string;
  /** Sentence describing exactly which record is about to be removed. */
  message: string;
  onCancel: () => void;
  /** Performs the DELETE call; a thrown error is shown inside the modal. */
  onConfirm: () => Promise<void>;
}

/**
 * Shared delete-confirmation dialog. The parent owns the API call (passed via
 * onConfirm); this component handles the busy state and shows API failures
 * (e.g. foreign-key conflicts) without closing, so the user can read them.
 */
export default function ConfirmDeleteModal({ open, title, message, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fresh state every time the dialog is opened for a new record
  useEffect(() => {
    if (open) {
      setBusy(false);
      setError(null);
    }
  }, [open]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onCancel} eyebrow="Irreversible Action" title={title}>
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <span className="rounded-full p-2.5 bg-red-400/10 border border-red-400/20 shrink-0">
            <AlertTriangle size={17} strokeWidth={1.5} className="text-red-300/90" />
          </span>
          <div>
            <p className="text-sm text-pearl/75 leading-relaxed">{message}</p>
            <p className="text-xs text-pearl/40 mt-1.5 italic">This action cannot be undone.</p>
          </div>
        </div>

        {error && (
          <div className="glass rounded-2xl px-5 py-4 border-red-400/20 flex items-center gap-3 animate-fade-up">
            <AlertTriangle size={16} strokeWidth={1.5} className="text-red-300/80 shrink-0" />
            <p className="text-sm text-red-200/90">{error}</p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleConfirm} disabled={busy}>
            <Trash2 size={15} strokeWidth={1.5} />
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
