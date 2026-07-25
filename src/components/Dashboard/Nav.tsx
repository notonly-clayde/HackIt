import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthService from '../../services/AuthService'
import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `border-x-2 border-transparent py-5 px-6 xl:px-10 hover:skew-x-165 hover:bg-[#285a4846] ${
    isActive ? 'bg-[#285a4846] skew-x-165 border-x-midtone' : ''
  }`

const Nav = () => {
  const { refresh } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    await AuthService.signout()
    refresh()
  }

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="page-container sticky top-4 z-50">
      <div className="relative flex items-center justify-between rounded-2xl border-0 border-highlight bg-accent-gradient px-4 sm:px-5">
        <h1 className="text-accent text-xl sm:text-[1.5rem] font-bold py-3">HackIT</h1>

        <div className="hidden lg:flex text-midtone items-center">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/tournament" className={linkClass}>Tournaments</NavLink>
          <NavLink to="/versus" className={linkClass}>Versus</NavLink>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block bg-highlight rounded-[0.5rem]">
            <button
              className="btn text-highlight border-1 p-2 bg-midtone rounded-[0.7rem] text-sm sm:text-base"
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
            <NavLink to="/" end onClick={closeMenu} className={({ isActive }) => `block py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10 ${isActive ? 'text-accent bg-[#285a4846]' : 'text-midtone'}`}>Home</NavLink>
            <NavLink to="/tournament" onClick={closeMenu} className={({ isActive }) => `block py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10 ${isActive ? 'text-accent bg-[#285a4846]' : 'text-midtone'}`}>Tournaments</NavLink>
            <NavLink to="/versus" onClick={closeMenu} className={({ isActive }) => `block py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10 ${isActive ? 'text-accent bg-[#285a4846]' : 'text-midtone'}`}>Versus</NavLink>
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
