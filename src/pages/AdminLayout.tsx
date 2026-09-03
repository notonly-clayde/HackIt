import { Link, Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const tabs = [
  { to: "/admin/problems", label: "Problems" },
  { to: "/admin/reports", label: "Reports" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/logs", label: "Logs" },
]

const AdminLayout = () => {
  const { profile } = useAuth()
  const location = useLocation()

  if (profile && profile.role !== "admin") {
    return <Navigate to="/problems" replace />
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
      <p className="ui-kicker mb-2">Admin</p>
      <h1 className="text-2xl font-bold tracking-tight text-accent sm:text-3xl">Platform control</h1>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const active =
            tab.to === "/admin/problems"
              ? location.pathname === "/admin" || location.pathname.startsWith("/admin/problems")
              : location.pathname.startsWith(tab.to)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
                active ? "bg-highlight/20 text-highlight" : "text-muted hover:text-accent"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  )
}

export default AdminLayout
