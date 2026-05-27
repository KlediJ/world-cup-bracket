export type Team = {
  id: string;
  name: string;
  code: string;
};

export type Group = {
  id: string;
  name: string;
  teamIds: string[];
};

export type GroupPick = {
  winnerId: string;
  runnerUpId: string;
};

export type KnockoutRound = "roundOf16" | "quarterfinal" | "semifinal" | "champion";

export type KnockoutPick = {
  matchId: string;
  winnerId: string;
};

export type BracketSubmission = {
  playerName: string;
  groupPicks: Record<string, GroupPick>;
  knockoutPicks: Record<string, string>;
  savedAt: string;
};

export type LeaderboardEntry = {
  rank: number;
  playerName: string;
  points: number;
  championPick: string;
  status: "Complete" | "In progress" | "Needs review";
};
