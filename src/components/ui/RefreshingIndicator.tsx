type RefreshingIndicatorProps = {
  show: boolean
  className?: string
}

const RefreshingIndicator = ({ show, className = "" }: RefreshingIndicatorProps) => {
  if (!show) return null

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-muted tabular-nums ${className}`}
      aria-live="polite"
    >
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-highlight" />
      Updating…
    </span>
  )
}

export default RefreshingIndicator
