import { useState } from 'react'
import Nav from '../components/Dashboard/Nav'
import Card from '../components/Versus/Card'

const Versus = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  return (
    <div className="bg-accent-gradient min-h-screen pb-12" id="versus">
      <Nav />

      <div className="page-container text-center mt-16 sm:mt-24 lg:mt-32 px-2">
        <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-white">Versus Battle</h1>
        <p className="text-accent text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Challenge your friends and lock horns in these thrilling 1-on-1 programming contests!
        </p>
      </div>

      <div className="page-container flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 lg:gap-24 pt-8 sm:pt-10">
        <Card text="Create Room" url="/createroom" onClick={() => setIsModalOpen(true)} />
        <Card text="Join Room" url="/joinroom" onClick={() => setIsJoinModalOpen(true)} />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-accent shadow-2xl border border-highlight/30 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="h-2 bg-gradient-to-r from-secondary via-midtone to-highlight" />

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 h-9 w-9 rounded-full text-secondary text-xl transition hover:bg-highlight hover:text-white"
            >
              &times;
            </button>

            <div className="p-5 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-secondary">Create Lobby</h2>
              <p className="mt-1 text-primary/70 text-sm sm:text-base">Set up your game and invite your friends.</p>

              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-secondary">Lobby Name</label>
                  <input
                    type="text"
                    placeholder="HackIT Room"
                    className="w-full rounded-xl border border-highlight bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-secondary">Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank for public"
                    className="w-full rounded-xl border border-highlight bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-secondary">Maximum Players</label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    defaultValue={2}
                    className="w-full rounded-xl border border-highlight bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
                  />
                </div>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-secondary px-5 py-3 font-medium text-secondary transition hover:bg-secondary hover:text-white"
                >
                  Cancel
                </button>
                <button className="rounded-xl bg-secondary px-6 py-3 font-semibold text-white transition duration-200 hover:bg-midtone active:scale-95">
                  Create Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-accent shadow-2xl border border-highlight/30 overflow-hidden">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 h-9 w-9 rounded-full text-secondary text-xl transition hover:bg-highlight hover:text-white"
            >
              &times;
            </button>

            <div className="p-5 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-secondary">Join Lobby</h2>
              <p className="mt-1 text-primary/70 text-sm sm:text-base">Enter the room code shared by the host.</p>

              <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-secondary">Lobby ID</label>
                  <input
                    type="text"
                    placeholder="Room ID"
                    className="w-full rounded-xl border border-highlight bg-white px-4 py-3 outline-none transition focus:border-secondary focus:ring-2 focus:ring-highlight"
                  />
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => setIsJoinModalOpen(false)}
                    className="rounded-xl border border-secondary px-5 py-3 font-medium text-secondary transition hover:bg-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                  <button className="rounded-xl bg-secondary px-6 py-3 font-semibold text-white transition duration-200 hover:bg-midtone active:scale-95">
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Versus
