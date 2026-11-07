import { LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, busy, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="admin-dialog w-[min(440px,calc(100vw-32px))]"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <div className="p-6 sm:p-7">
        <span className="grid size-12 place-items-center rounded-full bg-blush-100 text-primary-hover">
          <Trash2 className="size-6" strokeWidth={1.5} />
        </span>
        <h2 id="confirm-title" className="mt-5 font-display text-[28px] leading-tight text-ink">
          Rostdan ham o‘chirmoqchimisiz?
        </h2>
        <p className="mt-2 text-[15px] text-ink-soft">Bu amalni qaytarib bo‘lmaydi.</p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            <span>Bekor qilish</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Trash2 className="size-5" />
            )}
            <span>O‘chirish</span>
          </button>
        </div>
      </div>
    </dialog>
  );
}
