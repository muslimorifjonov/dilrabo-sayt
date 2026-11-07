import { CircleAlert, CircleCheck, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('ToastProvider topilmadi');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, kind, message }]);
      window.setTimeout(() => remove(id), kind === 'error' ? 6500 : 3500);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex flex-col items-center gap-2 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`admin-toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border px-4 py-3 text-[15px] font-semibold shadow-card ${
              t.kind === 'success'
                ? 'border-line bg-white text-ink'
                : 'border-rose-300 bg-blush-100 text-ink'
            }`}
          >
            {t.kind === 'success' ? (
              <CircleCheck className="size-5 flex-none text-primary" strokeWidth={1.75} />
            ) : (
              <CircleAlert className="size-5 flex-none text-primary-hover" strokeWidth={1.75} />
            )}
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="grid size-9 flex-none place-items-center rounded-full text-ink-soft hover:bg-blush-100"
              aria-label="Yopish"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
