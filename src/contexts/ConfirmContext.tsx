import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import ConfirmDialog, { type ConfirmVariant } from "../components/ui/ConfirmDialog"

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

type AlertOptions = Omit<ConfirmOptions, "cancelLabel" | "variant"> & {
  confirmLabel?: string
}

type ActiveDialog =
  | ({
      kind: "confirm"
      resolve: (value: boolean) => void
    } & ConfirmOptions)
  | ({
      kind: "alert"
      resolve: () => void
    } & AlertOptions)

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: AlertOptions) => Promise<void>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null)
  const dialogRef = useRef<ActiveDialog | null>(null)

  const closeDialog = useCallback((result: boolean) => {
    const active = dialogRef.current
    if (!active) return

    dialogRef.current = null
    setDialog(null)

    if (active.kind === "confirm") {
      active.resolve(result)
      return
    }

    active.resolve()
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    if (dialogRef.current) {
      if (dialogRef.current.kind === "confirm") {
        dialogRef.current.resolve(false)
      } else {
        dialogRef.current.resolve()
      }
    }

    return new Promise<boolean>((resolve) => {
      const next: ActiveDialog = {
        kind: "confirm",
        ...options,
        resolve,
      }
      dialogRef.current = next
      setDialog(next)
    })
  }, [])

  const alert = useCallback((options: AlertOptions) => {
    if (dialogRef.current) {
      if (dialogRef.current.kind === "confirm") {
        dialogRef.current.resolve(false)
      } else {
        dialogRef.current.resolve()
      }
    }

    return new Promise<void>((resolve) => {
      const next: ActiveDialog = {
        kind: "alert",
        ...options,
        resolve,
      }
      dialogRef.current = next
      setDialog(next)
    })
  }, [])

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel}
        cancelLabel={dialog?.kind === "confirm" ? dialog.cancelLabel : undefined}
        variant={dialog?.kind === "confirm" ? dialog.variant : "primary"}
        alertOnly={dialog?.kind === "alert"}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider")
  }
  return ctx
}

export function useConfirmOptional(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  return useMemo(
    () =>
      ctx ?? {
        confirm: async () => window.confirm("Continue?"),
        alert: async (options) => {
          window.alert(options.message)
        },
      },
    [ctx],
  )
}
