import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
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
import { STALE_TIME } from "../lib/queryClient"
import AdminService from "../services/AdminService"
import type { UserRole, UserStatus } from "../types/api"

const AdminUsers = () => {
  const { token } = useAuth()
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [status, setStatus] = useState<"" | UserStatus>("")
  const [role, setRole] = useState<"" | UserRole>("")

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 200)
    return () => window.clearTimeout(timer)
  }, [search])

  const filters = {
    search: debounced.trim() || undefined,
    status: status || undefined,
    role: role || undefined,
  }

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: queryKeys.admin.users(filters),
    queryFn: async () => unwrap(await AdminService.listUsers(token, filters)),
    enabled: Boolean(token),
    staleTime: STALE_TIME.catalog,
  })
  useQueryErrorToast(error)

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or email…"
        />
        <SelectField label="Status" value={status} onChange={(e) => setStatus(e.target.value as "" | UserStatus)}>
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </SelectField>
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as "" | UserRole)}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </SelectField>
      </div>

      {isLoading && users.length === 0 ? (
        <QueryLoadingCard message="Loading users…" />
      ) : error ? (
        <EmptyState title="Could not load users" description={error.message} />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search." />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-accent">{user.displayName}</p>
                  <Badge tone={user.role === "admin" ? "live" : "neutral"}>{user.role}</Badge>
                  <Badge tone={user.status === "suspended" ? "danger" : "success"}>{user.status}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
              </div>
              <Link to={`/admin/users/${user.id}`}>
                <Button variant="secondary">Manage</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminUsers
