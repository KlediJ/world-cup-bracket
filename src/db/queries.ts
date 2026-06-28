import { desc, eq } from "drizzle-orm";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { brackets, matchResults, players, pools } from "@/db/schema";
import type { GroupPick, ScorePick } from "@/types/bracket";

export const DEFAULT_POOL_CODE = "world-cup-2026";
export const DEFAULT_POOL_NAME = "World Cup 2026 Pool";

export type LeaderboardRow = {
  id: string;
  rank: number;
  playerName: string;
  points: number;
  championPick: string;
  originalChampionPick: string;
  officialChampionPick: string | null;
  submissionType: string;
  officialKnockoutSubmittedAt: Date | null;
  status: "Submitted" | "Official picks locked" | "Needs official picks";
};

export type SubmissionDetail = {
  id: string;
  playerName: string;
  submissionType: string;
  points: number;
  championTeamId: string;
  groupPicks: Record<string, GroupPick>;
  thirdPlaceAdvancers: string[];
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
  officialKnockoutPicks: Record<string, string>;
  officialChampionTeamId: string | null;
  officialKnockoutSubmittedAt: Date | null;
  predictionPayload: Record<string, unknown>;
  submittedAt: Date;
};

export type AdminSubmissionRow = {
  id: string;
  playerId: string;
  playerName: string;
  playerEmail: string;
  points: number;
  championPick: string;
  submissionType: string;
  officialKnockoutSubmittedAt: Date | null;
  submittedAt: Date;
};

export type ChampionPickCount = {
  teamId: string;
  teamName: string;
  count: number;
};

export type ResultSyncStatus = {
  connected: boolean;
  totalMatches: number;
  finalMatches: number;
  liveMatches: number;
  scheduledMatches: number;
  latestUpdatedAt: Date | null;
  recentMatches: {
    matchId: string;
    stage: string;
    status: string;
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    winnerTeamId: string | null;
    updatedAt: Date;
  }[];
};

export async function ensureDefaultPool() {
  const db = getDb();
  const existingPool = await db.query.pools.findFirst({
    where: eq(pools.code, DEFAULT_POOL_CODE),
  });

  if (existingPool) {
    return existingPool;
  }

  const [createdPool] = await db
    .insert(pools)
    .values({
      name: DEFAULT_POOL_NAME,
      code: DEFAULT_POOL_CODE,
    })
    .returning();

  return createdPool;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        id: brackets.id,
        playerName: players.name,
        points: brackets.points,
        championTeamId: brackets.championTeamId,
        officialChampionTeamId: brackets.officialChampionTeamId,
        officialKnockoutSubmittedAt: brackets.officialKnockoutSubmittedAt,
        submissionType: brackets.submissionType,
      })
      .from(brackets)
      .innerJoin(players, eq(brackets.playerId, players.id))
      .orderBy(desc(brackets.points), desc(brackets.submittedAt));

    return rows.map((row, index) => ({
      id: row.id,
      rank: index + 1,
      playerName: row.playerName,
      points: row.points,
      championPick: teamsById.get(row.officialChampionTeamId ?? row.championTeamId)?.name ?? row.officialChampionTeamId ?? row.championTeamId,
      originalChampionPick: teamsById.get(row.championTeamId)?.name ?? row.championTeamId,
      officialChampionPick: row.officialChampionTeamId ? teamsById.get(row.officialChampionTeamId)?.name ?? row.officialChampionTeamId : null,
      submissionType: row.submissionType,
      officialKnockoutSubmittedAt: row.officialKnockoutSubmittedAt,
      status: row.officialKnockoutSubmittedAt ? "Official picks locked" : "Needs official picks",
    }));
  } catch (error) {
    console.error("Leaderboard query failed", error);
    return [];
  }
}

