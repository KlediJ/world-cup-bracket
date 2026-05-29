import Link from "next/link";
import { scoringRules, scoringValues } from "@/lib/scoring";

const groupRules = scoringRules.slice(0, 4);
const knockoutRules = scoringRules.slice(4, 9);
const bonusRule = scoringRules[9];

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 text-white shadow-sm">
        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Rules and scoring</p>
            <h1 className="mt-3 max-w-3xl text-5xl font-black leading-none tracking-tight sm:text-6xl">
              Pick smart early. Win big late.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-zinc-300">
              The pool rewards a full tournament read: group order matters, third-place teams matter, and knockout picks get heavier the closer you get to the trophy.
            </p>
          </div>

          <Link href="/predict" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700">
            Start Picks
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Group stage</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Build the field</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
            Every group gives you three chances to score: winner, runner-up, and third place. The third-place race stays alive because only eight of twelve advance.
          </p>
          <div className="mt-5 space-y-2">
            {groupRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-3">
                <span className="text-sm font-black text-zinc-800">{rule.label}</span>
                <span className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-black text-white">{rule.points}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Knockouts</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">The points climb</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
            Early knockout picks matter, but the bracket gets more expensive as the field shrinks. The champion is the biggest single swing.
          </p>
          <div className="mt-5 space-y-2">
            {knockoutRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-3">
                <span className="text-sm font-black text-zinc-800">{rule.label}</span>
                <span className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white">{rule.points}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">Bonus</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Exact scores pay extra</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-700">
            Winner picks are the main game. Exact knockout scores are the edge case that can separate tied brackets.
          </p>
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-sm font-black text-zinc-700">{bonusRule.label}</p>
            <p className="mt-2 text-5xl font-black text-zinc-950">+{bonusRule.points}</p>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">How to think about it</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">A bracket can survive a messy group stage. It cannot survive a dead champion.</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Group winner</p>
              <p className="mt-2 text-4xl font-black text-zinc-950">{scoringValues.groupWinner}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 p-4">
              <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Semifinal</p>
              <p className="mt-2 text-4xl font-black text-zinc-950">{scoringValues.semifinalWinner}</p>
            </div>
            <div className="rounded-2xl bg-emerald-700 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-emerald-100">Champion</p>
              <p className="mt-2 text-4xl font-black">{scoringValues.champion}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
