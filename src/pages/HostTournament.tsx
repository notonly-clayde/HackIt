import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { HiOutlineArrowLeft } from "react-icons/hi2"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Field, { SelectField } from "../components/ui/Field"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import ModeratorPicker from "../components/tournament/ModeratorPicker"
import TournamentService from "../services/TournamentService"
import { queryKeys } from "../lib/queryKeys"
import type { TournamentModerator } from "../types/api"

const HostTournament = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { token } = useAuth()
  const toast = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [schedule, setSchedule] = useState<"now" | "later">("now")
  const [startsAt, setStartsAt] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [password, setPassword] = useState("")
  const [startMode, setStartMode] = useState<"manual" | "auto">("manual")
  const [capacity, setCapacity] = useState("16")
  const [durationMinutes, setDurationMinutes] = useState("60")
  const [mods, setMods] = useState<TournamentModerator[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const moderatorEmails = mods.map((mod) => mod.email)

    const [data, err] = await TournamentService.create(token, {
      name: name.trim(),
      description: description.trim(),
      schedule,
      startsAt: schedule === "later" && startsAt ? new Date(startsAt).toISOString() : undefined,
      visibility,
      password: visibility === "private" && password ? password : undefined,
      startMode,
      maxPlayers: Number(capacity),
      durationMinutes: Number(durationMinutes),
      moderatorEmails: moderatorEmails.length > 0 ? moderatorEmails : undefined,
    })

    setSubmitting(false)

    if (err || !data) {
      toast.error(err ?? "Failed to create tournament")
      return
    }

    void queryClient.invalidateQueries({ queryKey: queryKeys.users.hostedAll() })
    navigate(`/tournament/${data.id}/lobby`)
  }

  return (
    <div className="page-container mt-8 sm:mt-10 max-w-2xl">
        <Link to="/tournament" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-highlight transition-colors">
          <HiOutlineArrowLeft className="h-4 w-4" />
          Back to tournaments
        </Link>
        <p className="ui-kicker mt-6 mb-2">Host ops</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Create a tournament</h1>
        <p className="text-muted text-sm mt-2">
          Verified email required. Configure schedule, visibility, start rules, and moderators.
        </p>

        <Card className="mt-8 p-6 sm:p-8">
          <form className="flex flex-col gap-5" onSubmit={handleCreate}>
            <Field
              label="Tournament name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly Code Sprint"
              required
            />

            <Field
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short briefing for players"
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
              <Field
                label="Password (optional)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank for invite-only"
                hint="Private tournaments can still use a password for lobby entry."
              />
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
                label="Target / max players"
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
              <Link to="/tournament" className="sm:flex-1">
                <Button type="button" variant="secondary" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                className="sm:flex-1"
                disabled={!name.trim() || submitting || (schedule === "later" && !startsAt)}
              >
                {submitting ? "Creating…" : "Create & open lobby"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
  )
}

export default HostTournament
