export const scoringRules = [
  { label: "Correct group winner", points: 3 },
  { label: "Correct group runner-up", points: 2 },
  { label: "Correct Round of 16 winner", points: 4 },
  { label: "Correct quarterfinal winner", points: 6 },
  { label: "Correct semifinal winner", points: 8 },
  { label: "Correct champion", points: 12 },
];

export const maxSampleScore = scoringRules.reduce((total, rule) => total + rule.points, 0);
