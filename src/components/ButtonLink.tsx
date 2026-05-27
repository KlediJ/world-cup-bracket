import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const classes =
    variant === "primary"
      ? "bg-emerald-700 text-white hover:bg-emerald-800"
      : "border border-slate-300 bg-white text-slate-900 hover:border-emerald-700 hover:text-emerald-800";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-md px-5 py-3 text-sm font-bold transition ${classes}`}
    >
      {children}
    </Link>
  );
}
