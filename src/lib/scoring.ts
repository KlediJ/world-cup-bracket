import type { GroupPick, ScorePick } from "@/types/bracket";

export const scoringRules = [
  { label: "Correct group winner", points: 3 },
  { label: "Correct group runner-up", points: 2 },
  { label: "Correct group third place", points: 1 },
  { label: "Correct Round of 32 winner", points: 3 },
  { label: "Correct Round of 16 winner", points: 4 },
  { label: "Correct quarterfinal winner", points: 6 },
  { label: "Correct semifinal winner", points: 8 },
  { label: "Correct champion", points: 12 },
  { label: "Exact knockout score bonus", points: 2 },
];

export const maxSampleScore = scoringRules.reduce((total, rule) => total + rule.points, 0);

export const scoringValues = {
  groupWinner: 3,
  groupRunnerUp: 2,
  groupThirdPlace: 1,
  roundOf32Winner: 3,
  roundOf16Winner: 4,
  quarterfinalWinner: 6,
  semifinalWinner: 8,
  champion: 12,
  exactScoreBonus: 2,
};

export type BracketScoreInput = {
  groupPicks: Record<string, GroupPick>;
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
};

export type BracketResults = {
  groups: Record<string, GroupPick>;
  knockoutWinners: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
};

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

function isExactScore(pick?: ScorePick, result?: ScorePick) {
  return (
    pick?.teamAScore !== null &&
    pick?.teamBScore !== null &&
    pick?.teamAScore === result?.teamAScore &&
    pick?.teamBScore === result?.teamBScore
  );
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

  for (const [matchId, winnerId] of Object.entries(input.knockoutPicks)) {
    const correctWinner = results.knockoutWinners[matchId];

    if (!correctWinner || winnerId !== correctWinner) {
      continue;
    }

    total += getWinnerPoints(matchId);

    if (isExactScore(input.knockoutScores[matchId], results.knockoutScores[matchId])) {
      total += scoringValues.exactScoreBonus;
    }
  }

  return total;
}
