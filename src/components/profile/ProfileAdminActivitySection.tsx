import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import Badge from "../ui/Badge"
import EmptyState from "../ui/EmptyState"
import QueryLoadingCard from "../ui/QueryLoadingCard"
import { useQueryErrorToast } from "../../hooks/useQueryErrorToast"
import { queryKeys } from "../../lib/queryKeys"
import { STALE_TIME } from "../../lib/queryClient"
import { unwrap } from "../../lib/unwrap"
import AdminService from "../../services/AdminService"
import type { ActivityLogItem } from "../../types/api"

type ActivityTab = "mine" | "audit"

const tabs: { value: ActivityTab; label: string }[] = [
  { value: "mine", label: "Admin activity" },
  { value: "audit", label: "Audit log" },
]

function targetLink(item: ActivityLogItem) {
  switch (item.targetType) {
    case "user":
      return `/admin/users/${item.targetId}`
    case "tournament":
      return `/tournament/${item.targetId}`
    case "problem":
      return `/admin/problems/${item.targetId}`
    case "report":
      return "/admin/reports"
    default:
      return null
  }
}

type ProfileAdminActivitySectionProps = {
  actorId: string
  token: string | null
}

const ProfileAdminActivitySection = ({ actorId, token }: ProfileAdminActivitySectionProps) => {
  const [tab, setTab] = useState<ActivityTab>("mine")
  const filters =
    tab === "mine"
      ? { actorId, limit: "20" }
      : { limit: "20" }

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.admin.activityLogs(filters),
    queryFn: async () =>
      unwrap(
        await AdminService.listActivityLogs(token, {
          actorId: tab === "mine" ? actorId : undefined,
          limit: 20,
        }),
      ),
    enabled: Boolean(token) && Boolean(actorId),
    staleTime: STALE_TIME.detail,
  })
  useQueryErrorToast(error)

  const items = data?.items ?? []

  return (
    <section className="mt-10 sm:mt-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="ui-section-tabs" role="tablist" aria-label="Admin activity">
          {tabs.map((option) => (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={tab === option.value}
              onClick={() => setTab(option.value)}
              className="ui-section-tab"
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="text-muted text-sm tabular-nums">
          {isLoading ? "…" : `${items.length} recent`}
        </span>
      </div>

      {isLoading && items.length === 0 ? (
        <QueryLoadingCard message="Loading activity…" />
      ) : error ? (
        <EmptyState title="Could not load activity" description={error.message} />
      ) : items.length === 0 ? (
        <EmptyState
          title={tab === "mine" ? "No admin activity yet" : "No audit events yet"}
          description={
            tab === "mine"
              ? "Actions you take as an admin will show up here."
              : "Platform-wide audit events will show up here."
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const link = targetLink(item)
            return (
              <div
                key={item.id}
                className="ui-card flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{item.action}</Badge>
                    <Badge tone={item.actorType === "system" ? "warn" : "live"}>
                      {item.actorType === "system" ? "system" : item.actorDisplayName ?? "user"}
                    </Badge>
                    <span className="text-xs text-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
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
              </div>
            )
          })}
          <div className="pt-2 text-center">
            <Link to="/admin/logs" className="text-sm text-highlight hover:underline">
              View full audit log
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProfileAdminActivitySection
