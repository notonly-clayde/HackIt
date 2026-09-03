import type { InputGroupParams } from "../../types/common/inputgroup"
import { capitalize } from "../../utils/helper"

const InputGroup = ({ label, type, placeholder, error, name, onChange, onBlur, ref }: InputGroupParams) => {
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
      <input
        type={type}
        name={name}
        id={name}
        placeholder={placeholder}
        onChange={onChange}
        onBlur={onBlur}
        ref={ref}
        className={`w-full px-4 pb-2.5 outline-none text-base bg-transparent placeholder:text-muted/70 ${
          error ? "text-danger" : "text-accent"
        }`}
      />
    </div>
  )
}

export default InputGroup
