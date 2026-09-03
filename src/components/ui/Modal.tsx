import { useEffect, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { HiOutlineXMark } from "react-icons/hi2"
import { useHudSound } from "../../contexts/SoundContext"

type ModalSize = "md" | "sm"

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  kicker?: string
  size?: ModalSize
  showClose?: boolean
}

const sizeClass: Record<ModalSize, string> = {
  md: "max-w-lg",
  sm: "max-w-md",
}

const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  kicker = "Match ops",
  size = "md",
  showClose = true,
}: ModalProps) => {
  const { play } = useHudSound()
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open && !wasOpen.current) {
      play("deploy")
    }
    if (!open && wasOpen.current) {
      play("dismiss")
    }
    wasOpen.current = open
  }, [open, play])

  const handleClose = () => {
    onClose()
  }

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-overlay backdrop-blur-sm p-4 hud-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`ui-modal relative w-full ${sizeClass[size]} overflow-hidden max-h-[min(90vh,calc(100dvh-2rem))] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 bg-gradient-to-r from-secondary via-midtone to-highlight" />

        {showClose && (
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 flex h-9 w-9 cursor-pointer items-center justify-center text-midtone transition hover:bg-highlight/15 hover:text-accent"
            aria-label="Close"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        )}

        <div className="p-5 sm:p-7">
          <p className="ui-kicker mb-2">{kicker}</p>
          <h2 id="modal-title" className="text-xl sm:text-2xl font-bold text-accent pr-8 tracking-tight">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
          {children && <div className="mt-6 space-y-4">{children}</div>}
          {footer && (
            <div className={`${children || description ? "mt-7" : "mt-6"} flex flex-col-reverse sm:flex-row justify-end gap-3`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default Modal
