import { useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineCheck, HiOutlinePlay, HiOutlineXMark } from "react-icons/hi2"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import { TextAreaField } from "../components/ui/Field"
import Modal from "../components/ui/Modal"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import ProblemStatement from "../components/problems/ProblemStatement"
import ProblemTagChips from "../components/problems/ProblemTagChips"
import SampleTestCases from "../components/problems/SampleTestCases"
import { useAuth } from "../contexts/AuthContext"
import { useConfirm } from "../contexts/ConfirmContext"
import { useToast } from "../contexts/ToastContext"
import { useProblemDetail } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import ProblemService from "../services/ProblemService"

const difficultyTone = {
  easy: "success",
  medium: "warn",
  hard: "danger",
} as const

const AdminProblemReview = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()
  const isAdmin = profile?.role === "admin"
  const { data: problem, isLoading, isFetching, error } = useProblemDetail(id, token)
  useQueryErrorToast(error)

  const [busy, setBusy] = useState<"approve" | "reject" | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [startersOpen, setStartersOpen] = useState(false)

  if (profile && !isAdmin) {
    return <Navigate to="/problems" replace />
  }

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.problems() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.catalogs() })
    if (id) void queryClient.invalidateQueries({ queryKey: queryKeys.problems.detail(id) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.mine() })
  }

  const handleApprove = async () => {
    if (!id || !problem) return
    const ok = await confirm({
      title: "Approve problem?",
      message: `"${problem.title}" will be published to the public catalog.`,
      confirmLabel: "Approve",
      variant: "primary",
    })
    if (!ok) return

    setBusy("approve")
    const [, err] = await ProblemService.approve(token, id)
    setBusy(null)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("Problem approved")
    invalidate()
    navigate("/admin/problems", { replace: true })
  }

  const handleRejectSubmit = async () => {
    if (!id) return
    const reason = rejectReason.trim()
    if (!reason) {
      toast.error("Rejection reason is required")
      return
    }

    setBusy("reject")
    const [, err] = await ProblemService.reject(token, id, reason)
    setBusy(null)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("Problem rejected")
    setRejectOpen(false)
    setRejectReason("")
    invalidate()
    navigate("/admin/problems", { replace: true })
  }

  if (isLoading && !problem) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading review…" />
      </div>
    )
  }

  if ((error && !problem) || !problem) {
    return (
      <div className="page-container mt-10">
        <Link to="/admin/problems" className="text-sm text-muted hover:text-highlight">
          ← Pending queue
        </Link>
        <div className="mt-6">
          <EmptyState
            title="Problem unavailable"
            description={error?.message}
            action={
              <Link to="/admin/problems">
                <Button variant="secondary">Back to queue</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  if (problem.visibility !== "pending") {
    return (
      <div className="page-container mt-10">
        <Link to="/admin/problems" className="text-sm text-muted hover:text-highlight">
          ← Pending queue
        </Link>
        <div className="mt-6">
          <EmptyState
            title="Not pending review"
            description="This problem is no longer in the review queue."
            action={
              <Link to="/admin/problems">
                <Button variant="secondary">Back to queue</Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const hiddenTests = problem.hiddenTests ?? []

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to="/admin/problems" className="text-sm text-muted hover:text-highlight">
        ← Pending queue
      </Link>

      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 border-l-2 border-highlight/50 pl-4">
          <p className="ui-kicker mb-1">Admin review</p>
          <h1 className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">{problem.title}</h1>
          <p className="mt-2 text-sm text-muted">By {problem.author}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="warn">pending</Badge>
            <Badge tone={difficultyTone[problem.difficulty]}>{problem.difficulty}</Badge>
            <Badge tone="neutral">{problem.timeLimitMs} ms</Badge>
            <Badge tone="neutral">{problem.memoryLimitMb} MB</Badge>
          </div>
          <ProblemTagChips tags={problem.tags} className="mt-3" />
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Link to={`/problems/${problem.id}`}>
            <Button variant="secondary">
              <HiOutlinePlay className="h-4 w-4" />
              Try
            </Button>
          </Link>
          <Button variant="primary" loading={busy === "approve"} disabled={Boolean(busy)} onClick={() => void handleApprove()}>
            <HiOutlineCheck className="h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="danger"
            disabled={Boolean(busy)}
            onClick={() => {
              setRejectReason("")
              setRejectOpen(true)
            }}
          >
            <HiOutlineXMark className="h-4 w-4" />
            Reject
          </Button>
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

      <Card className="mt-5 p-5 sm:p-6">
        <p className="ui-kicker mb-3">Hidden tests</p>
        {hiddenTests.length === 0 ? (
          <p className="text-sm text-muted">No hidden tests on this problem.</p>
        ) : (
          <SampleTestCases tests={hiddenTests} caseLabel="Hidden" />
        )}
      </Card>

      <Card className="mt-5 p-5 sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setStartersOpen((open) => !open)}
        >
          <p className="ui-kicker mb-0">Starter code</p>
          <span className="text-sm text-muted">{startersOpen ? "Hide" : "Show"}</span>
        </button>
        {startersOpen && (
          <div className="mt-4 space-y-4">
            {(
              [
                ["Python", problem.starterPython],
                ["JavaScript", problem.starterJs],
              ] as const
            ).map(([label, code]) => (
              <div key={label}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border bg-surface/40 px-3 py-2 text-xs text-accent">
                  {code?.trim() || "(none)"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={rejectOpen}
        onClose={() => {
          if (busy === "reject") return
          setRejectOpen(false)
        }}
        title="Reject problem"
        description="The author will see this reason on My problems."
        kicker="Review"
        footer={
          <>
            <Button variant="secondary" disabled={busy === "reject"} onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={busy === "reject"}
              disabled={!rejectReason.trim() || busy === "reject"}
              onClick={() => void handleRejectSubmit()}
            >
              Reject
            </Button>
          </>
        }
      >
        <TextAreaField
          label="Reason"
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="What should the author fix before resubmitting?"
          maxLength={1000}
        />
      </Modal>
    </div>
  )
}

export default AdminProblemReview
