import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  HiCheck,
  HiOutlineBolt,
  HiOutlinePencilSquare,
  HiOutlineTrophy,
  HiOutlineUsers,
} from "react-icons/hi2"
import { useAuth } from "../contexts/AuthContext"
import { useToast } from "../contexts/ToastContext"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Modal from "../components/ui/Modal"
import Field from "../components/ui/Field"
import UserService from "../services/UserService"
import AdminService from "../services/AdminService"
import ProfileActivitySection from "../components/profile/ProfileActivitySection"
import ProfileAdminActivitySection from "../components/profile/ProfileAdminActivitySection"
import { isEmailVerifiedForAccess } from "../lib/emailVerification"
import { queryKeys } from "../lib/queryKeys"
import { unwrap } from "../lib/unwrap"
import { STALE_TIME } from "../lib/queryClient"
import { useQueryErrorToast } from "../hooks/useQueryErrorToast"

const Profile = () => {
  const { user, profile, token, setProfile, refreshProfile } = useAuth()
  const toast = useToast()
  const [editOpen, setEditOpen] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const isAdmin = profile?.role === "admin"

  const shownName =
    profile?.displayName?.trim() ||
    user?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Coder"
  const email = profile?.email ?? user?.email ?? "—"
  const avatar = profile?.avatarUrl ?? user?.image ?? null
  const emailVerified = isEmailVerifiedForAccess(user, profile)
  const initials =
    shownName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "H"

  useEffect(() => {
    if (token) void refreshProfile()
  }, [token, refreshProfile])

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
  } = useQuery({
    queryKey: queryKeys.admin.dashboardSummary(),
    queryFn: async () => unwrap(await AdminService.getDashboardSummary(token)),
    enabled: Boolean(token) && isAdmin,
    staleTime: STALE_TIME.catalog,
  })
  useQueryErrorToast(summaryError)

  const playerStats = [
    { label: "1v1 ELO", value: (profile?.elo1v1 ?? 1200).toLocaleString() },
    { label: "Tournament ELO", value: (profile?.eloTournament ?? 1200).toLocaleString() },
    { label: "Wins", value: String(profile?.wins ?? 0) },
    { label: "Matches", value: String(profile?.matchCount ?? 0) },
  ]

  const adminStats = [
    {
      label: "Total users",
      value: summaryLoading ? "…" : summary ? summary.totalUsers.toLocaleString() : "—",
    },
    {
      label: "Active tournaments",
      value: summaryLoading ? "…" : summary ? summary.activeTournaments.toLocaleString() : "—",
    },
    {
      label: "Open reports",
      value: summaryLoading ? "…" : summary ? summary.openReports.toLocaleString() : "—",
    },
    {
      label: "Active matches",
      value: summaryLoading ? "…" : summary ? summary.activeMatches.toLocaleString() : "—",
    },
  ]

  const stats = isAdmin ? adminStats : playerStats

  const openEdit = () => {
    setDisplayName(profile?.displayName ?? shownName)
    setBio(profile?.bio ?? "")
    setAvatarUrl(profile?.avatarUrl ?? "")
    setEditOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)

    const [data, err] = await UserService.updateMe(token, {
      displayName: displayName.trim(),
      bio: bio.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
    })

    setSaving(false)

    if (err || !data) {
      toast.error(err ?? "Failed to update profile")
      return
    }

    setProfile(data)
    toast.success("Profile updated")
    setEditOpen(false)
  }

  return (
    <div className="page-container mt-8 sm:mt-10">
        <Card className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(95,188,145,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 100%, rgba(64,138,113,0.18), transparent 50%)",
            }}
          />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 px-6 sm:px-10 pt-10 pb-8">
            <div className="relative shrink-0">
              <div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full border-2 border-highlight/50 bg-gradient-to-br from-secondary to-midtone text-3xl sm:text-4xl font-bold text-accent shadow-[0_0_40px_rgba(95,188,145,0.15)]">
                {avatar ? (
                  <img src={avatar} alt={shownName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {emailVerified && (
                <span
                  className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-highlight text-primary"
                  title="Verified"
                >
                  <HiCheck className="h-4 w-4" />
                </span>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="ui-kicker mb-1 justify-center sm:justify-start">
                {isAdmin ? "Administrator profile" : "Player dossier"}
              </p>
              <h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl text-accent tracking-tight truncate">
                {shownName}
              </h1>
              <p className="text-muted mt-1 text-sm sm:text-base truncate">{email}</p>
              {profile?.bio && <p className="text-accent/80 mt-3 text-sm max-w-xl">{profile.bio}</p>}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <Button variant="secondary" onClick={openEdit}>
                  <HiOutlinePencilSquare className="h-4 w-4" />
                  Edit profile
                </Button>
                {isAdmin ? (
                  <>
                    <Link to="/admin/users">
                      <Button variant="primary">
                        <HiOutlineUsers className="h-4 w-4" />
                        Manage users
                      </Button>
                    </Link>
                    <Link to="/tournament">
                      <Button variant="ghost">
                        <HiOutlineTrophy className="h-4 w-4" />
                        View tournaments
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/versus">
                      <Button variant="primary">
                        <HiOutlineBolt className="h-4 w-4" />
                        Challenge someone
                      </Button>
                    </Link>
                    <Link to="/tournament">
                      <Button variant="ghost">
                        <HiOutlineTrophy className="h-4 w-4" />
                        Find tournament
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        <section className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="px-5 py-5 sm:py-6 text-center">
              <p className="text-2xl sm:text-3xl font-bold text-accent tabular-nums">{stat.value}</p>
              <p className="text-muted text-xs sm:text-sm mt-1 uppercase tracking-wider">{stat.label}</p>
            </Card>
          ))}
        </section>

        {profile?.id ? (
          isAdmin ? (
            <ProfileAdminActivitySection actorId={profile.id} token={token} />
          ) : (
            <ProfileActivitySection userId={profile.id} token={token} />
          )
        ) : null}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        description={
          isAdmin
            ? "Update how you appear on HackIT."
            : "Update how you appear on HackIT. Stats stay match-driven."
        }
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || !displayName.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Field
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Field
            label="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
          />
          <Field
            label="Bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short intro"
          />
        </div>
      </Modal>
    </div>
  )
}

export default Profile
