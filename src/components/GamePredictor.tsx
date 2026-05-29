"use client";

import { useMemo, useState, useTransition, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { submitPrediction } from "@/app/predict/actions";
import { groups } from "@/data/groups";
import { teamsById } from "@/data/teams";

type ResultPick = "home" | "draw" | "away";
type GameStep = "entry" | "groups" | "tables" | "knockout" | "review";
type PickFeedback = {
  direction: "left" | "right" | "down";
  text: string;
};

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
  matches: KnockoutMatch[];
};

const stepOrder: GameStep[] = ["entry", "groups", "tables", "knockout", "review"];

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

function TeamFlag({ teamId, className = "h-16 w-24" }: { teamId?: string; className?: string }) {
  const flagUrl = getTeamFlagUrl(teamId);

  if (flagUrl) {
    return (
      <span
        aria-label={`${getTeamName(teamId)} flag`}
        role="img"
        className={`${className} block rounded-xl border border-white/70 bg-cover bg-center shadow-sm`}
        style={{ backgroundImage: `url(${flagUrl})` }}
      />
    );
  }

  return <span className="text-5xl leading-none">{getTeamFlag(teamId)}</span>;
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

function calculateGroupTables(matches: GroupMatch[], picks: Record<string, GroupMatchPick>) {
  return groups.map((group) => {
    const rows = new Map(group.teamIds.map((teamId) => [teamId, emptyTableRows([teamId])[0]]));

    for (const match of matches.filter((item) => item.groupId === group.id)) {
      const pick = picks[match.id];

      if (!pick?.result || pick.homeScore === null || pick.awayScore === null) {
        continue;
      }

      const home = rows.get(match.homeTeamId);
      const away = rows.get(match.awayTeamId);

      if (!home || !away) {
        continue;
      }

      home.played += 1;
      away.played += 1;
      home.goalsFor += pick.homeScore;
      home.goalsAgainst += pick.awayScore;
      away.goalsFor += pick.awayScore;
      away.goalsAgainst += pick.homeScore;

      if (pick.homeScore > pick.awayScore) {
        home.wins += 1;
        home.points += 3;
        away.losses += 1;
      } else if (pick.awayScore > pick.homeScore) {
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

    return {
      group,
      table: Array.from(rows.values()).sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDifference - a.goalDifference ||
          b.goalsFor - a.goalsFor ||
          getTeamName(a.teamId).localeCompare(getTeamName(b.teamId)),
      ),
    };
  });
}

function getDownstreamMatches(matchId: string) {
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

  return [
    {
      title: "Round of 32",
      matches: Array.from({ length: 16 }, (_, index) => ({
        id: `predict-r32-${index + 1}`,
        label: `Match ${index + 1}`,
        homeTeamId: roundOf32Teams[index],
        awayTeamId: roundOf32Teams[31 - index],
      })),
    },
    {
      title: "Round of 16",
      matches: Array.from({ length: 8 }, (_, index) => ({
        id: `predict-r16-${index + 1}`,
        label: `Match ${index + 17}`,
        homeTeamId: picks[`predict-r32-${index * 2 + 1}`],
        awayTeamId: picks[`predict-r32-${index * 2 + 2}`],
      })),
    },
    {
      title: "Quarterfinals",
      matches: Array.from({ length: 4 }, (_, index) => ({
        id: `predict-qf-${index + 1}`,
        label: `Quarterfinal ${index + 1}`,
        homeTeamId: picks[`predict-r16-${index * 2 + 1}`],
        awayTeamId: picks[`predict-r16-${index * 2 + 2}`],
      })),
    },
    {
      title: "Semifinals",
      matches: Array.from({ length: 2 }, (_, index) => ({
        id: `predict-sf-${index + 1}`,
        label: `Semifinal ${index + 1}`,
        homeTeamId: picks[`predict-qf-${index * 2 + 1}`],
        awayTeamId: picks[`predict-qf-${index * 2 + 2}`],
      })),
    },
    {
      title: "Champion",
      matches: [{ id: "predict-champion", label: "Final winner", homeTeamId: picks["predict-sf-1"], awayTeamId: picks["predict-sf-2"] }],
    },
  ];
}

function getThirdPlaceTable(tables: Array<{ group: { id: string; name: string }; table: TableRow[] }>) {
  return tables
    .map(({ group, table }) => ({
      group,
      row: table[2],
    }))
    .filter((entry): entry is { group: { id: string; name: string }; row: TableRow } => Boolean(entry.row))
    .sort(
      (a, b) =>
        b.row.points - a.row.points ||
        b.row.goalDifference - a.row.goalDifference ||
        b.row.goalsFor - a.row.goalsFor ||
        getTeamName(a.row.teamId).localeCompare(getTeamName(b.row.teamId)),
    );
}

function defaultScore(result: ResultPick) {
  if (result === "home") {
    return { homeScore: 1, awayScore: 0 };
  }

  if (result === "away") {
    return { homeScore: 0, awayScore: 1 };
  }

  return { homeScore: 0, awayScore: 0 };
}

function TeamFace({ teamId, align = "left" }: { teamId?: string; align?: "left" | "right" }) {
  return (
    <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}>
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <TeamFlag teamId={teamId} />
      </div>
      <p className="mt-3 truncate text-2xl font-black text-zinc-950 sm:text-3xl">{getTeamName(teamId)}</p>
      <p className="mt-1 text-sm font-black text-emerald-700">{getTeamCode(teamId)}</p>
    </div>
  );
}

export function GamePredictor() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<GameStep>("entry");
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [activeKnockoutIndex, setActiveKnockoutIndex] = useState(0);
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupMatchPick>>({});
  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string>>({});
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [pickFeedback, setPickFeedback] = useState<PickFeedback | null>(null);
  const [isResolvingPick, setIsResolvingPick] = useState(false);

  const groupMatches = useMemo(() => createGroupMatches(), []);
  const groupTables = useMemo(() => calculateGroupTables(groupMatches, groupPicks), [groupMatches, groupPicks]);
  const thirdPlaceTable = useMemo(() => getThirdPlaceTable(groupTables), [groupTables]);
  const knockoutRounds = useMemo(() => buildKnockoutRounds(groupTables, knockoutPicks), [groupTables, knockoutPicks]);
  const activeMatch = groupMatches[matchIndex];
  const activeRound = knockoutRounds[activeRoundIndex];
  const activeKnockoutMatch = activeRound?.matches[activeKnockoutIndex];
  const champion = knockoutPicks["predict-champion"];
  const hasValidEmail = !playerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim());
  const canStart = playerName.trim().length > 0 && hasValidEmail;
  const groupProgress = Object.keys(groupPicks).length;
  function chooseGroupResult(result: ResultPick) {
    if (!activeMatch || isResolvingPick) {
      return;
    }

    const currentMatch = activeMatch;
    const score = defaultScore(result);
    const winnerText =
      result === "draw"
        ? `${getTeamName(currentMatch.homeTeamId)} ${score.homeScore}-${score.awayScore} ${getTeamName(currentMatch.awayTeamId)}`
        : result === "home"
          ? `${getTeamName(currentMatch.homeTeamId)} wins`
          : `${getTeamName(currentMatch.awayTeamId)} wins`;
    const direction = result === "draw" ? "down" : result === "home" ? "right" : "left";

    setIsResolvingPick(true);
    setPickFeedback({ direction, text: winnerText });

    window.setTimeout(() => {
      setGroupPicks((current) => ({
        ...current,
        [currentMatch.id]: {
          result,
          ...score,
        },
      }));

      if (matchIndex < groupMatches.length - 1) {
        setMatchIndex((current) => current + 1);
      } else {
        setStep("tables");
      }

      setPickFeedback(null);
      setIsResolvingPick(false);
    }, 360);
  }

  function chooseKnockoutWinner(teamId: string | undefined) {
    if (!teamId || !activeKnockoutMatch || isResolvingPick) {
      return;
    }

    const currentMatch = activeKnockoutMatch;
    const currentRound = activeRound;
    const direction = teamId === currentMatch.homeTeamId ? "right" : "left";

    setIsResolvingPick(true);
    setPickFeedback({ direction, text: `${getTeamName(teamId)} advances` });

    window.setTimeout(() => {
      setKnockoutPicks((current) => {
        const next = { ...current };

        for (const matchId of getDownstreamMatches(currentMatch.id)) {
          delete next[matchId];
        }

        next[currentMatch.id] = teamId;
        return next;
      });

      if (activeKnockoutIndex < currentRound.matches.length - 1) {
        setActiveKnockoutIndex((current) => current + 1);
      } else if (activeRoundIndex < knockoutRounds.length - 1) {
        setActiveRoundIndex((current) => current + 1);
        setActiveKnockoutIndex(0);
      } else {
        setStep("review");
      }

      setPickFeedback(null);
      setIsResolvingPick(false);
    }, 360);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>, mode: "group" | "knockout") {
    if (!dragStart) {
      return;
    }

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    setDragStart(null);

    if (mode === "group") {
      if (dy > 70 && Math.abs(dy) > Math.abs(dx)) {
        chooseGroupResult("draw");
      } else if (dx > 70) {
        chooseGroupResult("home");
      } else if (dx < -70) {
        chooseGroupResult("away");
      }
    } else if (dx > 70) {
      chooseKnockoutWinner(activeKnockoutMatch?.homeTeamId);
    } else if (dx < -70) {
      chooseKnockoutWinner(activeKnockoutMatch?.awayTeamId);
    }
  }

  function goBackOneGroupMatch() {
    setMatchIndex((current) => Math.max(current - 1, 0));
    const previousMatch = groupMatches[Math.max(matchIndex - 1, 0)];

    if (previousMatch) {
      setGroupPicks((current) => {
        const next = { ...current };
        delete next[previousMatch.id];
        return next;
      });
    }
  }

  function submitGamePrediction() {
    startTransition(async () => {
      const result = await submitPrediction({
        playerName: playerName.trim(),
        playerEmail: playerEmail.trim().toLowerCase(),
        groupMatchPicks: groupPicks,
        knockoutPicks,
        calculatedTables: groupTables,
      });

      setStatusMessage(result.message);

      if (result.ok && result.bracketId) {
        router.push(`/submission/${result.bracketId}`);
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 sm:grid-cols-5">
          {stepOrder.map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(item)}
              disabled={index > stepOrder.indexOf(step)}
              className={`rounded-xl px-3 py-3 text-xs font-black uppercase tracking-wide transition ${
                item === step ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-500 disabled:opacity-40"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {statusMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">{statusMessage}</div> : null}

      {step === "entry" ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Game mode</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Swipe through the tournament</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-black text-zinc-700">
              Name
              <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>
            <label className="text-sm font-black text-zinc-700">
              Email <span className="text-zinc-500">(optional)</span>
              <input value={playerEmail} onChange={(event) => setPlayerEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
            </label>
          </div>
          <button type="button" disabled={!canStart} onClick={() => setStep("groups")} className="mt-5 min-h-12 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-zinc-300">
            Start Swiping
          </button>
        </section>
      ) : null}

      {step === "groups" && activeMatch ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{activeMatch.groupName}</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">Pick the result</h2>
            </div>
            <p className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white">
              {groupProgress}/{groupMatches.length}
            </p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(groupProgress / groupMatches.length) * 100}%` }} />
          </div>
          <div
            className={`game-pick-card relative mt-5 touch-none overflow-hidden rounded-3xl border border-zinc-200 bg-[#fbfaf3] p-5 shadow-sm ring-4 ring-transparent transition active:ring-emerald-100 ${pickFeedback ? `is-picking-${pickFeedback.direction}` : ""}`}
            onPointerDown={(event) => setDragStart({ x: event.clientX, y: event.clientY })}
            onPointerUp={(event) => handlePointerUp(event, "group")}
          >
            {pickFeedback ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-emerald-700/90 px-6 text-center text-3xl font-black text-white">
                {pickFeedback.text}
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black uppercase tracking-wide">
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Left wins</span>
              <span className="rounded-full bg-zinc-950 px-2 py-1 text-white">Draw</span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Right wins</span>
            </div>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamFace teamId={activeMatch.homeTeamId} />
              <span className="grid size-14 place-items-center rounded-full bg-zinc-950 text-lg font-black text-white">VS</span>
              <TeamFace teamId={activeMatch.awayTeamId} align="right" />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button type="button" disabled={isResolvingPick} onClick={() => chooseGroupResult("home")} className="min-h-12 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:bg-zinc-300">Home wins</button>
            <button type="button" disabled={isResolvingPick} onClick={() => chooseGroupResult("draw")} className="min-h-12 rounded-lg bg-zinc-950 px-4 py-3 text-sm font-black text-white disabled:bg-zinc-300">Draw</button>
            <button type="button" disabled={isResolvingPick} onClick={() => chooseGroupResult("away")} className="min-h-12 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:bg-zinc-300">Away wins</button>
          </div>
          <button type="button" onClick={goBackOneGroupMatch} disabled={matchIndex === 0} className="mt-3 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm font-black text-zinc-800 disabled:opacity-40">
            Back one match
          </button>
        </section>
      ) : null}

      {step === "tables" ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Generated tables</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Your knockout field is set</h2>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-amber-700">Third-place race</p>
                <h3 className="mt-1 text-xl font-black text-zinc-950">Top 8 of 12 advance</h3>
              </div>
              <p className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white">Round of 32 cutoff</p>
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {thirdPlaceTable.map(({ group, row }, index) => (
                <div
                  key={group.id}
                  className={`grid grid-cols-[32px_40px_minmax(0,1fr)_54px] items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    index < 8 ? "border border-emerald-200 bg-white text-zinc-950" : "border border-zinc-200 bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <span className={`grid size-7 place-items-center rounded text-xs font-black ${index < 8 ? "bg-emerald-700 text-white" : "bg-zinc-300 text-zinc-700"}`}>
                    {index + 1}
                  </span>
                  <TeamFlag teamId={row.teamId} className="h-6 w-9" />
                  <span className="min-w-0 truncate font-black">
                    {getTeamName(row.teamId)} <span className="font-bold text-zinc-500">({group.name})</span>
                  </span>
                  <span className="text-right font-black">{row.points} pts</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {groupTables.map(({ group, table }) => (
              <article key={group.id} className="rounded-xl border border-zinc-200 bg-[#fbfaf3] p-3">
                <p className="text-sm font-black text-zinc-950">{group.name}</p>
                <div className="mt-3 space-y-2">
                  {table.map((row, index) => (
                    <div key={row.teamId} className="grid grid-cols-[24px_1fr_36px] items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm">
                      <span className="font-black text-zinc-400">{index + 1}</span>
                      <span className="flex min-w-0 items-center gap-2 font-bold text-zinc-800">
                        <TeamFlag teamId={row.teamId} className="h-5 w-8 shrink-0" />
                        <span className="min-w-0 truncate">{getTeamName(row.teamId)}</span>
                      </span>
                      <span className="text-right font-black text-emerald-700">{row.points}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <button type="button" onClick={() => setStep("knockout")} className="mt-5 min-h-12 w-full rounded-lg bg-zinc-950 px-5 py-3 text-sm font-black text-white">
            Start Knockouts
          </button>
        </section>
      ) : null}

      {step === "knockout" && activeKnockoutMatch ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{activeRound.title}</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">{activeKnockoutMatch.label}</h2>
            </div>
            <p className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white">
              {activeKnockoutIndex + 1}/{activeRound.matches.length}
            </p>
          </div>
          <div
            className={`game-pick-card relative mt-5 touch-none overflow-hidden rounded-3xl border border-zinc-200 bg-[#fbfaf3] p-5 shadow-sm ${pickFeedback ? `is-picking-${pickFeedback.direction}` : ""}`}
            onPointerDown={(event) => setDragStart({ x: event.clientX, y: event.clientY })}
            onPointerUp={(event) => handlePointerUp(event, "knockout")}
          >
            {pickFeedback ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-emerald-700/90 px-6 text-center text-3xl font-black text-white">
                {pickFeedback.text}
              </div>
            ) : null}
            <p className="text-center text-xs font-black uppercase tracking-wide text-zinc-500">Swipe toward the winner</p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <TeamFace teamId={activeKnockoutMatch.homeTeamId} />
              <span className="grid size-14 place-items-center rounded-full bg-zinc-950 text-lg font-black text-white">VS</span>
              <TeamFace teamId={activeKnockoutMatch.awayTeamId} align="right" />
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={isResolvingPick} onClick={() => chooseKnockoutWinner(activeKnockoutMatch.homeTeamId)} className="min-h-12 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:bg-zinc-300">{getTeamName(activeKnockoutMatch.homeTeamId)}</button>
            <button type="button" disabled={isResolvingPick} onClick={() => chooseKnockoutWinner(activeKnockoutMatch.awayTeamId)} className="min-h-12 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-black text-white disabled:bg-zinc-300">{getTeamName(activeKnockoutMatch.awayTeamId)}</button>
          </div>
        </section>
      ) : null}

      {step === "review" ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Review</p>
          <h2 className="mt-2 text-3xl font-black text-zinc-950">Champion: {getTeamName(champion)}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
            Your picks will lock and open as a shareable bracket view.
          </p>
          <button type="button" disabled={!champion || isPending} onClick={submitGamePrediction} className="mt-5 min-h-12 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-zinc-300">
            {isPending ? "Submitting..." : "Submit Locked Prediction"}
          </button>
        </section>
      ) : null}
    </div>
  );
}
