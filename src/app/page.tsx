import Link from "next/link";
import { actualRoundOf32Matches } from "@/data/actualResults";
import { teamsById } from "@/data/teams";
import { getLeaderboard, getResultSyncStatus } from "@/db/queries";
import type { ResultSyncStatus } from "@/db/queries";

export const dynamic = "force-dynamic";

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

function formatUpdateTime(date: Date | null) {
  if (!date) {
    return "Updates pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export default async function Home() {
  const leaderboard = await getLeaderboard();
  const resultSyncStatus = await getResultSyncStatus();
  const officialPickCount = leaderboard.filter((entry) => entry.officialKnockoutSubmittedAt).length;
  const topThree = leaderboard.slice(0, 3);
  const resultsByMatchId = new Map(resultSyncStatus.matches.map((match) => [match.matchId, match]));
  const featuredMatch =
    resultSyncStatus.matches.find((match) => match.status === "live") ??
    resultSyncStatus.matches.find((match) => match.status === "final") ??
    actualRoundOf32Matches.map((match) => resultsByMatchId.get(match.id)).find(Boolean) ??
    null;
  const leadingEntry = topThree[0];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-950 text-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="p-5 sm:p-7">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-zinc-950">
                {resultSyncStatus.liveMatches > 0 ? "Live now" : "Knockout stage"}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-300">Updated {formatUpdateTime(resultSyncStatus.latestUpdatedAt)}</span>
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-none sm:text-6xl">Round of 32 scoreboard</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-300">
              Results feed straight into the pool standings as matches go final.
            </p>
            <div className="mt-6">
              <FeaturedMatch match={featuredMatch} />
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/5 p-5 sm:p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Pool snapshot</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <HeroStat label="Entries" value={String(leaderboard.length)} />
              <HeroStat label="Locked" value={`${officialPickCount}/${leaderboard.length}`} />
              <HeroStat label="Live" value={String(resultSyncStatus.liveMatches)} />
              <HeroStat label="Final" value={String(resultSyncStatus.finalMatches)} />
            </div>
            {leadingEntry ? (
              <Link href={`/submission/${leadingEntry.id}`} className="mt-4 block rounded-xl border border-white/10 bg-white p-4 text-zinc-950 transition hover:border-emerald-300">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Current leader</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xl font-black">{leadingEntry.playerName}</p>
                    <p className="mt-1 truncate text-xs font-bold text-zinc-500">{leadingEntry.officialChampionPick ? `Champion: ${leadingEntry.officialChampionPick}` : `Original: ${leadingEntry.originalChampionPick}`}</p>
                  </div>
                  <p className="text-3xl font-black text-emerald-700">{leadingEntry.points}</p>
                </div>
              </Link>
            ) : null}
            <div className="mt-4 flex flex-col gap-3">
              <Link href="/leaderboard" className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-400 px-5 py-3 text-sm font-black text-zinc-950 transition hover:bg-emerald-300">
                Leaderboard
              </Link>
              <Link href="/rules" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/15 px-5 py-3 text-sm font-black text-white transition hover:border-emerald-300">
                Scoring Rules
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Current leaders</p>
            <div className="mt-4 space-y-3">
              {topThree.map((entry) => (
                <Link key={entry.id} href={`/submission/${entry.id}`} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 rounded-lg border border-zinc-200 bg-[#fbfaf3] px-3 py-3 transition hover:border-emerald-600">
                  <span className="text-lg font-black text-zinc-950">#{entry.rank}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black text-zinc-950">{entry.playerName}</span>
                    <span className="text-xs font-bold text-zinc-500">{entry.officialChampionPick ? `Official: ${entry.officialChampionPick}` : `Original: ${entry.originalChampionPick}`}</span>
                  </span>
                  <span className="rounded bg-emerald-700 px-2 py-1 text-xs font-black text-white">{entry.points}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Match board</p>
              <h2 className="mt-1 text-3xl font-black text-zinc-950">Round of 32 results</h2>
            </div>
            <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
              Winner picks worth 3
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actualRoundOf32Matches.map((match) => {
              const result = resultsByMatchId.get(match.id);

              return <MatchCard key={match.id} match={match} result={result} />;
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedMatch({ match }: { match: ResultSyncStatus["matches"][number] | null }) {
  if (!match) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
        <p className="text-xs font-black uppercase tracking-wide text-amber-200">Next update</p>
        <p className="mt-2 text-2xl font-black">Scores will appear here when the first match feed arrives.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-4 text-zinc-950 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{match.stage}</p>
        <StatusBadge status={match.status} />
      </div>
      <div className="mt-5 grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <ScoreTeam teamId={match.homeTeamId} align="left" />
        <div className="grid grid-cols-[auto_auto_auto] items-center justify-center gap-3 rounded-xl bg-zinc-950 px-5 py-4 text-white">
          <span className="text-5xl font-black">{typeof match.homeScore === "number" ? match.homeScore : "-"}</span>
          <span className="text-sm font-black uppercase text-zinc-400">to</span>
          <span className="text-5xl font-black">{typeof match.awayScore === "number" ? match.awayScore : "-"}</span>
        </div>
        <ScoreTeam teamId={match.awayTeamId} align="right" />
      </div>
    </div>
  );
}

function ScoreTeam({ teamId, align }: { teamId: string; align: "left" | "right" }) {
  const flagUrl = getTeamFlagUrl(teamId);

  return (
    <div className={`flex min-w-0 items-center gap-3 ${align === "right" ? "sm:flex-row-reverse sm:text-right" : ""}`}>
      {flagUrl ? <span className="block h-10 w-14 shrink-0 rounded bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${flagUrl})` }} /> : null}
      <div className="min-w-0">
        <p className="truncate text-2xl font-black">{getTeamName(teamId)}</p>
        <p className="text-sm font-bold text-zinc-500">{getTeamCode(teamId)}</p>
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = status === "final" ? "Final" : status === "live" ? "Live" : "Upcoming";
  const classes = status === "final" ? "bg-zinc-950 text-white" : status === "live" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 text-zinc-600";

  return <span className={`rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${classes}`}>{label}</span>;
}

function MatchCard({
  match,
  result,
}: {
  match: (typeof actualRoundOf32Matches)[number];
  result?: ResultSyncStatus["matches"][number];
}) {
  const homeScore = result?.homeScore;
  const awayScore = result?.awayScore;
  const hasScore = typeof homeScore === "number" && typeof awayScore === "number";
  const homeTeamId = result?.homeTeamId ?? match.homeTeamId;
  const awayTeamId = result?.awayTeamId ?? match.awayTeamId;

  return (
    <article className={`rounded-lg border p-3 ${result?.status === "live" ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-[#fbfaf3]"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Match {match.matchNumber}</p>
        <StatusBadge status={result?.status ?? "scheduled"} />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <TeamLine teamId={homeTeamId} />
          <span className="text-lg font-black text-zinc-950">{hasScore ? homeScore : "-"}</span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center gap-3">
          <TeamLine teamId={awayTeamId} />
          <span className="text-lg font-black text-zinc-950">{hasScore ? awayScore : "-"}</span>
        </div>
      </div>
      {result?.winnerTeamId ? <p className="mt-3 truncate text-xs font-black uppercase tracking-wide text-emerald-800">Winner: {getTeamName(result.winnerTeamId)}</p> : null}
    </article>
  );
}
