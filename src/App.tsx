import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import { AuthProvider } from "./contexts/AuthContext"
import GuestRoutes from "./layouts/GuestRoutes"
import ProtectedRoutes from "./layouts/ProtectedRoutes"
import RootLayout from "./layouts/RootLayout"
import Home from "./pages/Home"
import Signup from "./pages/Signup"
import VerifyEmail from "./pages/VerifyEmail"
import AuthRoutes from "./layouts/AuthRoutes"
import Login from "./pages/Login"
import Terms from "./pages/Terms"
import Privacy from "./pages/Privacy"
import ForgotPassword from "./pages/ForgotPassword"
import VerifyResetPassword from "./pages/VerifyResetPassword"
import ResetPassword from "./pages/ResetPassword"
import Versus from "./pages/Versus"
import Tournament from "./pages/Tournament"
import Profile from "./pages/Profile"
import PublicProfile from "./pages/PublicProfile"
import HostTournament from "./pages/HostTournament"
import EditTournament from "./pages/EditTournament"
import TournamentDetail from "./pages/TournamentDetail"
import TournamentLobbyPage from "./pages/TournamentLobbyPage"
import Problems from "./pages/Problems"
import MyProblems from "./pages/MyProblems"
import NewProblem from "./pages/NewProblem"
import EditProblem from "./pages/EditProblem"
import ProblemPreview from "./pages/ProblemPreview"
import AdminLayout from "./pages/AdminLayout"
import AdminProblems from "./pages/AdminProblems"
import AdminProblemReview from "./pages/AdminProblemReview"
import AdminReports from "./pages/AdminReports"
import AdminUsers from "./pages/AdminUsers"
import AdminUserDetail from "./pages/AdminUserDetail"
import AdminActivityLogs from "./pages/AdminActivityLogs"
import NotFound from "./pages/NotFound"
import QueryLoadingCard from "./components/ui/QueryLoadingCard"

const TournamentPlay = lazy(() => import("./pages/TournamentPlay"))
const TournamentHostPage = lazy(() => import("./pages/TournamentHostPage"))
const TournamentSpectate = lazy(() => import("./pages/TournamentSpectate"))
const VersusPlay = lazy(() => import("./pages/VersusPlay"))
const VersusLobby = lazy(() => import("./pages/VersusLobby"))
const ProblemPractice = lazy(() => import("./pages/ProblemPractice"))

const LazyFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center px-4">
    <QueryLoadingCard />
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="/" element={<GuestRoutes />}>
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />
          </Route>

          <Route path="/" element={<AuthRoutes />}>
            <Route path="verify-email" element={<VerifyEmail />} />
            <Route path="verify-reset-password" element={<VerifyResetPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>

          <Route path="/" element={<RootLayout />}>
            <Route index element={<Home />} />

            <Route element={<ProtectedRoutes />}>
              <Route path="versus" element={<Versus />} />
              <Route
                path="versus/lobby/:matchId"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <VersusLobby />
                  </Suspense>
                }
              />
              <Route
                path="versus/play/:matchId"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <VersusPlay />
                  </Suspense>
                }
              />
              <Route path="problems" element={<Problems />} />
              <Route path="problems/mine" element={<MyProblems />} />
              <Route path="problems/new" element={<NewProblem />} />
              <Route path="problems/:id/edit" element={<EditProblem />} />
              <Route path="problems/:id/preview" element={<ProblemPreview />} />
              <Route
                path="problems/:id"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <ProblemPractice />
                  </Suspense>
                }
              />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminProblems />} />
                <Route path="problems" element={<AdminProblems />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="logs" element={<AdminActivityLogs />} />
              </Route>
              <Route path="admin/problems/:id" element={<AdminProblemReview />} />
              <Route path="tournament" element={<Tournament />} />
              <Route path="tournament/new" element={<HostTournament />} />
              <Route path="tournament/:id/edit" element={<EditTournament />} />
              <Route path="tournament/:id" element={<TournamentDetail />} />
              <Route path="tournament/:id/lobby" element={<TournamentLobbyPage />} />
              <Route
                path="tournament/:id/host"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <TournamentHostPage />
                  </Suspense>
                }
              />
              <Route
                path="tournament/:id/play"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <TournamentPlay />
                  </Suspense>
                }
              />
              <Route
                path="tournament/:id/spectate"
                element={
                  <Suspense fallback={<LazyFallback />}>
                    <TournamentSpectate />
                  </Suspense>
                }
              />
              <Route path="profile" element={<Profile />} />
              <Route path="u/:id" element={<PublicProfile />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
