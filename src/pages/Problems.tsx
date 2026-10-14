import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineDocumentText, HiOutlineEye, HiOutlinePlay, HiOutlinePlus } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Badge from "../components/ui/Badge"
import EmptyState from "../components/ui/EmptyState"
import Field, { SelectField } from "../components/ui/Field"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import { useAuth } from "../contexts/AuthContext"
import { useHudSound } from "../contexts/SoundContext"
import { prefetchProblemDetail, useProblemCatalog } from "../hooks/queries/useProblemQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import type { ProblemDifficulty } from "../types/api"

const difficultyTone = {
  easy: "success",
  medium: "warn",
  hard: "danger",
} as const

const Problems = () => {
  const { token } = useAuth()
  const { play } = useHudSound()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [difficulty, setDifficulty] = useState<"" | ProblemDifficulty>("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(timer)
  }, [search])

  const filters = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      difficulty: difficulty || undefined,
    }),
    [debouncedSearch, difficulty],
  )

  const { data: problems = [], isLoading, isFetching, error } = useProblemCatalog(token, filters)
  useQueryErrorToast(error)

  return (
    <div className="page-container mt-8 sm:mt-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="ui-kicker mb-2">Practice</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Problem catalog</h1>
          <p className="text-muted text-sm mt-2 max-w-2xl">
            Train on approved public problems. Tournament hosts can attach these to events.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/problems/mine" onClick={() => play("link")}>
            <Button variant="secondary" sound={false}>
              <HiOutlineDocumentText className="h-4 w-4" />
              My problems
            </Button>
          </Link>
          <Link to="/problems/new" onClick={() => play("link")}>
            <Button variant="primary" sound={false}>
              <HiOutlinePlus className="h-4 w-4" />
              Author problem
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Title…"
          className="sm:col-span-2"
        />
        <SelectField label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as "" | ProblemDifficulty)}>
          <option value="">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </SelectField>
      </div>

      <div className="mt-4 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>

      <div className="mt-2 space-y-3">
        {isLoading && problems.length === 0 ? (
          <QueryLoadingCard message="Loading problems…" />
        ) : error ? (
          <EmptyState title="Could not load catalog" description={error.message} />
        ) : problems.length === 0 ? (
          <EmptyState title="No public problems yet" description="Approved problems will appear here for practice." />
        ) : (
          problems.map((problem) => (
            <Card
              key={problem.id}
              hover
              className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              onMouseEnter={() => prefetchProblemDetail(queryClient, problem.id, token)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-accent font-semibold truncate">{problem.title}</h2>
                  <Badge tone={difficultyTone[problem.difficulty]}>{problem.difficulty}</Badge>
                </div>
                <p className="text-sm text-muted">By {problem.author}</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link to={`/problems/${problem.id}/preview`} onClick={() => play("link")}>
                  <Button variant="secondary" sound={false}>
                    <HiOutlineEye className="h-4 w-4" />
                    Preview
                  </Button>
                </Link>
                <Link to={`/problems/${problem.id}`} onClick={() => play("link")}>
                  <Button variant="primary" sound={false}>
                    <HiOutlinePlay className="h-4 w-4" />
                    Practice
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

export default Problems
