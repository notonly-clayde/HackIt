import { useAuth } from "../contexts/AuthContext"
import Dashboard from "./Dashboard"
import Landing from "./Landing"
import QueryLoadingCard from "../components/ui/QueryLoadingCard"

const Home = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center px-4">
        <QueryLoadingCard />
      </div>
    )
  }

  return user ? <Dashboard /> : <Landing />
}

export default Home
