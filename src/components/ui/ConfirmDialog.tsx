import { useEffect, useRef } from "react"
import Modal from "./Modal"
import Button from "./Button"

export type ConfirmVariant = "danger" | "primary"

export type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  alertOnly?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  alertOnly = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return

    const focusTarget = variant === "danger" && !alertOnly ? cancelRef.current : confirmRef.current
    focusTarget?.focus()
  }, [open, variant, alertOnly])

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      kicker={variant === "danger" ? "Warning" : "Confirm"}
      size="sm"
      footer={
        alertOnly ? (
          <Button ref={confirmRef} variant="primary" onClick={onConfirm}>
            OK
          </Button>
        ) : (
          <>
            <Button ref={cancelRef} variant="secondary" onClick={onCancel}>
              {cancelLabel}
            </Button>
            <Button
              ref={confirmRef}
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          </>
        )
      }
    />
  )
}

export default ConfirmDialog
