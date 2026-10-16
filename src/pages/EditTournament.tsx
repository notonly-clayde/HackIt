import { useEffect, useState } from "react"
import { subscribeModeratorInviteResolved } from "../services/socket"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "../lib/queryKeys"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Field, { SelectField } from "../components/ui/Field"
import EmptyState from "../components/ui/EmptyState"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"
import RefreshingIndicator from "../components/ui/RefreshingIndicator"
import TournamentProblemSet from "../components/problems/TournamentProblemSet"
import ModeratorPicker from "../components/tournament/ModeratorPicker"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import { useTournamentDetail } from "../hooks/queries/useTournamentQueries"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"
import TournamentService from "../services/TournamentService"
import type { TournamentModerator } from "../types/api"

const EditTournament = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const from = (location.state as { from?: string } | null)?.from
  const fromLobby = from === "lobby"
  const fromList = from === "list"
  const returnTo = fromLobby ? `/tournament/${id}/lobby` : fromList ? "/tournament" : `/tournament/${id}`
  const returnLabel = fromLobby ? "Back to lobby" : fromList ? "Back to tournaments" : "Back to event"
  const { token, profile } = useAuth()
  const toast = useToast()
  const { data: tournament, isLoading, isFetching, error } = useTournamentDetail(id, token)
  useQueryErrorToast(error)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState<"now" | "later">("now")
  const [startsAt, setStartsAt] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [password, setPassword] = useState("")
  const [clearPassword, setClearPassword] = useState(false)
  const [startMode, setStartMode] = useState<"manual" | "auto">("manual")
  const [capacity, setCapacity] = useState("16")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [mods, setMods] = useState<TournamentModerator[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!token || !id || !tournament || tournament.hostId !== profile?.id) return

    return subscribeModeratorInviteResolved(token, (event) => {
      if (event.tournamentId !== id) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.detail(id) })
    })
  }, [token, id, tournament, profile?.id, queryClient])

  useEffect(() => {
    if (!tournament || initialized) return

    if (profile && tournament.hostId !== profile.id) return

    setName(tournament.name)
    setDescription(tournament.description)
    setVisibility(tournament.visibility)
    setStartMode(tournament.startMode)
    setCapacity(String(tournament.maxPlayers))
    setDurationMinutes(String(tournament.durationMinutes))
    const accepted = tournament.moderators.map((mod) => ({ ...mod, inviteStatus: "accepted" as const }))
    const pending =
      tournament.moderatorInvites?.map((mod) => ({
        id: mod.id,
        displayName: mod.displayName,
        email: mod.email,
        inviteStatus: "pending" as const,
      })) ?? []
    setMods([...accepted, ...pending])
    setSchedule(tournament.status === "Open" ? "now" : "later")
    if (tournament.scheduledAt) {
      const local = new Date(tournament.scheduledAt)
      const pad = (n: number) => String(n).padStart(2, "0")
      setStartsAt(
        `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`,
      )
    }
    setInitialized(true)
  }, [tournament, profile, initialized])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSubmitting(true)

    const moderatorEmails = mods.map((mod) => mod.email)

    const [data, err] = await TournamentService.update(token, id, {
      name: name.trim(),
      description: description.trim(),
      schedule,
      startsAt: schedule === "later" && startsAt ? new Date(startsAt).toISOString() : undefined,
      visibility,
      password: clearPassword ? null : password ? password : undefined,
      startMode,
      maxPlayers: Number(capacity),
      durationMinutes: Number(durationMinutes),
      moderatorEmails,
    })

    setSubmitting(false)

    if (err || !data) {
      toast.error(err ?? "Failed to update tournament")
      return
    }

    queryClient.setQueryData(queryKeys.tournaments.detail(data.id), (prev: typeof tournament) =>
      prev ? { ...prev, ...data } : data,
    )
    void queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.lists() })
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.hostedAll() })
    navigate(returnTo, { replace: fromLobby || fromList })
  }

  const hostError =
    tournament && profile && tournament.hostId !== profile.id
      ? "Only the host can edit this tournament"
      : null

  if (isLoading && !tournament) {
    return (
      <div className="page-container mt-10">
        <QueryLoadingCard />
      </div>
    )
  }

  if ((error && !tournament) || hostError || !tournament) {
    return (
      <div className="page-container mt-10">
        <EmptyState
          title="Cannot edit tournament"
          description={hostError ?? error?.message ?? "Tournament not found"}
          action={
            <Link to="/tournament">
              <Button variant="secondary">Back</Button>
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="page-container mt-8 sm:mt-10 max-w-2xl">
      <Link to={returnTo} className="text-sm text-muted hover:text-highlight transition-colors">
        ← {returnLabel}
      </Link>
      <div className="mt-2 flex justify-end">
        <RefreshingIndicator show={isFetching && !isLoading} />
      </div>
      <p className="ui-kicker mt-4 mb-2">Host ops</p>
      <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Edit tournament</h1>

      <Card className="mt-8 p-6 sm:p-8">
        <form className="flex flex-col gap-5" onSubmit={handleSave}>
          <Field label="Tournament name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Field
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <p className="text-sm font-medium text-accent mb-2">Schedule</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSchedule("now")}
                className={`ui-chip ${
                  schedule === "now"
                    ? "bg-highlight/20 text-highlight border border-highlight/40"
                    : "border border-border text-muted hover:text-accent"
                }`}
              >
                <span>Open now</span>
              </button>
              <button
                type="button"
                onClick={() => setSchedule("later")}
                className={`ui-chip ${
                  schedule === "later"
                    ? "bg-highlight/20 text-highlight border border-highlight/40"
                    : "border border-border text-muted hover:text-accent"
                }`}
              >
                <span>Set time</span>
              </button>
            </div>
            {schedule === "later" && (
              <div className="mt-3">
                <Field
                  label="Starts at"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <SelectField
            label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "private")}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </SelectField>

          {visibility === "private" && (
            <>
              <Field
                label="New password (optional)"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setClearPassword(false)
                }}
                placeholder="Leave blank to keep current"
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={clearPassword}
                  onChange={(e) => {
                    setClearPassword(e.target.checked)
                    if (e.target.checked) setPassword("")
                  }}
                />
                Remove password
              </label>
            </>
          )}

          <SelectField
            label="Start rule"
            value={startMode}
            onChange={(e) => setStartMode(e.target.value as "manual" | "auto")}
          >
            <option value="manual">Host starts manually</option>
            <option value="auto">Auto-start at player capacity</option>
          </SelectField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Max players"
              type="number"
              min={3}
              max={128}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
            />
            <Field
              label="Duration (minutes)"
              type="number"
              min={5}
              max={480}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>

          <ModeratorPicker
            value={mods}
            onChange={setMods}
            hint="Mods must already have HackIT accounts with verified emails."
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
            <Link to={returnTo} className="sm:flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" className="sm:flex-1" disabled={submitting || !name.trim()}>
              {submitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      {id && (
        <TournamentProblemSet
          tournamentId={id}
          token={token}
          isHost
          mode={tournament.status === "Open" || tournament.status === "Soon" ? "full" : "readonly"}
        />
      )}
    </div>
  )
}

export default EditTournament
