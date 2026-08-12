"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useLayoutEffect,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

import {
  AppShellNavigationContext,
  type AppShellNavigationGuard,
} from "@/components/layout/app-shell-navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { cn } from "@/lib/cn";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

const navigationItems = [
  {
    href: "/library",
    label: "Library",
    description: "Song sketches and arrangements",
  },
  {
    href: "/songs/new",
    label: "New Sketch",
    description: "Title, mode, tempo, and notes",
  },
];

function isActivePath(pathname: string, href: string) {
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;
  const normalizedHref =
    href !== "/" && href.endsWith("/") ? href.slice(0, -1) : href;

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

function normalizePath(href: string) {
  const hrefWithoutHash = href.split("#")[0] ?? href;
  const hrefWithoutQuery = hrefWithoutHash.split("?")[0] ?? hrefWithoutHash;

  if (hrefWithoutQuery === "") {
    return "/";
  }

  return hrefWithoutQuery !== "/" && hrefWithoutQuery.endsWith("/")
    ? hrefWithoutQuery.slice(0, -1)
    : hrefWithoutQuery;
}

function NavigationLink({
  href,
  label,
  description,
  active,
  compact = false,
  pill = false,
  onNavigateAttempt,
}: Readonly<{
  href: string;
  label: string;
  description: string;
  active: boolean;
  compact?: boolean;
  pill?: boolean;
  onNavigateAttempt: (href: string) => boolean;
}>) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!onNavigateAttempt(href)) {
      event.preventDefault();
    }
  }

  if (pill) {
    return (
      <Link
        href={href}
        scroll={false}
        onClick={handleClick}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tracking-[0.08em] transition focus:outline-none focus:ring-4 focus:ring-accent/20",
          active
            ? "border-accent/40 bg-accent-soft/75 text-foreground shadow-[0_18px_40px_-28px_rgba(245,158,11,0.8)]"
            : "border-highlight/80 bg-background/45 text-foreground/72 hover:border-accent/25 hover:bg-background/75 hover:text-foreground",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2.5 w-2.5 rounded-full transition",
            active ? "bg-accent" : "bg-highlight group-hover:bg-accent/70",
          )}
        />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      scroll={false}
      onClick={handleClick}
      className={cn(
        "group rounded-[1.35rem] border px-4 py-3 transition focus:outline-none focus:ring-4 focus:ring-accent/20",
        active
          ? "border-accent/40 bg-accent-soft/70 text-foreground shadow-[0_18px_40px_-28px_rgba(245,158,11,0.8)]"
          : "border-highlight/80 bg-background/45 text-foreground/72 hover:border-accent/25 hover:bg-background/75 hover:text-foreground",
        compact ? "min-w-[11rem]" : "block",
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-2.5 w-2.5 rounded-full transition",
              active ? "bg-accent" : "bg-highlight group-hover:bg-accent/70",
            )}
          />
          <span className="text-sm font-semibold tracking-[0.06em]">
            {label}
          </span>
        </div>
        <p className="text-sm leading-5 text-muted">{description}</p>
      </div>
    </Link>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [navigationGuard, setNavigationGuard] =
    useState<AppShellNavigationGuard | null>(null);
  // Set when a guarded navigation is intercepted: the dialog confirms before
  // running `proceed`. Links preventDefault on the false return, so the
  // deferred action re-navigates via the router instead.
  const [pendingLeave, setPendingLeave] = useState<{
    message: string;
    proceed: () => void;
  } | null>(null);

  // Keyed off the account, not the deployment: a demo build still lets people
  // sign in normally, and a registered account should see its own address.
  // Demo accounts have a generated address that reads as noise in the header.
  const isDemoUser = user?.is_demo ?? false;
  const accountLabel = isDemoUser ? "Demo visitor" : (user?.email ?? null);
  const logoutLabel = isDemoUser ? "Exit demo" : "Logout";

  function confirmNavigation(href: string) {
    if (!navigationGuard || normalizePath(href) === normalizePath(pathname)) {
      return true;
    }

    setPendingLeave({
      message: navigationGuard.message,
      proceed: () => router.push(href),
    });

    return false;
  }

  function handleLogout() {
    const leave = () => {
      logout();
      router.replace("/login");
    };

    if (navigationGuard) {
      setPendingLeave({ message: navigationGuard.message, proceed: leave });
      return;
    }

    leave();
  }

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const animationFrameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [pathname]);

  return (
    <AppShellNavigationContext.Provider
      value={{
        confirmNavigation,
        setNavigationGuard,
      }}
    >
      <ConfirmDialog
        open={pendingLeave !== null}
        destructive
        title="Discard unsaved changes?"
        message={pendingLeave?.message ?? ""}
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => {
          pendingLeave?.proceed();
          setPendingLeave(null);
        }}
        onCancel={() => setPendingLeave(null)}
      />

      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_30%)] dark:bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),_transparent_28%)]" />
        <div className="absolute left-[-10rem] top-16 h-72 w-72 rounded-full bg-highlight/55 blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-5rem] h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-highlight to-transparent" />

        <div className="relative mx-auto min-h-screen w-full max-w-[96rem] px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex min-h-[calc(100vh-2rem)] min-w-0 flex-col rounded-[2rem] border border-highlight/80 bg-surface/82 shadow-[0_36px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <header className="hidden border-b border-highlight/70 px-8 py-6 lg:block xl:px-10">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-3xl space-y-3">
                  <Link
                    href="/"
                    onClick={(event) => {
                      if (!confirmNavigation("/")) {
                        event.preventDefault();
                      }
                    }}
                    className="inline-flex w-fit items-center gap-3 rounded-full border border-highlight/80 bg-background/60 px-3 py-2 text-sm font-semibold tracking-[0.28em] text-foreground/72 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                    LYDIAN GRAVITY
                  </Link>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-foreground/45">
                      Songwriting Workspace
                    </p>
                    <p className="text-sm leading-6 text-muted">
                      Sketch sections, shape harmonic motion, and track melody
                      ideas across the library, setup, and editor views.
                    </p>
                  </div>
                </div>

                <nav className="flex flex-wrap items-center justify-end gap-3">
                  {navigationItems.map((item) => (
                    <NavigationLink
                      key={item.href}
                      {...item}
                      active={isActivePath(pathname, item.href)}
                      onNavigateAttempt={confirmNavigation}
                      pill
                    />
                  ))}
                  <div className="flex items-center gap-2 rounded-full border border-highlight/80 bg-background/45 px-3 py-2">
                    {isDemoUser ? (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-foreground/72">
                        Demo
                      </span>
                    ) : null}
                    <span className="max-w-44 truncate text-sm font-semibold text-foreground/70">
                      {accountLabel}
                    </span>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full border border-highlight/80 bg-surface px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
                    >
                      {logoutLabel}
                    </button>
                  </div>
                </nav>
              </div>
            </header>

            <header className="border-b border-highlight/70 px-4 py-4 sm:px-6 lg:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={(event) => {
                      if (!confirmNavigation("/")) {
                        event.preventDefault();
                      }
                    }}
                    className="inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-[0.24em] text-foreground/55 transition hover:text-foreground focus:outline-none focus:underline"
                  >
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    LYDIAN GRAVITY
                  </Link>
                  <p className="text-sm text-muted">
                    {accountLabel ?? "Library, setup, and editor views."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-highlight/80 bg-background/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground/65 transition hover:border-accent/30 hover:text-foreground focus:outline-none focus:ring-4 focus:ring-accent/20"
                >
                  {logoutLabel}
                </button>
              </div>

              <nav className="-mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
                {navigationItems.map((item) => (
                  <NavigationLink
                    key={item.href}
                    {...item}
                    active={isActivePath(pathname, item.href)}
                    compact
                    onNavigateAttempt={confirmNavigation}
                  />
                ))}
              </nav>
            </header>

            <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-12">
              {children}
            </div>
          </div>
        </div>
      </div>
    </AppShellNavigationContext.Provider>
  );
}
