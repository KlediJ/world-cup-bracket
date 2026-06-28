import type { GroupPick, ScorePick } from "@/types/bracket";
import { actualGroupResults, actualThirdPlaceAdvancers } from "@/data/actualResults";

export const scoringRules = [
  { label: "Correct group winner", points: 3 },
  { label: "Correct group runner-up", points: 2 },
  { label: "Correct group third place", points: 1 },
  { label: "Correct third-place advancer", points: 1 },
  { label: "Correct Round of 32 winner", points: 3 },
  { label: "Correct Round of 16 winner", points: 4 },
  { label: "Correct quarterfinal winner", points: 6 },
  { label: "Correct semifinal winner", points: 8 },
  { label: "Correct champion", points: 12 },
];

export const maxSampleScore = scoringRules.reduce((total, rule) => total + rule.points, 0);

export const scoringValues = {
  groupWinner: 3,
  groupRunnerUp: 2,
  groupThirdPlace: 1,
  thirdPlaceAdvancer: 1,
  roundOf32Winner: 3,
  roundOf16Winner: 4,
  quarterfinalWinner: 6,
  semifinalWinner: 8,
  champion: 12,
};

export type BracketScoreInput = {
  groupPicks: Record<string, GroupPick>;
  thirdPlaceAdvancers: string[];
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
};

export type BracketResults = {
  groups: Record<string, GroupPick>;
  thirdPlaceAdvancers: string[];
  knockoutWinners: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
};

type TableRow = {
  teamId: string;
  points?: number;
  goalDifference?: number;
  goalsFor?: number;
};

type CalculatedTable = {
  group?: {
    id?: string;
  };
  table?: TableRow[];
};

export type GroupScoreBreakdownRow = {
  groupId: string;
  predicted: GroupPick;
  actual: GroupPick;
  winnerPoints: number;
  runnerUpPoints: number;
  thirdPlacePoints: number;
  total: number;
};

export type ThirdPlaceAdvancerBreakdownRow = {
  teamId: string;
  points: number;
};

export type GroupStageScoreBreakdown = {
  groupRows: GroupScoreBreakdownRow[];
  thirdPlaceAdvancers: ThirdPlaceAdvancerBreakdownRow[];
  total: number;
};

function asCalculatedTables(payload: Record<string, unknown>): CalculatedTable[] {
  const tables = payload.calculatedTables;

  if (!Array.isArray(tables)) {
    return [];
  }

  return tables.filter((table): table is CalculatedTable => typeof table === "object" && table !== null);
}

function getPredictedThirdPlaceAdvancers(tables: CalculatedTable[]) {
  return tables
    .map((table) => table.table?.[2])
    .filter((row): row is TableRow => Boolean(row?.teamId))
    .sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        (b.goalDifference ?? 0) - (a.goalDifference ?? 0) ||
        (b.goalsFor ?? 0) - (a.goalsFor ?? 0) ||
        a.teamId.localeCompare(b.teamId),
    )
    .slice(0, 8)
    .map((row) => row.teamId);
}

function getGroupRowPoints(predicted: GroupPick, actual: GroupPick) {
  const winnerPoints = predicted.winnerId === actual.winnerId ? scoringValues.groupWinner : 0;
  const runnerUpPoints = predicted.runnerUpId === actual.runnerUpId ? scoringValues.groupRunnerUp : 0;
  const thirdPlacePoints = predicted.thirdPlaceId === actual.thirdPlaceId ? scoringValues.groupThirdPlace : 0;

  return {
    winnerPoints,
    runnerUpPoints,
    thirdPlacePoints,
    total: winnerPoints + runnerUpPoints + thirdPlacePoints,
  };
}

function buildBreakdown(groupPicks: Record<string, GroupPick>, thirdPlaceAdvancers: string[]): GroupStageScoreBreakdown {
  const groupRows = Object.entries(actualGroupResults).map(([groupId, actual]) => {
    const predicted = groupPicks[groupId] ?? { winnerId: "", runnerUpId: "", thirdPlaceId: "" };

    return {
      groupId,
      predicted,
      actual,
      ...getGroupRowPoints(predicted, actual),
    };
  });
  const thirdPlaceAdvancerRows = thirdPlaceAdvancers
    .filter((teamId) => actualThirdPlaceAdvancers.includes(teamId))
    .map((teamId) => ({
      teamId,
      points: scoringValues.thirdPlaceAdvancer,
    }));
  const total = groupRows.reduce((sum, row) => sum + row.total, 0) + thirdPlaceAdvancerRows.reduce((sum, row) => sum + row.points, 0);

  return {
    groupRows,
    thirdPlaceAdvancers: thirdPlaceAdvancerRows,
    total,
  };
}

