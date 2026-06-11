import Link from "next/link";
import { ShareSubmissionControls } from "@/components/ShareSubmissionControls";
import { groups } from "@/data/groups";
import { homeAssets } from "@/data/homeAssets";
import { teamsById } from "@/data/teams";
import type { SubmissionDetail } from "@/db/queries";
import type { Group, GroupPick, ScorePick } from "@/types/bracket";

type TableRow = {
  teamId: string;
  points?: number;
  goalDifference?: number;
  goalsFor?: number;
};

type CalculatedTable = {
  group?: Group;
  table?: TableRow[];
};

type ReadonlyMatch = {
  id: string;
  label: string;
  teamA?: string;
  teamB?: string;
};

type ReadonlyRound = {
  title: string;
  shortTitle: string;
  matches: ReadonlyMatch[];
};

function getTeamName(teamId: string | undefined, fallback = "TBD") {
  return teamId ? teamsById.get(teamId)?.name ?? fallback : fallback;
}

function getTeamCode(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.code ?? "--" : "--";
}

function getTeamFlag(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flag ?? "" : "";
}

function getTeamFlagUrl(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flagUrl : undefined;
}

function TeamFlag({ teamId, className = "h-6 w-9" }: { teamId?: string; className?: string }) {
  const flagUrl = getTeamFlagUrl(teamId);

  if (flagUrl) {
    return (
      <span
        aria-label={`${getTeamName(teamId)} flag`}
        role="img"
        className={`${className} block rounded bg-cover bg-center shadow-sm`}
        style={{ backgroundImage: `url(${flagUrl})` }}
      />
    );
  }

  return <span className="text-xl leading-none">{getTeamFlag(teamId)}</span>;
}

function asCalculatedTables(payload: Record<string, unknown>): CalculatedTable[] {
  const tables = payload.calculatedTables;

  if (!Array.isArray(tables)) {
    return [];
  }

  return tables.filter((table): table is CalculatedTable => typeof table === "object" && table !== null);
}

function buildClassicRounds(submission: SubmissionDetail): ReadonlyRound[] {
  const picks = submission.knockoutPicks;
  const groupWinners = groups.map((group) => submission.groupPicks[group.id]?.winnerId ?? "");
  const runnersUp = groups.map((group) => submission.groupPicks[group.id]?.runnerUpId ?? "");
  const roundOf32Teams = [...groupWinners, ...runnersUp, ...submission.thirdPlaceAdvancers];

  return [
    {
      title: "Round of 32",
      shortTitle: "R32",
      matches: Array.from({ length: 16 }, (_, index) => ({
        id: `r32-${index + 1}`,
        label: `Match ${index + 1}`,
        teamA: roundOf32Teams[index],
        teamB: roundOf32Teams[31 - index],
      })),
    },
    {
      title: "Round of 16",
      shortTitle: "R16",
      matches: Array.from({ length: 8 }, (_, index) => ({
        id: `r16-${index + 1}`,
        label: `Match ${index + 17}`,
        teamA: picks[`r32-${index * 2 + 1}`],
        teamB: picks[`r32-${index * 2 + 2}`],
      })),
    },
    {
      title: "Quarterfinals",
      shortTitle: "QF",
      matches: Array.from({ length: 4 }, (_, index) => ({
        id: `qf-${index + 1}`,
        label: `Quarterfinal ${index + 1}`,
        teamA: picks[`r16-${index * 2 + 1}`],
        teamB: picks[`r16-${index * 2 + 2}`],
      })),
    },
    {
      title: "Semifinals",
      shortTitle: "SF",
      matches: Array.from({ length: 2 }, (_, index) => ({
        id: `sf-${index + 1}`,
        label: `Semifinal ${index + 1}`,
        teamA: picks[`qf-${index * 2 + 1}`],
        teamB: picks[`qf-${index * 2 + 2}`],
      })),
    },
    {
      title: "Champion",
      shortTitle: "Final",
      matches: [{ id: "champion", label: "Final winner", teamA: picks["sf-1"], teamB: picks["sf-2"] }],
    },
  ];
}

