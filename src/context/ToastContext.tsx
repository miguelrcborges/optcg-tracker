import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, string> = {
  success: 'border-emerald-400/35 bg-emerald-950/90 text-emerald-100',
  error: 'border-crimson-400/40 bg-crimson-950/90 text-crimson-100',
  info: 'border-gold-400/30 bg-ink-800/95 text-mist-100',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      const timer = window.setTimeout(() => dismiss(id), 3600);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/50 backdrop-blur-md animate-toast-in ${TONE_STYLES[item.tone]}`}
          >
            {item.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            ) : item.tone === 'error' ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-md p-0.5 opacity-60 transition hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return value;
}
