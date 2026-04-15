"use client";

import { useState, useEffect, useCallback } from "react";

export type ToastVariant = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

let listeners: ((toast: Toast) => void)[] = [];
let nextId = 0;

function emit(message: string, variant: ToastVariant) {
  const toast: Toast = { id: nextId++, message, variant };
  listeners.forEach((fn) => fn(toast));
}

export const toast = {
  success: (message: string) => emit(message, "success"),
  error: (message: string) => emit(message, "error"),
  info: (message: string) => emit(message, "info"),
};

export function useToastListener() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      const duration = t.variant === "error" ? 6000 : 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((p) => p.id !== t.id));
      }, duration);
    };
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}
