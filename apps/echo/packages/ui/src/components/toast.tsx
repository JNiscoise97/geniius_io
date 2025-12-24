import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  icon?: React.ReactNode | string;
  duration?: number; // ms
};

type ToastCtx = {
  show: (opts: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<number, number>>({});

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback((opts: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const item: ToastItem = {
      id,
      title: opts.title,
      description: opts.description,
      icon: opts.icon,
      duration: opts.duration ?? 2500,
    };
    setItems((prev) => [...prev, item]);
    timers.current[id] = window.setTimeout(() => remove(id), item.duration);
  }, [remove]);

  // cleanup
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((t) => window.clearTimeout(t));
      timers.current = {};
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onClose={remove} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ items, onClose }: { items: ToastItem[]; onClose: (id:number)=>void }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="true">
      {items.map((t) => (
        <div key={t.id} className="toast-item" role="status">
          <div className="toast-row">
            {t.icon ? <span className="toast-icon">{typeof t.icon === "string" ? t.icon : t.icon}</span> : null}
            <div className="toast-content">
              <div className="toast-title">{t.title}</div>
              {t.description ? <div className="toast-desc">{t.description}</div> : null}
            </div>
            <button className="toast-close" aria-label="Fermer" onClick={() => onClose(t.id)}>×</button>
          </div>
        </div>
      ))}
    </div>
  );
}
