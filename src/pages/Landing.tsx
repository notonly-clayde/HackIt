import Footer from "../components/common/Footer"
import AboutUs from "../components/Landing/AboutUs"
import FAQ from "../components/Landing/FAQ"
import Home from "../components/Landing/home"
import Nav from "../components/Landing/nav"

const Landing = () => {
  return (
    <div className="min-h-screen page-bg scroll-smooth">
      <Nav />
      <Home />
      <AboutUs />
      <FAQ />
      <Footer />
    </div>
  )
}

export default Landing
