import picture from "../../assets/Group 8.svg"
import { Link } from "react-router-dom"

const Home = () => {
  return (
    <div className="page-container py-5 mt-8 sm:mt-12 lg:mt-16">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        <div className="flex flex-col text-center lg:text-left w-full lg:max-w-xl xl:max-w-2xl">
          <h1 className="section-heading leading-tight">
            Level up your coding skill through real-time competitions!
          </h1>
          <p className="text-midtone mt-4 text-sm sm:text-base leading-relaxed">
            Enter the arena, face off against skilled coders, and prove your abilities through intense, real-time programming battles.
          </p>
          <div className="bg-highlight rounded-[0.5rem] py-2 self-center lg:self-start mt-8 sm:mt-10">
            <Link to="/signup" className="text-highlight border-1 py-2 px-6 sm:p-6 bg-midtone rounded-[0.7rem] text-sm sm:text-base">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="w-full lg:flex-1 flex justify-center">
          <img
            src={picture}
            alt="Competitive programming illustration"
            className="w-full max-w-sm sm:max-w-md lg:max-w-xl xl:max-w-2xl h-auto"
          />
        </div>
      </div>
    </div>
  )
}

export default Home
