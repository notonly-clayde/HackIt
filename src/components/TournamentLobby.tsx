type TournamentStatus = "Open" | "Soon" | "Live" | "Ended"
type BattleType = "1v1 Match" | "Free For All"

export type TournamentItem = {
  id: string
  name: string
  type: BattleType
  date: string
  status: TournamentStatus
  players: number
  maxPlayers: number
  duration: string
  description: string
}

type TournamentLobbyProps = {
  search?: string
  battleType?: string
}

const tournaments: TournamentItem[] = [
  {
    id: "1",
    name: "Weekly Code Sprint",
    type: "Free For All",
    date: "Sat, Jul 26 · 2:00 PM",
    status: "Open",
    players: 42,
    maxPlayers: 64,
    duration: "90 min",
    description: "Solve 4 timed algorithmic problems and climb the live scoreboard.",
  },  
  {
    id: "2",
    name: "Campus Clash Finals",
    type: "1v1 Match",
    date: "Sat, Aug 2 · 4:00 PM",
    status: "Soon",
    players: 8,
    maxPlayers: 16,
    duration: "75 min",
    description: "Invitation-style 1v1 finals. Single elimination until a champion.",
  },
  {
    id: "3",
    name: "Speed Typing Algorithms",
    type: "Free For All",
    date: "Mon, Jul 21 · 8:00 PM",
    status: "Ended",
    players: 56,
    maxPlayers: 56,
    duration: "40 min",
    description: "Quick implementation race — correctness first, then time.",
  },
  {
    id: "4",
    name: "Live Arena: Arrays",
    type: "1v1 Match",
    date: "Today · Ongoing",
    status: "Live",
    players: 14,
    maxPlayers: 20,
    duration: "30 min",
    description: "Ongoing live lobbies focused on array and string problems.",
  },
]

const statusStyles: Record<TournamentStatus, string> = {
  Open: "bg-highlight/20 text-highlight",
  Soon: "bg-midtone/25 text-accent",
  Live: "bg-red-400/20 text-red-300",
  Ended: "bg-primary/50 text-midtone",
}

const battleTypeValue = (type: BattleType) =>
  type === "1v1 Match" ? "single" : "ffa"

const TournamentLobby = ({ search = "", battleType = "" }: TournamentLobbyProps) => {
  const query = search.trim().toLowerCase()

  const filtered = tournaments.filter((tournament) => {
    const matchesSearch =
      !query ||
      tournament.name.toLowerCase().includes(query) ||
      tournament.description.toLowerCase().includes(query)

    const matchesType =
      !battleType || battleTypeValue(tournament.type) === battleType

    return matchesSearch && matchesType
  })

  return (
    <div className="page-container mt-8 sm:mt-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-accent font-bold text-xl sm:text-2xl">Available Lobbies</h2>
        <span className="text-midtone text-sm">
          {filtered.length} tournament{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-highlight/15 bg-secondary/20 px-6 py-14 text-center">
          <p className="text-accent font-semibold text-lg">No tournaments found</p>
          <p className="text-midtone text-sm mt-2">
            Try a different search or battle type.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((tournament) => (
            <article
              key={tournament.id}
              className="rounded-2xl border border-highlight/15 bg-secondary/30 px-5 sm:px-6 py-5 transition-colors hover:border-highlight/40 hover:bg-secondary/45"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-accent font-semibold text-lg truncate">
                      {tournament.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[tournament.status]}`}
                    >
                      {tournament.status}
                    </span>
                  </div>
                  <p className="text-midtone text-sm mt-1">
                    {tournament.type} · {tournament.date} · {tournament.duration}
                  </p>
                  <p className="text-accent/80 text-sm mt-2 leading-relaxed max-w-2xl">
                    {tournament.description}
                  </p>
                  <p className="text-midtone text-xs sm:text-sm mt-3">
                    {tournament.players}/{tournament.maxPlayers} players joined
                  </p>
                </div>

                <button
                  type="button"
                  disabled={tournament.status === "Ended" || tournament.status === "Soon"}
                  className="cursor-pointer shrink-0 self-start lg:self-center rounded-xl bg-highlight text-primary font-semibold px-5 py-2.5 transition-colors hover:bg-midtone hover:text-accent disabled:cursor-not-allowed disabled:bg-primary/40 disabled:text-midtone"
                >
                  {tournament.status === "Live"
                    ? "Spectate"
                    : tournament.status === "Open"
                      ? "Join"
                      : tournament.status === "Soon"
                        ? "Notify Me"
                        : "Ended"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default TournamentLobby
