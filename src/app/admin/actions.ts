"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/db/client";
import { brackets, players } from "@/db/schema";

const ADMIN_PASSWORD = "adminiscooking";
const ADMIN_COOKIE = "wc_admin";

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value === "1";
}

export async function loginAdmin(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password !== ADMIN_PASSWORD) {
    redirect("/admin?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "1", {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin");
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}

export async function deleteSubmission(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const playerId = String(formData.get("playerId") ?? "");

  if (!playerId) {
    return;
  }

  await getDb().delete(players).where(eq(players.id, playerId));

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function deleteBracketOnly(formData: FormData) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin");
  }

  const bracketId = String(formData.get("bracketId") ?? "");

  if (!bracketId) {
    return;
  }

  await getDb().delete(brackets).where(eq(brackets.id, bracketId));

  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}
