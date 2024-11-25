"use client"

import * as React from "react"
import { Alert } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { CheckCircle2, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Toast {
  id: string
  type: 'success' | 'error'
  title: string
  message?: string
  duration?: number
  data?: Record<string, any>
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);

    if (toast.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toast.duration || 7000);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "transform transition-all duration-300 ease-in-out",
            "animate-in fade-in slide-in-from-right",
          )}
        >
          <Alert
            variant={toast.type === "success" ? "default" : "destructive"}
            className={cn(
              "relative pr-12 shadow-lg",
              toast.type === "success" && "border-green-500 bg-green-50",
              toast.type === "error" && "border-red-500 bg-red-50"
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-2 top-2 h-6 w-6",
                toast.type === "success" && "text-green-700 hover:text-green-900",
                toast.type === "error" && "text-red-700 hover:text-red-900"
              )}
              onClick={() => removeToast(toast.id)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex gap-3">
              {toast.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div className="flex-1 space-y-1">
                <h3 className={cn(
                  "font-medium",
                  toast.type === "success" && "text-green-800",
                  toast.type === "error" && "text-red-800"
                )}>
                  {toast.title}
                </h3>
                {toast.message && (
                  <p className={cn(
                    "text-sm",
                    toast.type === "success" && "text-green-700",
                    toast.type === "error" && "text-red-700"
                  )}>
                    {toast.message}
                  </p>
                )}
                {toast.data && (
                  <div className="mt-2 text-sm space-y-1">
                    {Object.entries(toast.data).map(([key, value]) => (
                      <p key={key} className="text-muted-foreground">
                        <span className="font-medium">{key}:</span> {value}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Alert>
        </div>
      ))}
    </div>
  );
}