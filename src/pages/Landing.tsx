import { Link } from "react-router-dom"

const Landing = () => {
  return (
    <div>
      <Link to={"/login"}>login</Link>
      <Link to={"/signup"}>signup</Link>
    </div>
  )
}

export default Landing