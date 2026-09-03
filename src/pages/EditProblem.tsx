import { Link, useNavigate, useParams } from "react-router-dom"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import Button from "../components/ui/Button"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import ProblemForm from "../components/problems/ProblemForm"
import { useAuth } from "../contexts/AuthContext"
import { useProblemDetail } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import ProblemService from "../services/ProblemService"

const EditProblem = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const { data: problem, isLoading, isFetching, error } = useProblemDetail(id, token)
  useQueryErrorToast(error)

  if (isLoading && !problem) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard />
      </div>
    )
  }

  const visibilityError =
    problem && problem.visibility !== "private"
      ? "Only private problems can be edited"
      : null

  if (error || visibilityError || !problem) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Cannot edit problem"
          description={visibilityError ?? error?.message}
          action={
            <Link to="/problems/mine">
              <Button variant="secondary">Back</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const testCases = [
    ...(problem.sampleTests ?? []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: true,
      order: t.order,
    })),
    ...(problem.hiddenTests ?? []).map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: false,
      order: t.order,
    })),
  ]

  return (
    <div className="page-container mt-8 sm:mt-10">
      <Link to="/problems/mine" className="text-sm text-muted hover:text-highlight">
        ← My problems
      </Link>
      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>
      <p className="ui-kicker mt-4 mb-2">Authoring</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Edit problem</h1>
      <Card className="mt-8 p-6 sm:p-8">
        <ProblemForm
          initial={{
            title: problem.title,
            statement: problem.statement,
            difficulty: problem.difficulty,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
            starterPython: problem.starterPython,
            starterJs: problem.starterJs,
            starterCpp: problem.starterCpp,
            testCases,
          }}
          submitLabel="Save changes"
          onCancel={() => navigate("/problems/mine")}
          onSubmit={async (input) => {
            const [data, err] = await ProblemService.update(token, problem.id, input)
            if (err || !data) throw new Error(err ?? "Failed to update problem")
            navigate("/problems/mine")
          }}
        />
      </Card>
    </div>
  )
}

export default EditProblem
