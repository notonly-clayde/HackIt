import { useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineEye, HiOutlinePaperAirplane, HiOutlinePencilSquare, HiOutlinePlay, HiOutlinePlus } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import ProblemTagChips from "../components/problems/ProblemTagChips"
import { useAuth } from "../contexts/AuthContext"
import { useMyProblems } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import ProblemService from "../services/ProblemService"

const visibilityTone = {
  private: "neutral",
  pending: "warn",
  public: "live",
} as const

const MyProblems = () => {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const { data: problems = [], isLoading, isFetching, error } = useMyProblems(token)
  useQueryErrorToast(error)
  const [busyId, setBusyId] = useState<string | null>(null)

  const submitForReview = async (id: string) => {
    setBusyId(id)
    const [, err] = await ProblemService.submitForReview(token, id)
    setBusyId(null)
    if (err) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.mine() })
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to="/problems" className="text-sm text-muted hover:text-highlight">
        ← Catalog
      </Link>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="ui-kicker mb-2">Authoring</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">My problems</h1>
          <p className="text-muted text-sm mt-2">Private by default. Submit for admin approval to publish.</p>
        </div>
        <Link to="/problems/new">
          <Button variant="primary">
            <HiOutlinePlus className="h-4 w-4" />
            New problem
          </Button>
        </Link>
      </div>

      <div className="mt-4 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-2 space-y-3">
        {isLoading && problems.length === 0 ? (
          <QueryLoadingCard />
        ) : error ? (
          <EmptyState title="Could not load problems" description={error.message} />
        ) : problems.length === 0 ? (
          <EmptyState title="No problems yet" description="Create a private problem for your tournaments." />
        ) : (
          problems.map((problem) => (
            <Card key={problem.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-accent">{problem.title}</h2>
                  <Badge tone={visibilityTone[problem.visibility]}>{problem.visibility}</Badge>
                  <Badge tone="neutral">{problem.difficulty}</Badge>
                </div>
                <ProblemTagChips tags={problem.tags} className="mb-1" max={4} />
                <p className="text-sm text-muted">Updated {new Date(problem.createdAt).toLocaleDateString()}</p>
                {problem.visibility === "private" && problem.reviewNote ? (
                  <p className="mt-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm text-amber-300">
                    Rejected: {problem.reviewNote}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link to={`/problems/${problem.id}/preview`}>
                  <Button variant="secondary">
                    <HiOutlineEye className="h-4 w-4" />
                    Preview
                  </Button>
                </Link>
                {problem.visibility === "public" ? (
                  <Link to={`/problems/${problem.id}`}>
                    <Button variant="secondary">
                      <HiOutlinePlay className="h-4 w-4" />
                      Practice
                    </Button>
                  </Link>
                ) : null}
                {problem.visibility === "private" ? (
                  <>
                    <Link to={`/problems/${problem.id}/edit`}>
                      <Button variant="secondary">
                        <HiOutlinePencilSquare className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      loading={busyId === problem.id}
                      onClick={() => void submitForReview(problem.id)}
                    >
                      <HiOutlinePaperAirplane className="h-4 w-4" />
                      Submit
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default MyProblems
