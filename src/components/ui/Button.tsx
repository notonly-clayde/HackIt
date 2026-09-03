import { forwardRef, type ButtonHTMLAttributes, type MouseEvent, type ReactNode } from "react"
import { useHudSound } from "../../contexts/SoundContext"
import type { HudSoundCue } from "../../lib/hudSound"

type Variant = "primary" | "secondary" | "ghost" | "danger" | "solid"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  loading?: boolean
  sound?: HudSoundCue | false
}

const variantClass: Record<Variant, string> = {
  primary: "ui-btn",
  secondary: "ui-btn ui-btn-secondary",
  ghost: "ui-btn-ghost",
  danger: "ui-btn ui-btn-danger",
  solid: "ui-btn-solid",
}

const variantCue: Record<Variant, HudSoundCue> = {
  primary: "confirm",
  solid: "confirm",
  danger: "deny",
  secondary: "tap",
  ghost: "tap",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    loading = false,
    disabled,
    className = "",
    type = "button",
    sound,
    onClick,
    ...rest
  },
  ref,
) {
  const { play } = useHudSound()

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && sound !== false) {
      play(sound ?? variantCue[variant])
    }
    onClick?.(event)
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {loading ? "Loading..." : children}
    </button>
  )
})

export default Button
