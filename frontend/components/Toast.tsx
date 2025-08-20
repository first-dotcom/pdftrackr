"use client";

import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect, useState, useCallback, useMemo } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconStyles = {
  success: "text-green-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = toastIcons[type];

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-dismiss
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [id, duration, onClose]);

  return (
    <div
      className={`fixed top-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50 w-auto bg-white border rounded-lg shadow-lg transition-all duration-300 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } ${toastStyles[type]}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex p-4">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconStyles[type]}`} aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{title}</p>
          {message && <p className="mt-1 text-sm opacity-90 break-words">{message}</p>}
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(id), 300);
            }}
            className={`inline-flex rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${iconStyles[type]} hover:opacity-75 min-h-[44px] min-w-[44px] items-center justify-center touch-manipulation`}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToasts() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => addToast("success", title, message), [addToast]);
  const showError = useCallback((title: string, message?: string) => addToast("error", title, message), [addToast]);
  const showWarning = useCallback((title: string, message?: string) => addToast("warning", title, message), [addToast]);
  const showInfo = useCallback((title: string, message?: string) => addToast("info", title, message), [addToast]);

  return useMemo(() => ({
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }), [toasts, removeToast, showSuccess, showError, showWarning, showInfo]);
}
