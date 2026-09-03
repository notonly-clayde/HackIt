import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBars3,
  HiOutlineHome,
  HiOutlineInformationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineXMark,
} from "react-icons/hi2"
import Button from "../ui/Button"
import { useHudSound } from "../../contexts/SoundContext"

const Nav = () => {
  const { play } = useHudSound()
  const [menuOpen, setMenuOpen] = useState(false)
  const { hash, pathname } = useLocation()
  const isHome = pathname === "/" && (!hash || hash === "#")

  const closeMenu = () => {
    setMenuOpen((open) => {
      if (open) play("dismiss")
      return false
    })
  }

  const toggleMenu = () => {
    setMenuOpen((open) => {
      const next = !open
      play(next ? "deploy" : "dismiss")
      return next
    })
  }

  const paraClass = (active: boolean) => `nav-para ${active ? "nav-para-active" : ""}`

  return (
    <nav className="page-container sticky top-4 z-50 pt-1">
      <div className="nav-shell relative">
        <a href="/" className="flex items-center text-accent text-lg sm:text-xl font-bold tracking-tight px-1 shrink-0">
          HackIT
        </a>

        <div className="hidden lg:flex h-full items-stretch self-stretch">
          <a href="/" className={paraClass(isHome)} onClick={() => play("tap")}>
            <span>
              <HiOutlineHome className="h-4 w-4" />
              Home
            </span>
          </a>
          <a href="#about" className={paraClass(hash === "#about")} onClick={() => play("tap")}>
            <span>
              <HiOutlineInformationCircle className="h-4 w-4" />
              About
            </span>
          </a>
          <a href="#faq" className={paraClass(hash === "#faq")} onClick={() => play("tap")}>
            <span>
              <HiOutlineQuestionMarkCircle className="h-4 w-4" />
              FAQ
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:inline-flex">
            <Button variant="primary" className="!py-2 !px-4 text-sm">
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              Participate
            </Button>
          </Link>

          <button
            type="button"
            className="lg:hidden cursor-pointer text-accent p-2 rounded-lg hover:bg-highlight/10"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            {menuOpen ? <HiOutlineXMark className="h-5 w-5" /> : <HiOutlineBars3 className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 lg:hidden ui-card hud-menu overflow-hidden shadow-xl">
            <a href="/" onClick={() => { play("tap"); closeMenu() }} className="flex items-center gap-2.5 px-5 py-3.5 text-sm text-midtone border-b border-border hover:bg-highlight/10 cursor-pointer">
              <HiOutlineHome className="h-4 w-4" />
              Home
            </a>
            <a href="#about" onClick={() => { play("tap"); closeMenu() }} className="flex items-center gap-2.5 px-5 py-3.5 text-sm text-midtone border-b border-border hover:bg-highlight/10 cursor-pointer">
              <HiOutlineInformationCircle className="h-4 w-4" />
              About
            </a>
            <a href="#faq" onClick={() => { play("tap"); closeMenu() }} className="flex items-center gap-2.5 px-5 py-3.5 text-sm text-midtone border-b border-border hover:bg-highlight/10 cursor-pointer">
              <HiOutlineQuestionMarkCircle className="h-4 w-4" />
              FAQ
            </a>
            <Link
              to="/login"
              onClick={closeMenu}
              className="flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold text-highlight hover:bg-highlight/10 sm:hidden cursor-pointer"
            >
              <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
              Participate
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Nav
