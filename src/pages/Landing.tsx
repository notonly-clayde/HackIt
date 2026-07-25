

import Footer from "../components/common/Footer"
import AboutUs from "../components/Landing/AboutUs"
import FAQ from "../components/Landing/FAQ"
import Home from "../components/Landing/home"
import Nav from "../components/Landing/nav"



const Landing = () => {
  return (
    <div className="bg-accent-gradient min-h-screen pt-4 scroll-smooth">
      <div>
        <Nav />
        <Home/>
        <AboutUs/>
        <FAQ/>
        <Footer/>
      </div>
    </div>
  )
}

export default Landing