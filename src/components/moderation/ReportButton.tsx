import { useState } from "react"
import { HiOutlineFlag } from "react-icons/hi2"
import Button from "../ui/Button"
import Modal from "../ui/Modal"
import { SelectField, TextAreaField } from "../ui/Field"
import { useAuth } from "../../contexts/AuthContext"
import { useToast } from "../../contexts/ToastContext"
import UserService from "../../services/UserService"
import type { ReportCategory, ReportTargetType } from "../../types/api"

type ReportButtonProps = {
  targetType: ReportTargetType
  targetId: string
  contextTournamentId?: string
  label?: string
  variant?: "ghost" | "secondary" | "danger"
  className?: string
}

const categories: { value: ReportCategory; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "hate", label: "Hate / discrimination" },
  { value: "sexual", label: "Sexual content" },
  { value: "spam", label: "Spam" },
  { value: "cheating", label: "Cheating / abuse" },
  { value: "other", label: "Other" },
]

export default function ReportButton({
  targetType,
  targetId,
  contextTournamentId,
  label = "Report",
  variant = "ghost",
  className = "",
}: ReportButtonProps) {
  const { token, profile } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<ReportCategory>("harassment")
  const [details, setDetails] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!profile || (targetType === "user" && profile.id === targetId)) {
    return null
  }

  const submit = async () => {
    if (!details.trim()) {
      toast.error("Please describe the issue")
      return
    }
    setSubmitting(true)
    const [, err] = await UserService.createReport(token, {
      targetType,
      targetId,
      contextTournamentId,
      category,
      details: details.trim(),
    })
    setSubmitting(false)
    if (err) {
      toast.error(err)
      return
    }
    toast.success("Report submitted")
    setOpen(false)
    setDetails("")
    setCategory("harassment")
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
        title="Report for harmful content or abuse"
        aria-label={label.trim() ? undefined : "Report for harmful content or abuse"}
      >
        <HiOutlineFlag className="h-4 w-4" />
        {label.trim() ? label : null}
      </Button>

      <Modal
        open={open}
        onClose={() => {
          if (!submitting) setOpen(false)
        }}
        title="Report to platform"
        description="Use this for harmful content or abuse. Tournament hosts handle match disputes separately."
        kicker="Safety"
        footer={
          <>
            <Button variant="secondary" disabled={submitting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={submitting}
              disabled={!details.trim() || submitting}
              onClick={() => void submit()}
            >
              Submit report
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <SelectField
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as ReportCategory)}
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Details"
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="What happened?"
            maxLength={2000}
          />
        </div>
      </Modal>
    </>
  )
}
