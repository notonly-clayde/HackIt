import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"
import Select, { optionsFromChildren } from "./Select"

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export const Field = ({ label, error, hint, className = "", id, ...rest }: FieldProps) => {
  const fieldId = id || rest.name || label.replace(/\s+/g, "-").toLowerCase()

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <input
        id={fieldId}
        className={`ui-input ${error ? "border-danger focus:border-danger focus:ring-danger/30" : ""} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  )
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  children: ReactNode
}

export const SelectField = ({ label, error, children, className = "", id, ...rest }: SelectFieldProps) => {
  const fieldId = id || rest.name || label.replace(/\s+/g, "-").toLowerCase()
  const options = optionsFromChildren(children)
  const value = rest.value === undefined || rest.value === null ? "" : String(rest.value)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <Select
        id={fieldId}
        name={typeof rest.name === "string" ? rest.name : undefined}
        value={value}
        disabled={rest.disabled}
        className={`${error ? "!border-danger" : ""} ${className}`}
        aria-label={label}
        options={options}
        onChange={(next) => {
          rest.onChange?.({
            target: { value: next, name: rest.name ?? "" },
            currentTarget: { value: next, name: rest.name ?? "" },
          } as ChangeEvent<HTMLSelectElement>)
        }}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export const TextAreaField = ({ label, error, className = "", id, ...rest }: TextAreaFieldProps) => {
  const fieldId = id || rest.name || label.replace(/\s+/g, "-").toLowerCase()

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      <textarea
        id={fieldId}
        className={`ui-input min-h-[100px] resize-y ${error ? "border-danger" : ""} ${className}`}
        {...rest}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

export default Field
