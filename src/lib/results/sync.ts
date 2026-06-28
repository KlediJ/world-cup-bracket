import { sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { matchResults } from "@/db/schema";
import { fetchFootballDataResults } from "@/lib/results/footballData";
import { getStoredKnockoutWinners, recalculateAllBracketPoints } from "@/lib/results/recalculate";

export async function syncResults() {
  const provider = process.env.RESULTS_PROVIDER ?? "football-data";

  if (provider !== "football-data") {
    throw new Error(`Unsupported RESULTS_PROVIDER: ${provider}`);
  }

  const db = getDb();
  const existingWinners = await getStoredKnockoutWinners(db);
  const providerResults = await fetchFootballDataResults(existingWinners);

  for (const result of providerResults) {
    await db
      .insert(matchResults)
      .values({
        matchId: result.matchId,
        provider: result.provider,
        providerMatchId: result.providerMatchId,
        stage: result.stage,
        status: result.status,
        homeTeamId: result.homeTeamId,
        awayTeamId: result.awayTeamId,
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        winnerTeamId: result.winnerTeamId,
        startedAt: result.startedAt,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: matchResults.matchId,
        set: {
          provider: result.provider,
          providerMatchId: result.providerMatchId,
          stage: result.stage,
          status: result.status,
          homeTeamId: result.homeTeamId,
          awayTeamId: result.awayTeamId,
          homeScore: result.homeScore,
          awayScore: result.awayScore,
          winnerTeamId: sql`coalesce(excluded.winner_team_id, ${matchResults.winnerTeamId})`,
          startedAt: result.startedAt,
          updatedAt: new Date(),
        },
      });
  }

  const recalculation = await recalculateAllBracketPoints(db);

  revalidatePath("/");
  revalidatePath("/leaderboard");
  revalidatePath("/admin");

  return {
    provider,
    syncedMatches: providerResults.length,
    updatedBrackets: recalculation.updated,
    knockoutWinners: Object.keys(recalculation.knockoutWinners).length,
  };
}
