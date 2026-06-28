import { findActualKnockoutMatch } from "@/data/actualResults";
import { teams } from "@/data/teams";

export type NormalizedMatchResult = {
  matchId: string;
  provider: "football-data";
  providerMatchId: string;
  stage: string;
  status: "scheduled" | "live" | "final";
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  winnerTeamId: string | null;
  startedAt: Date | null;
};

type FootballDataMatch = {
  id: number;
  utcDate?: string;
  status?: string;
  stage?: string;
  homeTeam?: {
    name?: string;
    shortName?: string;
    tla?: string;
  };
  awayTeam?: {
    name?: string;
    shortName?: string;
    tla?: string;
  };
  score?: {
    winner?: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime?: {
      home: number | null;
      away: number | null;
    };
  };
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

const teamIdsByCode = new Map(teams.map((team) => [team.code.toUpperCase(), team.id]));
const teamIdsByName = new Map(teams.map((team) => [normalizeName(team.name), team.id]));

const teamAliases: Record<string, string> = {
  "bosnia-herzegovina": "bosnia-herzegovina",
  "bosnia and herzegovina": "bosnia-herzegovina",
  "cabo verde": "cabo-verde",
  "cape verde": "cabo-verde",
  "congo dr": "congo-dr",
  "dr congo": "congo-dr",
  "democratic republic of congo": "congo-dr",
  "cote divoire": "cote-divoire",
  "cote d ivoire": "cote-divoire",
  "côte d'ivoire": "cote-divoire",
  "ivory coast": "cote-divoire",
  iran: "ir-iran",
  "ir iran": "ir-iran",
  "korea republic": "korea-republic",
  "south korea": "korea-republic",
  usa: "united-states",
  "united states": "united-states",
};

const codeAliases: Record<string, string> = {
  BIH: "bosnia-herzegovina",
  CIV: "cote-divoire",
  COD: "congo-dr",
  DRC: "congo-dr",
  CPV: "cabo-verde",
  IRN: "ir-iran",
  KOR: "korea-republic",
  RSA: "south-africa",
  SUI: "switzerland",
  USA: "united-states",
};

function normalizeName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function getTeamId(team: FootballDataMatch["homeTeam"]) {
  const code = team?.tla?.trim().toUpperCase();

  if (code) {
    const codeMatch = codeAliases[code] ?? teamIdsByCode.get(code);

    if (codeMatch) {
      return codeMatch;
    }
  }

  for (const name of [team?.name, team?.shortName]) {
    if (!name) {
      continue;
    }

    const normalizedName = normalizeName(name);
    const aliasMatch = teamAliases[normalizedName];

    if (aliasMatch) {
      return aliasMatch;
    }

    const nameMatch = teamIdsByName.get(normalizedName);

    if (nameMatch) {
      return nameMatch;
    }
  }

  return null;
}

function normalizeStatus(status: string | undefined): NormalizedMatchResult["status"] {
  if (status === "FINISHED" || status === "AWARDED") {
    return "final";
  }

  if (status === "IN_PLAY" || status === "LIVE" || status === "PAUSED") {
    return "live";
  }

  return "scheduled";
}

function getWinnerTeamId(match: FootballDataMatch, homeTeamId: string, awayTeamId: string) {
  if (match.score?.winner === "HOME_TEAM") {
    return homeTeamId;
  }

  if (match.score?.winner === "AWAY_TEAM") {
    return awayTeamId;
  }

  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;

  if (typeof homeScore === "number" && typeof awayScore === "number" && homeScore !== awayScore) {
    return homeScore > awayScore ? homeTeamId : awayTeamId;
  }

  return null;
}

function endpoint() {
  const competition = process.env.FOOTBALL_DATA_COMPETITION ?? "WC";
  const season = process.env.FOOTBALL_DATA_SEASON ?? "2026";
  return `https://api.football-data.org/v4/competitions/${competition}/matches?season=${season}`;
}

export async function fetchFootballDataResults(existingWinners: Record<string, string>) {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;

  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not configured.");
  }

  const response = await fetch(endpoint(), {
    headers: {
      "X-Auth-Token": token,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`football-data request failed with ${response.status}`);
  }

  const data = (await response.json()) as FootballDataMatchesResponse;
  const winners = { ...existingWinners };
  const normalizedMatches: NormalizedMatchResult[] = [];
  const matches = [...(data.matches ?? [])].sort((a, b) => String(a.utcDate ?? "").localeCompare(String(b.utcDate ?? "")));

  for (const match of matches) {
    const homeTeamId = getTeamId(match.homeTeam);
    const awayTeamId = getTeamId(match.awayTeam);

    if (!homeTeamId || !awayTeamId) {
      continue;
    }

    const actualMatch = findActualKnockoutMatch(homeTeamId, awayTeamId, winners);

    if (!actualMatch) {
      continue;
    }

    const status = normalizeStatus(match.status);
    const winnerTeamId = status === "final" ? getWinnerTeamId(match, homeTeamId, awayTeamId) : null;
    const normalizedMatch = {
      matchId: actualMatch.id,
      provider: "football-data" as const,
      providerMatchId: String(match.id),
      stage: actualMatch.stage,
      status,
      homeTeamId: actualMatch.homeTeamId ?? homeTeamId,
      awayTeamId: actualMatch.awayTeamId ?? awayTeamId,
      homeScore: match.score?.fullTime?.home ?? null,
      awayScore: match.score?.fullTime?.away ?? null,
      winnerTeamId,
      startedAt: match.utcDate ? new Date(match.utcDate) : null,
    };

    normalizedMatches.push(normalizedMatch);

    if (winnerTeamId) {
      winners[actualMatch.id] = winnerTeamId;
    }
  }

  return normalizedMatches;
}
