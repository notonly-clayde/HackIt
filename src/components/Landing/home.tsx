import picture from "../../assets/Group 8.svg"
import { Link } from "react-router-dom"
import Button from "../ui/Button"

const Home = () => {
  return (
    <div className="page-container py-8 mt-6 sm:mt-10 lg:mt-14">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        <div className="flex flex-col text-center lg:text-left w-full lg:max-w-xl xl:max-w-2xl">
          <p className="ui-kicker mb-4">Enter the arena</p>
          <h1 className="section-heading leading-[1.1]">
            Level up your coding skill through real-time competitions
          </h1>
          <p className="text-muted mt-5 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
            Enter the arena, face off against skilled coders, and prove your abilities through intense,
            real-time programming battles and free-for-all tournaments.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Link to="/signup">
              <Button variant="primary" className="!px-7 !py-3">
                Sign Up
              </Button>
            </Link>
            <a href="#about">
              <Button variant="secondary" className="!px-7 !py-3">
                Learn more
              </Button>
            </a>
          </div>
        </div>

        <div className="w-full lg:flex-1 flex justify-center">
          <div className="relative">
            <div className="absolute inset-8 bg-highlight/15 blur-3xl" />
            <div className="relative ui-card p-3 sm:p-4">
              <img
                src={picture}
                alt="Competitive programming illustration"
                className="w-full max-w-sm sm:max-w-md lg:max-w-xl xl:max-w-2xl h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