function buildPredictorRounds(submission: SubmissionDetail): ReadonlyRound[] {
  const picks = submission.knockoutPicks;
  const tables = asCalculatedTables(submission.predictionPayload);
  const winners = tables.map(({ table }) => table?.[0]?.teamId ?? "");
  const runnersUp = tables.map(({ table }) => table?.[1]?.teamId ?? "");
  const thirdPlace = tables
    .map(({ table }) => table?.[2])
    .filter((row): row is TableRow => Boolean(row?.teamId))
    .sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        (b.goalDifference ?? 0) - (a.goalDifference ?? 0) ||
        (b.goalsFor ?? 0) - (a.goalsFor ?? 0) ||
        getTeamName(a.teamId).localeCompare(getTeamName(b.teamId)),
    )
    .slice(0, 8)
    .map((row) => row.teamId);
  const roundOf32Teams = [...winners, ...runnersUp, ...thirdPlace];

  return [
    {
      title: "Round of 32",
      shortTitle: "R32",
      matches: Array.from({ length: 16 }, (_, index) => ({
        id: `predict-r32-${index + 1}`,
        label: `Match ${index + 1}`,
        teamA: roundOf32Teams[index],
        teamB: roundOf32Teams[31 - index],
      })),
    },
    {
      title: "Round of 16",
      shortTitle: "R16",
      matches: Array.from({ length: 8 }, (_, index) => ({
        id: `predict-r16-${index + 1}`,
        label: `Match ${index + 17}`,
        teamA: picks[`predict-r32-${index * 2 + 1}`],
        teamB: picks[`predict-r32-${index * 2 + 2}`],
      })),
    },
    {
      title: "Quarterfinals",
      shortTitle: "QF",
      matches: Array.from({ length: 4 }, (_, index) => ({
        id: `predict-qf-${index + 1}`,
        label: `Quarterfinal ${index + 1}`,
        teamA: picks[`predict-r16-${index * 2 + 1}`],
        teamB: picks[`predict-r16-${index * 2 + 2}`],
      })),
    },
    {
      title: "Semifinals",
      shortTitle: "SF",
      matches: Array.from({ length: 2 }, (_, index) => ({
        id: `predict-sf-${index + 1}`,
        label: `Semifinal ${index + 1}`,
        teamA: picks[`predict-qf-${index * 2 + 1}`],
        teamB: picks[`predict-qf-${index * 2 + 2}`],
      })),
    },
    {
      title: "Champion",
      shortTitle: "Final",
      matches: [{ id: "predict-champion", label: "Final winner", teamA: picks["predict-sf-1"], teamB: picks["predict-sf-2"] }],
    },
  ];
}

function getScoreLabel(scores: Record<string, ScorePick>, matchId: string) {
  const score = scores[matchId];

  if (!score || score.teamAScore === null || score.teamBScore === null) {
    return null;
  }

  return `${score.teamAScore}-${score.teamBScore}`;
}

function TeamPill({ teamId, isWinner }: { teamId?: string; isWinner?: boolean }) {
  return (
    <div className={`grid grid-cols-[32px_minmax(0,1fr)_44px] items-center gap-2 rounded-md border px-2 py-2 ${isWinner ? "border-emerald-500 bg-emerald-50" : "border-zinc-200 bg-white"}`}>
      <TeamFlag teamId={teamId} className="h-5 w-8" />
      <span className={`min-w-0 truncate text-sm ${isWinner ? "font-black text-emerald-950" : "font-bold text-zinc-700"}`}>
        {getTeamName(teamId)}
      </span>
      <span className={`rounded px-2 py-1 text-center text-xs font-black ${isWinner ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-500"}`}>
        {getTeamCode(teamId)}
      </span>
    </div>
  );
}

function MatchCard({ match, winnerId, score }: { match: ReadonlyMatch; winnerId?: string; score: string | null }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-[#fbfaf3] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{match.label}</p>
        {score ? <span className="rounded bg-zinc-950 px-2 py-1 text-xs font-black text-white">{score}</span> : null}
      </div>
      <div className="mt-3 space-y-2">
        <TeamPill teamId={match.teamA} isWinner={winnerId === match.teamA} />
        <TeamPill teamId={match.teamB} isWinner={winnerId === match.teamB} />
      </div>
    </article>
  );
}

