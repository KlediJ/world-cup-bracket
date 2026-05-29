import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/predict", label: "Picks" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-20 bg-transparent px-4 py-3">
      <nav className="mx-auto flex max-w-7xl justify-center">
        <div className="flex rounded-full border border-zinc-200/80 bg-white/85 p-1 shadow-sm backdrop-blur">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-black text-zinc-700 transition hover:bg-emerald-50 hover:text-emerald-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
