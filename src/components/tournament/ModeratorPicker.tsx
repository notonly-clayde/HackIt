import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { HiOutlineXMark } from "react-icons/hi2"
import { useAuth } from "../../contexts/AuthContext"
import UserService from "../../services/UserService"
import type { TournamentModerator, UserLookupItem } from "../../types/api"

type ModeratorPickerProps = {
  value: TournamentModerator[]
  onChange: (next: TournamentModerator[]) => void
  disabled?: boolean
  hint?: string
}

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300

const ModeratorPicker = ({ value, onChange, disabled = false, hint }: ModeratorPickerProps) => {
  const { token } = useAuth()
  const inputId = useId()
  const listboxId = `${inputId}-listbox`
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [lookup, setLookup] = useState<{ query: string; items: UserLookupItem[] }>({ query: "", items: [] })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const trimmed = query.trim()
  const searchable = trimmed.length >= MIN_QUERY_LENGTH
  const searching = searchable && lookup.query !== trimmed
  const selectedIds = new Set(value.map((mod) => mod.id))
  const options = searchable && !searching ? lookup.items.filter((user) => !selectedIds.has(user.id)) : []

  useEffect(() => {
    if (!searchable) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      const [data] = await UserService.lookup(token, trimmed)
      if (cancelled) return
      setLookup({ query: trimmed, items: data ?? [] })
      setActiveIndex(0)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [searchable, trimmed, token])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    return () => document.removeEventListener("mousedown", onPointer)
  }, [open])

  const add = (user: UserLookupItem) => {
    if (selectedIds.has(user.id)) return
    onChange([...value, user])
    setQuery("")
    setOpen(false)
    inputRef.current?.focus()
  }

  const remove = (id: string) => {
    onChange(value.filter((mod) => mod.id !== id))
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (options.length === 0) return
      event.preventDefault()
      setOpen(true)
      const step = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex((prev) => (prev + step + options.length) % options.length)
      return
    }

    if (event.key === "Enter") {
      // Keep Enter from submitting the surrounding form while picking.
      event.preventDefault()
      const option = options[activeIndex] ?? options[0]
      if (option) add(option)
      return
    }

    if (event.key === "Escape" && open) {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (event.key === "Backspace" && query === "" && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const showMenu = open && searchable

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-muted">
        Moderators
      </label>
      <div ref={containerRef} className="relative">
        <div
          className="ui-input flex flex-wrap items-center gap-2 !py-2 cursor-text"
          onClick={() => inputRef.current?.focus()}
        >
          {value.map((mod) => (
            <span
              key={mod.id}
              title={mod.displayName}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-highlight/40 bg-highlight/15 py-0.5 pl-3 pr-1 text-sm text-highlight"
            >
              <span className="truncate">{mod.email}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  remove(mod.id)
                }}
                disabled={disabled}
                aria-label={`Remove ${mod.email}`}
                className="rounded-full p-0.5 hover:bg-highlight/25 disabled:opacity-50"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={showMenu}
            aria-controls={listboxId}
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? "Search by name or email" : ""}
            className="min-w-[10rem] flex-1 bg-transparent py-1 text-accent placeholder:text-muted outline-none"
          />
        </div>

        {showMenu && (
          <div
            id={listboxId}
            role="listbox"
            className="ui-select-menu hud-menu absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto py-1"
          >
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted">
                {searching ? "Searching…" : "No verified HackIT accounts match."}
              </p>
            ) : (
              options.map((user, index) => (
                <button
                  key={user.id}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  data-active={index === activeIndex ? "true" : "false"}
                  className="ui-select-option"
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => add(user)}
                >
                  <span className="min-w-0 truncate text-accent">{user.displayName}</span>
                  <span className="min-w-0 truncate text-xs text-muted">{user.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
}

export default ModeratorPicker
