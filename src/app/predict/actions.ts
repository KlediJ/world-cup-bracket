"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { ensureDefaultPool } from "@/db/queries";
import { brackets, players } from "@/db/schema";

type GroupMatchPick = {
  result?: "home" | "draw" | "away";
  homeScore: number | null;
  awayScore: number | null;
};

type SubmitPredictionInput = {
  playerName: string;
  playerEmail: string;
  groupMatchPicks: Record<string, GroupMatchPick>;
  knockoutPicks: Record<string, string>;
  calculatedTables: unknown;
};

export type SubmitPredictionResult = {
  ok: boolean;
  message: string;
  bracketId?: string;
};

function validatePrediction(input: SubmitPredictionInput) {
  if (!input.playerName.trim()) {
    return "Enter a player name.";
  }

  const email = input.playerEmail.trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  if (!input.knockoutPicks["predict-champion"] || !teamsById.has(input.knockoutPicks["predict-champion"])) {
    return "Pick a champion.";
  }

  return null;
}

export async function submitPrediction(input: SubmitPredictionInput): Promise<SubmitPredictionResult> {
  const validationError = validatePrediction(input);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  try {
    const db = getDb();
    const pool = await ensureDefaultPool();
    const submittedEmail = input.playerEmail.trim().toLowerCase();
    const normalizedEmail = submittedEmail || `anonymous-${crypto.randomUUID()}@local.invalid`;

    if (submittedEmail) {
      const [existingBracket] = await db
        .select({ id: brackets.id })
        .from(brackets)
        .innerJoin(players, eq(brackets.playerId, players.id))
        .where(and(eq(players.poolId, pool.id), eq(players.email, submittedEmail)))
        .limit(1);

      if (existingBracket) {
        return { ok: false, message: "That email already submitted a bracket for this pool." };
      }
    }

    const [player] = await db
      .insert(players)
      .values({
        poolId: pool.id,
        name: input.playerName.trim(),
        email: normalizedEmail,
      })
      .returning();

    const [bracket] = await db.insert(brackets).values({
      poolId: pool.id,
      playerId: player.id,
      submissionType: "predictor",
      championTeamId: input.knockoutPicks["predict-champion"],
      groupPicks: {},
      thirdPlaceAdvancers: [],
      knockoutPicks: input.knockoutPicks,
      knockoutScores: {},
      predictionPayload: {
        groupMatchPicks: input.groupMatchPicks,
        calculatedTables: input.calculatedTables,
      },
    }).returning({ id: brackets.id });

    revalidatePath("/leaderboard");

    return { ok: true, message: "Prediction submitted.", bracketId: bracket.id };
  } catch (error) {
    console.error("Prediction submission failed", error);
    return { ok: false, message: "Database is not connected yet." };
  }
}
