import Link from "next/link";
import { ShareSubmissionControls } from "@/components/ShareSubmissionControls";
import { SubmissionViewSwitcher } from "@/components/SubmissionViewSwitcher";
import { groups } from "@/data/groups";
import { homeAssets } from "@/data/homeAssets";
import { buildOfficialKnockoutRounds, getCalculatedTablesFromPayload, isOfficialBracketReady } from "@/data/officialKnockout";
import { teamsById } from "@/data/teams";
import type { SubmissionDetail } from "@/db/queries";
import { getGroupStageScoreBreakdownFromClassicPicks, getGroupStageScoreBreakdownFromPredictionPayload } from "@/lib/scoring";
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

type ThirdPlaceEntry = {
  group: Group;
  row: TableRow;
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

function getPredictorGroupTables(submission: SubmissionDetail) {
  const tables = asCalculatedTables(submission.predictionPayload);

  return groups.map((group) => {
    const storedTable = tables.find((table) => table.group?.id === group.id)?.table ?? [];

    return {
      group,
      table: storedTable,
    };
  });
}

function getPredictorThirdPlaceTable(tables: Array<{ group: Group; table: TableRow[] }>): ThirdPlaceEntry[] {
  return tables
    .map(({ group, table }) => ({
      group,
      row: table[2],
    }))
    .filter((entry): entry is ThirdPlaceEntry => Boolean(entry.row?.teamId))
    .sort(
      (a, b) =>
        (b.row.points ?? 0) - (a.row.points ?? 0) ||
        (b.row.goalDifference ?? 0) - (a.row.goalDifference ?? 0) ||
        (b.row.goalsFor ?? 0) - (a.row.goalsFor ?? 0) ||
        getTeamName(a.row.teamId).localeCompare(getTeamName(b.row.teamId)),
    );
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

function toReadonlyOfficialRounds(tables: ReturnType<typeof getCalculatedTablesFromPayload>, picks: Record<string, string>): ReadonlyRound[] {
  return buildOfficialKnockoutRounds(tables, picks).map((round) => ({
    title: round.title,
    shortTitle: round.shortTitle,
    matches: round.matches.map((match) => ({
      id: match.id,
      label: match.label,
      teamA: match.homeTeamId,
      teamB: match.awayTeamId,
    })),
  }));
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

function GroupTableView({ tables }: { tables: Array<{ group: Group; table: TableRow[] }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tables.map(({ group, table }) => (
        <article key={group.id} className="rounded-xl border border-zinc-200 bg-[#fbfaf3] p-3">
          <p className="text-sm font-black text-zinc-950">{group.name}</p>
          <div className="mt-3 space-y-2">
            {table.map((row, index) => (
              <div key={row.teamId} className="grid grid-cols-[28px_32px_minmax(0,1fr)_52px] items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                <span className="font-black text-zinc-400">{index + 1}</span>
                <TeamFlag teamId={row.teamId} className="h-5 w-8" />
                <span className="min-w-0 truncate font-bold text-zinc-800">{getTeamName(row.teamId)}</span>
                <span className="text-right font-black text-emerald-700">{row.points ?? 0} pts</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ThirdPlaceRaceView({ entries }: { entries: ThirdPlaceEntry[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-black uppercase tracking-wide text-amber-700">Third-place race</p>
        <h3 className="mt-1 text-xl font-black text-zinc-950">Top 8 of 12 advance</h3>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {entries.map(({ group, row }, index) => (
          <div
            key={`${group?.id}-${row.teamId}`}
            className={`grid grid-cols-[32px_40px_minmax(0,1fr)_58px] items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              index < 8 ? "border border-emerald-200 bg-white text-zinc-950" : "border border-zinc-200 bg-zinc-100 text-zinc-500"
            }`}
          >
            <span className={`grid size-7 place-items-center rounded text-xs font-black ${index < 8 ? "bg-emerald-700 text-white" : "bg-zinc-300 text-zinc-700"}`}>
              {index + 1}
            </span>
            <TeamFlag teamId={row.teamId} className="h-6 w-9" />
            <span className="min-w-0 truncate font-black">
              {getTeamName(row.teamId)} <span className="font-bold text-zinc-500">({group?.name ?? "Group"})</span>
            </span>
            <span className="text-right font-black">{row.points ?? 0} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoundListView({ rounds, submission }: { rounds: ReadonlyRound[]; submission: SubmissionDetail }) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
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
  );
}

function BracketRoadView({ rounds, submission }: { rounds: ReadonlyRound[]; submission: SubmissionDetail }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[980px] grid-cols-5 gap-3">
        {rounds.map((round) => (
          <div key={round.title} className="min-w-0">
            <div className="mb-3 rounded-lg bg-zinc-950 px-3 py-2 text-white">
              <h3 className="text-center text-xs font-black uppercase tracking-wide">{round.shortTitle}</h3>
            </div>
            <div className="flex h-full flex-col justify-around gap-3">
              {round.matches.map((match) => (
                <article key={match.id} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-2">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-zinc-500">{match.label}</p>
                  <div className="space-y-1.5">
                    <TeamPill teamId={match.teamA} isWinner={submission.knockoutPicks[match.id] === match.teamA} />
                    <TeamPill teamId={match.teamB} isWinner={submission.knockoutPicks[match.id] === match.teamB} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
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

function ScoreBreakdown({ submission, isPredictor }: { submission: SubmissionDetail; isPredictor: boolean }) {
  const breakdown = isPredictor
    ? getGroupStageScoreBreakdownFromPredictionPayload(submission.predictionPayload)
    : getGroupStageScoreBreakdownFromClassicPicks(submission.groupPicks, submission.thirdPlaceAdvancers);
  const groupRowsWithPoints = breakdown.groupRows.filter((row) => row.total > 0);

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Scorecard</p>
          <h2 className="mt-1 text-3xl font-black text-zinc-950">{submission.points} points</h2>
        </div>
        <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
          Group stage scored
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-2">
          {groupRowsWithPoints.length > 0 ? (
            groupRowsWithPoints.map((row) => (
              <article key={row.groupId} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-zinc-950">Group {row.groupId.toUpperCase()}</p>
                  <span className="rounded bg-zinc-950 px-2 py-1 text-xs font-black text-white">+{row.total}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <PointLine label="Winner" points={row.winnerPoints} predictedTeamId={row.predicted.winnerId} actualTeamId={row.actual.winnerId} />
                  <PointLine label="Runner-up" points={row.runnerUpPoints} predictedTeamId={row.predicted.runnerUpId} actualTeamId={row.actual.runnerUpId} />
                  <PointLine label="Third" points={row.thirdPlacePoints} predictedTeamId={row.predicted.thirdPlaceId} actualTeamId={row.actual.thirdPlaceId} />
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg bg-zinc-50 px-3 py-3 text-sm font-bold text-zinc-600">No group placement points yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Third-place advancers</p>
          <p className="mt-2 text-2xl font-black text-zinc-950">+{breakdown.thirdPlaceAdvancers.reduce((sum, row) => sum + row.points, 0)}</p>
          <div className="mt-3 space-y-2">
            {breakdown.thirdPlaceAdvancers.length > 0 ? (
              breakdown.thirdPlaceAdvancers.map((row) => <SummaryTeam key={row.teamId} label={`+${row.points}`} teamId={row.teamId} />)
            ) : (
              <p className="text-sm font-bold text-zinc-600">No third-place advancer hits.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function PointLine({ label, points, predictedTeamId, actualTeamId }: { label: string; points: number; predictedTeamId?: string; actualTeamId?: string }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${points > 0 ? "bg-emerald-50" : "bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{label}</p>
        <span className={`rounded px-2 py-1 text-xs font-black ${points > 0 ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-500"}`}>+{points}</span>
      </div>
      <p className="mt-2 truncate text-sm font-black text-zinc-950">{getTeamName(predictedTeamId)}</p>
      {points === 0 ? <p className="mt-1 truncate text-xs font-bold text-zinc-500">Actual: {getTeamName(actualTeamId)}</p> : null}
    </div>
  );
}

export function SubmissionBracketView({ submission }: { submission: SubmissionDetail }) {
  const isPredictor = submission.submissionType === "predictor";
  const rounds = isPredictor ? buildPredictorRounds(submission) : buildClassicRounds(submission);
  const officialTables = getCalculatedTablesFromPayload(submission.predictionPayload);
  const officialRounds = toReadonlyOfficialRounds(officialTables, submission.officialKnockoutPicks ?? {});
  const predictorTables = isPredictor ? getPredictorGroupTables(submission) : [];
  const predictorThirdPlaceTable = isPredictor ? getPredictorThirdPlaceTable(predictorTables) : [];
  const champion = submission.championTeamId;
  const officialChampion = submission.officialChampionTeamId;
  const finalists = isPredictor ? [submission.knockoutPicks["predict-sf-1"], submission.knockoutPicks["predict-sf-2"]] : [submission.knockoutPicks["sf-1"], submission.knockoutPicks["sf-2"]];
  const officialFinalists = [submission.officialKnockoutPicks?.["official-sf-101"], submission.officialKnockoutPicks?.["official-sf-102"]];
  const hasOfficialPicks = Boolean(submission.officialKnockoutSubmittedAt);
  const officialBracketReady = isOfficialBracketReady(officialTables);
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
              <span className={`rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide ${hasOfficialPicks ? "bg-emerald-300 text-emerald-950" : "bg-white/10 text-white"}`}>
                Official KO {hasOfficialPicks ? "locked" : "open"}
              </span>
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
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{hasOfficialPicks ? "Official finalists" : "Original finalists"}</p>
          <div className="mt-3 space-y-2">
            {(hasOfficialPicks ? officialFinalists : finalists).map((teamId, index) => (
              <SummaryTeam key={`${teamId}-${index}`} label={`Finalist ${index + 1}`} teamId={teamId} />
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:col-span-2">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Official knockout</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">
            {hasOfficialPicks
              ? `Official picks locked${submission.officialKnockoutSubmittedAt ? ` ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(submission.officialKnockoutSubmittedAt)}` : ""}.`
              : officialBracketReady
                ? "Use this existing submission link to make the corrected official knockout picks from this player's group predictions."
                : "This original submission is missing enough group-table data to build the corrected path."}
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href={`/submission/${submission.id}/official-knockout`} className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800">
              {hasOfficialPicks ? "View Official Picks" : "Make Official Picks"}
            </Link>
            <ShareSubmissionControls playerName={submission.playerName} championName={getTeamName(officialChampion ?? champion)} />
          </div>
        </div>
      </section>

      <ScoreBreakdown submission={submission} isPredictor={isPredictor} />

      {hasOfficialPicks ? (
        <section className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Corrected path</p>
            <h2 className="mt-1 text-3xl font-black text-zinc-950">Official knockout bracket</h2>
          </div>
          <SubmissionViewSwitcher
            groupsView={
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-black text-zinc-950">Original group-stage receipt stays below.</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">These official knockout picks are the corrected bracket path for scoring.</p>
              </div>
            }
            thirdPlaceView={<RoundListView rounds={officialRounds} submission={{ ...submission, knockoutPicks: submission.officialKnockoutPicks }} />}
            listView={<RoundListView rounds={officialRounds} submission={{ ...submission, knockoutPicks: submission.officialKnockoutPicks }} />}
            bracketView={<BracketRoadView rounds={officialRounds} submission={{ ...submission, knockoutPicks: submission.officialKnockoutPicks }} />}
          />
        </section>
      ) : null}

      {isPredictor ? (
        <SubmissionViewSwitcher
          groupsView={<GroupTableView tables={predictorTables} />}
          thirdPlaceView={<ThirdPlaceRaceView entries={predictorThirdPlaceTable} />}
          listView={<RoundListView rounds={rounds} submission={submission} />}
          bracketView={<BracketRoadView rounds={rounds} submission={submission} />}
        />
      ) : (
        <SubmissionViewSwitcher
          groupsView={
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <GroupPickCard key={group.id} group={group} pick={submission.groupPicks[group.id]} />
              ))}
            </div>
          }
          thirdPlaceView={
            <div className="grid gap-2 md:grid-cols-2">
              {submission.thirdPlaceAdvancers.map((teamId, index) => (
                <SummaryTeam key={`${teamId}-${index}`} label={`Advancer ${index + 1}`} teamId={teamId} />
              ))}
            </div>
          }
          listView={<RoundListView rounds={rounds} submission={submission} />}
          bracketView={<BracketRoadView rounds={rounds} submission={submission} />}
        />
      )}

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
