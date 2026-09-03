import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useInfiniteQuery } from "@tanstack/react-query"
import Badge from "../components/ui/Badge"
import Button from "../components/ui/Button"
import Card from "../components/ui/Card"
import EmptyState from "../components/ui/EmptyState"
import Field, { SelectField } from "../components/ui/Field"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import { useAuth } from "../contexts/AuthContext"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import { queryKeys } from "../lib/queryKeys"
import { unwrap } from "../lib/unwrap"
import AdminService from "../services/AdminService"
import type { ActivityLogItem } from "../types/api"

function targetLink(item: ActivityLogItem) {
  switch (item.targetType) {
    case "user":
      return `/admin/users/${item.targetId}`
    case "tournament":
      return `/tournament/${item.targetId}`
    case "problem":
      return `/admin/problems/${item.targetId}`
    default:
      return null
  }
}

function toIsoStartOfDay(date: string) {
  if (!date) return undefined
  return new Date(`${date}T00:00:00.000Z`).toISOString()
}

function toIsoEndOfDay(date: string) {
  if (!date) return undefined
  return new Date(`${date}T23:59:59.999Z`).toISOString()
}

const AdminActivityLogs = () => {
  const { token } = useAuth()
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [action, setAction] = useState("")
  const [targetType, setTargetType] = useState("")
  const [tournamentId, setTournamentId] = useState("")
  const [actorId, setActorId] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [knownActions, setKnownActions] = useState<string[]>([])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQ(q), 250)
    return () => window.clearTimeout(timer)
  }, [q])

  const filters = useMemo(
    () => ({
      q: debouncedQ.trim() || undefined,
      action: action || undefined,
      targetType: targetType || undefined,
      tournamentId: tournamentId.trim() || undefined,
      actorId: actorId.trim() || undefined,
      from: toIsoStartOfDay(from),
      to: toIsoEndOfDay(to),
    }),
    [debouncedQ, action, targetType, tournamentId, actorId, from, to],
  )

  const query = useInfiniteQuery({
    queryKey: queryKeys.admin.activityLogs(filters),
    queryFn: async ({ pageParam }) => {
      const data = unwrap(
        await AdminService.listActivityLogs(token, {
          ...filters,
          cursor: pageParam,
          limit: 40,
        }),
      )
      if (data.actions?.length) setKnownActions(data.actions)
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: Boolean(token),
  })

  useQueryErrorToast(query.error)

  const items = query.data?.pages.flatMap((page) => page.items) ?? []

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Summary, actor, target…" />
        <SelectField label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All actions</option>
          {knownActions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Target type" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
          <option value="">All targets</option>
          <option value="USER">User</option>
          <option value="TOURNAMENT">Tournament</option>
          <option value="PROBLEM">Problem</option>
          <option value="REPORT">Report</option>
          <option value="SUBMISSION">Submission</option>
        </SelectField>
        <Field
          label="From"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Field label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <Field
          label="Tournament ID"
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
          placeholder="Optional"
        />
        <Field
          label="Actor ID"
          value={actorId}
          onChange={(e) => setActorId(e.target.value)}
          placeholder="Optional"
        />
      </div>

      {query.isLoading && items.length === 0 ? (
        <QueryLoadingCard message="Loading activity logs…" />
      ) : query.error ? (
        <EmptyState title="Could not load logs" description={query.error.message} />
      ) : items.length === 0 ? (
        <EmptyState title="No activity yet" description="Matching events will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const link = targetLink(item)
            const open = expanded === item.id
            return (
              <Card key={item.id} className="px-4 py-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{item.action}</Badge>
                      <Badge tone={item.actorType === "system" ? "warn" : "live"}>
                        {item.actorType === "system" ? "system" : item.actorDisplayName ?? "user"}
                      </Badge>
                      <span className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-accent">{item.summary}</p>
                    <p className="mt-1 text-xs text-muted">
                      {item.targetType} · {item.targetId.slice(0, 12)}…
                      {link ? (
                        <>
                          {" "}
                          ·{" "}
                          <Link to={link} className="text-highlight hover:underline">
                            Open target
                          </Link>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setExpanded(open ? null : item.id)}
                  >
                    {open ? "Hide" : "Details"}
                  </Button>
                </div>
                {open ? (
                  <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-secondary/30 p-3 text-xs text-muted">
                    {JSON.stringify(item.metadata ?? {}, null, 2)}
                  </pre>
                ) : null}
              </Card>
            )
          })}

          {query.hasNextPage ? (
            <div className="pt-2">
              <Button
                variant="secondary"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default AdminActivityLogs
