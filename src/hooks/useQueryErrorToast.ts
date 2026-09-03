import { useEffect, useRef } from "react"
import { useToastOptional } from "../contexts/ToastContext"

export function useQueryErrorToast(error: Error | null | undefined) {
  const toast = useToastOptional()
  const lastMessageRef = useRef<string | null>(null)

  useEffect(() => {
    if (!error) {
      lastMessageRef.current = null
      return
    }

    if (lastMessageRef.current === error.message) return

    lastMessageRef.current = error.message
    toast.error(error.message)
  }, [error, toast])
}
