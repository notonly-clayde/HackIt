import { useState } from "react"
import { HiOutlineEye, HiOutlineEyeSlash } from "react-icons/hi2"

import type { InputGroupParams } from "../../types/common/inputgroup"
import { capitalize } from "../../utils/helper"

const InputGroup = ({ label, type, placeholder, error, name, onChange, onBlur, ref }: InputGroupParams) => {
  const [showPassword, setShowPassword] = useState(false)
  const isPasswordField = type === "password"
  const inputType = isPasswordField && showPassword ? "text" : type

  return (
    <div
      className={`auth-field ${
        error
          ? "border-danger bg-danger-soft/40"
          : "border-border bg-primary/30 focus-within:border-highlight focus-within:shadow-[inset_2px_0_0_0_var(--color-highlight)]"
      }`}
    >
      {error ? (
        <label htmlFor={name} className="block cursor-text px-4 pt-2 text-xs font-medium text-danger">
          {capitalize(error)}
        </label>
      ) : (
        <label htmlFor={name} className="block cursor-text px-4 pt-2 text-xs font-medium uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          name={name}
          id={name}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          ref={ref}
          className={`w-full px-4 pb-2.5 outline-none text-base bg-transparent placeholder:text-muted/70 ${
            isPasswordField ? "pr-11" : ""
          } ${error ? "text-danger" : "text-accent"}`}
        />
        {isPasswordField && (
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 bottom-2.5 text-muted hover:text-highlight transition-colors"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <HiOutlineEyeSlash className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
          </button>
        )}
      </div>
    </div>
  )
}

export default InputGroup
