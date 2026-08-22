import { useState } from "react"
import pic from "../assets/s.png"
import Nav from "../components/Dashboard/Nav"
import TournamentLobby from "../components/TournamentLobby"

const Tournament = () => {
  const [search, setSearch] = useState("")
  const [battleType, setBattleType] = useState("")

  return (
    <div className="bg-accent-gradient min-h-screen pb-12">
      <Nav />

      <div className="page-container mt-6 sm:mt-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <img src={pic} alt="" className="w-12 h-8 sm:w-[6rem] sm:h-[4rem] object-contain" />
          <h1 className="font-bold text-xl sm:text-2xl text-midtone">Tournaments</h1>
        </div>

        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tournaments..."
              className="w-full rounded-xl border border-highlight bg-[#285a4846] px-4 py-3 pr-10 text-accent placeholder:text-midtone outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-midtone"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
              />
            </svg>
          </div>

          <select
            value={battleType}
            onChange={(e) => setBattleType(e.target.value)}
            className="cursor-pointer w-full md:w-auto md:min-w-[12rem] rounded-xl border border-highlight bg-[#285a4846] px-4 py-3 text-accent outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
          >
            <option className="bg-midtone" value="">
              All Battle Types
            </option>
            <option className="bg-midtone" value="single">
              1v1 Match
            </option>
            <option className="bg-midtone" value="ffa">
              Free For All
            </option>
          </select>
        </div>
      </div>

      <TournamentLobby search={search} battleType={battleType} />
    </div>
  )
}

export default Tournament
