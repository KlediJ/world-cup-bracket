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

function formatSyncTime(date: Date | null) {
  if (!date) {
    return "No sync yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function getSyncLabel(status: ResultSyncStatus) {
  if (!status.connected) {
    return "Database not connected";
  }

  if (status.totalMatches === 0) {
    return "Waiting for first sync";
  }

  if (status.liveMatches > 0) {
    return "Live feed active";
  }

  return "Feed synced";
}

function MatchResultLine({ match }: { match: ResultSyncStatus["recentMatches"][number] }) {
  const hasScore = typeof match.homeScore === "number" && typeof match.awayScore === "number";

  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-amber-200">{match.stage}</p>
        <span className="rounded bg-white px-2 py-1 text-[10px] font-black uppercase text-zinc-950">{match.status}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3 text-sm font-black text-white">
        <span className="truncate">{getTeamName(match.homeTeamId)}</span>
        <span>{hasScore ? match.homeScore : "-"}</span>
        <span className="truncate">{getTeamName(match.awayTeamId)}</span>
        <span>{hasScore ? match.awayScore : "-"}</span>
      </div>
    </div>
  );
}

export default async function Home() {
  const leaderboard = await getLeaderboard();
  const resultSyncStatus = await getResultSyncStatus();
  const officialPickCount = leaderboard.filter((entry) => entry.officialKnockoutSubmittedAt).length;
  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="grid gap-5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Knockout stage</p>
          <h1 className="mt-2 text-5xl font-black leading-none text-zinc-950 sm:text-6xl">Round of 32 is live.</h1>
          <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-600">
            Group-stage points are posted. Open your bracket to review the scorecard and lock the corrected official knockout path.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/leaderboard" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">
              Leaderboard
            </Link>
            <Link href="/rules" className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-emerald-600 hover:text-emerald-700">
              Scoring Rules
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <Stat label="Entries" value={String(leaderboard.length)} />
          <Stat label="Official picks locked" value={`${officialPickCount}/${leaderboard.length}`} tone="green" />
          <Stat label="Max group-stage points" value="80" />
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

          <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-200">Live score sync</p>
                <h2 className="mt-2 text-2xl font-black">{getSyncLabel(resultSyncStatus)}</h2>
              </div>
              <span className={`mt-1 size-3 rounded-full ${resultSyncStatus.totalMatches > 0 ? "bg-emerald-400" : "bg-amber-300"}`} />
            </div>
            <p className="mt-3 text-sm font-semibold leading-6 text-zinc-300">
              Last provider update: {formatSyncTime(resultSyncStatus.latestUpdatedAt)}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MiniStat label="Synced" value={String(resultSyncStatus.totalMatches)} />
              <MiniStat label="Live" value={String(resultSyncStatus.liveMatches)} />
              <MiniStat label="Final" value={String(resultSyncStatus.finalMatches)} />
            </div>
            {resultSyncStatus.recentMatches.length > 0 ? (
              <div className="mt-4 space-y-2">
                {resultSyncStatus.recentMatches.map((match) => (
                  <MatchResultLine key={match.matchId} match={match} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-white/10 bg-white/10 p-3 text-sm font-semibold leading-6 text-zinc-300">
                No match rows found yet. After the cron endpoint runs, this panel will show the stored football-data results.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Actual bracket</p>
              <h2 className="mt-1 text-3xl font-black text-zinc-950">Round of 32</h2>
            </div>
            <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
              Winner picks worth 3
            </span>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {actualRoundOf32Matches.map((match) => (
              <article key={match.id} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
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
      </section>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-zinc-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "green" }) {
  return (
    <div className={`rounded-2xl border p-4 ${tone === "green" ? "border-emerald-200 bg-emerald-50" : "border-zinc-200 bg-zinc-50"}`}>
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${tone === "green" ? "text-emerald-800" : "text-zinc-950"}`}>{value}</p>
    </div>
  );
}
