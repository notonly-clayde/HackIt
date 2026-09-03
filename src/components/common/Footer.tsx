import { Link } from "react-router-dom"

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-border bg-primary/90">
      <div className="page-container py-10 sm:py-12">
        <div className="ui-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">
            <div>
              <p className="ui-kicker mb-2">HackIT</p>
              <p className="font-bold text-lg text-accent tracking-tight">Arena status: Online</p>
              <p className="text-muted text-sm mt-2 max-w-sm leading-relaxed">
                Real-time programming tournaments and 1v1 battles. Compete, climb the ranks, and sharpen your craft.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <a href="#about" className="text-midtone hover:text-highlight transition-colors uppercase tracking-wider text-xs font-semibold">
                About
              </a>
              <a href="#faq" className="text-midtone hover:text-highlight transition-colors uppercase tracking-wider text-xs font-semibold">
                FAQ
              </a>
              <Link to="/login" className="text-midtone hover:text-highlight transition-colors uppercase tracking-wider text-xs font-semibold">
                Sign in
              </Link>
              <Link to="/terms" className="text-midtone hover:text-highlight transition-colors uppercase tracking-wider text-xs font-semibold">
                Terms
              </Link>
              <Link to="/privacy" className="text-midtone hover:text-highlight transition-colors uppercase tracking-wider text-xs font-semibold">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-xs text-muted tabular-nums">
            &copy; {new Date().getFullYear()} HackIT · Competitive programming arena
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
