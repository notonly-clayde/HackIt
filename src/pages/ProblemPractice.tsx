import { Link, useNavigate, useParams } from "react-router-dom"
import { useEffect } from "react"
import EmptyState from "../components/ui/EmptyState"
import Button from "../components/ui/Button"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import PlayArena from "../components/play/PlayArena"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useProblemDetail } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"

const ProblemPractice = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, profile } = useAuth()
  const toast = useToast()
  const { data: problem, isLoading, error } = useProblemDetail(id, token)
  useQueryErrorToast(error)

  const isAdmin = profile?.role === "admin"
  const isAuthor = Boolean(problem && profile && problem.authorId === profile.id)
  const canPractice = Boolean(problem && (problem.visibility === "public" || isAdmin || isAuthor))
  const visibilityError =
    problem && !canPractice ? "Only public catalog problems can be practiced here" : null

  useEffect(() => {
    if (visibilityError) toast.error(visibilityError)
  }, [visibilityError, toast])

  if (isLoading && !problem) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard message="Loading problem…" />
      </div>
    )
  }

  if (error || visibilityError || !problem) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Problem unavailable"
          description={visibilityError ?? error?.message}
          action={
            <Link to={isAdmin ? "/admin/problems" : "/problems"}>
              <Button variant="secondary">{isAdmin ? "Back to queue" : "Back to catalog"}</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const isPublic = problem.visibility === "public"
  const backTo = isPublic ? "/problems" : isAuthor ? "/problems/mine" : `/admin/problems/${problem.id}`
  const backLabel = isPublic ? "Catalog" : isAuthor ? "My problems" : "Review"
  const modeLabel = isPublic ? "Practice" : isAuthor ? "Author test" : "Admin try"

  return (
    <PlayArena
      backTo={backTo}
      backLabel={backLabel}
      modeLabel={modeLabel}
      problems={[problem]}
      authToken={token}
      onLeave={() => navigate(backTo)}
    />
  )
}

export default ProblemPractice
