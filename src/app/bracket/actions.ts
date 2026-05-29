"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { ensureDefaultPool } from "@/db/queries";
import { brackets, players } from "@/db/schema";
import type { GroupPick, ScorePick } from "@/types/bracket";

type SubmitBracketInput = {
  playerName: string;
  playerEmail: string;
  groupPicks: Record<string, GroupPick>;
  thirdPlaceAdvancers: string[];
  knockoutPicks: Record<string, string>;
  knockoutScores: Record<string, ScorePick>;
};

export type SubmitBracketResult = {
  ok: boolean;
  message: string;
  bracketId?: string;
};

function validateSubmission(input: SubmitBracketInput) {
  if (!input.playerName.trim()) {
    return "Enter a player name.";
  }

  const email = input.playerEmail.trim();

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }

  if (!input.knockoutPicks.champion || !teamsById.has(input.knockoutPicks.champion)) {
    return "Pick a champion.";
  }

  if (input.thirdPlaceAdvancers.length !== 8) {
    return "Pick the 8 third-place teams that advance.";
  }

  return null;
}

export async function submitBracket(input: SubmitBracketInput): Promise<SubmitBracketResult> {
  const validationError = validateSubmission(input);

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
      championTeamId: input.knockoutPicks.champion,
      groupPicks: input.groupPicks,
      thirdPlaceAdvancers: input.thirdPlaceAdvancers,
      knockoutPicks: input.knockoutPicks,
      knockoutScores: input.knockoutScores,
    }).returning({ id: brackets.id });

    revalidatePath("/leaderboard");

    return { ok: true, message: "Bracket submitted.", bracketId: bracket.id };
  } catch (error) {
    console.error("Bracket submission failed", error);
    return { ok: false, message: "Database is not connected yet." };
  }
}
