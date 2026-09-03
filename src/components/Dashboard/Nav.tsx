import { useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useAuth } from "../../contexts/AuthContext"
import AuthService from "../../services/AuthService"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  HiOutlineArrowLeftOnRectangle,
  HiOutlineBars3,
  HiOutlineBolt,
  HiOutlineCodeBracket,
  HiOutlineDocumentText,
  HiOutlineFlag,
  HiOutlineHome,
  HiOutlineShieldCheck,
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineTrophy,
  HiOutlineUser,
  HiOutlineXMark,
} from "react-icons/hi2"
import { prefetchTournamentList } from "../../hooks/queries/useTournamentQueries"
import { prefetchProblemCatalog, useAdminProblems } from "../../hooks/queries/useProblemQueries"
import { useHudSound } from "../../contexts/SoundContext"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "../../lib/queryKeys"
import { unwrap } from "../../lib/unwrap"
import { STALE_TIME } from "../../lib/queryClient"
import AdminService from "../../services/AdminService"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-para ${isActive ? "nav-para-active" : ""}`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 px-5 py-3.5 text-sm font-medium transition-colors border-b border-border cursor-pointer ${
    isActive ? "bg-highlight/15 text-highlight" : "text-midtone hover:bg-highlight/10 hover:text-accent"
  }`

type PrefetchNavLinkProps = {
  to: string
  end?: boolean
  className: typeof linkClass | typeof mobileLinkClass
  onClick?: () => void
  children: React.ReactNode
  prefetch?: () => void
}

const PrefetchNavLink = ({ prefetch, onClick, ...props }: PrefetchNavLinkProps) => {
  const { play } = useHudSound()

  return (
    <NavLink
      {...props}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={() => {
        play("tap")
        onClick?.()
      }}
    />
  )
}

