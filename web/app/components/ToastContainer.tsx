"use client";

import { X } from "lucide-react";
import { useToastListener, type Toast } from "@/app/hooks/useToast";

const VARIANT_STYLES: Record<string, { border: string; text: string }> = {
  success: { border: "#22c55e", text: "text-profit" },
  error: { border: "#ef4444", text: "text-loss" },
  info: { border: "#6366f1", text: "text-accent" },
};

export default function ToastContainer() {
  const { toasts, dismiss } = useToastListener();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const style = VARIANT_STYLES[t.variant] || VARIANT_STYLES.info;
        return (
          <div
            key={t.id}
            className="rounded-lg p-3 pr-8 relative"
            style={{
              background: "#18181b",
              border: "1px solid rgba(255,255,255,0.10)",
              borderLeft: `3px solid ${style.border}`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
              animation: "slideIn 200ms ease-out",
            }}
          >
            <p className={`text-sm ${style.text}`}>{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="absolute top-2 right-2 text-muted hover:text-primary"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
