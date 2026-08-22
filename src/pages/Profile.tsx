import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Nav from "../components/Dashboard/Nav"

const stats = [
  { label: "Wins", value: "24" },
  { label: "Losses", value: "11" },
  { label: "Win Rate", value: "69%" },
  { label: "Matches", value: "35" },
]

const gameHistory = [
  {
    opponent: "AlgoFox",
    mode: "Versus · 1v1",
    result: "Win" as const,
    date: "Jul 27, 2026",
    score: "3 – 1",
  },
  {
    opponent: "Weekly Code Sprint",
    mode: "Tournament · Free For All",
    result: "2nd" as const,
    date: "Jul 26, 2026",
    score: "Rank #2",
  },
  {
    opponent: "ByteRunner",
    mode: "Versus · 1v1",
    result: "Loss" as const,
    date: "Jul 24, 2026",
    score: "1 – 3",
  },
  {
    opponent: "Beginner Showdown",
    mode: "Tournament · 1v1 Bracket",
    result: "Win" as const,
    date: "Jul 20, 2026",
    score: "Champion",
  },
]

const resultStyles: Record<(typeof gameHistory)[number]["result"], string> = {
  Win: "bg-highlight/20 text-highlight",
  Loss: "bg-red-400/15 text-red-300",
  "2nd": "bg-midtone/25 text-accent",
}

const Profile = () => {
  const { user } = useAuth()
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Coder"
  const email = user?.email ?? "—"
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "H"

  return (
    <div className="bg-accent-gradient min-h-screen pb-16">
      <Nav />

      <div className="page-container mt-6 sm:mt-10">
        {/* Profile header */}
        <section className="relative overflow-hidden rounded-3xl border border-highlight/20 bg-primary/40">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(95,188,145,0.25), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(64,138,113,0.2), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 px-6 sm:px-10 pt-10 pb-8">
            <div className="relative shrink-0">
              <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 border-highlight/50 bg-gradient-to-br from-secondary to-midtone text-3xl sm:text-4xl font-bold text-accent shadow-[0_0_40px_rgba(95,188,145,0.2)]">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={displayName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              {user?.emailVerified && (
                <span
                  className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-highlight text-primary"
                  title="Verified"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-highlight text-sm font-medium tracking-wide uppercase mb-1">
                Player Profile
              </p>
              <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl bg-gradient-to-b from-highlight to-accent bg-clip-text text-transparent truncate">
                {displayName}
              </h1>
              <p className="text-midtone mt-1 text-sm sm:text-base truncate">{email}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <Link
                  to="/versus"
                  className="inline-block bg-highlight text-primary font-semibold px-5 py-2 rounded-xl hover:bg-midtone hover:text-accent transition-colors"
                >
                  Challenge Someone
                </Link>
                <Link
                  to="/tournament"
                  className="inline-block border border-highlight/40 text-accent font-semibold px-5 py-2 rounded-xl hover:border-highlight hover:bg-highlight/10 transition-colors"
                >
                  Find Tournament
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-highlight/15 bg-secondary/30 px-5 py-5 sm:py-6 text-center transition-colors hover:border-highlight/40"
            >
              <p className="text-2xl sm:text-3xl font-bold text-accent">{stat.value}</p>
              <p className="text-midtone text-xs sm:text-sm mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        {/* Game history */}
        <section className="mt-10 sm:mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-accent font-bold text-xl sm:text-2xl">Game History</h2>
            <span className="text-midtone text-sm">{gameHistory.length} recent</span>
          </div>

          <div className="flex flex-col gap-3">
            {gameHistory.map((game) => (
              <div
                key={`${game.opponent}-${game.date}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-highlight/15 bg-secondary/30 px-5 sm:px-6 py-4 transition-colors hover:border-highlight/35 hover:bg-secondary/45"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-accent font-semibold truncate">{game.opponent}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${resultStyles[game.result]}`}>
                      {game.result}
                    </span>
                  </div>
                  <p className="text-midtone text-sm mt-0.5">
                    {game.mode} · {game.date}
                  </p>
                </div>
                <p className="text-highlight font-medium text-sm sm:text-base shrink-0">
                  {game.score}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile
