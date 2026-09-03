import type { ReactNode } from "react"

export type PlayLeftTab = "problem" | "output" | "submissions"

type PlayLeftPanelTabsProps = {
  activeTab: PlayLeftTab
  onTabChange: (tab: PlayLeftTab) => void
  outputUnread?: boolean
  submissionsUnread?: boolean
  problemContent: ReactNode
  outputContent: ReactNode
  submissionsContent: ReactNode
}

const tabs: { id: PlayLeftTab; label: string }[] = [
  { id: "problem", label: "Problem" },
  { id: "output", label: "Output" },
  { id: "submissions", label: "Submissions" },
]

const PlayLeftPanelTabs = ({
  activeTab,
  onTabChange,
  outputUnread = false,
  submissionsUnread = false,
  problemContent,
  outputContent,
  submissionsContent,
}: PlayLeftPanelTabsProps) => {
  const unreadFor = (tab: PlayLeftTab) => {
    if (tab === "output") return outputUnread
    if (tab === "submissions") return submissionsUnread
    return false
  }

  const content =
    activeTab === "problem"
      ? problemContent
      : activeTab === "output"
        ? outputContent
        : submissionsContent

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-border px-3 py-2.5">
        {tabs.map((tab) => {
          const active = activeTab === tab.id
          const unread = unreadFor(tab.id) && !active
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-highlight/15 text-highlight border border-highlight/40"
                  : "border border-border text-muted hover:text-accent hover:border-highlight/30"
              }`}
            >
              {tab.label}
              {unread && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-highlight" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">{content}</div>
    </div>
  )
}

export default PlayLeftPanelTabs
