import { useId, type ComponentPropsWithoutRef } from "react";

type AuthInputFieldProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "className"
> &
  Readonly<{
    label: string;
    hint?: string;
    error?: string;
  }>;

export function AuthInputField({
  label,
  hint,
  error,
  id,
  "aria-describedby": ariaDescribedBy,
  ...inputProps
}: AuthInputFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(" ");
  const inputClassName = error
    ? "w-full rounded-2xl border border-highlight bg-background/75 px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60 border-rose-500/70 focus:border-rose-500 focus:ring-rose-500/15"
    : "w-full rounded-2xl border border-highlight bg-background/75 px-4 py-3 text-base text-foreground outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="space-y-2">
      {hint ? (
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground/80"
          >
            {label}
          </label>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-foreground/45">
            {hint}
          </span>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-foreground/80"
        >
          {label}
        </label>
      )}

      <input
        {...inputProps}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        className={inputClassName}
      />

      {error ? (
        <p id={errorId} className="text-sm text-rose-700 dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
