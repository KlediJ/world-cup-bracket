import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  if (!existsSync(".env.local")) {
    return;
  }

  const lines = readFileSync(".env.local", "utf8").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    process.env[key] ??= valueParts.join("=");
  }
}

const scoringValues = {
  groupWinner: 3,
  groupRunnerUp: 2,
  groupThirdPlace: 1,
  thirdPlaceAdvancer: 1,
};

const actualGroupResults = {
  a: { winnerId: "mexico", runnerUpId: "south-africa", thirdPlaceId: "korea-republic" },
  b: { winnerId: "switzerland", runnerUpId: "canada", thirdPlaceId: "bosnia-herzegovina" },
  c: { winnerId: "brazil", runnerUpId: "morocco", thirdPlaceId: "scotland" },
  d: { winnerId: "united-states", runnerUpId: "australia", thirdPlaceId: "paraguay" },
  e: { winnerId: "germany", runnerUpId: "cote-divoire", thirdPlaceId: "ecuador" },
  f: { winnerId: "netherlands", runnerUpId: "japan", thirdPlaceId: "sweden" },
  g: { winnerId: "belgium", runnerUpId: "egypt", thirdPlaceId: "ir-iran" },
  h: { winnerId: "spain", runnerUpId: "cabo-verde", thirdPlaceId: "uruguay" },
  i: { winnerId: "france", runnerUpId: "norway", thirdPlaceId: "senegal" },
  j: { winnerId: "argentina", runnerUpId: "austria", thirdPlaceId: "algeria" },
  k: { winnerId: "colombia", runnerUpId: "portugal", thirdPlaceId: "congo-dr" },
  l: { winnerId: "england", runnerUpId: "croatia", thirdPlaceId: "ghana" },
};

const actualThirdPlaceAdvancers = new Set([
  "bosnia-herzegovina",
  "paraguay",
  "ecuador",
  "sweden",
  "senegal",
  "algeria",
  "congo-dr",
  "ghana",
]);

function getPredictedThirdPlaceAdvancers(tables) {
  return tables
    .map((table) => table?.table?.[2])
    .filter((row) => row?.teamId)
    .sort(
      (a, b) =>
        (b.points ?? 0) - (a.points ?? 0) ||
        (b.goalDifference ?? 0) - (a.goalDifference ?? 0) ||
        (b.goalsFor ?? 0) - (a.goalsFor ?? 0) ||
        String(a.teamId).localeCompare(String(b.teamId)),
    )
    .slice(0, 8)
    .map((row) => row.teamId);
}

function scorePredictionPayload(predictionPayload) {
  const tables = Array.isArray(predictionPayload?.calculatedTables) ? predictionPayload.calculatedTables : [];
  let total = 0;

  for (const predictedTable of tables) {
    const groupId = predictedTable?.group?.id;
    const actualGroup = groupId ? actualGroupResults[groupId] : null;

    if (!actualGroup) {
      continue;
    }

    if (predictedTable?.table?.[0]?.teamId === actualGroup.winnerId) {
      total += scoringValues.groupWinner;
    }

    if (predictedTable?.table?.[1]?.teamId === actualGroup.runnerUpId) {
      total += scoringValues.groupRunnerUp;
    }

    if (predictedTable?.table?.[2]?.teamId === actualGroup.thirdPlaceId) {
      total += scoringValues.groupThirdPlace;
    }
  }

  for (const teamId of getPredictedThirdPlaceAdvancers(tables)) {
    if (actualThirdPlaceAdvancers.has(teamId)) {
      total += scoringValues.thirdPlaceAdvancer;
    }
  }

  return total;
}

function scoreClassicPicks(groupPicks, thirdPlaceAdvancers) {
  let total = 0;

  for (const [groupId, pick] of Object.entries(groupPicks ?? {})) {
    const actualGroup = actualGroupResults[groupId];

    if (!actualGroup) {
      continue;
    }

    if (pick?.winnerId === actualGroup.winnerId) {
      total += scoringValues.groupWinner;
    }

    if (pick?.runnerUpId === actualGroup.runnerUpId) {
      total += scoringValues.groupRunnerUp;
    }

    if (pick?.thirdPlaceId === actualGroup.thirdPlaceId) {
      total += scoringValues.groupThirdPlace;
    }
  }

  for (const teamId of thirdPlaceAdvancers ?? []) {
    if (actualThirdPlaceAdvancers.has(teamId)) {
      total += scoringValues.thirdPlaceAdvancer;
    }
  }

  return total;
}

loadLocalEnv();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Add it to .env.local or export it before running this script.");
  process.exit(1);
}

const sql = neon(databaseUrl);
const rows = await sql`
  select id, submission_type, group_picks, third_place_advancers, prediction_payload
  from brackets
`;

for (const row of rows) {
  const points =
    row.submission_type === "predictor"
      ? scorePredictionPayload(row.prediction_payload)
      : scoreClassicPicks(row.group_picks, row.third_place_advancers);

  await sql`
    update brackets
    set points = ${points}, updated_at = now()
    where id = ${row.id}
  `;

  console.log(`${row.id}: ${points}`);
}

console.log(`Updated ${rows.length} bracket point totals.`);
