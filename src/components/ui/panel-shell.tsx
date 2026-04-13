import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type PanelShellProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}>;

export function PanelShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: PanelShellProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-highlight/80 bg-surface/85 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="border-b border-highlight/70 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {eyebrow ? (
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-foreground/45">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>

      <div className={cn("px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
    </section>
  );
}
