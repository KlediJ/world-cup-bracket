import { ButtonLink } from "@/components/ButtonLink";

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="grid gap-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">Private World Cup pool</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
            Make your picks, track the table, keep it friendly.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            A simple bracket prediction game for friends and family. No payments, no betting platform, no clutter.
            Fill out a bracket, save your picks, and compare against a sample leaderboard.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/bracket">Create Bracket</ButtonLink>
            <ButtonLink href="/leaderboard" variant="secondary">
              View Leaderboard
            </ButtonLink>
            <ButtonLink href="/rules" variant="secondary">
              Rules
            </ButtonLink>
          </div>
        </div>
        <div className="rounded-lg bg-slate-950 p-5 text-white">
          <div className="rounded-md bg-white/10 p-4">
            <p className="text-sm font-bold text-emerald-200">Sample final</p>
            <div className="mt-5 space-y-3">
              {["Brazil", "France", "Argentina", "England"].map((team, index) => (
                <div key={team} className="flex items-center justify-between rounded-md bg-white px-4 py-3 text-slate-950">
                  <span className="font-bold">{team}</span>
                  <span className="text-sm font-black text-emerald-700">#{index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">
            Built for a casual prediction pool where bragging rights matter more than complexity.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["1", "Enter your name", "Start a private bracket with a simple player name."],
          ["2", "Pick each round", "Choose group winners, runner-ups, knockout winners, and a champion."],
          ["3", "Save and compare", "Save locally for now and view the mock leaderboard."],
        ].map(([number, title, description]) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <span className="grid size-9 place-items-center rounded-md bg-amber-300 text-sm font-black text-slate-950">
              {number}
            </span>
            <h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
