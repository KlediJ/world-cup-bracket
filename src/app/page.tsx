import { ButtonLink } from "@/components/ButtonLink";

const steps = [
  ["01", "Name the entry", "One bracket per player."],
  ["02", "Pick the field", "Groups first, knockout next."],
  ["03", "Track the pool", "Standings stay easy to read."],
];

const previewRows = [
  ["Maya", "76", "Complete"],
  ["Uncle Rob", "71", "Complete"],
  ["Jess", "68", "Complete"],
];

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_420px]">
          <div className="p-6 sm:p-10 lg:p-12">
            <div className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-800">
              Casual private pool
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-tight text-zinc-950 sm:text-6xl">
              World Cup picks without sportsbook noise.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Make your picks, submit your bracket, and follow the standings with your group.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bracket">Create Bracket</ButtonLink>
              <ButtonLink href="/leaderboard" variant="secondary">
                View Leaderboard
              </ButtonLink>
              <ButtonLink href="/rules" variant="secondary">
                Rules
              </ButtonLink>
            </div>
          </div>

          <aside className="border-t border-zinc-200 bg-zinc-950 p-5 text-white lg:border-l lg:border-t-0">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black">Pool Snapshot</p>
                <span className="rounded-md bg-amber-300 px-2 py-1 text-xs font-black text-zinc-950">Mock</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  ["48", "Teams"],
                  ["31", "Picks"],
                  ["12", "Champion pts"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-white p-3 text-zinc-950">
                    <p className="text-2xl font-black">{value}</p>
                    <p className="mt-1 text-xs font-bold text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                {previewRows.map(([name, points, status], index) => (
                  <div key={name} className="grid grid-cols-[36px_1fr_56px] items-center gap-3 rounded-md bg-white/10 px-3 py-3">
                    <span className="grid size-8 place-items-center rounded-md bg-emerald-500 text-sm font-black">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-bold">{name}</span>
                      <span className="block text-xs text-zinc-300">{status}</span>
                    </span>
                    <span className="text-right font-black text-amber-200">{points}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {steps.map(([number, title, description]) => (
          <div key={title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
            <span className="text-sm font-black text-emerald-700">{number}</span>
            <h2 className="mt-3 text-xl font-black text-zinc-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
