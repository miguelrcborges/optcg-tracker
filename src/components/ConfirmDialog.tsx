import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'btn-danger' : 'btn-primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex gap-3">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full ${
            tone === 'danger'
              ? 'bg-crimson-500/15 text-crimson-300'
              : 'bg-gold-400/15 text-gold-300'
          }`}
        >
          <AlertTriangle className="size-4.5" />
        </span>
        <p className="text-sm leading-relaxed text-mist-300">{description}</p>
      </div>
    </Modal>
  );
}
