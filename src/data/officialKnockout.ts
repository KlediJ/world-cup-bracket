import { thirdPlaceMatrix } from "@/data/thirdPlaceMatrix";

export type OfficialKnockoutSeed = {
  label: string;
  teamId: string;
};

type TableRow = {
  teamId: string;
  points?: number;
  goalDifference?: number;
  goalsFor?: number;
};

type CalculatedTable = {
  group?: {
    id?: string;
    name?: string;
  };
  table?: TableRow[];
};

export type OfficialRoundOf32Match = {
  id: string;
  matchNumber: number;
  home: OfficialKnockoutSeed;
  away: OfficialKnockoutSeed;
};

export type OfficialKnockoutMatch = {
  id: string;
  matchNumber?: number;
  label: string;
  homeTeamId?: string;
  awayTeamId?: string;
};

export type OfficialKnockoutRound = {
  title: string;
  shortTitle: string;
  matches: OfficialKnockoutMatch[];
};

type FixedSeed = {
  label: string;
  groupId: string;
  rank: 1 | 2;
};

type ThirdPlaceSeed = {
  label: string;
  allowedGroupIds: string[];
};

type SeedDefinition = FixedSeed | ThirdPlaceSeed;

type RoundOf32Definition = {
  id: string;
  matchNumber: number;
  home: SeedDefinition;
  away: SeedDefinition;
};

const groupNamesById: Record<string, string> = {
  a: "Group A",
  b: "Group B",
  c: "Group C",
  d: "Group D",
  e: "Group E",
  f: "Group F",
  g: "Group G",
  h: "Group H",
  i: "Group I",
  j: "Group J",
  k: "Group K",
  l: "Group L",
};

const officialRoundOf32Definitions: RoundOf32Definition[] = [
  { id: "official-r32-73", matchNumber: 73, home: { label: "Runner-up Group A", groupId: "a", rank: 2 }, away: { label: "Runner-up Group B", groupId: "b", rank: 2 } },
  { id: "official-r32-74", matchNumber: 74, home: { label: "Winner Group E", groupId: "e", rank: 1 }, away: { label: "Best 3rd A/B/C/D/F", allowedGroupIds: ["a", "b", "c", "d", "f"] } },
  { id: "official-r32-75", matchNumber: 75, home: { label: "Winner Group F", groupId: "f", rank: 1 }, away: { label: "Runner-up Group C", groupId: "c", rank: 2 } },
  { id: "official-r32-76", matchNumber: 76, home: { label: "Winner Group C", groupId: "c", rank: 1 }, away: { label: "Runner-up Group F", groupId: "f", rank: 2 } },
  { id: "official-r32-77", matchNumber: 77, home: { label: "Winner Group I", groupId: "i", rank: 1 }, away: { label: "Best 3rd C/D/F/G/H", allowedGroupIds: ["c", "d", "f", "g", "h"] } },
  { id: "official-r32-78", matchNumber: 78, home: { label: "Runner-up Group E", groupId: "e", rank: 2 }, away: { label: "Runner-up Group I", groupId: "i", rank: 2 } },
  { id: "official-r32-79", matchNumber: 79, home: { label: "Winner Group A", groupId: "a", rank: 1 }, away: { label: "Best 3rd C/E/F/H/I", allowedGroupIds: ["c", "e", "f", "h", "i"] } },
  { id: "official-r32-80", matchNumber: 80, home: { label: "Winner Group L", groupId: "l", rank: 1 }, away: { label: "Best 3rd E/H/I/J/K", allowedGroupIds: ["e", "h", "i", "j", "k"] } },
  { id: "official-r32-81", matchNumber: 81, home: { label: "Winner Group D", groupId: "d", rank: 1 }, away: { label: "Best 3rd B/E/F/I/J", allowedGroupIds: ["b", "e", "f", "i", "j"] } },
  { id: "official-r32-82", matchNumber: 82, home: { label: "Winner Group G", groupId: "g", rank: 1 }, away: { label: "Best 3rd A/E/H/I/J", allowedGroupIds: ["a", "e", "h", "i", "j"] } },
  { id: "official-r32-83", matchNumber: 83, home: { label: "Runner-up Group K", groupId: "k", rank: 2 }, away: { label: "Runner-up Group L", groupId: "l", rank: 2 } },
  { id: "official-r32-84", matchNumber: 84, home: { label: "Winner Group H", groupId: "h", rank: 1 }, away: { label: "Runner-up Group J", groupId: "j", rank: 2 } },
  { id: "official-r32-85", matchNumber: 85, home: { label: "Winner Group B", groupId: "b", rank: 1 }, away: { label: "Best 3rd E/F/G/I/J", allowedGroupIds: ["e", "f", "g", "i", "j"] } },
  { id: "official-r32-86", matchNumber: 86, home: { label: "Winner Group J", groupId: "j", rank: 1 }, away: { label: "Runner-up Group H", groupId: "h", rank: 2 } },
  { id: "official-r32-87", matchNumber: 87, home: { label: "Winner Group K", groupId: "k", rank: 1 }, away: { label: "Best 3rd D/E/I/J/L", allowedGroupIds: ["d", "e", "i", "j", "l"] } },
  { id: "official-r32-88", matchNumber: 88, home: { label: "Runner-up Group D", groupId: "d", rank: 2 }, away: { label: "Runner-up Group G", groupId: "g", rank: 2 } },
];

