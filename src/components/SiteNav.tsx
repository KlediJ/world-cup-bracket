import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/predict", label: "Picks" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-sm font-black text-white shadow-sm">
            WC
          </span>
          <span>
            <span className="block text-base font-black text-zinc-950">World Cup Bracket</span>
            <span className="block text-xs font-semibold text-zinc-500">Private prediction pool</span>
          </span>
        </Link>
        <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-bold text-zinc-700 transition hover:bg-white hover:text-emerald-700 hover:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
