import type { LeaderboardEntry } from "@/types/bracket";

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, playerName: "Maya", points: 76, championPick: "Brazil", status: "Complete" },
  { rank: 2, playerName: "Uncle Rob", points: 71, championPick: "France", status: "Complete" },
  { rank: 3, playerName: "Jess", points: 68, championPick: "Argentina", status: "Complete" },
  { rank: 4, playerName: "Chris", points: 61, championPick: "England", status: "In progress" },
  { rank: 5, playerName: "Nina", points: 56, championPick: "Spain", status: "Needs review" },
  { rank: 6, playerName: "Dad", points: 49, championPick: "Portugal", status: "Complete" },
];