export const officialRequiredPickIds = [
  ...officialRoundOf32Definitions.map((match) => match.id),
  ...Array.from({ length: 8 }, (_, index) => `official-r16-${89 + index}`),
  ...Array.from({ length: 4 }, (_, index) => `official-qf-${97 + index}`),
  "official-sf-101",
  "official-sf-102",
  "official-champion",
];

function getTableByGroupId(tables: CalculatedTable[], groupId: string) {
  return tables.find((table) => table.group?.id?.toLowerCase() === groupId);
}

function getFixedSeed(tables: CalculatedTable[], seed: FixedSeed): OfficialKnockoutSeed {
  return {
    label: seed.label,
    teamId: getTableByGroupId(tables, seed.groupId)?.table?.[seed.rank - 1]?.teamId ?? "",
  };
}

function getThirdPlaceRows(tables: CalculatedTable[]) {
  return tables
    .map((table) => {
      const groupId = table.group?.id?.toLowerCase() ?? "";
      const row = table.table?.[2];

      return groupId && row?.teamId ? { groupId, row } : null;
    })
    .filter((entry): entry is { groupId: string; row: TableRow } => Boolean(entry))
    .sort(
      (a, b) =>
        (b.row.points ?? 0) - (a.row.points ?? 0) ||
        (b.row.goalDifference ?? 0) - (a.row.goalDifference ?? 0) ||
        (b.row.goalsFor ?? 0) - (a.row.goalsFor ?? 0) ||
        a.row.teamId.localeCompare(b.row.teamId),
    )
    .slice(0, 8);
}

function assignThirdPlaceGroups(tables: CalculatedTable[]) {
  const qualifiedThirdPlaceGroups = getThirdPlaceRows(tables).map((entry) => entry.groupId);
  const matrixKey = [...qualifiedThirdPlaceGroups].sort().join("");
  const matrixRow = thirdPlaceMatrix[matrixKey];
  const assignments = new Map<string, string>();

  if (!matrixRow) {
    return assignments;
  }

  for (const [matchId, groupId] of Object.entries(matrixRow)) {
    assignments.set(matchId, groupId);
  }

  return assignments;
}

function getThirdPlaceSeed(tables: CalculatedTable[], matchId: string, seed: ThirdPlaceSeed, assignments: Map<string, string>): OfficialKnockoutSeed {
  const groupId = assignments.get(matchId);
  const teamId = groupId ? getTableByGroupId(tables, groupId)?.table?.[2]?.teamId ?? "" : "";
  const groupName = groupId ? groupNamesById[groupId] ?? `Group ${groupId.toUpperCase()}` : seed.label;

  return {
    label: groupId ? `Third place ${groupName}` : seed.label,
    teamId,
  };
}

export function getCalculatedTablesFromPayload(payload: Record<string, unknown>): CalculatedTable[] {
  const tables = payload.calculatedTables;

  if (!Array.isArray(tables)) {
    return [];
  }

  return tables.filter((table): table is CalculatedTable => typeof table === "object" && table !== null);
}

