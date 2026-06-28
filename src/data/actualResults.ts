import type { GroupPick } from "@/types/bracket";

export const actualGroupResults: Record<string, GroupPick> = {
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

export const actualThirdPlaceAdvancers = [
  "bosnia-herzegovina",
  "paraguay",
  "ecuador",
  "sweden",
  "senegal",
  "algeria",
  "congo-dr",
  "ghana",
];

export const actualRoundOf32Matches = [
  { id: "official-r32-73", matchNumber: 73, homeTeamId: "south-africa", awayTeamId: "canada" },
  { id: "official-r32-74", matchNumber: 74, homeTeamId: "germany", awayTeamId: "paraguay" },
  { id: "official-r32-75", matchNumber: 75, homeTeamId: "netherlands", awayTeamId: "morocco" },
  { id: "official-r32-76", matchNumber: 76, homeTeamId: "brazil", awayTeamId: "japan" },
  { id: "official-r32-77", matchNumber: 77, homeTeamId: "france", awayTeamId: "sweden" },
  { id: "official-r32-78", matchNumber: 78, homeTeamId: "cote-divoire", awayTeamId: "norway" },
  { id: "official-r32-79", matchNumber: 79, homeTeamId: "mexico", awayTeamId: "ecuador" },
  { id: "official-r32-80", matchNumber: 80, homeTeamId: "england", awayTeamId: "congo-dr" },
  { id: "official-r32-81", matchNumber: 81, homeTeamId: "united-states", awayTeamId: "bosnia-herzegovina" },
  { id: "official-r32-82", matchNumber: 82, homeTeamId: "belgium", awayTeamId: "senegal" },
  { id: "official-r32-83", matchNumber: 83, homeTeamId: "portugal", awayTeamId: "croatia" },
  { id: "official-r32-84", matchNumber: 84, homeTeamId: "spain", awayTeamId: "austria" },
  { id: "official-r32-85", matchNumber: 85, homeTeamId: "switzerland", awayTeamId: "algeria" },
  { id: "official-r32-86", matchNumber: 86, homeTeamId: "argentina", awayTeamId: "cabo-verde" },
  { id: "official-r32-87", matchNumber: 87, homeTeamId: "colombia", awayTeamId: "ghana" },
  { id: "official-r32-88", matchNumber: 88, homeTeamId: "australia", awayTeamId: "egypt" },
];

export type ActualKnockoutMatch = {
  id: string;
  stage: "roundOf32" | "roundOf16" | "quarterfinal" | "semifinal" | "champion";
  matchNumber?: number;
  homeTeamId?: string;
  awayTeamId?: string;
};

export function buildActualKnockoutMatches(winners: Record<string, string> = {}): ActualKnockoutMatch[] {
  return [
    ...actualRoundOf32Matches.map((match) => ({
      ...match,
      stage: "roundOf32" as const,
    })),
    { id: "official-r16-89", stage: "roundOf16", matchNumber: 89, homeTeamId: winners["official-r32-73"], awayTeamId: winners["official-r32-75"] },
    { id: "official-r16-90", stage: "roundOf16", matchNumber: 90, homeTeamId: winners["official-r32-74"], awayTeamId: winners["official-r32-77"] },
    { id: "official-r16-91", stage: "roundOf16", matchNumber: 91, homeTeamId: winners["official-r32-76"], awayTeamId: winners["official-r32-78"] },
    { id: "official-r16-92", stage: "roundOf16", matchNumber: 92, homeTeamId: winners["official-r32-79"], awayTeamId: winners["official-r32-80"] },
    { id: "official-r16-93", stage: "roundOf16", matchNumber: 93, homeTeamId: winners["official-r32-83"], awayTeamId: winners["official-r32-84"] },
    { id: "official-r16-94", stage: "roundOf16", matchNumber: 94, homeTeamId: winners["official-r32-81"], awayTeamId: winners["official-r32-82"] },
    { id: "official-r16-95", stage: "roundOf16", matchNumber: 95, homeTeamId: winners["official-r32-86"], awayTeamId: winners["official-r32-88"] },
    { id: "official-r16-96", stage: "roundOf16", matchNumber: 96, homeTeamId: winners["official-r32-85"], awayTeamId: winners["official-r32-87"] },
    { id: "official-qf-97", stage: "quarterfinal", matchNumber: 97, homeTeamId: winners["official-r16-89"], awayTeamId: winners["official-r16-90"] },
    { id: "official-qf-98", stage: "quarterfinal", matchNumber: 98, homeTeamId: winners["official-r16-93"], awayTeamId: winners["official-r16-94"] },
    { id: "official-qf-99", stage: "quarterfinal", matchNumber: 99, homeTeamId: winners["official-r16-91"], awayTeamId: winners["official-r16-92"] },
    { id: "official-qf-100", stage: "quarterfinal", matchNumber: 100, homeTeamId: winners["official-r16-95"], awayTeamId: winners["official-r16-96"] },
    { id: "official-sf-101", stage: "semifinal", homeTeamId: winners["official-qf-97"], awayTeamId: winners["official-qf-98"] },
    { id: "official-sf-102", stage: "semifinal", homeTeamId: winners["official-qf-99"], awayTeamId: winners["official-qf-100"] },
    { id: "official-champion", stage: "champion", homeTeamId: winners["official-sf-101"], awayTeamId: winners["official-sf-102"] },
  ];
}

export function findActualKnockoutMatch(homeTeamId: string, awayTeamId: string, winners: Record<string, string> = {}) {
  return buildActualKnockoutMatches(winners).find((match) => {
    if (!match.homeTeamId || !match.awayTeamId) {
      return false;
    }

    return (
      (match.homeTeamId === homeTeamId && match.awayTeamId === awayTeamId) ||
      (match.homeTeamId === awayTeamId && match.awayTeamId === homeTeamId)
    );
  });
}