export function getPredictedGroupPicksFromPredictionPayload(predictionPayload: Record<string, unknown>) {
  const predictedTables = asCalculatedTables(predictionPayload);
  const groupPicks: Record<string, GroupPick> = {};

  for (const predictedTable of predictedTables) {
    const groupId = predictedTable.group?.id;

    if (!groupId) {
      continue;
    }

    groupPicks[groupId] = {
      winnerId: predictedTable.table?.[0]?.teamId ?? "",
      runnerUpId: predictedTable.table?.[1]?.teamId ?? "",
      thirdPlaceId: predictedTable.table?.[2]?.teamId ?? "",
    };
  }

  return {
    groupPicks,
    thirdPlaceAdvancers: getPredictedThirdPlaceAdvancers(predictedTables),
  };
}

export function getGroupStageScoreBreakdownFromPredictionPayload(predictionPayload: Record<string, unknown>) {
  const predicted = getPredictedGroupPicksFromPredictionPayload(predictionPayload);

  return buildBreakdown(predicted.groupPicks, predicted.thirdPlaceAdvancers);
}

export function getGroupStageScoreBreakdownFromClassicPicks(groupPicks: Record<string, GroupPick>, thirdPlaceAdvancers: string[]) {
  return buildBreakdown(groupPicks, thirdPlaceAdvancers);
}

export function calculateGroupStageScoreFromPredictionPayload(predictionPayload: Record<string, unknown>) {
  const predictedTables = asCalculatedTables(predictionPayload);
  let total = 0;

  for (const predictedTable of predictedTables) {
    const groupId = predictedTable.group?.id;
    const actualGroup = groupId ? actualGroupResults[groupId] : null;

    if (!actualGroup) {
      continue;
    }

    if (predictedTable.table?.[0]?.teamId === actualGroup.winnerId) {
      total += scoringValues.groupWinner;
    }

    if (predictedTable.table?.[1]?.teamId === actualGroup.runnerUpId) {
      total += scoringValues.groupRunnerUp;
    }

    if (predictedTable.table?.[2]?.teamId === actualGroup.thirdPlaceId) {
      total += scoringValues.groupThirdPlace;
    }
  }

  for (const teamId of getPredictedThirdPlaceAdvancers(predictedTables)) {
    if (actualThirdPlaceAdvancers.includes(teamId)) {
      total += scoringValues.thirdPlaceAdvancer;
    }
  }

  return total;
}

export function calculateGroupStageScoreFromClassicPicks(groupPicks: Record<string, GroupPick>, thirdPlaceAdvancers: string[]) {
  let total = 0;

  for (const [groupId, pick] of Object.entries(groupPicks)) {
    const actualGroup = actualGroupResults[groupId];

    if (!actualGroup) {
      continue;
    }

    if (pick.winnerId === actualGroup.winnerId) {
      total += scoringValues.groupWinner;
    }

    if (pick.runnerUpId === actualGroup.runnerUpId) {
      total += scoringValues.groupRunnerUp;
    }

    if (pick.thirdPlaceId === actualGroup.thirdPlaceId) {
      total += scoringValues.groupThirdPlace;
    }
  }

  for (const teamId of thirdPlaceAdvancers) {
    if (actualThirdPlaceAdvancers.includes(teamId)) {
      total += scoringValues.thirdPlaceAdvancer;
    }
  }

  return total;
}

function getWinnerPoints(matchId: string) {
  if (matchId.startsWith("r32-")) {
    return scoringValues.roundOf32Winner;
  }

  if (matchId.startsWith("r16-")) {
    return scoringValues.roundOf16Winner;
  }

  if (matchId.startsWith("qf-")) {
    return scoringValues.quarterfinalWinner;
  }

  if (matchId.startsWith("sf-")) {
    return scoringValues.semifinalWinner;
  }

  if (matchId === "champion") {
    return scoringValues.champion;
  }

  return 0;
}

export function calculateBracketScore(input: BracketScoreInput, results: BracketResults) {
  let total = 0;

  for (const [groupId, pick] of Object.entries(input.groupPicks)) {
    const result = results.groups[groupId];

    if (!result) {
      continue;
    }

    if (pick.winnerId === result.winnerId) {
      total += scoringValues.groupWinner;
    }

    if (pick.runnerUpId === result.runnerUpId) {
      total += scoringValues.groupRunnerUp;
    }

    if (pick.thirdPlaceId === result.thirdPlaceId) {
      total += scoringValues.groupThirdPlace;
    }
  }

  for (const teamId of input.thirdPlaceAdvancers) {
    if (results.thirdPlaceAdvancers.includes(teamId)) {
      total += scoringValues.thirdPlaceAdvancer;
    }
  }

  for (const [matchId, winnerId] of Object.entries(input.knockoutPicks)) {
    const correctWinner = results.knockoutWinners[matchId];

    if (!correctWinner || winnerId !== correctWinner) {
      continue;
    }

    total += getWinnerPoints(matchId);
  }

  return total;
}
