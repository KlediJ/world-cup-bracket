export type Team = {
  id: string;
  name: string;
  code: string;
  flag: string;
};

export type Group = {
  id: string;
  name: string;
  teamIds: string[];
};

export type GroupPick = {
  winnerId: string;
  runnerUpId: string;
  thirdPlaceId: string;
};

export type KnockoutRound = "roundOf16" | "quarterfinal" | "semifinal" | "champion";

export type KnockoutPick = {
  matchId: string;
  winnerId: string;
};

export type ScorePick = {
  teamAScore: number | null;
  teamBScore: number | null;
};

export type BracketSubmission = {
  playerName: string;
  groupPicks: Record<string, GroupPick>;
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
  submittedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  playerName: string;
  points: number;
  championPick: string;
  status: "Complete" | "In progress" | "Needs review";
};
