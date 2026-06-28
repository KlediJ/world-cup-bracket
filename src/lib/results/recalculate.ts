import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { brackets, matchResults } from "@/db/schema";
import { calculateGroupStageScoreFromClassicPicks, calculateGroupStageScoreFromPredictionPayload, calculateKnockoutScore } from "@/lib/scoring";

type Db = ReturnType<typeof getDb>;

export async function getStoredKnockoutWinners(db: Db) {
  const rows = await db
    .select({
      matchId: matchResults.matchId,
      winnerTeamId: matchResults.winnerTeamId,
    })
    .from(matchResults);

  return Object.fromEntries(rows.filter((row) => row.winnerTeamId).map((row) => [row.matchId, row.winnerTeamId as string]));
}

export async function recalculateAllBracketPoints(db: Db) {
  const knockoutWinners = await getStoredKnockoutWinners(db);
  const rows = await db
    .select({
      id: brackets.id,
      submissionType: brackets.submissionType,
      groupPicks: brackets.groupPicks,
      thirdPlaceAdvancers: brackets.thirdPlaceAdvancers,
      predictionPayload: brackets.predictionPayload,
      officialKnockoutPicks: brackets.officialKnockoutPicks,
    })
    .from(brackets);

  for (const row of rows) {
    const groupPoints =
      row.submissionType === "predictor"
        ? calculateGroupStageScoreFromPredictionPayload(row.predictionPayload)
        : calculateGroupStageScoreFromClassicPicks(row.groupPicks, row.thirdPlaceAdvancers);
    const knockoutPoints = calculateKnockoutScore(row.officialKnockoutPicks ?? {}, knockoutWinners);

    await db
      .update(brackets)
      .set({
        points: groupPoints + knockoutPoints,
        updatedAt: new Date(),
      })
      .where(eq(brackets.id, row.id));
  }

  return {
    updated: rows.length,
    knockoutWinners,
  };
}
