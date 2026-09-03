import { useState } from "react"
import { IoChevronDown, IoChevronForward } from "react-icons/io5"
import Badge from "../ui/Badge"
import RunResultsPanel from "./RunResultsPanel"
import type { PlayRunResultView } from "./runner/normalizeRunResult"
import { verdictLabels } from "./runner/normalizeRunResult"

type SubmissionsPanelProps = {
  submissions: PlayRunResultView[]
}

function verdictTone(status: PlayRunResultView["status"]): "success" | "danger" | "warn" | "neutral" {
  if (status === "accepted") return "success"
  if (status === "timeout" || status === "unsupported") return "warn"
  if (status === "running") return "neutral"
  return "danger"
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso))
}

const SubmissionsPanel = ({ submissions }: SubmissionsPanelProps) => {
  const [expandedAt, setExpandedAt] = useState<string | null>(null)

  if (submissions.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-sm text-muted">Submit to judge against hidden tests.</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-2">
      {submissions.map((submission) => {
        const expanded = expandedAt === submission.at
        return (
          <div key={submission.at} className="rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedAt(expanded ? null : submission.at)}
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-surface/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                {expanded ? (
                  <IoChevronDown className="shrink-0 text-muted" />
                ) : (
                  <IoChevronForward className="shrink-0 text-muted" />
                )}
                <span className="text-sm text-muted tabular-nums">{formatTime(submission.at)}</span>
              </div>
              <Badge tone={verdictTone(submission.status)}>{verdictLabels[submission.status]}</Badge>
            </button>

            {expanded && (
              <div className="border-t border-border bg-surface/20">
                <RunResultsPanel
                  result={submission}
                  emptyMessage="No test case details available."
                  runningMessage="Submitting…"
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default SubmissionsPanel
