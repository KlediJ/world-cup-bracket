import { ButtonLink } from "@/components/ButtonLink";
import { TournamentWidget } from "@/components/TournamentWidget";
import { homeAssets } from "@/data/homeAssets";
import { dailyBriefing, flagStripTeamIds, matchdayCards, upcomingMilestones } from "@/data/homeContent";
import { teamsById } from "@/data/teams";
import { tournamentNumbers } from "@/data/tournamentWidget";
import { scoringRules } from "@/lib/scoring";

const playSteps = [
  {
    title: "Make your picks",
    detail: "Use the match predictor for a full match-by-match path, or the classic bracket if you want the faster version.",
  },
  {
    title: "Submit once",
    detail: "Each email gets one entry. After submission, the bracket is locked.",
  },
  {
    title: "Follow the table",
    detail: "The leaderboard tracks total points, champion picks, and entry type.",
  },
];

export default function Home() {
  const flagStripTeams = flagStripTeamIds.flatMap((teamId) => {
    const team = teamsById.get(teamId);
    return team ? [team] : [];
  });

  return (
    <div className="space-y-8">
      <section className="home-hero relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-emerald-950 text-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen"
          style={{ backgroundImage: `url(${homeAssets.heroGraphic})` }}
        />
        <div className="pointer-events-none absolute inset-0 hidden opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:92px_92px] sm:block" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/35 sm:block" />
        <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-white/25 sm:block" />

        <div className="relative grid gap-5 p-4 sm:gap-8 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">World Cup pool</p>
            <h1 className="mt-3 text-4xl font-black leading-none tracking-tight sm:mt-4 sm:text-7xl">
              Pick the road to the trophy.
            </h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-emerald-50 sm:mt-5 sm:text-lg sm:leading-8">
              A clean private pool for match predictions, bracket picks, scoring rules, and tournament updates.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
              <ButtonLink href="/predict">Start Match Predictor</ButtonLink>
              <ButtonLink href="/bracket" variant="secondary">
                Classic Bracket
              </ButtonLink>
              <ButtonLink href="/leaderboard" variant="secondary">
                Leaderboard
              </ButtonLink>
            </div>
            <div className="mt-6 overflow-hidden rounded-xl border border-white/15 bg-white/10 py-2 sm:mt-8 sm:py-3">
              <div className="flag-strip flex w-max gap-3 px-3" aria-label="Featured country flag strip">
                {[...flagStripTeams, ...flagStripTeams].map((team, index) => (
                  <span
                    key={`${team.id}-${index}`}
                    className="grid min-w-16 grid-cols-[auto_1fr] items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2"
                    aria-label={team.name}
                    role="img"
                  >
                    <span className="text-2xl leading-none">{team.flag}</span>
                    <span className="text-xs font-black text-emerald-50">{team.code}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-xl shadow-emerald-950/30 backdrop-blur sm:p-5">
            <div
              className="size-20 rounded-2xl border border-amber-200/70 bg-amber-300 bg-contain bg-center bg-no-repeat shadow-sm sm:size-24"
              style={{ backgroundImage: `url(${homeAssets.trophyGraphic})` }}
              aria-label="Generic trophy graphic"
              role="img"
            >
              <span className="sr-only">Trophy</span>
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-wide text-amber-200 sm:mt-5">Pool snapshot</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
              {tournamentNumbers.map((fact) => (
                <div key={fact.label} className="rounded-xl border border-white/10 bg-white/10 p-2.5 sm:p-3">
                  <p className="text-2xl font-black text-white sm:text-3xl">{fact.value}</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-emerald-50">{fact.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TournamentWidget />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Matchday cards</p>
            <h2 className="mt-2 text-3xl font-black text-zinc-950">What to watch</h2>
          </div>
          <span className="rounded-md bg-zinc-950 px-3 py-2 text-xs font-black text-white">UI component</span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {matchdayCards.map((card) => (
            <article key={card.title} className="overflow-hidden rounded-2xl border border-zinc-200 bg-[#fbfaf3]">
              <div className="relative bg-emerald-800 p-4 text-white">
                <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:44px_44px]" />
                <div className="relative">
                  <p className="text-xs font-black uppercase tracking-wide text-amber-200">{card.label}</p>
                  <h3 className="mt-2 text-xl font-black">{card.title}</h3>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm font-black text-zinc-950">{card.matchup}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{card.detail}</p>
                <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-black text-emerald-800">{card.meta}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Daily briefing</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">Tournament news desk</h2>
            </div>
            <span className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
              Admin-editable feed
            </span>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {dailyBriefing.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="group rounded-xl border border-zinc-200 bg-[#fbfaf3] p-4 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:shadow-sm"
              >
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{item.category}</p>
                <h3 className="mt-3 text-lg font-black leading-6 text-zinc-950 group-hover:text-emerald-800">{item.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">{item.summary}</p>
              </a>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-amber-200">Upcoming</p>
          <h2 className="mt-2 text-3xl font-black">Key dates</h2>
          <div className="mt-5 space-y-3">
            {upcomingMilestones.map((event) => (
              <div key={`${event.date}-${event.title}`} className="grid grid-cols-[72px_1fr] gap-3 rounded-xl border border-white/10 bg-white/10 p-3">
                <div className="rounded-lg bg-amber-300 px-2 py-3 text-center text-sm font-black text-zinc-950">{event.date}</div>
                <div>
                  <p className="font-black">{event.title}</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-300">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">How to play</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Simple pool flow</h2>
          <div className="mt-5 space-y-3">
            {playSteps.map((step, index) => (
              <div key={step.title} className="grid grid-cols-[44px_1fr] gap-3 rounded-xl border border-zinc-200 bg-[#fbfaf3] p-4">
                <span className="grid size-10 place-items-center rounded-lg bg-emerald-600 text-sm font-black text-white">{index + 1}</span>
                <div>
                  <h3 className="font-black text-zinc-950">{step.title}</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-zinc-600">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Scoring</p>
              <h2 className="mt-2 text-3xl font-black text-zinc-950">Points at a glance</h2>
            </div>
            <span className="rounded-md bg-amber-300 px-3 py-2 text-sm font-black text-zinc-950">Highest score wins</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {scoringRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <span className="text-sm font-black text-zinc-800">{rule.label}</span>
                <span className="grid size-10 place-items-center rounded-lg bg-zinc-950 text-sm font-black text-white">{rule.points}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