function GroupPickCard({ group, pick }: { group: Group; pick?: GroupPick }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{group.name}</p>
      <div className="mt-3 space-y-2">
        <SummaryTeam label="Winner" teamId={pick?.winnerId} />
        <SummaryTeam label="Runner-up" teamId={pick?.runnerUpId} />
        <SummaryTeam label="Third" teamId={pick?.thirdPlaceId} />
      </div>
    </article>
  );
}

function SummaryTeam({ label, teamId }: { label: string; teamId?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
      <span className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="min-w-0 truncate text-sm font-black text-zinc-950">
        <span className="inline-flex items-center gap-2">
          <TeamFlag teamId={teamId} />
          {getTeamName(teamId)}
        </span>
      </span>
    </div>
  );
}

export function SubmissionBracketView({ submission }: { submission: SubmissionDetail }) {
  const isPredictor = submission.submissionType === "predictor";
  const rounds = isPredictor ? buildPredictorRounds(submission) : buildClassicRounds(submission);
  const champion = submission.championTeamId;
  const finalists = isPredictor ? [submission.knockoutPicks["predict-sf-1"], submission.knockoutPicks["predict-sf-2"]] : [submission.knockoutPicks["sf-1"], submission.knockoutPicks["sf-2"]];
  const submittedDate = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(submission.submittedAt);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-emerald-950 p-5 text-white shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 mix-blend-screen"
          style={{ backgroundImage: `url(${homeAssets.heroGraphic})` }}
        />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Locked submission</p>
            <h1 className="mt-3 text-4xl font-black leading-none tracking-tight sm:text-5xl">{submission.playerName}&apos;s bracket</h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">
              Submitted {submittedDate}. Locked bracket.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-white">
                {isPredictor ? "Match predictor" : "Classic bracket"}
              </span>
              <span className="rounded-md bg-amber-300 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-950">Locked</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Champion pick</p>
            <div className="mt-3 flex items-center gap-3">
              <TeamFlag teamId={champion} className="h-10 w-16" />
              <div>
                <p className="text-2xl font-black">{getTeamName(champion)}</p>
                <p className="text-sm font-bold text-emerald-50">{getTeamCode(champion)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Finalists</p>
          <div className="mt-3 space-y-2">
            {finalists.map((teamId, index) => (
              <SummaryTeam key={`${teamId}-${index}`} label={`Finalist ${index + 1}`} teamId={teamId} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:col-span-2">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Share</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
            Keep this link handy to reopen the bracket later.
          </p>
          <ShareSubmissionControls playerName={submission.playerName} championName={getTeamName(champion)} />
        </div>
      </section>

      {!isPredictor ? (
        <section className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Group picks</p>
              <h2 className="mt-2 text-2xl font-black text-zinc-950">Path into the knockouts</h2>
            </div>
            <p className="rounded-md bg-white px-3 py-2 text-sm font-black text-zinc-700">8 third-place advancers</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <GroupPickCard key={group.id} group={group} pick={submission.groupPicks[group.id]} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Bracket view</p>
        <h2 className="mt-2 text-2xl font-black text-zinc-950">One-page locked bracket</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-5">
          {rounds.map((round) => (
            <div key={round.title} className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-zinc-950 px-3 py-2 text-white">
                <h3 className="text-sm font-black">{round.title}</h3>
                <span className="rounded bg-white/10 px-2 py-1 text-xs font-black">{round.shortTitle}</span>
              </div>
              <div className="space-y-3">
                {round.matches.map((match) => (
                  <MatchCard key={match.id} match={match} winnerId={submission.knockoutPicks[match.id]} score={getScoreLabel(submission.knockoutScores, match.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/leaderboard" className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">
          Back to Leaderboard
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-emerald-600 hover:text-emerald-700">
          Home
        </Link>
      </div>
    </div>
  );
}
