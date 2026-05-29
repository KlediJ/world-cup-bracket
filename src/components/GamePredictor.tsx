"use client";

import { useMemo, useState, useTransition, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { submitPrediction } from "@/app/predict/actions";
import { groups } from "@/data/groups";
import { teamsById } from "@/data/teams";
import type { ChampionPickCount } from "@/db/queries";

type ResultPick = "home" | "draw" | "away";
type GameStep = "groups" | "tables" | "knockout" | "review";
type PickFeedback = {
  direction: "left" | "right" | "down";
  text: string;
  consequence?: string;
};
type PickHistoryItem =
  | {
      phase: "group";
      matchId: string;
      matchIndex: number;
    }
  | {
      phase: "knockout";
      matchId: string;
      roundIndex: number;
      knockoutIndex: number;
    };

type GroupMatch = {
  id: string;
  groupId: string;
  groupName: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  time: string;
  venue: string;
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
type GroupTables = ReturnType<typeof calculateGroupTables>;

const groupAccentColors = ["#0f766e", "#1d4ed8", "#b45309", "#7c3aed", "#0e7490", "#be123c"];
const PICK_ANIMATION_MS = 320;
const SWIPE_THRESHOLD = 42;
const groupStageVenues = [
  "Estadio Azteca, Mexico City",
  "BMO Field, Toronto",
  "SoFi Stadium, Los Angeles",
  "AT&T Stadium, Dallas",
  "Hard Rock Stadium, Miami",
  "Levi's Stadium, San Francisco",
  "MetLife Stadium, New York New Jersey",
  "Mercedes-Benz Stadium, Atlanta",
  "NRG Stadium, Houston",
  "Lumen Field, Seattle",
  "Lincoln Financial Field, Philadelphia",
  "BC Place, Vancouver",
];
const groupStageDates = [
  "Jun 11, 2026",
  "Jun 12, 2026",
  "Jun 13, 2026",
  "Jun 14, 2026",
  "Jun 15, 2026",
  "Jun 16, 2026",
  "Jun 17, 2026",
  "Jun 18, 2026",
  "Jun 19, 2026",
  "Jun 20, 2026",
  "Jun 21, 2026",
  "Jun 22, 2026",
  "Jun 23, 2026",
  "Jun 24, 2026",
  "Jun 25, 2026",
  "Jun 26, 2026",
];
const kickoffTimes = ["12:00 PM ET", "3:00 PM ET", "6:00 PM ET", "9:00 PM ET"];

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
  return groups.flatMap((group, groupIndex) => {
    const [a, b, c, d] = group.teamIds;
    const pairings = [
      [a, b],
      [c, d],
      [a, c],
      [d, b],
      [d, a],
      [b, c],
    ];

    return pairings.map(([homeTeamId, awayTeamId], index) => {
      const matchNumber = groupIndex * pairings.length + index;

      return {
        id: `${group.id}-${index + 1}`,
        groupId: group.id,
        groupName: group.name,
        homeTeamId,
        awayTeamId,
        date: groupStageDates[matchNumber % groupStageDates.length],
        time: kickoffTimes[matchNumber % kickoffTimes.length],
        venue: groupStageVenues[matchNumber % groupStageVenues.length],
      };
    });
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

function getThirdPlaceThreat(teamId: string | undefined, tables: GroupTables) {
  if (!teamId) {
    return "Bubble";
  }

  const thirdPlaceTable = getThirdPlaceTable(tables);
  const rank = thirdPlaceTable.findIndex(({ row }) => row.teamId === teamId);

  if (rank === -1) {
    return "Chasing";
  }

  if (rank < 5) {
    return "Safe";
  }

  if (rank < 8) {
    return "Bubble";
  }

  return "Danger";
}

function getMatchRisk(match: GroupMatch, tables: GroupTables) {
  const groupTable = tables.find(({ group }) => group.id === match.groupId)?.table ?? [];
  const homeRank = groupTable.findIndex((row) => row.teamId === match.homeTeamId);
  const awayRank = groupTable.findIndex((row) => row.teamId === match.awayTeamId);

  if (homeRank >= 0 && awayRank >= 0 && Math.abs(homeRank - awayRank) >= 2) {
    return "Upset swing";
  }

  if (homeRank >= 2 || awayRank >= 2) {
    return "Third-place pressure";
  }

  return "Group control";
}

function getPickConsequence(match: GroupMatch, result: ResultPick, matches: GroupMatch[], picks: Record<string, GroupMatchPick>) {
  const score = defaultScore(result);
  const simulatedTables = calculateGroupTables(matches, {
    ...picks,
    [match.id]: {
      result,
      ...score,
    },
  });
  const groupTable = simulatedTables.find(({ group }) => group.id === match.groupId)?.table ?? [];
  const winnerId = result === "draw" ? undefined : result === "home" ? match.homeTeamId : match.awayTeamId;
  const winnerRank = winnerId ? groupTable.findIndex((row) => row.teamId === winnerId) + 1 : 0;
  const homeThreat = getThirdPlaceThreat(match.homeTeamId, simulatedTables);
  const awayThreat = getThirdPlaceThreat(match.awayTeamId, simulatedTables);

  if (result === "draw") {
    return `Draw keeps it tight · ${getTeamCode(match.homeTeamId)} ${homeThreat} · ${getTeamCode(match.awayTeamId)} ${awayThreat}`;
  }

  return `${getTeamName(winnerId)} jumps to #${winnerRank || "?"} · ${getTeamCode(result === "home" ? match.awayTeamId : match.homeTeamId)} ${result === "home" ? awayThreat : homeThreat}`;
}

function getBracketPersonality(knockoutPicks: Record<string, string>, tables: GroupTables) {
  const thirdPlaceTeams = new Set(getThirdPlaceTable(tables).slice(0, 8).map(({ row }) => row.teamId));
  const knockoutWinners = Object.values(knockoutPicks).filter(Boolean);
  const thirdPlaceWinners = knockoutWinners.filter((teamId) => thirdPlaceTeams.has(teamId)).length;
  const champion = knockoutPicks["predict-champion"];
  const groupWinners = new Set(tables.map(({ table }) => table[0]?.teamId).filter(Boolean));

  if (champion && thirdPlaceTeams.has(champion)) {
    return "Chaos bracket";
  }

  if (thirdPlaceWinners >= 5) {
    return "Upset merchant";
  }

  if (champion && groupWinners.has(champion)) {
    return "Favorite-heavy";
  }

  return "Pressure cooker";
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

function playPickSound(enabled: boolean, direction: PickFeedback["direction"]) {
  if (!enabled || typeof window === "undefined") {
    return;
  }

  const AudioContextClass = window.AudioContext;

  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const frequency = direction === "down" ? 260 : direction === "right" ? 430 : 360;

  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  oscillator.type = "triangle";
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.18);
}

function vibratePick() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(18);
  }
}

export function GamePredictor({ championPickCounts }: { championPickCounts: ChampionPickCount[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<GameStep>("groups");
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [activeKnockoutIndex, setActiveKnockoutIndex] = useState(0);
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupMatchPick>>({});
  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string>>({});
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [statusMessage, setStatusMessage] = useState("");
  const [pickFeedback, setPickFeedback] = useState<PickFeedback | null>(null);
  const [isResolvingPick, setIsResolvingPick] = useState(false);
  const [checkpointGroupIndex, setCheckpointGroupIndex] = useState<number | null>(null);
  const [pickHistory, setPickHistory] = useState<PickHistoryItem[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const groupMatches = useMemo(() => createGroupMatches(), []);
  const groupTables = useMemo(() => calculateGroupTables(groupMatches, groupPicks), [groupMatches, groupPicks]);
  const thirdPlaceTable = useMemo(() => getThirdPlaceTable(groupTables), [groupTables]);
  const knockoutRounds = useMemo(() => buildKnockoutRounds(groupTables, knockoutPicks), [groupTables, knockoutPicks]);
  const activeMatch = groupMatches[matchIndex];
  const activeRound = knockoutRounds[activeRoundIndex];
  const activeKnockoutMatch = activeRound?.matches[activeKnockoutIndex];
  const champion = knockoutPicks["predict-champion"];
  const hasValidEmail = !playerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim());
  const canSubmit = playerName.trim().length > 0 && hasValidEmail && Boolean(champion);
  const groupProgress = Object.keys(groupPicks).length;
  const currentGroupIndex = activeMatch ? groups.findIndex((group) => group.id === activeMatch.groupId) : 0;
  const groupAccent = groupAccentColors[Math.max(currentGroupIndex, 0) % groupAccentColors.length];
  const visualGroupProgress = Math.max(12, (groupProgress / groupMatches.length) * 100);
  const matchRisk = activeMatch ? getMatchRisk(activeMatch, groupTables) : "";
  const activeHomeThreat = activeMatch ? getThirdPlaceThreat(activeMatch.homeTeamId, groupTables) : "";
  const activeAwayThreat = activeMatch ? getThirdPlaceThreat(activeMatch.awayTeamId, groupTables) : "";
  const personality = getBracketPersonality(knockoutPicks, groupTables);
  const championPickCount = championPickCounts.find((item) => item.teamId === champion)?.count ?? 0;
  const topChampionPick = championPickCounts[0];
  const lockInMessage =
    step === "groups" && groupMatches.length - groupProgress <= 5
      ? `${groupMatches.length - groupProgress} group picks from knockouts`
      : step === "knockout" && !champion
        ? "Final path almost built"
        : "Fast path";
  const dragIntent =
    dragOffset.y > SWIPE_THRESHOLD && Math.abs(dragOffset.y) > Math.abs(dragOffset.x)
      ? "down"
      : dragOffset.x > SWIPE_THRESHOLD
        ? "right"
        : dragOffset.x < -SWIPE_THRESHOLD
          ? "left"
          : null;
  const dragStyle =
    dragStart && !pickFeedback
      ? {
          transform: `translate(${Math.max(Math.min(dragOffset.x, 120), -120)}px, ${Math.max(Math.min(dragOffset.y, 110), -28)}px) rotate(${Math.max(Math.min(dragOffset.x / 18, 7), -7)}deg)`,
        }
      : undefined;
  const streakLabel = streak >= 20 ? "on fire" : streak >= 10 ? "hot streak" : streak >= 5 ? "streak" : "momentum";

  function triggerFeedback(feedback: PickFeedback) {
    setIsResolvingPick(true);
    setPickFeedback(feedback);
    setDragOffset({ x: 0, y: 0 });
    playPickSound(true, feedback.direction);
    vibratePick();
  }

  function bumpStreak() {
    setStreak((current) => {
      const next = current + 1;
      setMaxStreak((best) => Math.max(best, next));
      return next;
    });
  }
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

    triggerFeedback({ direction, text: winnerText, consequence: getPickConsequence(currentMatch, result, groupMatches, groupPicks) });

    window.setTimeout(() => {
      setGroupPicks((current) => ({
        ...current,
        [currentMatch.id]: {
          result,
          ...score,
        },
      }));
      setPickHistory((current) => [...current, { phase: "group", matchId: currentMatch.id, matchIndex }]);
      bumpStreak();

      if (matchIndex < groupMatches.length - 1) {
        const nextIndex = matchIndex + 1;
        setMatchIndex(nextIndex);

        if (nextIndex % 6 === 0) {
          setCheckpointGroupIndex(Math.floor((nextIndex - 1) / 6));
        }
      } else {
        setStep("tables");
      }

      setPickFeedback(null);
      setIsResolvingPick(false);
    }, PICK_ANIMATION_MS);
  }

  function chooseKnockoutWinner(teamId: string | undefined) {
    if (!teamId || !activeKnockoutMatch || isResolvingPick) {
      return;
    }

    const currentMatch = activeKnockoutMatch;
    const currentRound = activeRound;
    const direction = teamId === currentMatch.homeTeamId ? "right" : "left";

    triggerFeedback({ direction, text: `${getTeamName(teamId)} advances` });

    window.setTimeout(() => {
      setKnockoutPicks((current) => {
        const next = { ...current };

        for (const matchId of getDownstreamMatches(currentMatch.id)) {
          delete next[matchId];
        }

        next[currentMatch.id] = teamId;
        return next;
      });
      setPickHistory((current) => [...current, { phase: "knockout", matchId: currentMatch.id, roundIndex: activeRoundIndex, knockoutIndex: activeKnockoutIndex }]);
      bumpStreak();

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
    }, PICK_ANIMATION_MS);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>, mode: "group" | "knockout") {
    if (!dragStart) {
      return;
    }

    const dx = event.clientX - dragStart.x;
    const dy = event.clientY - dragStart.y;
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });

    if (mode === "group") {
      if (dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        chooseGroupResult("draw");
      } else if (dx > SWIPE_THRESHOLD) {
        chooseGroupResult("home");
      } else if (dx < -SWIPE_THRESHOLD) {
        chooseGroupResult("away");
      }
    } else if (dx > SWIPE_THRESHOLD) {
      chooseKnockoutWinner(activeKnockoutMatch?.homeTeamId);
    } else if (dx < -SWIPE_THRESHOLD) {
      chooseKnockoutWinner(activeKnockoutMatch?.awayTeamId);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isResolvingPick) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, y: event.clientY });
    setDragOffset({ x: 0, y: 0 });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragStart || isResolvingPick) {
      return;
    }

    setDragOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  }

  function cancelDrag() {
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
  }

  function undoLastPick() {
    const lastPick = pickHistory[pickHistory.length - 1];

    if (!lastPick || isResolvingPick) {
      return;
    }

    setPickHistory((current) => current.slice(0, -1));
    setStreak(0);
    setCheckpointGroupIndex(null);
    setPickFeedback(null);
    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });

    if (lastPick.phase === "group") {
      setGroupPicks((current) => {
        const next = { ...current };
        delete next[lastPick.matchId];
        return next;
      });
      setMatchIndex(lastPick.matchIndex);
      setStep("groups");
      return;
    }

    setKnockoutPicks((current) => {
      const next = { ...current };
      delete next[lastPick.matchId];

      for (const matchId of getDownstreamMatches(lastPick.matchId)) {
        delete next[matchId];
      }

      return next;
    });
    setActiveRoundIndex(lastPick.roundIndex);
    setActiveKnockoutIndex(lastPick.knockoutIndex);
    setStep("knockout");
  }

  function continuePastCheckpoint() {
    if (checkpointGroupIndex === null) {
      return;
    }

    setCheckpointGroupIndex(null);
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
    <div className="mx-auto max-w-4xl space-y-3">
      <section className="sticky top-[73px] z-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-wide text-emerald-700">
              {step === "groups" ? `${activeMatch?.groupName ?? "Groups"} · ${groupProgress}/72` : step}
            </p>
            <p className="mt-1 truncate text-[11px] font-black text-zinc-500">{lockInMessage}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: step === "groups" ? `${visualGroupProgress}%` : champion ? "100%" : "68%",
                  backgroundColor: step === "groups" ? groupAccent : "#047857",
                }}
              />
            </div>
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
            <p className="text-[10px] font-black uppercase tracking-wide text-emerald-700">{streakLabel}</p>
            <p className="text-lg font-black text-emerald-950">{streak}</p>
          </div>
        </div>
      </section>

      {statusMessage ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-900">{statusMessage}</div> : null}

      {step === "groups" && checkpointGroupIndex !== null ? (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-zinc-950 p-5 text-white shadow-sm sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:54px_54px]" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Group locked</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">{groups[checkpointGroupIndex]?.name} complete</h2>
            <p className="mt-3 text-sm font-semibold text-zinc-300">Winner, runner-up, and third-place pressure are now live.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {groupTables[checkpointGroupIndex]?.table.slice(0, 3).map((row, index) => (
                <div key={row.teamId} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <TeamFlag teamId={row.teamId} className="h-9 w-14" />
                    <span className="rounded-md bg-amber-300 px-2 py-1 text-xs font-black text-zinc-950">#{index + 1}</span>
                  </div>
                  <p className="mt-3 text-lg font-black">{getTeamName(row.teamId)}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-300">{row.points} pts · GD {row.goalDifference}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={continuePastCheckpoint} className="min-h-12 rounded-lg bg-emerald-600 px-5 py-3 text-sm font-black text-white hover:bg-emerald-700">
                Keep Picking
              </button>
              <button type="button" onClick={undoLastPick} className="min-h-12 rounded-lg border border-white/20 bg-white/10 px-5 py-3 text-sm font-black text-white hover:bg-white/15">
                Back
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {step === "groups" && activeMatch && checkpointGroupIndex === null ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide" style={{ color: groupAccent }}>{activeMatch.groupName}</p>
              <h2 className="mt-1 text-2xl font-black text-zinc-950">Pick the result</h2>
            </div>
            <p className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white">
              {groupProgress}/{groupMatches.length}
            </p>
          </div>
          <div className="mt-3 grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm font-black text-zinc-700 sm:grid-cols-2">
            <span>{activeMatch.date} · {activeMatch.time}</span>
            <span className="min-w-0 truncate sm:text-right">{activeMatch.venue}</span>
          </div>
          <div
            className={`game-pick-card relative mt-3 touch-none overflow-hidden rounded-3xl border border-zinc-200 bg-[#fbfaf3] p-5 shadow-sm ring-4 ring-transparent transition active:ring-emerald-100 ${dragIntent ? `is-dragging-${dragIntent}` : ""} ${pickFeedback ? `is-picking-${pickFeedback.direction}` : ""}`}
            style={dragStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => handlePointerUp(event, "group")}
            onPointerCancel={cancelDrag}
          >
            {pickFeedback ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-emerald-700/90 px-6 text-center text-white">
                <div>
                  <p className="text-3xl font-black">{pickFeedback.text}</p>
                  {pickFeedback.consequence ? <p className="mt-3 text-sm font-black text-emerald-50">{pickFeedback.consequence}</p> : null}
                </div>
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black uppercase tracking-wide">
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Left wins</span>
              <span className="rounded-full bg-zinc-950 px-2 py-1 text-white">{matchRisk}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-800">Right wins</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-black">
              <span className="rounded-lg bg-white px-3 py-2 text-emerald-800">{getTeamCode(activeMatch.homeTeamId)} {activeHomeThreat}</span>
              <span className="rounded-lg bg-white px-3 py-2 text-right text-emerald-800">{getTeamCode(activeMatch.awayTeamId)} {activeAwayThreat}</span>
            </div>
            {dragIntent ? (
              <div className="mt-4 rounded-xl bg-white px-4 py-3 text-center text-lg font-black text-zinc-950 shadow-sm">
                {dragIntent === "down"
                  ? "Locking in a draw"
                  : dragIntent === "right"
                    ? `${getTeamName(activeMatch.homeTeamId)} wins`
                    : `${getTeamName(activeMatch.awayTeamId)} wins`}
              </div>
            ) : null}
            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
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
        </section>
      ) : null}

      {step === "tables" ? (
        <section className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="rounded-3xl bg-zinc-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Group stage locked</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">Round of 32 unlocked</h2>
            <p className="mt-3 text-sm font-semibold text-zinc-300">
              {groupProgress} picks made · best streak {maxStreak} · third-place cutoff decided
            </p>
          </div>
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
            className={`game-pick-card relative mt-5 touch-none overflow-hidden rounded-3xl border border-zinc-200 bg-[#fbfaf3] p-5 shadow-sm ${dragIntent ? `is-dragging-${dragIntent}` : ""} ${pickFeedback ? `is-picking-${pickFeedback.direction}` : ""}`}
            style={dragStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => handlePointerUp(event, "knockout")}
            onPointerCancel={cancelDrag}
          >
            {pickFeedback ? (
              <div className="absolute inset-0 z-10 grid place-items-center bg-emerald-700/90 px-6 text-center text-3xl font-black text-white">
                {pickFeedback.text}
              </div>
            ) : null}
            <p className="text-center text-xs font-black uppercase tracking-wide text-zinc-500">Swipe toward the winner</p>
            {dragIntent && dragIntent !== "down" ? (
              <div className="mt-4 rounded-xl bg-white px-4 py-3 text-center text-lg font-black text-zinc-950 shadow-sm">
                {dragIntent === "right" ? `${getTeamName(activeKnockoutMatch.homeTeamId)} advances` : `${getTeamName(activeKnockoutMatch.awayTeamId)} advances`}
              </div>
            ) : null}
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

      {(step === "groups" || step === "knockout") && checkpointGroupIndex === null ? (
        <nav className="sticky bottom-3 z-20 mx-auto max-w-md rounded-2xl border border-zinc-200 bg-zinc-950/95 p-2 text-white shadow-xl backdrop-blur">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <button
              type="button"
              onClick={undoLastPick}
              disabled={pickHistory.length === 0 || isResolvingPick}
              className="min-h-11 rounded-xl bg-white/10 px-4 py-2 text-sm font-black transition hover:bg-white/15 disabled:opacity-30"
            >
              Back
            </button>
            <div className="px-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-wide text-amber-200">Best</p>
              <p className="text-base font-black">{maxStreak}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (step === "groups" && groupProgress === groupMatches.length) {
                  setStep("tables");
                }
              }}
              disabled={step !== "groups" || groupProgress !== groupMatches.length}
              className="min-h-11 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black transition hover:bg-emerald-700 disabled:bg-white/10 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </nav>
      ) : null}

      {step === "review" ? (
        <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-emerald-800 p-5 text-white sm:p-6">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Final path complete</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">Champion: {getTeamName(champion)}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-emerald-50">
              {personality} · {maxStreak} best streak · {Object.keys(knockoutPicks).length} knockout picks
            </p>
          </div>
          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-4">
                <TeamFlag teamId={champion} className="h-12 w-20" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Your winner</p>
                  <p className="text-2xl font-black text-emerald-950">{getTeamName(champion)}</p>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Bracket type</p>
                <p className="mt-2 text-xl font-black text-zinc-950">{personality}</p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Friends pool</p>
                <p className="mt-2 text-sm font-black leading-6 text-zinc-950">
                  {championPickCount > 0
                    ? `${championPickCount} submitted bracket${championPickCount === 1 ? "" : "s"} already picked ${getTeamName(champion)}`
                    : topChampionPick
                      ? `${topChampionPick.teamName} is the current crowd pick`
                      : "You are setting the early tone"}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-black text-zinc-700">
                Name
                <input
                  value={playerName}
                  onChange={(event) => setPlayerName(event.target.value)}
                  placeholder="Example: Alex"
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="text-sm font-black text-zinc-700">
                Email <span className="text-zinc-500">(optional)</span>
                <input
                  value={playerEmail}
                  type="email"
                  onChange={(event) => setPlayerEmail(event.target.value)}
                  placeholder="alex@example.com"
                  className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            </div>
            {!playerName.trim() ? (
              <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm font-black text-zinc-950">Add your name to submit.</p>
            ) : null}
            {playerEmail.trim() && !hasValidEmail ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-700">Enter a valid email or leave it blank.</p>
            ) : null}
            <button type="button" disabled={!canSubmit || isPending} onClick={submitGamePrediction} className="mt-5 min-h-12 w-full rounded-lg bg-emerald-700 px-5 py-3 text-sm font-black text-white disabled:bg-zinc-300">
              {isPending ? "Submitting..." : "Submit Locked Prediction"}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
