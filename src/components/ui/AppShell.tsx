import type { ReactNode } from "react"
import Nav from "../Dashboard/Nav"
import WarnBanner from "../moderation/WarnBanner"

type AppShellProps = {
  children: ReactNode
  /** Hide the shared app nav (e.g. full-bleed play/spectate) */
  hideNav?: boolean
  className?: string
  /** Extra bottom padding */
  dense?: boolean
}

const AppShell = ({ children, hideNav = false, className = "", dense = false }: AppShellProps) => {
  return (
    <div className={`min-h-screen page-bg ${dense ? "pb-8" : "pb-16"} ${className}`}>
      {!hideNav && <Nav />}
      {!hideNav && <WarnBanner />}
      {children}
    </div>
  )
}

export default AppShell
