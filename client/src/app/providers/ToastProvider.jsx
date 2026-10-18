import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANT_STYLES = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-500/40 text-accent',
  },
  error: {
    icon: AlertTriangle,
    className: 'border-red-500/40 text-danger',
  },
  info: {
    icon: Info,
    className: 'border-sky-500/40 text-info',
  },
};

let nextToastId = 1;

/**
 * Lightweight toast notifications with an accessible live region.
 * Toasts are ephemeral UI state, so no external state library is needed.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ title, description = '', variant = 'success', duration = 4500 }) => {
      const id = nextToastId++;
      setToasts((current) => [...current.slice(-2), { id, title, description, variant }]);
      const timer = setTimeout(() => dismissToast(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:bottom-4 sm:right-4 sm:left-auto sm:items-end"
      >
        {toasts.map((toast) => {
          const { icon: Icon, className } = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info;
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface/95 p-3.5 shadow-lg shadow-black/20 backdrop-blur ${className}`}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded-md p-1 text-fg-muted transition hover:bg-surface-2 hover:text-fg"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
}
