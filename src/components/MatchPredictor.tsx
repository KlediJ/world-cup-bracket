"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitPrediction } from "@/app/predict/actions";
import { groups } from "@/data/groups";
import { homeAssets } from "@/data/homeAssets";
import { teamsById } from "@/data/teams";

type ResultPick = "home" | "draw" | "away";
type PredictorStep = "entry" | "groups" | "tables" | "knockout" | "review";

type GroupMatch = {
  id: string;
  groupId: string;
  groupName: string;
  homeTeamId: string;
  awayTeamId: string;
};

type GroupMatchPick = {
  result?: ResultPick;
  homeScore: number | null;
  awayScore: number | null;
};

type TableRow = {
  teamId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

type KnockoutMatch = {
  id: string;
  label: string;
  homeTeamId?: string;
  awayTeamId?: string;
};

type KnockoutRound = {
  title: string;
  shortTitle: string;
  matches: KnockoutMatch[];
};

const stepOrder: PredictorStep[] = ["entry", "groups", "tables", "knockout", "review"];

const roundTargets = {
  "Round of 32": 16,
  "Round of 16": 8,
  Quarterfinals: 4,
  Semifinals: 2,
  Champion: 1,
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

function FlagIcon({ teamId, className = "size-8" }: { teamId: string | undefined; className?: string }) {
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

  return <span className="text-2xl">{getTeamFlag(teamId)}</span>;
}

function getPredictDownstreamMatches(matchId: string) {
  if (matchId.startsWith("predict-r32-")) {
    return [
      ...Array.from({ length: 8 }, (_, index) => `predict-r16-${index + 1}`),
      ...Array.from({ length: 4 }, (_, index) => `predict-qf-${index + 1}`),
      "predict-sf-1",
      "predict-sf-2",
      "predict-champion",
    ];
  }

  if (matchId.startsWith("predict-r16-")) {
    return [...Array.from({ length: 4 }, (_, index) => `predict-qf-${index + 1}`), "predict-sf-1", "predict-sf-2", "predict-champion"];
  }

  if (matchId.startsWith("predict-qf-")) {
    return ["predict-sf-1", "predict-sf-2", "predict-champion"];
  }

  if (matchId.startsWith("predict-sf-")) {
    return ["predict-champion"];
  }

  return [];
}

function createGroupMatches(): GroupMatch[] {
  return groups.flatMap((group) => {
    const [a, b, c, d] = group.teamIds;
    const pairings = [
      [a, b],
      [c, d],
      [a, c],
      [d, b],
      [d, a],
      [b, c],
    ];

    return pairings.map(([homeTeamId, awayTeamId], index) => ({
      id: `${group.id}-${index + 1}`,
      groupId: group.id,
      groupName: group.name,
      homeTeamId,
      awayTeamId,
    }));
  });
}

function emptyTableRows(teamIds: string[]) {
  return teamIds.map((teamId) => ({
    teamId,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));
}

function scoreFromPick(pick?: GroupMatchPick) {
  if (!pick?.result) {
    return null;
  }

  if (pick.homeScore !== null && pick.awayScore !== null) {
    return [pick.homeScore, pick.awayScore] as const;
  }

  if (pick.result === "home") {
    return [1, 0] as const;
  }

  if (pick.result === "away") {
    return [0, 1] as const;
  }

  return [0, 0] as const;
}

function calculateGroupTables(matches: GroupMatch[], picks: Record<string, GroupMatchPick>) {
  return groups.map((group) => {
    const rows = new Map(group.teamIds.map((teamId) => [teamId, emptyTableRows([teamId])[0]]));
    const groupMatches = matches.filter((match) => match.groupId === group.id);

    for (const match of groupMatches) {
      const score = scoreFromPick(picks[match.id]);

      if (!score) {
        continue;
      }

      const [homeScore, awayScore] = score;
      const home = rows.get(match.homeTeamId);
      const away = rows.get(match.awayTeamId);

      if (!home || !away) {
        continue;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += homeScore;
      home.goalsAgainst += awayScore;
      away.goalsFor += awayScore;
      away.goalsAgainst += homeScore;

      if (homeScore > awayScore) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (awayScore > homeScore) {
        away.wins += 1;
        away.points += 3;
        home.losses += 1;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
    }

    const table = Array.from(rows.values()).sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        getTeamName(a.teamId).localeCompare(getTeamName(b.teamId)),
    );

    return {
      group,
      table,
    };
  });
}

function buildKnockoutRounds(tables: Array<{ table: TableRow[] }>, picks: Record<string, string>): KnockoutRound[] {
  const winners = tables.map(({ table }) => table[0]?.teamId ?? "");
  const runnersUp = tables.map(({ table }) => table[1]?.teamId ?? "");
  const thirdPlace = tables
    .map(({ table }) => table[2])
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        getTeamName(a.teamId).localeCompare(getTeamName(b.teamId)),
    )
    .slice(0, 8)
    .map((row) => row.teamId);

  const roundOf32Teams = [...winners, ...runnersUp, ...thirdPlace];
  const roundOf32 = Array.from({ length: 16 }, (_, index) => ({
    id: `predict-r32-${index + 1}`,
    label: `Match ${index + 1}`,
    homeTeamId: roundOf32Teams[index],
    awayTeamId: roundOf32Teams[31 - index],
  }));

  const roundOf16 = Array.from({ length: 8 }, (_, index) => ({
    id: `predict-r16-${index + 1}`,
    label: `Match ${index + 17}`,
    homeTeamId: picks[`predict-r32-${index * 2 + 1}`],
    awayTeamId: picks[`predict-r32-${index * 2 + 2}`],
  }));

  const quarterfinals = Array.from({ length: 4 }, (_, index) => ({
    id: `predict-qf-${index + 1}`,
    label: `Quarterfinal ${index + 1}`,
    homeTeamId: picks[`predict-r16-${index * 2 + 1}`],
    awayTeamId: picks[`predict-r16-${index * 2 + 2}`],
  }));

  const semifinals = Array.from({ length: 2 }, (_, index) => ({
    id: `predict-sf-${index + 1}`,
    label: `Semifinal ${index + 1}`,
    homeTeamId: picks[`predict-qf-${index * 2 + 1}`],
    awayTeamId: picks[`predict-qf-${index * 2 + 2}`],
  }));

  return [
    { title: "Round of 32", shortTitle: "R32", matches: roundOf32 },
    { title: "Round of 16", shortTitle: "R16", matches: roundOf16 },
    { title: "Quarterfinals", shortTitle: "QF", matches: quarterfinals },
    { title: "Semifinals", shortTitle: "SF", matches: semifinals },
    {
      title: "Champion",
      shortTitle: "Final",
      matches: [{ id: "predict-champion", label: "Final winner", homeTeamId: picks["predict-sf-1"], awayTeamId: picks["predict-sf-2"] }],
    },
  ];
}

export function MatchPredictor() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<PredictorStep>("entry");
  const [activeGroupId, setActiveGroupId] = useState(groups[0].id);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupMatchPick>>({});
  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const groupMatches = useMemo(() => createGroupMatches(), []);
  const groupTables = useMemo(() => calculateGroupTables(groupMatches, groupPicks), [groupMatches, groupPicks]);
  const knockoutRounds = useMemo(() => buildKnockoutRounds(groupTables, knockoutPicks), [groupTables, knockoutPicks]);
  const activeGroupMatches = groupMatches.filter((match) => match.groupId === activeGroupId);
  const completedGroupMatches = Object.values(groupPicks).filter((pick) => pick.result).length;
  const hasValidEntry = playerName.trim().length > 0 && (!playerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim()));
  const allGroupsComplete = completedGroupMatches === groupMatches.length;
  const champion = knockoutPicks["predict-champion"];
  const activeRound = knockoutRounds[activeRoundIndex];
  const activeRoundTarget = roundTargets[activeRound.title as keyof typeof roundTargets];
  const knockoutComplete = Boolean(champion);

  function updateGroupPick(matchId: string, result: ResultPick) {
    setGroupPicks((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] ?? { homeScore: null, awayScore: null }),
        result,
      },
    }));
    setKnockoutPicks({});
  }

  function updateGroupScore(matchId: string, field: "homeScore" | "awayScore", value: number | null) {
    setGroupPicks((current) => {
      const next = {
        ...(current[matchId] ?? { homeScore: null, awayScore: null }),
        [field]: value,
      };

      if (next.homeScore !== null && next.awayScore !== null) {
        next.result = next.homeScore > next.awayScore ? "home" : next.awayScore > next.homeScore ? "away" : "draw";
      }

      return {
        ...current,
        [matchId]: next,
      };
    });
    setKnockoutPicks({});
  }

  function pickKnockoutWinner(matchId: string, teamId: string) {
    const nextPickCount = knockoutPicks[matchId]
      ? activeRound.matches.filter((match) => knockoutPicks[match.id]).length
      : activeRound.matches.filter((match) => knockoutPicks[match.id]).length + 1;

    setKnockoutPicks((current) => {
      const next = { ...current };

      for (const downstreamMatchId of getPredictDownstreamMatches(matchId)) {
        delete next[downstreamMatchId];
      }

      next[matchId] = teamId;
      return next;
    });

    if (nextPickCount === activeRoundTarget && activeRoundIndex < knockoutRounds.length - 1) {
      setActiveRoundIndex((current) => current + 1);
    }
  }

  function nextStep() {
    const index = stepOrder.indexOf(step);
    setStep(stepOrder[Math.min(index + 1, stepOrder.length - 1)]);
  }

  function previousStep() {
    const index = stepOrder.indexOf(step);
    setStep(stepOrder[Math.max(index - 1, 0)]);
  }

  function handleSubmitPrediction() {
    startTransition(async () => {
      const result = await submitPrediction({
        playerName: playerName.trim(),
        playerEmail: playerEmail.trim().toLowerCase(),
        groupMatchPicks: groupPicks,
        knockoutPicks,
        calculatedTables: groupTables,
      });

      setStatusMessage(result.message);
      setIsSubmitted(result.ok);

      if (result.ok && result.bracketId) {
        router.push(`/submission/${result.bracketId}`);
      }
    });
  }

  return (
    <div className="space-y-5">
      <PredictorProgress step={step} hasValidEntry={hasValidEntry} groupsComplete={allGroupsComplete} champion={champion} onSelect={setStep} />

      {statusMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">
          {statusMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-emerald-900/20 bg-white shadow-sm">
        <div className="relative overflow-hidden border-b border-emerald-900/20 bg-emerald-800 p-5 text-white">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,.55)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:96px_96px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-amber-200">Match Predictor</p>
              <h2 className="mt-2 text-3xl font-black">{getStepTitle(step)}</h2>
            </div>
            <div
              className="size-16 rounded-xl border border-amber-200/70 bg-amber-300 bg-contain bg-center bg-no-repeat shadow-sm"
              style={{ backgroundImage: `url(${homeAssets.trophyGraphic})` }}
              aria-label="Generic trophy graphic"
              role="img"
            >
              <span className="sr-only">Trophy</span>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {step === "entry" ? (
            <PredictorEntry name={playerName} email={playerEmail} onNameChange={setPlayerName} onEmailChange={setPlayerEmail} />
          ) : null}

          {step === "groups" ? (
            <GroupPredictionStage
              activeGroupId={activeGroupId}
              matches={activeGroupMatches}
              picks={groupPicks}
              completed={completedGroupMatches}
              total={groupMatches.length}
              onGroupChange={setActiveGroupId}
              onPick={updateGroupPick}
              onScoreChange={updateGroupScore}
            />
          ) : null}

          {step === "tables" ? <TablesStage tables={groupTables} /> : null}

          {step === "knockout" ? (
            <KnockoutPredictionStage
              rounds={knockoutRounds}
              picks={knockoutPicks}
              activeRoundIndex={activeRoundIndex}
              onRoundChange={setActiveRoundIndex}
              onNextRound={() => setActiveRoundIndex((current) => Math.min(current + 1, knockoutRounds.length - 1))}
              onPreviousRound={() => setActiveRoundIndex((current) => Math.max(current - 1, 0))}
              onPick={pickKnockoutWinner}
            />
          ) : null}

          {step === "review" ? (
            <PredictorReview
              name={playerName}
              email={playerEmail}
              completedGroupMatches={completedGroupMatches}
              champion={champion}
              isSubmitting={isPending}
              isSubmitted={isSubmitted}
              onComplete={handleSubmitPrediction}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={previousStep}
            disabled={step === "entry"}
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {step !== "review" ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={(step === "entry" && !hasValidEntry) || (step === "groups" && !allGroupsComplete) || (step === "knockout" && !knockoutComplete)}
              className="min-h-11 rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              Continue
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function getStepTitle(step: PredictorStep) {
  const titles: Record<PredictorStep, string> = {
    entry: "Start prediction",
    groups: "Predict group matches",
    tables: "Review calculated tables",
    knockout: "Predict knockout rounds",
    review: "Review prediction",
  };

  return titles[step];
}

function PredictorProgress({
  step,
  hasValidEntry,
  groupsComplete,
  champion,
  onSelect,
}: {
  step: PredictorStep;
  hasValidEntry: boolean;
  groupsComplete: boolean;
  champion?: string;
  onSelect: (step: PredictorStep) => void;
}) {
  const labels: Record<PredictorStep, string> = {
    entry: "Entry",
    groups: "Groups",
    tables: "Tables",
    knockout: "Knockout",
    review: "Review",
  };
  const complete: Record<PredictorStep, boolean> = {
    entry: hasValidEntry,
    groups: groupsComplete,
    tables: groupsComplete,
    knockout: Boolean(champion),
    review: Boolean(champion),
  };

  return (
    <div className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm md:grid-cols-5">
      {stepOrder.map((item, index) => (
        <button
          key={item}
          type="button"
          onClick={() => onSelect(item)}
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
            step === item ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          <span className={`grid size-8 place-items-center rounded-lg text-sm font-black ${step === item ? "bg-amber-300 text-zinc-950" : complete[item] ? "bg-emerald-100 text-emerald-800" : "bg-white text-zinc-500"}`}>
            {complete[item] ? "✓" : index + 1}
          </span>
          <span className="font-black">{labels[item]}</span>
        </button>
      ))}
    </div>
  );
}

function PredictorEntry({
  name,
  email,
  onNameChange,
  onEmailChange,
}: {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        <TextField id="predictName" label="Player name" value={name} placeholder="Example: Alex" onChange={onNameChange} />
        <TextField id="predictEmail" label="Email address (optional)" value={email} placeholder="alex@example.com" type="email" onChange={onEmailChange} />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">How this flow works</p>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-700">
          Pick match results first. Exact scores are optional. Tables and the Round of 32 are calculated from your predictions.
        </p>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id} className="text-sm font-black text-zinc-900">
      {label}
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function GroupPredictionStage({
  activeGroupId,
  matches,
  picks,
  completed,
  total,
  onGroupChange,
  onPick,
  onScoreChange,
}: {
  activeGroupId: string;
  matches: GroupMatch[];
  picks: Record<string, GroupMatchPick>;
  completed: number;
  total: number;
  onGroupChange: (groupId: string) => void;
  onPick: (matchId: string, result: ResultPick) => void;
  onScoreChange: (matchId: string, field: "homeScore" | "awayScore", value: number | null) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-3">
        <p className="px-2 pb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Groups</p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {groups.map((group) => {
            const completedInGroup = Object.entries(picks).filter(([matchId, pick]) => matchId.startsWith(`${group.id}-`) && pick.result).length;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onGroupChange(group.id)}
                className={`rounded-lg px-3 py-3 text-left text-sm font-black transition ${
                  activeGroupId === group.id ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{group.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${activeGroupId === group.id ? "bg-white/10 text-zinc-200" : "bg-zinc-100 text-zinc-500"}`}>
                    {completedInGroup}/6
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl bg-zinc-950 p-5 text-white sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Group stage</p>
            <h3 className="mt-1 text-3xl font-black">{groups.find((group) => group.id === activeGroupId)?.name}</h3>
          </div>
          <p className="rounded-lg bg-white/10 px-3 py-2 text-sm font-black">{completed} / {total}</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {matches.map((match) => (
            <GroupMatchCard key={match.id} match={match} pick={picks[match.id]} onPick={onPick} onScoreChange={onScoreChange} />
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupMatchCard({
  match,
  pick,
  onPick,
  onScoreChange,
}: {
  match: GroupMatch;
  pick?: GroupMatchPick;
  onPick: (matchId: string, result: ResultPick) => void;
  onScoreChange: (matchId: string, field: "homeScore" | "awayScore", value: number | null) => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock teamId={match.homeTeamId} align="left" />
        <span className="text-xs font-black text-zinc-400">VS</span>
        <TeamBlock teamId={match.awayTeamId} align="right" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <ResultButton active={pick?.result === "home"} onClick={() => onPick(match.id, "home")}>
          {getTeamCode(match.homeTeamId)}
        </ResultButton>
        <ResultButton active={pick?.result === "draw"} onClick={() => onPick(match.id, "draw")}>
          Draw
        </ResultButton>
        <ResultButton active={pick?.result === "away"} onClick={() => onPick(match.id, "away")}>
          {getTeamCode(match.awayTeamId)}
        </ResultButton>
      </div>
      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-2 rounded-xl border border-zinc-200 bg-white p-3">
        <ScoreBox label={getTeamCode(match.homeTeamId)} value={pick?.homeScore ?? null} onChange={(value) => onScoreChange(match.id, "homeScore", value)} />
        <span className="pb-2 text-sm font-black text-zinc-400">-</span>
        <ScoreBox label={getTeamCode(match.awayTeamId)} value={pick?.awayScore ?? null} onChange={(value) => onScoreChange(match.id, "awayScore", value)} />
      </div>
    </div>
  );
}

function ResultButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-lg px-3 py-2 text-sm font-black transition ${active ? "bg-emerald-600 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"}`}
    >
      {children}
    </button>
  );
}

function TeamBlock({ teamId, align }: { teamId: string; align: "left" | "right" }) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <FlagIcon teamId={teamId} className="h-8 w-11" />
      </div>
      <p className="mt-2 line-clamp-2 text-base font-black leading-5 text-zinc-950">{getTeamName(teamId)}</p>
      <p className="mt-1 text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</p>
    </div>
  );
}

function ScoreBox({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <label className="text-xs font-black text-zinc-500">
      {label}
      <input
        type="number"
        min="0"
        max="20"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        className="mt-1 h-11 w-full rounded-lg border border-zinc-300 text-center text-base font-black text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function TablesStage({ tables }: { tables: Array<{ group: (typeof groups)[number]; table: TableRow[] }> }) {
  const thirdPlace = tables
    .map(({ group, table }) => ({ groupName: group.name, ...table[2] }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {tables.map(({ group, table }) => (
          <div key={group.id} className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-4">
            <h3 className="font-black text-zinc-950">{group.name}</h3>
            <div className="mt-3 space-y-2">
              {table.map((row, index) => (
                <div key={row.teamId} className="grid grid-cols-[24px_1fr_36px_36px] items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                  <span className="font-black text-zinc-400">{index + 1}</span>
                  <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-800">
                    <FlagIcon teamId={row.teamId} className="h-4 w-6 shrink-0" />
                    <span className="truncate">{getTeamName(row.teamId)}</span>
                  </span>
                  <span className="text-right font-bold text-zinc-500">{row.goalDifference}</span>
                  <span className="text-right font-black text-zinc-950">{row.points}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Best third-place teams</p>
        <h3 className="mt-1 text-2xl font-black text-zinc-950">These 8 advance</h3>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {thirdPlace.map((row) => (
            <div key={row.teamId} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
              <p className="flex items-center gap-2 font-black text-emerald-950">
                <FlagIcon teamId={row.teamId} className="h-5 w-7 shrink-0" />
                <span className="truncate">{getTeamName(row.teamId)}</span>
              </p>
              <p className="mt-1 text-xs font-bold text-emerald-700">{row.groupName} · {row.points} pts · GD {row.goalDifference}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnockoutPredictionStage({
  rounds,
  picks,
  activeRoundIndex,
  onRoundChange,
  onNextRound,
  onPreviousRound,
  onPick,
}: {
  rounds: KnockoutRound[];
  picks: Record<string, string>;
  activeRoundIndex: number;
  onRoundChange: (index: number) => void;
  onNextRound: () => void;
  onPreviousRound: () => void;
  onPick: (matchId: string, teamId: string) => void;
}) {
  const activeRound = rounds[activeRoundIndex];
  const activeRoundTarget = roundTargets[activeRound.title as keyof typeof roundTargets];
  const activeRoundPicks = activeRound.matches.filter((match) => picks[match.id]).length;
  const canAdvanceRound = activeRoundPicks === activeRoundTarget;

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-3">
        <div className="space-y-2">
          {rounds.map((round, index) => (
            <button
              key={round.title}
              type="button"
              onClick={() => onRoundChange(index)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left font-black ${index === activeRoundIndex ? "bg-zinc-950 text-white" : "bg-white text-zinc-700"}`}
            >
              {round.shortTitle}
              <span>{round.matches.filter((match) => picks[match.id]).length}/{roundTargets[round.title as keyof typeof roundTargets]}</span>
            </button>
          ))}
        </div>
      </aside>
      <div className="space-y-4">
        <div className="rounded-2xl bg-zinc-950 p-5 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-amber-200">Now Picking</p>
          <h3 className="mt-1 text-3xl font-black">{activeRound.title}</h3>
          <p className="mt-2 text-sm font-black text-emerald-100">{activeRoundPicks} of {activeRoundTarget} picked</p>
        </div>
        <div className={`grid gap-3 ${activeRound.matches.length > 8 ? "xl:grid-cols-2" : "md:grid-cols-2"}`}>
          {activeRound.matches.map((match) => (
            <KnockoutPickCard key={match.id} match={match} selectedTeamId={picks[match.id]} onPick={onPick} />
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={onPreviousRound}
            disabled={activeRoundIndex === 0}
            className="min-h-11 rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous Round
          </button>
          <button
            type="button"
            onClick={onNextRound}
            disabled={!canAdvanceRound || activeRoundIndex === rounds.length - 1}
            className="min-h-11 rounded-md bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Next Round
          </button>
        </div>
      </div>
    </div>
  );
}

function KnockoutPickCard({ match, selectedTeamId, onPick }: { match: KnockoutMatch; selectedTeamId?: string; onPick: (matchId: string, teamId: string) => void }) {
  const teams = [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[];
  return (
    <div className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-4">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{match.label}</p>
      <div className="mt-3 space-y-2">
        {teams.length ? (
          teams.map((teamId) => (
            <button
              key={teamId}
              type="button"
              onClick={() => onPick(match.id, teamId)}
              className={`grid min-h-16 w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-xl border px-3 py-2 text-left ${selectedTeamId === teamId ? "border-emerald-600 bg-emerald-50" : "border-zinc-200 bg-white"}`}
            >
              <FlagIcon teamId={teamId} className="h-7 w-10" />
              <span className="min-w-0">
                <span className="block line-clamp-2 font-black text-zinc-950">{getTeamName(teamId)}</span>
                <span className="text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</span>
              </span>
              {selectedTeamId === teamId ? <span className="rounded bg-emerald-600 px-2 py-1 text-xs font-black text-white">Pick</span> : null}
            </button>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-3 py-3 text-sm font-bold text-zinc-500">Waiting on earlier picks</p>
        )}
      </div>
    </div>
  );
}

function PredictorReview({
  name,
  email,
  completedGroupMatches,
  champion,
  isSubmitting,
  isSubmitted,
  onComplete,
}: {
  name: string;
  email: string;
  completedGroupMatches: number;
  champion?: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-5">
        <h3 className="text-2xl font-black text-zinc-950">Prediction summary</h3>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">Review the champion and submit when your path is ready.</p>
      </div>
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <SummaryLine label="Player" value={name || "Name needed"} />
        <SummaryLine label="Email" value={email || "Optional"} />
        <SummaryLine label="Group matches" value={`${completedGroupMatches} of 72`} />
        <SummaryLine label="Champion" value={getTeamName(champion, "No champion picked")} />
        <button
          type="button"
          onClick={onComplete}
          disabled={isSubmitting || isSubmitted || !champion}
          className="mt-5 min-h-11 w-full rounded-md bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Prediction"}
        </button>
      </aside>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 py-3 text-sm">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="text-right font-black text-zinc-950">{value}</span>
    </div>
  );
}