export async function getResultSyncStatus(): Promise<ResultSyncStatus> {
  const emptyStatus: ResultSyncStatus = {
    connected: Boolean(process.env.DATABASE_URL),
    totalMatches: 0,
    finalMatches: 0,
    liveMatches: 0,
    scheduledMatches: 0,
    latestUpdatedAt: null,
    recentMatches: [],
  };

  if (!process.env.DATABASE_URL) {
    return emptyStatus;
  }

  try {
    const rows = await getDb()
      .select({
        matchId: matchResults.matchId,
        stage: matchResults.stage,
        status: matchResults.status,
        homeTeamId: matchResults.homeTeamId,
        awayTeamId: matchResults.awayTeamId,
        homeScore: matchResults.homeScore,
        awayScore: matchResults.awayScore,
        winnerTeamId: matchResults.winnerTeamId,
        updatedAt: matchResults.updatedAt,
      })
      .from(matchResults)
      .orderBy(desc(matchResults.updatedAt));

    return {
      connected: true,
      totalMatches: rows.length,
      finalMatches: rows.filter((row) => row.status === "final").length,
      liveMatches: rows.filter((row) => row.status === "live").length,
      scheduledMatches: rows.filter((row) => row.status === "scheduled").length,
      latestUpdatedAt: rows[0]?.updatedAt ?? null,
      recentMatches: rows.slice(0, 4),
    };
  } catch (error) {
    console.error("Result sync status query failed", error);
    return emptyStatus;
  }
}

export async function getSubmissionDetail(id: string): Promise<SubmissionDetail | null> {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const [row] = await getDb()
      .select({
        id: brackets.id,
        playerName: players.name,
        submissionType: brackets.submissionType,
        points: brackets.points,
        championTeamId: brackets.championTeamId,
        groupPicks: brackets.groupPicks,
        thirdPlaceAdvancers: brackets.thirdPlaceAdvancers,
        knockoutPicks: brackets.knockoutPicks,
        knockoutScores: brackets.knockoutScores,
        officialKnockoutPicks: brackets.officialKnockoutPicks,
        officialChampionTeamId: brackets.officialChampionTeamId,
        officialKnockoutSubmittedAt: brackets.officialKnockoutSubmittedAt,
        predictionPayload: brackets.predictionPayload,
        submittedAt: brackets.submittedAt,
      })
      .from(brackets)
      .innerJoin(players, eq(brackets.playerId, players.id))
      .where(eq(brackets.id, id))
      .limit(1);

    return row ?? null;
  } catch (error) {
    console.error("Submission query failed", error);
    return null;
  }
}

export async function getAdminSubmissions(search = ""): Promise<AdminSubmissionRow[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const rows = await getDb()
      .select({
        id: brackets.id,
        playerId: players.id,
        playerName: players.name,
        playerEmail: players.email,
        points: brackets.points,
        championTeamId: brackets.championTeamId,
        submissionType: brackets.submissionType,
        officialKnockoutSubmittedAt: brackets.officialKnockoutSubmittedAt,
        submittedAt: brackets.submittedAt,
      })
      .from(brackets)
      .innerJoin(players, eq(brackets.playerId, players.id))
      .orderBy(desc(brackets.submittedAt));
    const normalizedSearch = search.trim().toLowerCase();

    return rows
      .filter((row) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          row.playerName.toLowerCase().includes(normalizedSearch) ||
          row.playerEmail.toLowerCase().includes(normalizedSearch) ||
          row.submissionType.toLowerCase().includes(normalizedSearch) ||
          (teamsById.get(row.championTeamId)?.name ?? row.championTeamId).toLowerCase().includes(normalizedSearch)
        );
      })
      .map((row) => ({
        id: row.id,
        playerId: row.playerId,
        playerName: row.playerName,
        playerEmail: row.playerEmail,
        points: row.points,
        championPick: teamsById.get(row.championTeamId)?.name ?? row.championTeamId,
        submissionType: row.submissionType,
        officialKnockoutSubmittedAt: row.officialKnockoutSubmittedAt,
        submittedAt: row.submittedAt,
      }));
  } catch (error) {
    console.error("Admin submissions query failed", error);
    return [];
  }
}

export async function getChampionPickCounts(): Promise<ChampionPickCount[]> {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  try {
    const rows = await getDb()
      .select({
        championTeamId: brackets.championTeamId,
      })
      .from(brackets);
    const counts = new Map<string, number>();

    for (const row of rows) {
      counts.set(row.championTeamId, (counts.get(row.championTeamId) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([teamId, count]) => ({
        teamId,
        teamName: teamsById.get(teamId)?.name ?? teamId,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName));
  } catch (error) {
    console.error("Champion pick counts query failed", error);
    return [];
  }
}
