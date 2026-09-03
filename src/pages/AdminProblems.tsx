import { Link, Navigate } from "react-router-dom"
import { HiOutlineDocumentMagnifyingGlass } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import { useAuth } from "../contexts/AuthContext"
import { useAdminProblems } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"

const AdminProblems = () => {
  const { token, profile } = useAuth()
  const isAdmin = profile?.role === "admin"
  const { data: problems = [], isLoading, isFetching, error } = useAdminProblems(token, isAdmin)
  useQueryErrorToast(error)

  if (profile && profile.role !== "admin") {
    return <Navigate to="/problems" replace />
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-accent">Pending problems</h2>
          <p className="mt-1 text-sm text-muted">Open a review to inspect tests before approving.</p>
        </div>
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="space-y-4">
        {isLoading && problems.length === 0 ? (
          <QueryLoadingCard message="Loading queue…" />
        ) : error ? (
          <EmptyState title="Could not load queue" description={error.message} />
        ) : problems.length === 0 ? (
          <EmptyState title="No pending problems" description="Submissions awaiting review will appear here." />
        ) : (
          problems.map((problem) => (
            <Card key={problem.id} className="px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-accent">{problem.title}</h3>
                    <Badge tone="warn">pending</Badge>
                    <Badge tone="neutral">{problem.difficulty}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">By {problem.author}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{problem.statement}</p>
                </div>
                <Link to={`/admin/problems/${problem.id}`} className="shrink-0">
                  <Button variant="primary">
                    <HiOutlineDocumentMagnifyingGlass className="h-4 w-4" />
                    Review
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminProblems
