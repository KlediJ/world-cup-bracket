import { desc, eq } from "drizzle-orm";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { brackets, players, pools } from "@/db/schema";
import type { GroupPick, ScorePick } from "@/types/bracket";

export const DEFAULT_POOL_CODE = "world-cup-2026";
export const DEFAULT_POOL_NAME = "World Cup 2026 Pool";

export type LeaderboardRow = {
  id: string;
  rank: number;
  playerName: string;
  points: number;
  championPick: string;
  submissionType: string;
  status: "Submitted";
};

export type SubmissionDetail = {
  id: string;
  playerName: string;
  submissionType: string;
  championTeamId: string;
  groupPicks: Record<string, GroupPick>;
  thirdPlaceAdvancers: string[];
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
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
  submittedAt: Date;
};

export type ChampionPickCount = {
  teamId: string;
  teamName: string;
  count: number;
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
      championPick: teamsById.get(row.championTeamId)?.name ?? row.championTeamId,
      submissionType: row.submissionType,
      status: "Submitted",
    }));
  } catch (error) {
    console.error("Leaderboard query failed", error);
    return [];
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
        championTeamId: brackets.championTeamId,
        groupPicks: brackets.groupPicks,
        thirdPlaceAdvancers: brackets.thirdPlaceAdvancers,
        knockoutPicks: brackets.knockoutPicks,
        knockoutScores: brackets.knockoutScores,
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
