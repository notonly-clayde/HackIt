import { useState } from 'react'
import { Link } from 'react-router-dom'

const Nav = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="page-container sticky top-4 z-50">
      <div className="relative flex items-center justify-between rounded-2xl border-0 border-highlight bg-accent-gradient px-4 sm:px-5">
        <h1 className="text-accent text-xl sm:text-[1.5rem] font-bold py-3">HackIT</h1>

        <div className="hidden lg:flex text-midtone items-center">
          <a href="/" className="hover:bg-[#285a4846] hover:skew-x-165 border-x-midtone py-5 px-6 xl:px-10">Home</a>
          <a href="#about" className="hover:bg-[#285a4846] hover:skew-x-165 border-x-midtone py-5 px-6 xl:px-10">About Us</a>
          <a href="#faq" className="hover:bg-[#285a4846] hover:skew-x-165 border-x-midtone py-5 px-6 xl:px-10">FAQ's</a>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block bg-highlight rounded-[0.5rem] py-2">
            <Link to="/login" className="text-highlight border-1 p-2 bg-midtone rounded-[0.7rem] text-sm sm:text-base">
              Participate
            </Link>
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
          <div className="absolute left-0 right-0 top-full mt-2 lg:hidden rounded-2xl bg-primary/95 border border-highlight/20 backdrop-blur-sm overflow-hidden cursor-pointer">
            <a href="/" onClick={closeMenu} className="block text-midtone py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10">Home</a>
            <a href="#about" onClick={closeMenu} className="block text-midtone py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10">About Us</a>
            <a href="#faq" onClick={closeMenu} className="block text-midtone py-4 px-6 hover:bg-[#285a4846] border-b border-highlight/10">FAQ's</a>
            <Link to="/login" onClick={closeMenu} className="block text-center text-highlight py-4 px-6 bg-midtone font-semibold sm:hidden">
              Participate
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Nav
