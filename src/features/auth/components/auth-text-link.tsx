import Link from "next/link";
import type { ComponentProps } from "react";

type AuthTextLinkProps = Omit<ComponentProps<typeof Link>, "className">;

export function AuthTextLink({ children, ...props }: AuthTextLinkProps) {
  return (
    <Link
      {...props}
      className="font-semibold text-accent transition hover:brightness-110 focus:outline-none focus:underline"
    >
      {children}
    </Link>
  );
}
