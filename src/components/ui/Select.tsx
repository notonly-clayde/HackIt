import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { HiOutlineCheck, HiOutlineChevronDown } from "react-icons/hi2"
import { useHudSound } from "../../contexts/SoundContext"

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
  size?: "md" | "sm"
  icon?: ReactNode
  "aria-label"?: string
}

type MenuPos = { top: number; left: number; width: number }

const MENU_GAP = 4
const MENU_VIEWPORT_PAD = 8

function placeMenu(trigger: DOMRect, menuHeight: number): MenuPos {
  const width = Math.max(trigger.width, 168)
  const spaceBelow = window.innerHeight - trigger.bottom - MENU_VIEWPORT_PAD
  const openUp = spaceBelow < Math.min(menuHeight, 240) + MENU_GAP && trigger.top > spaceBelow
  const top = openUp ? trigger.top - menuHeight - MENU_GAP : trigger.bottom + MENU_GAP
  let left = trigger.left
  if (left + width > window.innerWidth - MENU_VIEWPORT_PAD) {
    left = Math.max(MENU_VIEWPORT_PAD, window.innerWidth - width - MENU_VIEWPORT_PAD)
  }
  return { top, left, width }
}

export const optionsFromChildren = (children: ReactNode): SelectOption[] => {
  const options: SelectOption[] = []

  Children.forEach(children, (child) => {
    if (!isValidElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>(child)) return
    if (child.type !== "option") return

    const rawLabel = child.props.children
    const label =
      typeof rawLabel === "string" || typeof rawLabel === "number"
        ? String(rawLabel)
        : Children.toArray(rawLabel).join("")

    options.push({
      value: String(child.props.value ?? ""),
      label,
      disabled: Boolean(child.props.disabled),
    })
  })

  return options
}

const Select = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className = "",
  disabled = false,
  id,
  name,
  size = "md",
  icon,
  "aria-label": ariaLabel,
}: SelectProps) => {
  const { play } = useHudSound()
  const generatedId = useId()
  const listboxId = `${generatedId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [pos, setPos] = useState<MenuPos | null>(null)

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  )

  const enabledIndexes = useMemo(
    () => options.map((option, index) => (option.disabled ? -1 : index)).filter((index) => index >= 0),
    [options],
  )

  const close = useCallback(() => {
    setOpen(false)
    setPos(null)
    play("dismiss")
  }, [play])

  const openMenu = useCallback(() => {
    const trigger = triggerRef.current
    if (trigger) setPos(placeMenu(trigger.getBoundingClientRect(), 240))
    setOpen(true)
    play("deploy")
  }, [play])

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const menuHeight = menuRef.current?.offsetHeight ?? 240
    setPos(placeMenu(trigger.getBoundingClientRect(), menuHeight))
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    updatePosition()
  }, [open, options, updatePosition])

  useEffect(() => {
    if (!open) return

    const selectedIndex = options.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : (enabledIndexes[0] ?? 0))

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      close()
    }

    const onReposition = () => updatePosition()

    document.addEventListener("mousedown", onPointer)
    window.addEventListener("resize", onReposition)
    window.addEventListener("scroll", onReposition, true)

    return () => {
      document.removeEventListener("mousedown", onPointer)
      window.removeEventListener("resize", onReposition)
      window.removeEventListener("scroll", onReposition, true)
    }
  }, [open, options, value, enabledIndexes, close, updatePosition])

  useEffect(() => {
    if (!open) return
    const active = menuRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    active?.scrollIntoView({ block: "nearest" })
  }, [open, activeIndex])

  const selectIndex = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    onChange(option.value)
    play("tap")
    setOpen(false)
    setPos(null)
    triggerRef.current?.focus()
  }

  const moveActive = (direction: 1 | -1) => {
    if (enabledIndexes.length === 0) return
    const currentPos = enabledIndexes.indexOf(activeIndex)
    const nextPos =
      currentPos === -1
        ? direction === 1
          ? 0
          : enabledIndexes.length - 1
        : (currentPos + direction + enabledIndexes.length) % enabledIndexes.length
    setActiveIndex(enabledIndexes[nextPos] ?? enabledIndexes[0])
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        openMenu()
        return
      }
      moveActive(event.key === "ArrowDown" ? 1 : -1)
      return
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      if (!open) {
        openMenu()
        return
      }
      selectIndex(activeIndex)
      return
    }

    if (event.key === "Escape" && open) {
      event.preventDefault()
      close()
    }

    if (event.key === "Home" && open) {
      event.preventDefault()
      setActiveIndex(enabledIndexes[0] ?? 0)
    }

    if (event.key === "End" && open) {
      event.preventDefault()
      setActiveIndex(enabledIndexes[enabledIndexes.length - 1] ?? 0)
    }
  }

  const label = selected?.label || placeholder

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        className={`ui-select ${size === "sm" ? "ui-select-sm" : ""} ${className}`}
        data-open={open ? "true" : "false"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return
          if (open) close()
          else openMenu()
        }}
        onKeyDown={onTriggerKeyDown}
      >
        {icon ? <span className="shrink-0 text-highlight">{icon}</span> : null}
        <span className={`min-w-0 flex-1 truncate ${selected ? "text-accent" : "text-muted"}`}>{label}</span>
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-midtone transition-transform duration-150 ease-[cubic-bezier(0.2,0,0,1)] ${open ? "rotate-180 text-highlight" : ""}`}
        />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel}
              className="ui-select-menu hud-menu fixed max-h-60 overflow-y-auto py-1"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={`${option.value}-${index}`}
                    type="button"
                    role="option"
                    disabled={option.disabled}
                    aria-selected={isSelected}
                    data-selected={isSelected ? "true" : "false"}
                    data-active={index === activeIndex ? "true" : "false"}
                    className="ui-select-option"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectIndex(index)}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {isSelected ? <HiOutlineCheck className="h-4 w-4 shrink-0 text-highlight" /> : null}
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export default Select
