import Badge from "../ui/Badge"
import { labelForProblemTag } from "../../lib/problemTags"

type ProblemTagChipsProps = {
  tags: string[] | undefined | null
  className?: string
  max?: number
}

const ProblemTagChips = ({ tags, className = "", max }: ProblemTagChipsProps) => {
  if (!tags || tags.length === 0) return null

  const visible = typeof max === "number" ? tags.slice(0, max) : tags
  const remaining = typeof max === "number" ? Math.max(0, tags.length - visible.length) : 0

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`.trim()}>
      {visible.map((tag) => (
        <Badge key={tag} tone="neutral">
          {labelForProblemTag(tag)}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge tone="neutral">+{remaining}</Badge>
      )}
    </div>
  )
}

export default ProblemTagChips