export function buildOfficialRoundOf32Matches(tables: CalculatedTable[]): OfficialRoundOf32Match[] {
  const thirdPlaceAssignments = assignThirdPlaceGroups(tables);

  return officialRoundOf32Definitions.map((match) => ({
    id: match.id,
    matchNumber: match.matchNumber,
    home: "rank" in match.home ? getFixedSeed(tables, match.home) : getThirdPlaceSeed(tables, match.id, match.home, thirdPlaceAssignments),
    away: "rank" in match.away ? getFixedSeed(tables, match.away) : getThirdPlaceSeed(tables, match.id, match.away, thirdPlaceAssignments),
  }));
}

export function isOfficialBracketReady(tables: CalculatedTable[]) {
  return buildOfficialRoundOf32Matches(tables).every((match) => match.home.teamId && match.away.teamId);
}

export function buildOfficialKnockoutRounds(tables: CalculatedTable[], picks: Record<string, string>): OfficialKnockoutRound[] {
  const roundOf32Matches = buildOfficialRoundOf32Matches(tables);

  return [
    {
      title: "Round of 32",
      shortTitle: "R32",
      matches: roundOf32Matches.map((match) => ({
        id: match.id,
        matchNumber: match.matchNumber,
        label: `Match ${match.matchNumber}`,
        homeTeamId: match.home.teamId,
        awayTeamId: match.away.teamId,
      })),
    },
    {
      title: "Round of 16",
      shortTitle: "R16",
      matches: [
        { id: "official-r16-89", matchNumber: 89, label: "Match 89", homeTeamId: picks["official-r32-73"], awayTeamId: picks["official-r32-75"] },
        { id: "official-r16-90", matchNumber: 90, label: "Match 90", homeTeamId: picks["official-r32-74"], awayTeamId: picks["official-r32-77"] },
        { id: "official-r16-91", matchNumber: 91, label: "Match 91", homeTeamId: picks["official-r32-76"], awayTeamId: picks["official-r32-78"] },
        { id: "official-r16-92", matchNumber: 92, label: "Match 92", homeTeamId: picks["official-r32-79"], awayTeamId: picks["official-r32-80"] },
        { id: "official-r16-93", matchNumber: 93, label: "Match 93", homeTeamId: picks["official-r32-83"], awayTeamId: picks["official-r32-84"] },
        { id: "official-r16-94", matchNumber: 94, label: "Match 94", homeTeamId: picks["official-r32-81"], awayTeamId: picks["official-r32-82"] },
        { id: "official-r16-95", matchNumber: 95, label: "Match 95", homeTeamId: picks["official-r32-86"], awayTeamId: picks["official-r32-88"] },
        { id: "official-r16-96", matchNumber: 96, label: "Match 96", homeTeamId: picks["official-r32-85"], awayTeamId: picks["official-r32-87"] },
      ],
    },
    {
      title: "Quarterfinals",
      shortTitle: "QF",
      matches: [
        { id: "official-qf-97", matchNumber: 97, label: "Match 97", homeTeamId: picks["official-r16-89"], awayTeamId: picks["official-r16-90"] },
        { id: "official-qf-98", matchNumber: 98, label: "Match 98", homeTeamId: picks["official-r16-93"], awayTeamId: picks["official-r16-94"] },
        { id: "official-qf-99", matchNumber: 99, label: "Match 99", homeTeamId: picks["official-r16-91"], awayTeamId: picks["official-r16-92"] },
        { id: "official-qf-100", matchNumber: 100, label: "Match 100", homeTeamId: picks["official-r16-95"], awayTeamId: picks["official-r16-96"] },
      ],
    },
    {
      title: "Semifinals",
      shortTitle: "SF",
      matches: [
        { id: "official-sf-101", label: "Semifinal 1", homeTeamId: picks["official-qf-97"], awayTeamId: picks["official-qf-98"] },
        { id: "official-sf-102", label: "Semifinal 2", homeTeamId: picks["official-qf-99"], awayTeamId: picks["official-qf-100"] },
      ],
    },
    {
      title: "Champion",
      shortTitle: "Final",
      matches: [{ id: "official-champion", label: "Final winner", homeTeamId: picks["official-sf-101"], awayTeamId: picks["official-sf-102"] }],
    },
  ];
}
