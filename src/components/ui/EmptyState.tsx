import type { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

const EmptyState = ({ title, description, action }: EmptyStateProps) => {
  return (
    <div className="ui-card px-6 py-14 text-center">
      <p className="ui-kicker mb-3 justify-center">Empty</p>
      <p className="text-accent font-semibold text-lg tracking-tight">{title}</p>
      {description && <p className="text-muted text-sm mt-2 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  )
}

export default EmptyState
