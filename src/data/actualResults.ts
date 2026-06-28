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

