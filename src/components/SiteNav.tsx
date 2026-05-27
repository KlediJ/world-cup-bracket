import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/bracket", label: "Bracket" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export function SiteNav() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg bg-emerald-700 text-sm font-black text-white">
            WC
          </span>
          <span>
            <span className="block text-base font-bold text-slate-950">World Cup Bracket</span>
            <span className="block text-xs font-medium text-slate-500">Private prediction pool</span>
          </span>
        </Link>
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
