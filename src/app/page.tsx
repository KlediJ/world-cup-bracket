import { ButtonLink } from "@/components/ButtonLink";
import { actualRoundOf32Matches } from "@/data/actualResults";
import { homeAssets } from "@/data/homeAssets";
import { teamsById } from "@/data/teams";

function getTeamName(teamId: string) {
  return teamsById.get(teamId)?.name ?? teamId;
}

function getTeamCode(teamId: string) {
  return teamsById.get(teamId)?.code ?? "TBD";
}

function getTeamFlagUrl(teamId: string) {
  return teamsById.get(teamId)?.flagUrl;
}

function TeamLine({ teamId }: { teamId: string }) {
  const flagUrl = getTeamFlagUrl(teamId);

  return (
    <div className="flex min-w-0 items-center gap-3">
      {flagUrl ? <span className="block h-7 w-10 shrink-0 rounded bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${flagUrl})` }} /> : null}
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-zinc-950">{getTeamName(teamId)}</p>
        <p className="text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="home-hero relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-emerald-950 text-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen"
          style={{ backgroundImage: `url(${homeAssets.heroGraphic})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-emerald-950/45" />

        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:p-10">
          <div className="flex flex-col justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-wide text-amber-200">Knockout stage</p>
              <h1 className="mt-4 text-5xl font-black leading-none tracking-tight sm:text-7xl">
                Round of 32 is set.
              </h1>
              <p className="mt-5 text-base font-semibold leading-7 text-emerald-50">
                Group-stage points are being scored now. Open your submitted bracket from the leaderboard and lock the corrected official knockout path.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ButtonLink href="/leaderboard">Open Leaderboard</ButtonLink>
              <ButtonLink href="/rules">Scoring Rules</ButtonLink>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/95 p-4 text-zinc-950 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Actual bracket</p>
                <h2 className="mt-1 text-2xl font-black">Round of 32</h2>
              </div>
              <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
                16 matches
              </span>
            </div>
            <div className="mt-4 grid max-h-[68vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {actualRoundOf32Matches.map((match) => (
                <article key={match.id} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Match {match.matchNumber}</p>
                    <span className="rounded bg-zinc-950 px-2 py-1 text-[10px] font-black text-white">R32</span>
                  </div>
                  <div className="space-y-2">
                    <TeamLine teamId={match.homeTeamId} />
                    <div className="pl-[52px] text-xs font-black uppercase tracking-wide text-zinc-400">vs</div>
                    <TeamLine teamId={match.awayTeamId} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
