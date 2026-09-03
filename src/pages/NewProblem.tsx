import { Link, useNavigate } from "react-router-dom"
import Card from "../components/ui/Card"
import ProblemForm from "../components/problems/ProblemForm"
import { useAuth } from "../contexts/AuthContext"
import ProblemService from "../services/ProblemService"

const NewProblem = () => {
  const navigate = useNavigate()
  const { token } = useAuth()

  return (
    <div className="page-container mt-8 sm:mt-10">
        <Link to="/problems/mine" className="text-sm text-muted hover:text-highlight">
          ← My problems
        </Link>
        <p className="ui-kicker mt-6 mb-2">Authoring</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-accent tracking-tight">Create problem</h1>
        <Card className="mt-8 p-6 sm:p-8">
          <ProblemForm
            submitLabel="Create problem"
            onCancel={() => navigate("/problems/mine")}
            onSubmit={async (input) => {
              const [data, err] = await ProblemService.create(token, input)
              if (err || !data) throw new Error(err ?? "Failed to create problem")
              navigate("/problems/mine")
            }}
          />
        </Card>
    </div>
  )
}

export default NewProblem
