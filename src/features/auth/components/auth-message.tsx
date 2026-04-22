import type { ReactNode } from "react";

type AuthMessageProps = Readonly<{
  variant: "success" | "error";
  children: ReactNode;
}>;

// Success and error states use explicit colors so transient feedback stays legible outside the base palette.
const variantClassName = {
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-900 dark:text-rose-100",
};

export function AuthMessage({ variant, children }: AuthMessageProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${variantClassName[variant]}`}
    >
      {children}
    </div>
  );
}
