import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthService from '../../services/AuthService'
import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `border-x-2 border-transparent py-5 px-6 xl:px-10 hover:skew-x-165 hover:bg-[#285a4846] ${
    isActive ? 'bg-[#285a4846] skew-x-165 border-x-midtone' : ''
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10 ${
    isActive ? 'text-accent bg-[#285a4846]' : 'text-midtone'
  }`

const Nav = () => {
  const { user, refresh } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Coder"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "H"

  const handleLogout = async () => {
    await AuthService.signout()
    refresh()
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="page-container sticky top-4 z-50">
      <div className="relative flex items-center justify-between rounded-2xl border-0 border-highlight bg-accent-gradient px-4 sm:px-5">
        <h1 className="text-accent text-xl sm:text-[1.5rem] font-bold py-3">HackIT</h1>

        <div className="hidden lg:flex text-midtone items-center cursor-pointer">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/tournament" className={linkClass}>Tournaments</NavLink>
          <NavLink to="/versus" className={linkClass}>Versus</NavLink>
          <NavLink to="/profile" className={linkClass}>Profile</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border text-sm font-bold transition-colors ${
                isActive
                  ? "border-highlight bg-highlight text-primary"
                  : "border-highlight/40 bg-secondary text-accent hover:border-highlight hover:bg-midtone"
              }`
            }
            aria-label="Open profile"
            title={displayName}
          >
            {user?.image ? (
              <img src={user.image} alt={displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </NavLink>

          <div className="hidden sm:block bg-highlight rounded-[0.5rem]">
            <button
              className="cursor-pointer btn text-highlight border-1 p-2 bg-midtone rounded-[0.7rem] text-sm sm:text-base"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>

          <button
            type="button"
            className="lg:hidden text-accent p-2"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 lg:hidden rounded-2xl bg-primary/95 border border-highlight/20 backdrop-blur-sm overflow-hidden">
            <NavLink to="/" end onClick={closeMenu} className={mobileLinkClass}>Home</NavLink>
            <NavLink to="/tournament" onClick={closeMenu} className={mobileLinkClass}>Tournaments</NavLink>
            <NavLink to="/versus" onClick={closeMenu} className={mobileLinkClass}>Versus</NavLink>
            <NavLink to="/profile" onClick={closeMenu} className={mobileLinkClass}>Profile</NavLink>
            <button
              onClick={() => { closeMenu(); handleLogout() }}
              className="block w-full text-center text-highlight py-4 px-6 bg-midtone font-semibold sm:hidden"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Nav
