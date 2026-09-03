import type { ReactNode } from "react"

type SectionHeaderProps = {
  kicker?: string
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

const SectionHeader = ({ kicker, title, description, action, className = "" }: SectionHeaderProps) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0 border-l-2 border-highlight/50 pl-4">
        {kicker && <p className="ui-kicker mb-2">{kicker}</p>}
        <h1 className="font-bold text-2xl sm:text-3xl text-accent tracking-tight">{title}</h1>
        {description && <p className="text-muted text-sm mt-2 max-w-xl leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export default SectionHeader
