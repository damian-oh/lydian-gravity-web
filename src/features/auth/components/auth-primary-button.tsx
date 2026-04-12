import type { ComponentPropsWithoutRef } from "react";

type AuthPrimaryButtonProps = Omit<
  ComponentPropsWithoutRef<"button">,
  "className"
>;

export function AuthPrimaryButton({
  type = "button",
  children,
  ...buttonProps
}: AuthPrimaryButtonProps) {
  return (
    <button
      {...buttonProps}
      type={type}
      className="inline-flex w-full items-center justify-center rounded-2xl bg-accent px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:brightness-105 focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  );
}
