import { ButtonLink } from "@/components/ButtonLink";
import { scoringRules } from "@/lib/scoring";

const pickSteps = [
  ["1", "Pick group finishers", "Choose 1st, 2nd, and 3rd for every group."],
  ["2", "Advance the bracket", "Pick winners round by round until the final."],
  ["3", "Submit once", "Your entry goes into the shared pool leaderboard."],
];

const quickRules = [
  "Exact knockout scores earn a bonus.",
  "Winner picks still matter most.",
  "Highest total points wins.",
  "Offline pools stay outside the app.",
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="bg-zinc-950 p-6 text-white sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">World Cup pool</p>
            <h1 className="mt-4 max-w-xl text-5xl font-black tracking-tight sm:text-6xl">
              Simple picks. Clear scoring.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-zinc-300">
              Fill out one bracket, submit it to the pool, and follow the standings.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/bracket">Create Bracket</ButtonLink>
              <ButtonLink href="/predict" variant="secondary">
                Match Predictor
              </ButtonLink>
              <ButtonLink href="/leaderboard" variant="secondary">
                Leaderboard
              </ButtonLink>
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Scoring</p>
                <h2 className="mt-2 text-3xl font-black text-zinc-950">How points work</h2>
              </div>
              <span className="rounded-md bg-amber-300 px-3 py-2 text-sm font-black text-zinc-950">
                12 pts max pick
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {scoringRules.map((rule) => (
                <div key={rule.label} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 bg-[#fbfaf3] px-4 py-3">
                  <span className="text-sm font-black text-zinc-800">{rule.label}</span>
                  <span className="grid size-10 place-items-center rounded-md bg-zinc-950 text-sm font-black text-white">
                    {rule.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">How to play</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">Three quick steps</h2>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {pickSteps.map(([number, title, description]) => (
              <div key={title} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-4">
                <span className="grid size-9 place-items-center rounded-md bg-emerald-600 text-sm font-black text-white">
                  {number}
                </span>
                <h3 className="mt-4 text-lg font-black text-zinc-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Keep it clean</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Pool basics</h2>
          <div className="mt-5 space-y-3">
            {quickRules.map((rule) => (
              <div key={rule} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="grid size-7 place-items-center rounded-md bg-zinc-950 text-xs font-black text-white">✓</span>
                <span className="text-sm font-bold text-zinc-700">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
