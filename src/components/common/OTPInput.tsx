import { useRef, useState } from "react"

type OTPInputProps = {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  onClearInvalid?: () => void
  length?: number
}

export default function OTPInput({
  value,
  onChange,
  invalid = false,
  onClearInvalid,
  length = 6,
}: OTPInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onClearInvalid?.()
    const digits = e.target.value.replace(/\D/g, "").slice(0, length)
    onChange(digits)
  }

  return (
    <div className={`my-8 ${invalid ? "mb-3 animate-shake" : ""}`} onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        value={value}
        onChange={handleChange}
        className="sr-only"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      <div className="flex gap-2 sm:gap-3 cursor-text justify-center">
        {Array.from({ length }).map((_, index) => (
          <div
            key={index}
            className={`
              h-12 w-10 sm:h-14 sm:w-12
              border flex items-center justify-center
              text-lg font-semibold text-accent
              ${
                invalid
                  ? "border-danger bg-danger-soft text-danger"
                  : value.length === index && isFocused
                    ? "border-highlight bg-highlight/10 shadow-[inset_2px_0_0_0_var(--color-highlight)]"
                    : "border-border bg-primary/30"
              }
            `}
            style={{ borderRadius: "0.25rem" }}
          >
            {value[index] ?? ""}
          </div>
        ))}
      </div>
    </div>
  )
}
