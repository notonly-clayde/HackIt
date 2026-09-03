import { Link } from "react-router-dom"
import Card from "../ui/Card"
import Badge from "../ui/Badge"
import EmptyState from "../ui/EmptyState"
import ProblemTagChips from "./ProblemTagChips"
import type { TournamentProblemItem } from "../../types/api"

type PreviewContext = {
  tournamentId: string
  from: "spectate"
  viewerId?: string
}

type TournamentProblemListProps = {
  items: TournamentProblemItem[]
  loading?: boolean
  title?: string
  description?: string
  className?: string
  previewContext?: PreviewContext
}

const visibilityTone = {
  private: "neutral",
  pending: "warn",
  public: "live",
} as const

function canPreviewProblem(problem: TournamentProblemItem["problem"], viewerId?: string) {
  if (problem.visibility === "public") return true
  return Boolean(viewerId && problem.authorId === viewerId)
}

function buildPreviewUrl(problemId: string, context: PreviewContext) {
  const params = new URLSearchParams({
    tournamentId: context.tournamentId,
    from: context.from,
  })
  return `/problems/${problemId}/preview?${params.toString()}`
}

const TournamentProblemList = ({
  items,
  loading = false,
  title = "Problem set",
  description = "Problems in this contest.",
  className = "mt-6",
  previewContext,
}: TournamentProblemListProps) => {
  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="mb-4">
        <p className="ui-kicker mb-1">Contest problems</p>
        <h2 className="text-accent font-semibold tracking-tight">{title}</h2>
        <p className="text-muted text-sm mt-1">{description}</p>
      </div>

      {loading ? (
        <p className="text-muted text-sm">Loading problem set…</p>
      ) : items.length === 0 ? (
        <EmptyState title="No problems" description="The host has not published any problems yet." />
      ) : (
        <ul className="space-y-2">
          {items.map((entry, index) => {
            const previewable = previewContext
              ? canPreviewProblem(entry.problem, previewContext.viewerId)
              : false
            const rowContent = (
              <>
                <div className="min-w-0">
                  <p className="text-accent font-medium truncate">
                    {index + 1}. {entry.problem.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {entry.points} pts · {entry.problem.difficulty} · {entry.problem.author}
                    {!previewable && entry.problem.visibility !== "public" && (
                      <span className="ml-1">· Author only</span>
                    )}
                  </p>
                  <ProblemTagChips tags={entry.problem.tags} className="mt-1.5" max={3} />
                </div>
                <Badge tone={visibilityTone[entry.problem.visibility]}>{entry.problem.visibility}</Badge>
              </>
            )

            if (previewable && previewContext) {
              return (
                <li key={entry.problemId}>
                  <Link
                    to={buildPreviewUrl(entry.problemId, previewContext)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3 hover:border-highlight/40 hover:bg-surface-2/50 transition-colors"
                  >
                    {rowContent}
                  </Link>
                </li>
              )
            }

            return (
              <li
                key={entry.problemId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-4 py-3"
              >
                {rowContent}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export default TournamentProblemList
