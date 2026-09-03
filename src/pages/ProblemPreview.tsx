import { useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import ProblemStatement from "../components/problems/ProblemStatement"
import SampleTestCases from "../components/problems/SampleTestCases"
import ReportButton from "../components/moderation/ReportButton"
import { useAuth } from "../contexts/AuthContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { useToast } from "../contexts/ToastContext"
import { useProblemDetail } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import ProblemService from "../services/ProblemService"

const visibilityTone = {
  private: "neutral",
  pending: "warn",
  public: "live",
} as const

const difficultyTone = {
  easy: "success",
  medium: "warn",
  hard: "danger",
} as const

type PreviewFrom = "spectate"

function resolveBackLink(
  tournamentId: string | null,
  from: PreviewFrom | null,
  isAuthor: boolean,
): { to: string; label: string } {
  if (tournamentId && from === "spectate") {
    return { to: `/tournament/${tournamentId}/spectate`, label: "Back to live" }
  }
  if (isAuthor) {
    return { to: "/problems/mine", label: "My problems" }
  }
  return { to: "/problems", label: "Catalog" }
}

const ProblemPreview = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()
  const { data: problem, isLoading, isFetching, error } = useProblemDetail(id, token)
  useQueryErrorToast(error)
  const [unpublishing, setUnpublishing] = useState(false)

  const tournamentId = searchParams.get("tournamentId")
  const fromParam = searchParams.get("from")
  const from: PreviewFrom | null =
    fromParam === "spectate" || fromParam === "host" ? "spectate" : null

  const isAuthor = Boolean(problem && profile && problem.authorId === profile.id)
  const isAdmin = profile?.role === "admin"
  const backLink = useMemo(
    () => resolveBackLink(tournamentId, from, isAuthor),
    [tournamentId, from, isAuthor],
  )

  const handleUnpublish = async () => {
    if (!id || !problem) return
    const ok = await confirm({
      title: "Unpublish problem?",
      message: `"${problem.title}" will be removed from the public catalog and returned to private.`,
      confirmLabel: "Unpublish",
      variant: "danger",
    })
    if (!ok) return

    setUnpublishing(true)
    const [, err] = await ProblemService.unpublish(token, id)
    setUnpublishing(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("Problem unpublished")
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.catalogs() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.mine() })
    navigate(isAuthor ? "/problems/mine" : "/problems", { replace: true })
  }

  if (isLoading && !problem) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading preview…" />
      </div>
    )
  }

  if ((error && !problem) || !problem) {
    return (
      <div className="page-container mt-10">
        <Link to={backLink.to} className="text-sm text-muted hover:text-highlight">
          ← {backLink.label}
        </Link>
        <div className="mt-6">
          <EmptyState
            title="Problem unavailable"
            description={error?.message}
            action={
              <Link to={backLink.to}>
                <Button variant="secondary">{backLink.label}</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to={backLink.to} className="text-sm text-muted hover:text-highlight">
        ← {backLink.label}
      </Link>

      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 border-l-2 border-highlight/50 pl-4">
          <p className="ui-kicker mb-1">Preview</p>
          <h1 className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">{problem.title}</h1>
          <p className="mt-2 text-sm text-muted">By {problem.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={difficultyTone[problem.difficulty]}>{problem.difficulty}</Badge>
            {problem.visibility !== "public" && (
              <Badge tone={visibilityTone[problem.visibility]}>{problem.visibility}</Badge>
            )}
            <Badge tone="neutral">{problem.timeLimitMs} ms</Badge>
            <Badge tone="neutral">{problem.memoryLimitMb} MB</Badge>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <ReportButton targetType="problem" targetId={problem.id} variant="ghost" />
          {problem.visibility === "public" ? (
            <Link to={`/problems/${problem.id}`}>
              <Button variant="primary">Practice</Button>
            </Link>
          ) : (
            <Button variant="primary" disabled title="Available after admin approval">
              Practice
            </Button>
          )}
          {isAdmin && problem.visibility === "public" && (
            <Button variant="danger" loading={unpublishing} onClick={() => void handleUnpublish()}>
              Unpublish
            </Button>
          )}
        </div>
      </div>

      <Card className="mt-8 p-5 sm:p-6">
        <p className="ui-kicker mb-3">Statement</p>
        {problem.statement.trim() ? (
          <ProblemStatement content={problem.statement} />
        ) : (
          <p className="text-sm text-muted">No statement provided.</p>
        )}
      </Card>

      <Card className="mt-5 p-5 sm:p-6">
        <p className="ui-kicker mb-3">Sample tests</p>
        <SampleTestCases tests={problem.sampleTests} />
      </Card>
    </div>
  )
}

export default ProblemPreview
