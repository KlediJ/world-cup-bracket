import { NextResponse } from "next/server";
import { syncResults } from "@/lib/results/sync";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const cronSecret = request.headers.get("x-cron-secret");
  const url = new URL(request.url);

  return authorization === `Bearer ${secret}` || cronSecret === secret || url.searchParams.get("secret") === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncResults();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Result sync failed", error);
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Result sync failed" }, { status: 500 });
  }
}

