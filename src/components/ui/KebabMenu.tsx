import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { HiOutlineEllipsisVertical } from "react-icons/hi2"
import { useHudSound } from "../../contexts/SoundContext"

export type KebabMenuItem = {
  label: string
  icon?: ReactNode
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
}

type KebabMenuProps = {
  items: KebabMenuItem[]
  "aria-label"?: string
  className?: string
}

const MENU_GAP = 4
const MENU_WIDTH = 160
const MENU_VIEWPORT_PAD = 8

type MenuPos = { top: number; left: number }

function placeMenu(trigger: DOMRect, menuHeight: number): MenuPos {
  const spaceBelow = window.innerHeight - trigger.bottom - MENU_VIEWPORT_PAD
  const openUp = spaceBelow < menuHeight + MENU_GAP && trigger.top > spaceBelow
  const top = openUp ? trigger.top - menuHeight - MENU_GAP : trigger.bottom + MENU_GAP
  const left = Math.max(MENU_VIEWPORT_PAD, trigger.right - MENU_WIDTH)
  return { top, left }
}

const KebabMenu = ({ items, "aria-label": ariaLabel = "Options", className = "" }: KebabMenuProps) => {
  const { play } = useHudSound()
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<MenuPos | null>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    setPos(placeMenu(trigger.getBoundingClientRect(), menuRef.current?.offsetHeight ?? 88))
  }, [])

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open, items.length, updatePosition])

  useEffect(() => {
    if (!open) return

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      triggerRef.current?.focus()
    }

    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [open, updatePosition])

  const toggle = () => {
    play(open ? "dismiss" : "deploy")
    setOpen((prev) => !prev)
  }

  const select = (item: KebabMenuItem) => {
    if (item.disabled) return
    setOpen(false)
    play("tap")
    item.onSelect()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={toggle}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:text-highlight hover:border-highlight/40 transition-colors ${className}`}
      >
        <HiOutlineEllipsisVertical className="h-5 w-5" />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              className="ui-select-menu hud-menu fixed py-1"
              style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            >
              {items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => select(item)}
                  className={`ui-select-option ${item.danger ? "!text-danger" : ""}`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                    <span className="truncate">{item.label}</span>
                  </span>
                </button>
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export default KebabMenu
