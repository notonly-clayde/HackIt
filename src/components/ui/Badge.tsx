import type { ReactNode } from "react"

type Tone = "open" | "soon" | "live" | "ended" | "neutral" | "success" | "danger" | "warn"

const toneClass: Record<Tone, string> = {
  open: "bg-highlight/20 text-highlight",
  soon: "bg-midtone/25 text-accent",
  live: "bg-danger-soft text-danger ui-badge-live",
  ended: "bg-primary/60 text-muted",
  neutral: "bg-secondary/40 text-midtone",
  success: "bg-highlight/20 text-highlight",
  danger: "bg-danger-soft text-danger",
  warn: "bg-amber-400/15 text-amber-300",
}

type BadgeProps = {
  children: ReactNode
  tone?: Tone
  className?: string
}

const Badge = ({ children, tone = "neutral", className = "" }: BadgeProps) => {
  return (
    <span className={`ui-badge ${toneClass[tone]} ${className}`}>
      <span className="ui-badge-label">{children}</span>
    </span>
  )
}

export default Badge
