import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import Nav from "../components/Dashboard/Nav"

const quickActions = [
  {
    title: "Tournaments",
    description: "Browse and join upcoming programming contests with live rankings.",
    to: "/tournament",
    cta: "Browse Tournaments",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0116.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.02 5.228m4.02-5.228a6.003 6.003 0 00-4.02-5.228" />
      </svg>
    ),
  },
  {
    title: "Versus",
    description: "Create or join a private room and battle a friend in a 1-on-1 coding duel.",
    to: "/versus",
    cta: "Start a Battle",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
  },
]

const upcomingTournaments = [
  { name: "Weekly Code Sprint", type: "Free For All", date: "Sat, Jul 26 · 2:00 PM", status: "Open" },
  { name: "Beginner Showdown", type: "1v1 Match", date: "Sun, Jul 27 · 6:00 PM", status: "Open" },
  { name: "Algo Masters Cup", type: "Free For All", date: "Fri, Aug 1 · 7:00 PM", status: "Soon" },
]

const Dashboard = () => {
  const { user } = useAuth()
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Coder"

  return (
    <div className="bg-accent-gradient min-h-screen pb-16">
      <Nav />

      <div className="page-container mt-6 sm:mt-10">
        <div className="mb-8 sm:mb-12">
          <h1 className="font-bold text-2xl sm:text-3xl lg:text-[2.75rem] bg-gradient-to-b from-highlight to-secondary bg-clip-text text-transparent leading-tight">
            Welcome back, {displayName}!
          </h1>
          <p className="text-midtone text-sm sm:text-base lg:text-lg mt-2">
            Ready to compete? Jump into a tournament or challenge someone to a versus battle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.to}
              className="group bg-primary/50 border border-highlight/20 rounded-2xl p-6 sm:p-8 hover:border-highlight/60 hover:bg-primary/70 transition-all"
            >
              <div className="text-highlight mb-4">{action.icon}</div>
              <h2 className="text-accent font-bold text-2xl mb-2">{action.title}</h2>
              <p className="text-midtone mb-6 leading-relaxed">{action.description}</p>
              <span className="inline-block bg-highlight text-primary font-semibold px-5 py-2 rounded-xl group-hover:bg-midtone transition-colors">
                {action.cta}
              </span>
            </Link>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-accent font-bold text-2xl">Upcoming Tournaments</h2>
            <Link to="/tournament" className="text-highlight text-sm hover:underline">
              View all
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {upcomingTournaments.map((tournament) => (
              <div
                key={tournament.name}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/30 border border-highlight/15 rounded-xl px-6 py-4"
              >
                <div>
                  <h3 className="text-accent font-semibold">{tournament.name}</h3>
                  <p className="text-midtone text-sm mt-0.5">
                    {tournament.type} · {tournament.date}
                  </p>
                </div>
                <span
                  className={`self-start sm:self-auto text-xs font-semibold px-3 py-1 rounded-full ${
                    tournament.status === "Open"
                      ? "bg-highlight/20 text-highlight"
                      : "bg-midtone/20 text-midtone"
                  }`}
                >
                  {tournament.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
