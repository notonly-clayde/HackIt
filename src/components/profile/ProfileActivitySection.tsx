import { useState } from "react"
import ProfileHistoryList from "./ProfileHistoryList"
import ProfileHostedTournamentsList from "./ProfileHostedTournamentsList"

type ActivityTab = "history" | "hosted"

const tabs: { value: ActivityTab; label: string }[] = [
  { value: "history", label: "History" },
  { value: "hosted", label: "Hosted lobbies" },
]

type ProfileActivitySectionProps = {
  userId: string
  token: string | null
}

const ProfileActivitySection = ({ userId, token }: ProfileActivitySectionProps) => {
  const [tab, setTab] = useState<ActivityTab>("history")

  const title = (
    <div className="ui-section-tabs" role="tablist" aria-label="Profile activity">
      {tabs.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={tab === option.value}
          onClick={() => setTab(option.value)}
          className="ui-section-tab"
        >
          {option.label}
        </button>
      ))}
    </div>
  )

  return tab === "history" ? (
    <ProfileHistoryList userId={userId} token={token} canReview title={title} />
  ) : (
    <ProfileHostedTournamentsList userId={userId} token={token} title={title} />
  )
}

export default ProfileActivitySection
