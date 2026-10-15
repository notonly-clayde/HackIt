import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Editor from "@monaco-editor/react"
import { Group, Panel, useDefaultLayout } from "react-resizable-panels"
import ProblemStatement from "../components/problems/ProblemStatement"
import SplitHandle from "../components/play/SplitHandle"
import Button from "../components/ui/Button"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import EmptyState from "../components/ui/EmptyState"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useMediaQuery } from "../hooks/useMediaQuery"
import VersusService from "../services/VersusService"
import { leaveVersusResults, subscribeVersusMatchFound } from "../services/socket"
import type { PlayLanguage, VersusReview, VersusReviewSubmission } from "../types/api"

function monacoLanguage(language: string): PlayLanguage | "plaintext" {
  if (language === "javascript" || language === "python") return language
  return "plaintext"
}

const ReviewPane = ({
  label,
  submission,
}: {
  label: string
  submission: VersusReviewSubmission | null
}) => {
  return (
    <div className="h-full min-h-0 flex flex-col bg-primary">
      <div className="shrink-0 px-3 py-2 border-b border-border">
        <p className="text-sm font-semibold text-accent">{label}</p>
        {submission ? (
          <p className="text-xs text-muted mt-0.5">
            {submission.language} · {submission.verdict}
            {submission.effectiveElapsedMinutes != null
              ? ` · ${submission.effectiveElapsedMinutes} min`
              : ""}
          </p>
        ) : (
          <p className="text-xs text-muted mt-0.5">No submission</p>
        )}
      </div>
      <div className="flex-1 min-h-0">
        {submission ? (
          <Editor
            height="100%"
            language={monacoLanguage(submission.language)}
            theme="vs-dark"
            value={submission.sourceCode}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted text-sm px-6 text-center">
            No submission.
          </div>
        )}
      </div>
    </div>
  )
}

const VersusReview = () => {
  const { matchId } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const toast = useToast()
  const [review, setReview] = useState<VersusReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  const codeLayout = useDefaultLayout({
    id: "hackit.versusReview.codes.v1",
    panelIds: ["you", "opponent"],
    storage: localStorage,
  })

  const mainLayout = useDefaultLayout({
    id: "hackit.versusReview.main.v1",
    panelIds: ["problem", "codes"],
    storage: localStorage,
  })

  useEffect(() => {
    if (!token || !matchId) return
    let cancelled = false
    setLoading(true)
    void VersusService.getReview(token, matchId).then(([data, err]) => {
      if (cancelled) return
      if (err || !data) {
        setError(err ?? "Review unavailable")
        setLoading(false)
        if (err) toast.error(err)
        return
      }
      setReview(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [token, matchId, toast])

  useEffect(() => {
    if (!token) return
    return subscribeVersusMatchFound(token, (found) => {
      navigate(`/versus/lobby/${found.id}`, { replace: true })
    })
  }, [token, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <QueryLoadingCard message="Loading match review…" />
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Review unavailable"
          description={error ?? "This match cannot be reviewed."}
          action={
            <Link to="/versus">
              <Button variant="secondary">Back to Versus</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="shrink-0 border-b border-border bg-surface-raised/90 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(`/versus/play/${review.matchId}`)}
              className="text-sm text-muted hover:text-highlight shrink-0"
            >
              ← Back to results
            </button>
            <div className="min-w-0 border-l-2 border-highlight/40 pl-3">
              <p className="ui-kicker !text-[0.65rem] mb-0.5">Match review</p>
              <p className="text-sm font-semibold text-accent truncate">{review.problem.title}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              if (token) void leaveVersusResults(token, review.matchId)
              navigate("/versus")
            }}
          >
            Versus
          </Button>
        </div>
      </header>

      <div className="relative flex-1 min-h-0">
        {!isDesktop ? (
          <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
            <aside className="shrink-0 max-h-[40vh] overflow-y-auto border-b border-border bg-surface/50 p-4">
              <h1 className="text-lg font-semibold text-accent mb-3">{review.problem.title}</h1>
              <ProblemStatement content={review.problem.statement} />
            </aside>
            <section className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0 border-b border-border">
                <ReviewPane label={`You · ${review.you?.displayName ?? "You"}`} submission={review.you} />
              </div>
              <div className="flex-1 min-h-0">
                <ReviewPane
                  label={`Opponent · ${review.opponent?.displayName ?? "Opponent"}`}
                  submission={review.opponent}
                />
              </div>
            </section>
          </div>
        ) : (
          <Group
            id="versus-review-main"
            orientation="horizontal"
            className="absolute inset-0 min-h-0"
            defaultLayout={mainLayout.defaultLayout}
            onLayoutChange={mainLayout.onLayoutChange}
            onLayoutChanged={mainLayout.onLayoutChanged}
          >
            <Panel id="problem" defaultSize="36" minSize="22" maxSize="55" className="min-h-0">
              <aside className="h-full overflow-y-auto border-r border-border bg-surface/50 p-5">
                <h1 className="text-xl font-semibold text-accent mb-4">{review.problem.title}</h1>
                <ProblemStatement content={review.problem.statement} />
              </aside>
            </Panel>
            <SplitHandle direction="vertical" />
            <Panel id="codes" defaultSize="64" minSize="40" className="min-h-0">
              <Group
                id="versus-review-codes"
                orientation="horizontal"
                className="h-full min-h-0"
                defaultLayout={codeLayout.defaultLayout}
                onLayoutChange={codeLayout.onLayoutChange}
                onLayoutChanged={codeLayout.onLayoutChanged}
              >
                <Panel id="you" defaultSize="50" minSize="30" className="min-h-0">
                  <ReviewPane label={`You · ${review.you?.displayName ?? "You"}`} submission={review.you} />
                </Panel>
                <SplitHandle direction="vertical" />
                <Panel id="opponent" defaultSize="50" minSize="30" className="min-h-0">
                  <ReviewPane
                    label={`Opponent · ${review.opponent?.displayName ?? "Opponent"}`}
                    submission={review.opponent}
                  />
                </Panel>
              </Group>
            </Panel>
          </Group>
        )}
      </div>
    </div>
  )
}

export default VersusReview
