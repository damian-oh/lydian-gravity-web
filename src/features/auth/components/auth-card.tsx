import type { ReactNode } from "react";

type AuthCardProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
  status?: ReactNode;
  footer?: ReactNode;
}>;

export function AuthCard({
  title,
  description,
  children,
  status,
  footer,
}: AuthCardProps) {
  return (
    <section className="relative z-10 w-full max-w-md">
      <div className="overflow-hidden rounded-[2rem] border border-highlight/80 bg-background/80 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-accent via-foreground/80 to-highlight" />

        <div className="space-y-8 px-6 py-8 sm:px-8 sm:py-10">
          <header className="space-y-5">
            <p className="text-xs font-semibold tracking-[0.28em] text-foreground/55">
              Lydian Gravity
            </p>

            <div className="space-y-3">
              <h1 className="max-w-xs text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="max-w-sm text-sm leading-6 text-foreground/65">
                {description}
              </p>
            </div>
          </header>

          <div className="space-y-6">
            {status}
            {children}
          </div>

          {footer ? (
            <footer className="border-t border-highlight/80 pt-5">{footer}</footer>
          ) : null}
        </div>
      </div>
    </section>
  );
}
