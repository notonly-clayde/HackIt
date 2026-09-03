import { useRef, useState, type ReactNode } from "react"
import {
  FaBold,
  FaCode,
  FaItalic,
  FaLink,
  FaListOl,
  FaListUl,
} from "react-icons/fa6"
import { useMediaQuery } from "../../hooks/useMediaQuery"
import ProblemStatement from "./ProblemStatement"

type StatementMarkdownEditorProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  rows?: number
}

type EditorTab = "write" | "preview"

type ToolbarAction = {
  label: string
  icon: ReactNode
  wrap?: { before: string; after: string; placeholder?: string }
  insert?: string
}

const toolbarActions: ToolbarAction[] = [
  { label: "Bold", icon: <FaBold />, wrap: { before: "**", after: "**", placeholder: "bold text" } },
  { label: "Italic", icon: <FaItalic />, wrap: { before: "*", after: "*", placeholder: "italic text" } },
  { label: "Inline code", icon: <FaCode />, wrap: { before: "`", after: "`", placeholder: "code" } },
  {
    label: "Code block",
    icon: <FaCode />,
    insert: "\n```\ncode here\n```\n",
  },
  { label: "Bullet list", icon: <FaListUl />, insert: "\n- item one\n- item two\n" },
  { label: "Numbered list", icon: <FaListOl />, insert: "\n1. first\n2. second\n" },
  {
    label: "Link",
    icon: <FaLink />,
    wrap: { before: "[", after: "](https://)", placeholder: "link text" },
  },
]

function applyWrap(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  before: string,
  after: string,
  placeholder: string,
): { next: string; cursor: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd) || placeholder
  const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd)
  const cursor = selectionStart + before.length
  const end = cursor + selected.length
  return { next, cursor, selectionEnd: end }
}

const StatementMarkdownEditor = ({
  value,
  onChange,
  label = "Statement",
  required = false,
  rows = 12,
}: StatementMarkdownEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const [tab, setTab] = useState<EditorTab>("write")

  const applyAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    let next = value
    let cursor = start
    let selectEnd = end

    if (action.wrap) {
      const result = applyWrap(
        value,
        start,
        end,
        action.wrap.before,
        action.wrap.after,
        action.wrap.placeholder ?? "text",
      )
      next = result.next
      cursor = result.cursor
      selectEnd = result.selectionEnd
    } else if (action.insert) {
      next = value.slice(0, start) + action.insert + value.slice(end)
      cursor = start + action.insert.length
      selectEnd = cursor
    }

    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(cursor, selectEnd)
    })
  }

  const writePane = (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {toolbarActions.map((action) => (
          <button
            key={action.label}
            type="button"
            title={action.label}
            onClick={() => applyAction(action)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-accent hover:border-highlight/40 transition-colors"
          >
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
          </button>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        rows={rows}
        className="ui-input min-h-[240px] lg:min-h-[360px] flex-1 resize-y font-mono text-sm leading-relaxed"
        placeholder="Describe the problem using Markdown…"
      />
      <p className="text-xs text-muted">Supports Markdown — preview updates live.</p>
    </div>
  )

  const previewPane = (
    <div className="min-h-[240px] lg:min-h-[360px] rounded-xl border border-border bg-surface/40 p-4 overflow-y-auto">
      {value.trim() ? (
        <ProblemStatement content={value} />
      ) : (
        <p className="text-sm text-muted">Nothing to preview yet.</p>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</label>

      {isDesktop ? (
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          <div>
            <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Write</p>
            {writePane}
          </div>
          <div>
            <p className="text-xs font-medium text-muted mb-2 uppercase tracking-wider">Preview</p>
            {previewPane}
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            {(["write", "preview"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  tab === item
                    ? "bg-highlight/15 text-highlight border border-highlight/40"
                    : "border border-border text-muted hover:text-accent"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "write" ? writePane : previewPane}
        </>
      )}
    </div>
  )
}

export default StatementMarkdownEditor
