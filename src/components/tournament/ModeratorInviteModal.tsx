import Button from "../ui/Button"
import Modal from "../ui/Modal"
import type { ModeratorInviteItem } from "../../types/api"

type ModeratorInviteModalProps = {
  open: boolean
  invite: ModeratorInviteItem | null
  busy?: boolean
  acceptDisabled?: boolean
  onAccept: () => void
  onDecline: () => void
  onClose?: () => void
}

const ModeratorInviteModal = ({
  open,
  invite,
  busy = false,
  acceptDisabled = false,
  onAccept,
  onDecline,
  onClose,
}: ModeratorInviteModalProps) => {
  if (!invite) return null

  const liveNotice =
    acceptDisabled &&
    (invite.tournamentStatus === "Live" || invite.tournamentStatus === "Ended")
      ? " This tournament has already started, so you can no longer accept — decline to dismiss this invite."
      : ""

  return (
    <Modal
      open={open}
      onClose={onClose ?? onDecline}
      kicker="Tournament staff"
      title="Moderator invitation"
      description={`${invite.hostDisplayName} invited you to moderate "${invite.tournamentName}". Moderators monitor players during the event and cannot compete.${liveNotice}`}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onDecline} disabled={busy}>
            Decline
          </Button>
          <Button
            variant="primary"
            onClick={onAccept}
            disabled={busy || acceptDisabled}
            title={
              acceptDisabled
                ? "Accept is only available before the host starts the tournament"
                : undefined
            }
          >
            {busy ? "Saving…" : "Accept"}
          </Button>
        </div>
      }
    />
  )
}

export default ModeratorInviteModal
