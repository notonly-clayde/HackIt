import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { useHudSoundOptional } from "./SoundContext"

export type ToastVariant = "error" | "success" | "info"

type ToastItem = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastContextValue = {
  show: (message: string, variant?: ToastVariant) => void
  error: (message: string) => void
  success: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION_MS = 3200

const variantClasses: Record<ToastVariant, string> = {
  error: "border-danger/50 text-danger",
  success: "border-highlight/50 text-highlight",
  info: "border-border text-accent",
}

function ToastViewport({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return createPortal(
    <div
      className="fixed bottom-6 left-1/2 z-[110] flex w-[min(92vw,28rem)] -translate-x-1/2 flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`ui-card pointer-events-auto px-4 py-2.5 text-sm shadow-xl animate-hud-in border ${variantClasses[toast.variant]}`}
        >
          <div className="flex min-h-10 items-center justify-between gap-3">
            <p className="leading-normal">{toast.message}</p>
            <button
              type="button"
              className="inline-flex shrink-0 items-center self-center text-xs leading-none text-muted hover:text-accent"
              onClick={() => onDismiss(toast.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const { play } = useHudSoundOptional()

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const trimmed = message.trim()
      if (!trimmed) return

      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message: trimmed, variant }].slice(-4))

      if (variant === "error") play("deny")
      else if (variant === "success") play("confirm")
      else play("tap")

      const timer = setTimeout(() => dismiss(id), DEFAULT_DURATION_MS)
      timersRef.current.set(id, timer)
    },
    [dismiss, play],
  )

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
      timersRef.current.clear()
    }
  }, [])

  const value = useMemo(
    () => ({
      show,
      error: (message: string) => show(message, "error"),
      success: (message: string) => show(message, "success"),
      info: (message: string) => show(message, "info"),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}

export function useToastOptional(): ToastContextValue {
  const ctx = useContext(ToastContext)
  return useMemo(
    () =>
      ctx ?? {
        show: () => {},
        error: () => {},
        success: () => {},
        info: () => {},
      },
    [ctx],
  )
}
