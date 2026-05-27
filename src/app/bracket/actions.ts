"use server";

import { revalidatePath } from "next/cache";
import { teamsById } from "@/data/teams";
import { getDb } from "@/db/client";
import { ensureDefaultPool } from "@/db/queries";
import { brackets, players } from "@/db/schema";
import type { GroupPick } from "@/types/bracket";

type SubmitBracketInput = {
  playerName: string;
  groupPicks: Record<string, GroupPick>;
  knockoutPicks: Record<string, string>;
};

export type SubmitBracketResult = {
  ok: boolean;
  message: string;
};

function validateSubmission(input: SubmitBracketInput) {
  if (!input.playerName.trim()) {
    return "Enter a player name.";
  }

  if (!input.knockoutPicks.champion || !teamsById.has(input.knockoutPicks.champion)) {
    return "Pick a champion.";
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
    const [player] = await db
      .insert(players)
      .values({
        poolId: pool.id,
        name: input.playerName.trim(),
      })
      .returning();

    await db.insert(brackets).values({
      poolId: pool.id,
      playerId: player.id,
      championTeamId: input.knockoutPicks.champion,
      groupPicks: input.groupPicks,
      knockoutPicks: input.knockoutPicks,
    });

    revalidatePath("/leaderboard");

    return { ok: true, message: "Bracket submitted." };
  } catch (error) {
    console.error("Bracket submission failed", error);
    return { ok: false, message: "Database is not connected yet." };
  }
}
