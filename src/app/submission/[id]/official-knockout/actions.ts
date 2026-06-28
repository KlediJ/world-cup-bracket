"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db/client";
import { brackets } from "@/db/schema";
import { buildOfficialKnockoutRounds, getCalculatedTablesFromPayload, isOfficialBracketReady, officialRequiredPickIds } from "@/data/officialKnockout";
import { teamsById } from "@/data/teams";

export type SubmitOfficialKnockoutResult = {
  ok: boolean;
  message: string;
};

function validateOfficialPicks(payload: Record<string, unknown>, picks: Record<string, string>) {
  const tables = getCalculatedTablesFromPayload(payload);

  if (!isOfficialBracketReady(tables)) {
    return "This submission is missing enough group-table data to build the official bracket.";
  }

  if (officialRequiredPickIds.some((matchId) => !picks[matchId])) {
    return "Complete every official knockout pick before submitting.";
  }

  const rounds = buildOfficialKnockoutRounds(tables, picks);

  for (const round of rounds) {
    for (const match of round.matches) {
      const pickedTeamId = picks[match.id];

      if (!pickedTeamId || !teamsById.has(pickedTeamId)) {
        return "One of the selected teams is not valid.";
      }

      if (pickedTeamId !== match.homeTeamId && pickedTeamId !== match.awayTeamId) {
        return "One of the picks does not belong to its matchup.";
      }
    }
  }

  return null;
}

export async function submitOfficialKnockoutPicks(bracketId: string, picks: Record<string, string>): Promise<SubmitOfficialKnockoutResult> {
  try {
    const db = getDb();
    const [existing] = await db
      .select({
        id: brackets.id,
        officialKnockoutSubmittedAt: brackets.officialKnockoutSubmittedAt,
        predictionPayload: brackets.predictionPayload,
      })
      .from(brackets)
      .where(eq(brackets.id, bracketId))
      .limit(1);

    if (!existing) {
      return { ok: false, message: "Submission not found." };
    }

    if (existing.officialKnockoutSubmittedAt) {
      return { ok: false, message: "Official knockout picks are already locked." };
    }

    const validationError = validateOfficialPicks(existing.predictionPayload, picks);

    if (validationError) {
      return { ok: false, message: validationError };
    }

    await db
      .update(brackets)
      .set({
        officialKnockoutPicks: picks,
        officialChampionTeamId: picks["official-champion"],
        officialKnockoutSubmittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(brackets.id, bracketId));

    revalidatePath(`/submission/${bracketId}`);
    revalidatePath(`/submission/${bracketId}/official-knockout`);
    revalidatePath("/admin");
    revalidatePath("/leaderboard");

    return { ok: true, message: "Official knockout picks locked." };
  } catch (error) {
    console.error("Official knockout submission failed", error);
    return { ok: false, message: "Database is not connected yet." };
  }
}