const Nav = () => {
  const { user, profile, token, refresh } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { play, enabled, toggleEnabled } = useHudSound()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const isAdmin = profile?.role === "admin"
  const { data: pendingProblems = [] } = useAdminProblems(token, isAdmin)
  const { data: openReportCount = 0 } = useQuery({
    queryKey: queryKeys.admin.reportCount(),
    queryFn: async () => {
      const result = unwrap(await AdminService.countOpenReports(token))
      return result.count
    },
    enabled: Boolean(token) && isAdmin,
    staleTime: STALE_TIME.catalog,
  })
  const pendingCount = pendingProblems.length + openReportCount

  const adminBadge =
    pendingCount > 0 ? (
      <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-sm bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-300">
        {pendingCount > 99 ? "99+" : pendingCount}
      </span>
    ) : null

  const displayName =
    profile?.displayName?.trim() || user?.name?.trim() || user?.email?.split("@")[0] || "Coder"
  const email = profile?.email ?? user?.email ?? ""
  const avatar = profile?.avatarUrl ?? user?.image ?? null
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "H"

  const prefetchTournaments = () => {
    void prefetchTournamentList(queryClient)
  }

  const prefetchProblems = () => {
    void prefetchProblemCatalog(queryClient, token)
  }

  const handleLogout = async () => {
    closeAccountMenu()
    closeMobileMenu()
    await AuthService.signout()
    refresh()
  }

  const closeMobileMenu = () => {
    setMenuOpen((open) => {
      if (open) play("dismiss")
      return false
    })
  }

  const closeAccountMenu = () => {
    setAccountOpen((open) => {
      if (open) play("dismiss")
      return false
    })
  }

  useEffect(() => {
    if (!accountOpen) return

    const onPointer = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) {
        closeAccountMenu()
      }
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAccountMenu()
    }

    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [accountOpen])

  const toggleAccountMenu = () => {
    setAccountOpen((open) => {
      const next = !open
      play(next ? "deploy" : "dismiss")
      return next
    })
    setMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setMenuOpen((open) => {
      const next = !open
      play(next ? "deploy" : "dismiss")
      return next
    })
    setAccountOpen(false)
  }

  return (
    <nav className="page-container sticky top-4 z-50 pt-1">
      <div className="nav-shell relative">
        <Link to="/" className="flex items-center text-accent text-lg sm:text-xl font-bold tracking-tight px-1 shrink-0">
          HackIT
        </Link>

        <div className="hidden lg:flex h-full items-stretch self-stretch">
          <PrefetchNavLink to="/" end className={linkClass}>
            <span>
              <HiOutlineHome className="h-4 w-4" />
              Home
            </span>
          </PrefetchNavLink>
          <PrefetchNavLink to="/tournament" className={linkClass} prefetch={prefetchTournaments}>
            <span>
              <HiOutlineTrophy className="h-4 w-4" />
              Tournaments
            </span>
          </PrefetchNavLink>
          <PrefetchNavLink to="/problems" className={linkClass} prefetch={prefetchProblems}>
            <span>
              <HiOutlineCodeBracket className="h-4 w-4" />
              Problems
            </span>
          </PrefetchNavLink>
          <PrefetchNavLink to="/versus" className={linkClass}>
            <span>
              <HiOutlineBolt className="h-4 w-4" />
              Versus
            </span>
          </PrefetchNavLink>
          {isAdmin && (
            <PrefetchNavLink to="/admin" className={linkClass}>
              <span>
                <HiOutlineShieldCheck className="h-4 w-4" />
                Admin
                {adminBadge}
              </span>
            </PrefetchNavLink>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div ref={accountRef} className="relative">
            <button
              type="button"
              className={`flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full border text-xs font-bold transition-colors ${
                accountOpen
                  ? "border-highlight bg-highlight text-primary"
                  : "border-border-strong bg-secondary/50 text-accent hover:border-highlight"
              }`}
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              title={displayName}
              onClick={toggleAccountMenu}
            >
              {avatar ? (
                <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </button>

            {accountOpen && (
              <div
                role="menu"
                className="ui-card ui-menu hud-menu absolute right-0 top-full z-50 mt-2 w-56 shadow-xl"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-accent">{displayName}</p>
                  {email ? <p className="mt-0.5 truncate text-xs text-muted">{email}</p> : null}
                </div>
                <NavLink
                  to="/profile"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={closeAccountMenu}
                >
                  <HiOutlineUser className="h-4 w-4 text-highlight" />
                  Profile
                </NavLink>
                <button
                  type="button"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={() => {
                    closeAccountMenu()
                    navigate("/tournament/new")
                  }}
                >
                  <HiOutlineFlag className="h-4 w-4 text-highlight" />
                  Host tournament
                </button>
                <NavLink
                  to="/problems/mine"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={closeAccountMenu}
                >
                  <HiOutlineDocumentText className="h-4 w-4 text-highlight" />
                  My problems
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    role="menuitem"
                    className="ui-menu-item"
                    onClick={closeAccountMenu}
                  >
                    <HiOutlineShieldCheck className="h-4 w-4 text-highlight" />
                    Admin
                    {adminBadge}
                  </NavLink>
                )}
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  role="menuitem"
                  className="ui-menu-item"
                  onClick={() => void toggleEnabled()}
                >
                  {enabled ? (
                    <HiOutlineSpeakerWave className="h-4 w-4 text-highlight" />
                  ) : (
                    <HiOutlineSpeakerXMark className="h-4 w-4 text-muted" />
                  )}
                  HUD sound {enabled ? "on" : "off"}
                </button>
                <div className="my-1 border-t border-border" />
                <button
                  type="button"
                  role="menuitem"
                  className="ui-menu-item ui-menu-item-danger"
                  onClick={() => void handleLogout()}
                >
                  <HiOutlineArrowLeftOnRectangle className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden cursor-pointer text-accent p-2 rounded-lg hover:bg-highlight/10"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={toggleMobileMenu}
          >
            {menuOpen ? <HiOutlineXMark className="h-5 w-5" /> : <HiOutlineBars3 className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 lg:hidden ui-card hud-menu overflow-hidden shadow-xl">
            <PrefetchNavLink to="/" end onClick={closeMobileMenu} className={mobileLinkClass}>
              <HiOutlineHome className="h-4 w-4" />
              Home
            </PrefetchNavLink>
            <PrefetchNavLink to="/tournament" onClick={closeMobileMenu} className={mobileLinkClass} prefetch={prefetchTournaments}>
              <HiOutlineTrophy className="h-4 w-4" />
              Tournaments
            </PrefetchNavLink>
            <PrefetchNavLink to="/problems" onClick={closeMobileMenu} className={mobileLinkClass} prefetch={prefetchProblems}>
              <HiOutlineCodeBracket className="h-4 w-4" />
              Problems
            </PrefetchNavLink>
            <PrefetchNavLink to="/versus" onClick={closeMobileMenu} className={mobileLinkClass}>
              <HiOutlineBolt className="h-4 w-4" />
              Versus
            </PrefetchNavLink>
            <PrefetchNavLink to="/profile" onClick={closeMobileMenu} className={mobileLinkClass}>
              <HiOutlineUser className="h-4 w-4" />
              Profile
            </PrefetchNavLink>
            {isAdmin && (
              <PrefetchNavLink to="/admin" onClick={closeMobileMenu} className={mobileLinkClass}>
                <HiOutlineShieldCheck className="h-4 w-4" />
                Admin
                {adminBadge}
              </PrefetchNavLink>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Nav
