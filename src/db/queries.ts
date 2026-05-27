import { desc, eq } from "drizzle-orm";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { brackets, players, pools } from "@/db/schema";

export const DEFAULT_POOL_CODE = "world-cup-2026";
export const DEFAULT_POOL_NAME = "World Cup 2026 Pool";

export type LeaderboardRow = {
  id: string;
  rank: number;
  playerName: string;
  points: number;
  championPick: string;
  status: "Submitted";
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
      status: "Submitted",
    }));
  } catch (error) {
    console.error("Leaderboard query failed", error);
    return [];
  }
}
