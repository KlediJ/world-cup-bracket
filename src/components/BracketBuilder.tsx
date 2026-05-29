"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitBracket } from "@/app/bracket/actions";
import { groups } from "@/data/groups";
import { teamsById } from "@/data/teams";
import type { BracketSubmission, GroupPick, ScorePick } from "@/types/bracket";

const emptyGroupPick: GroupPick = {
  winnerId: "",
  runnerUpId: "",
  thirdPlaceId: "",
};

type StepId = "entry" | "groups" | "knockout" | "review";

type Match = {
  id: string;
  label: string;
  teamA?: string;
  teamB?: string;
};

type KnockoutRoundConfig = {
  title: string;
  shortTitle: string;
  matches: Match[];
};

const knockoutPickTargets = {
  "Round of 32": 16,
  "Round of 16": 8,
  Quarterfinals: 4,
  Semifinals: 2,
  Champion: 1,
};

const stepOrder: StepId[] = ["entry", "groups", "knockout", "review"];

function getTeamName(teamId: string | undefined, fallback = "TBD") {
  return teamId ? teamsById.get(teamId)?.name ?? fallback : fallback;
}

function getTeamCode(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.code ?? "--" : "--";
}

function getTeamFlag(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flag ?? "" : "";
}

function getTeamFlagUrl(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flagUrl : undefined;
}

function FlagIcon({ teamId, className = "size-8" }: { teamId: string | undefined; className?: string }) {
  const flagUrl = getTeamFlagUrl(teamId);

  if (flagUrl) {
    return (
      <span
        aria-label={`${getTeamName(teamId)} flag`}
        role="img"
        className={`${className} block rounded bg-cover bg-center shadow-sm`}
        style={{ backgroundImage: `url(${flagUrl})` }}
      />
    );
  }

  return <span className="text-xl">{getTeamFlag(teamId)}</span>;
}

function getGroupPick(groupPicks: Record<string, GroupPick>, groupId: string, slot: keyof GroupPick) {
  return groupPicks[groupId]?.[slot] ?? "";
}

function removeEntries<T>(current: Record<string, T>, matchIds: string[]) {
  const next = { ...current };

  for (const matchId of matchIds) {
    delete next[matchId];
  }

  return next;
}

function getDownstreamMatches(matchId: string) {
  if (matchId.startsWith("r32-")) {
    return [
      ...Array.from({ length: 8 }, (_, index) => `r16-${index + 1}`),
      ...Array.from({ length: 4 }, (_, index) => `qf-${index + 1}`),
      "sf-1",
      "sf-2",
      "champion",
    ];
  }

  if (matchId.startsWith("r16-")) {
    return [...Array.from({ length: 4 }, (_, index) => `qf-${index + 1}`), "sf-1", "sf-2", "champion"];
  }

  if (matchId.startsWith("qf-")) {
    return ["sf-1", "sf-2", "champion"];
  }

  if (matchId.startsWith("sf-")) {
    return ["champion"];
  }

  return [];
}

function countCompletedPicks(picks: Record<string, string>) {
  return Object.values(picks).filter(Boolean).length;
}

function countCompletedScores(scores: Record<string, ScorePick>) {
  return Object.values(scores).filter((score) => score.teamAScore !== null && score.teamBScore !== null).length;
}

export function BracketBuilder() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeStep, setActiveStep] = useState<StepId>("entry");
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupPick>>({});
  const [thirdPlaceAdvancers, setThirdPlaceAdvancers] = useState<string[]>([]);
  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string>>({});
  const [knockoutScores, setKnockoutScores] = useState<Record<string, ScorePick>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const knockoutRounds = useMemo<KnockoutRoundConfig[]>(() => {
    const groupWinners = groups.map((group) => getGroupPick(groupPicks, group.id, "winnerId"));
    const runnersUp = groups.map((group) => getGroupPick(groupPicks, group.id, "runnerUpId"));
    const roundOf32Teams = [...groupWinners, ...runnersUp, ...thirdPlaceAdvancers];

    const roundOf32Matches = Array.from({ length: 16 }, (_, index) => ({
      id: `r32-${index + 1}`,
      label: `Match ${index + 1}`,
      teamA: roundOf32Teams[index],
      teamB: roundOf32Teams[31 - index],
    }));

    const roundOf16Matches = Array.from({ length: 8 }, (_, index) => ({
      id: `r16-${index + 1}`,
      label: `Match ${index + 17}`,
      teamA: knockoutPicks[`r32-${index * 2 + 1}`],
      teamB: knockoutPicks[`r32-${index * 2 + 2}`],
    }));

    const quarterfinalMatches = Array.from({ length: 4 }, (_, index) => ({
      id: `qf-${index + 1}`,
      label: `Quarterfinal ${index + 1}`,
      teamA: knockoutPicks[`r16-${index * 2 + 1}`],
      teamB: knockoutPicks[`r16-${index * 2 + 2}`],
    }));

    const semifinalMatches = Array.from({ length: 2 }, (_, index) => ({
      id: `sf-${index + 1}`,
      label: `Semifinal ${index + 1}`,
      teamA: knockoutPicks[`qf-${index * 2 + 1}`],
      teamB: knockoutPicks[`qf-${index * 2 + 2}`],
    }));

    return [
      { title: "Round of 32", shortTitle: "R32", matches: roundOf32Matches },
      { title: "Round of 16", shortTitle: "R16", matches: roundOf16Matches },
      { title: "Quarterfinals", shortTitle: "QF", matches: quarterfinalMatches },
      { title: "Semifinals", shortTitle: "SF", matches: semifinalMatches },
      { title: "Champion", shortTitle: "Final", matches: [{ id: "champion", label: "Final winner", teamA: knockoutPicks["sf-1"], teamB: knockoutPicks["sf-2"] }] },
    ];
  }, [groupPicks, knockoutPicks, thirdPlaceAdvancers]);

  const completedGroups = groups.filter(
    (group) => groupPicks[group.id]?.winnerId && groupPicks[group.id]?.runnerUpId && groupPicks[group.id]?.thirdPlaceId,
  ).length;
  const completedKnockoutPicks = countCompletedPicks(knockoutPicks);
  const completedScorePicks = countCompletedScores(knockoutScores);
  const completedThirdPlaceAdvancers = thirdPlaceAdvancers.length;
  const championName = getTeamName(knockoutPicks.champion, "No champion picked");
  const hasValidEmail = !playerEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail.trim());
  const canSubmit =
    playerName.trim().length > 0 &&
    hasValidEmail &&
    completedGroups === groups.length &&
    completedThirdPlaceAdvancers === 8 &&
    Boolean(knockoutPicks.champion);

  const stepState = {
    entry: playerName.trim().length > 0,
    groups: completedGroups === groups.length && completedThirdPlaceAdvancers === 8,
    knockout: Boolean(knockoutPicks.champion),
    review: canSubmit,
  };

  function goToNextStep() {
    const currentIndex = stepOrder.indexOf(activeStep);
    setActiveStep(stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)]);
  }

  function goToPreviousStep() {
    const currentIndex = stepOrder.indexOf(activeStep);
    setActiveStep(stepOrder[Math.max(currentIndex - 1, 0)]);
  }

  function updatePlayerName(name: string) {
    setPlayerName(name);
    setStatusMessage("");
  }

  function updatePlayerEmail(email: string) {
    setPlayerEmail(email);
    setStatusMessage("");
  }

  function updateGroupPick(groupId: string, field: keyof GroupPick, teamId: string) {
    const previousThirdPlaceId = groupPicks[groupId]?.thirdPlaceId;

    setGroupPicks((current) => {
      const currentPick = current[groupId] ?? emptyGroupPick;
      const nextPick = { ...currentPick };

      if (nextPick[field] === teamId) {
        nextPick[field] = "";
      } else {
        for (const pickField of Object.keys(nextPick) as Array<keyof GroupPick>) {
          if (nextPick[pickField] === teamId) {
            nextPick[pickField] = "";
          }
        }

        nextPick[field] = teamId;
      }

      return {
        ...current,
        [groupId]: nextPick,
      };
    });
    setThirdPlaceAdvancers((current) =>
      current.filter((selectedTeamId) => {
        if (selectedTeamId === previousThirdPlaceId) {
          return false;
        }

        if (field !== "thirdPlaceId" && selectedTeamId === teamId) {
          return false;
        }

        return true;
      }),
    );
    setKnockoutPicks({});
    setKnockoutScores({});
    setStatusMessage("Knockout picks reset because a group-stage pick changed.");
  }

  function toggleThirdPlaceAdvancer(teamId: string) {
    setThirdPlaceAdvancers((current) => {
      if (current.includes(teamId)) {
        return current.filter((selectedTeamId) => selectedTeamId !== teamId);
      }

      if (current.length >= 8) {
        return current;
      }

      return [...current, teamId];
    });
    setKnockoutPicks({});
    setKnockoutScores({});
    setStatusMessage("Knockout picks reset because the third-place table changed.");
  }

  function updateKnockoutPick(matchId: string, teamId: string) {
    setKnockoutPicks((current) => {
      const next = removeEntries(current, getDownstreamMatches(matchId));

      if (teamId) {
        next[matchId] = teamId;
      } else {
        delete next[matchId];
      }

      return next;
    });
    setKnockoutScores((current) => removeEntries(current, getDownstreamMatches(matchId)));
    setStatusMessage("");
  }

  function updateKnockoutScore(matchId: string, field: keyof ScorePick, value: number | null) {
    setKnockoutScores((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] ?? { teamAScore: null, teamBScore: null }),
        [field]: value,
      },
    }));
  }

  function handleSubmitBracket() {
    const submission: BracketSubmission = {
      playerName: playerName.trim(),
      playerEmail: playerEmail.trim().toLowerCase(),
      groupPicks,
      thirdPlaceAdvancers,
      knockoutPicks,
      knockoutScores,
      submittedAt: new Date().toISOString(),
    };

    startTransition(async () => {
      const result = await submitBracket(submission);
      setStatusMessage(result.message);
      setIsSubmitted(result.ok);

      if (result.ok && result.bracketId) {
        router.push(`/submission/${result.bracketId}`);
      }
    });
  }

  function clearBracket() {
    setPlayerName("");
    setPlayerEmail("");
    setGroupPicks({});
    setThirdPlaceAdvancers([]);
    setKnockoutPicks({});
    setKnockoutScores({});
    setActiveStep("entry");
    setStatusMessage("Bracket cleared.");
    setIsSubmitted(false);
  }

  return (
    <div className="space-y-5">
      <BracketProgress activeStep={activeStep} stepState={stepState} onSelectStep={setActiveStep} />

      {statusMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {statusMessage}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-950 px-5 py-4 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-amber-200">Prediction Sheet</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-2xl font-black">{getStepTitle(activeStep)}</h2>
            <p className="text-sm font-semibold text-zinc-300">{getStepHelp(activeStep)}</p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeStep === "entry" ? (
            <EntryStep
              playerName={playerName}
              playerEmail={playerEmail}
              onPlayerNameChange={updatePlayerName}
              onPlayerEmailChange={updatePlayerEmail}
            />
          ) : null}

          {activeStep === "groups" ? (
            <GroupStageStep
              groupPicks={groupPicks}
              completedGroups={completedGroups}
              thirdPlaceAdvancers={thirdPlaceAdvancers}
              onPick={updateGroupPick}
              onToggleThirdPlaceAdvancer={toggleThirdPlaceAdvancer}
            />
          ) : null}

          {activeStep === "knockout" ? (
            <KnockoutStep
              rounds={knockoutRounds}
              picks={knockoutPicks}
              scores={knockoutScores}
              onPick={updateKnockoutPick}
              onScoreChange={updateKnockoutScore}
            />
          ) : null}

          {activeStep === "review" ? (
            <ReviewStep
              playerName={playerName}
              playerEmail={playerEmail}
              groupPicks={groupPicks}
              completedGroups={completedGroups}
              completedThirdPlaceAdvancers={completedThirdPlaceAdvancers}
              completedKnockoutPicks={completedKnockoutPicks}
              completedScorePicks={completedScorePicks}
              championName={championName}
              canSubmit={canSubmit}
              isSubmitting={isPending}
              isSubmitted={isSubmitted}
              onSubmit={handleSubmitBracket}
              onClear={clearBracket}
            />
          ) : null}
        </div>

        <StepFooter
          activeStep={activeStep}
          canContinue={stepState[activeStep] || activeStep === "review"}
          onBack={goToPreviousStep}
          onNext={goToNextStep}
        />
      </section>
    </div>
  );
}

function getStepTitle(step: StepId) {
  const titles: Record<StepId, string> = {
    entry: "Start the entry",
    groups: "Pick group finishers",
    knockout: "Fill the bracket",
    review: "Review and submit",
  };

  return titles[step];
}

function getStepHelp(step: StepId) {
  const help: Record<StepId, string> = {
    entry: "One person, one bracket.",
    groups: "Pick group finishers and the 8 third-place advancers.",
    knockout: "Advance winners until you choose a champion.",
    review: "Confirm the picks before submission.",
  };

  return help[step];
}

type BracketProgressProps = {
  activeStep: StepId;
  stepState: Record<StepId, boolean>;
  onSelectStep: (step: StepId) => void;
};

function BracketProgress({ activeStep, stepState, onSelectStep }: BracketProgressProps) {
  const labels: Record<StepId, string> = {
    entry: "Entry",
    groups: "Groups",
    knockout: "Bracket",
    review: "Review",
  };

  return (
    <div className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm sm:grid-cols-4">
      {stepOrder.map((step, index) => {
        const isActive = activeStep === step;
        const isComplete = stepState[step];

        return (
          <button
            key={step}
            type="button"
            onClick={() => onSelectStep(step)}
            className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left transition ${
              isActive ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <span
              className={`grid size-8 shrink-0 place-items-center rounded-md text-sm font-black ${
                isActive ? "bg-amber-300 text-zinc-950" : isComplete ? "bg-emerald-100 text-emerald-800" : "bg-white text-zinc-500"
              }`}
            >
              {isComplete ? "✓" : index + 1}
            </span>
            <span>
              <span className="block text-sm font-black">{labels[step]}</span>
              <span className={`block text-xs font-semibold ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                {isComplete ? "Complete" : "Open"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

type EntryStepProps = {
  playerName: string;
  playerEmail: string;
  onPlayerNameChange: (name: string) => void;
  onPlayerEmailChange: (email: string) => void;
};

function EntryStep({ playerName, playerEmail, onPlayerNameChange, onPlayerEmailChange }: EntryStepProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="grid gap-4">
        <div>
          <label htmlFor="playerName" className="text-sm font-black text-zinc-900">
            Player name
          </label>
          <input
            id="playerName"
            value={playerName}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Example: Alex"
            className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label htmlFor="playerEmail" className="text-sm font-black text-zinc-900">
            Email address <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            id="playerEmail"
            type="email"
            value={playerEmail}
            onChange={(event) => onPlayerEmailChange(event.target.value)}
            placeholder="alex@example.com"
            className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-4 text-lg font-bold text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>
      <div className="rounded-lg border border-dashed border-zinc-300 bg-[#fbfaf3] p-4">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Locked after submission</p>
        <p className="mt-2 text-sm leading-6 text-zinc-700">
          The leaderboard shows player names only. Add an email only if you want duplicate-entry protection.
        </p>
      </div>
    </div>
  );
}

type GroupStageStepProps = {
  groupPicks: Record<string, GroupPick>;
  completedGroups: number;
  thirdPlaceAdvancers: string[];
  onPick: (groupId: string, field: keyof GroupPick, teamId: string) => void;
  onToggleThirdPlaceAdvancer: (teamId: string) => void;
};

function GroupStageStep({
  groupPicks,
  completedGroups,
  thirdPlaceAdvancers,
  onPick,
  onToggleThirdPlaceAdvancer,
}: GroupStageStepProps) {
  const thirdPlaceTeams = groups
    .map((group) => ({
      groupName: group.name,
      teamId: groupPicks[group.id]?.thirdPlaceId ?? "",
    }))
    .filter((entry) => entry.teamId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-zinc-600">Pick the top three in every group, then choose the 8 third-place teams that advance.</p>
        <div className="flex flex-wrap gap-2">
          <p className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-800">
            Groups {completedGroups} / {groups.length}
          </p>
          <p className="w-fit rounded-md bg-amber-100 px-3 py-2 text-sm font-black text-zinc-900">
            Third-place {thirdPlaceAdvancers.length} / 8
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {groups.map((group) => {
          const pick = groupPicks[group.id] ?? emptyGroupPick;

          return (
            <div key={group.id} className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-4">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 pb-3">
                <h3 className="text-lg font-black text-zinc-950">{group.name}</h3>
                <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-zinc-500">Group</span>
              </div>
              <div className="mt-3 space-y-2">
                {group.teamIds.map((teamId) => (
                  <TeamPickRow
                    key={teamId}
                    teamId={teamId}
                    pick={pick}
                    onPick={(field) => onPick(group.id, field, teamId)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <ThirdPlaceTable
        thirdPlaceTeams={thirdPlaceTeams}
        selectedTeamIds={thirdPlaceAdvancers}
        onToggle={onToggleThirdPlaceAdvancer}
      />
    </div>
  );
}

type ThirdPlaceTableProps = {
  thirdPlaceTeams: Array<{
    groupName: string;
    teamId: string;
  }>;
  selectedTeamIds: string[];
  onToggle: (teamId: string) => void;
};

function ThirdPlaceTable({ thirdPlaceTeams, selectedTeamIds, onToggle }: ThirdPlaceTableProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-zinc-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Third-place table</p>
          <h3 className="mt-1 text-2xl font-black text-zinc-950">Choose 8 of 12 to advance</h3>
        </div>
        <p className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-black text-white">
          {selectedTeamIds.length} selected
        </p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {thirdPlaceTeams.map((entry) => {
          const isSelected = selectedTeamIds.includes(entry.teamId);
          const isLocked = selectedTeamIds.length >= 8 && !isSelected;

          return (
            <button
              key={`${entry.groupName}-${entry.teamId}`}
              type="button"
              onClick={() => onToggle(entry.teamId)}
              disabled={isLocked}
              className={`grid min-h-16 grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                isSelected
                  ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                  : "border-zinc-200 bg-[#fbfaf3] text-zinc-800 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-45"
              }`}
            >
              <FlagIcon teamId={entry.teamId} className="size-10" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black">{getTeamName(entry.teamId)}</span>
                <span className="block text-xs font-bold text-zinc-500">
                  {entry.groupName} · {getTeamCode(entry.teamId)}
                </span>
              </span>
              <span className={`rounded px-2 py-1 text-xs font-black ${isSelected ? "bg-emerald-600 text-white" : "bg-white text-zinc-500"}`}>
                {isSelected ? "In" : "Out"}
              </span>
            </button>
          );
        })}
      </div>

      {thirdPlaceTeams.length < groups.length ? (
        <p className="mt-3 text-sm font-semibold text-zinc-500">Finish all group third-place picks to complete this table.</p>
      ) : null}
    </section>
  );
}

function TeamPickRow({
  teamId,
  pick,
  onPick,
}: {
  teamId: string;
  pick: GroupPick;
  onPick: (field: keyof GroupPick) => void;
}) {
  const rankOptions: Array<[keyof GroupPick, string]> = [
    ["winnerId", "1"],
    ["runnerUpId", "2"],
    ["thirdPlaceId", "3"],
  ];

  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <FlagIcon teamId={teamId} className="h-6 w-8 shrink-0" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-black text-zinc-900">{getTeamName(teamId)}</span>
          <span className="block text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</span>
        </span>
      </div>
      <div className="flex gap-1">
        {rankOptions.map(([field, label]) => {
          const isSelected = pick[field] === teamId;
          const isFilledByOtherTeam = Boolean(pick[field] && pick[field] !== teamId);

          return (
            <button
              key={field}
              type="button"
              onClick={() => onPick(field)}
              className={`grid size-8 place-items-center rounded-md text-xs font-black transition ${
                isSelected
                  ? "bg-emerald-600 text-white"
                  : isFilledByOtherTeam
                    ? "bg-zinc-200 text-zinc-400 hover:bg-zinc-300"
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

type KnockoutStepProps = {
  rounds: KnockoutRoundConfig[];
  picks: Record<string, string>;
  scores: Record<string, ScorePick>;
  onPick: (matchId: string, teamId: string) => void;
  onScoreChange: (matchId: string, field: keyof ScorePick, value: number | null) => void;
};

function KnockoutStep({ rounds, picks, scores, onPick, onScoreChange }: KnockoutStepProps) {
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const activeRound = rounds[activeRoundIndex];
  const activeRoundPicks = activeRound.matches.filter((match) => picks[match.id]).length;
  const activeRoundTarget = knockoutPickTargets[activeRound.title as keyof typeof knockoutPickTargets];
  const canAdvanceRound = activeRoundPicks === activeRoundTarget;

  function goToNextRound() {
    setActiveRoundIndex((current) => Math.min(current + 1, rounds.length - 1));
  }

  function goToPreviousRound() {
    setActiveRoundIndex((current) => Math.max(current - 1, 0));
  }

  function handlePick(matchId: string, teamId: string) {
    const wasComplete = activeRoundPicks === activeRoundTarget;
    const nextPickCount = picks[matchId] ? activeRoundPicks : activeRoundPicks + 1;

    onPick(matchId, teamId);

    if (!wasComplete && nextPickCount === activeRoundTarget && activeRoundIndex < rounds.length - 1) {
      setActiveRoundIndex((current) => current + 1);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-3">
        <p className="px-2 pb-2 text-xs font-black uppercase tracking-wide text-zinc-500">Rounds</p>
        <div className="space-y-2">
          {rounds.map((round, index) => {
            const roundPicks = round.matches.filter((match) => picks[match.id]).length;
            const roundTarget = knockoutPickTargets[round.title as keyof typeof knockoutPickTargets];
            const isActive = index === activeRoundIndex;
            const isComplete = roundPicks === roundTarget;

            return (
              <button
                key={round.title}
                type="button"
                onClick={() => setActiveRoundIndex(index)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition ${
                  isActive ? "bg-zinc-950 text-white" : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                <span>
                  <span className="block text-sm font-black">{round.shortTitle}</span>
                  <span className={`block text-xs font-semibold ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                    {roundPicks}/{roundTarget}
                  </span>
                </span>
                <span
                  className={`grid size-7 place-items-center rounded text-xs font-black ${
                    isActive ? "bg-amber-300 text-zinc-950" : isComplete ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-400"
                  }`}
                >
                  {isComplete ? "✓" : index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-amber-200">Now Picking</p>
              <h3 className="mt-1 text-3xl font-black">{activeRound.title}</h3>
            </div>
            <p className="rounded-md bg-white/10 px-3 py-2 text-sm font-black">
              {activeRoundPicks} of {activeRoundTarget}
            </p>
          </div>
        </div>

        <div className="grid gap-4 2xl:grid-cols-[180px_minmax(0,1fr)_180px]">
          <div className="hidden 2xl:block">
            {activeRoundIndex > 0 ? (
              <MiniRoundSummary round={rounds[activeRoundIndex - 1]} picks={picks} />
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm font-semibold text-zinc-500">
                Start with the Round of 32.
              </div>
            )}
          </div>

          <div className="min-w-0 rounded-lg border border-zinc-200 bg-[#fbfaf3] p-4 shadow-sm">
            <div className={`grid gap-3 ${activeRound.matches.length > 8 ? "xl:grid-cols-2" : "md:grid-cols-2"}`}>
              {activeRound.matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  selectedTeamId={picks[match.id] ?? ""}
                  score={scores[match.id] ?? { teamAScore: null, teamBScore: null }}
                  onPick={handlePick}
                  onScoreChange={onScoreChange}
                />
              ))}
            </div>
          </div>

          <div className="hidden 2xl:block">
            {activeRoundIndex < rounds.length - 1 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-4 opacity-55">
                <p className="text-xs font-black uppercase tracking-wide text-zinc-400">Next</p>
                <p className="mt-2 text-lg font-black text-zinc-800">{rounds[activeRoundIndex + 1].title}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goToPreviousRound}
            disabled={activeRoundIndex === 0}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous Round
          </button>
          <button
            type="button"
            onClick={goToNextRound}
            disabled={!canAdvanceRound || activeRoundIndex === rounds.length - 1}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Next Round
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniRoundSummary({ round, picks }: { round: KnockoutRoundConfig; picks: Record<string, string> }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 opacity-60">
      <p className="text-xs font-black uppercase tracking-wide text-zinc-400">{round.shortTitle}</p>
      <div className="mt-3 space-y-2">
        {round.matches.slice(0, 6).map((match) => (
          <div key={match.id} className="flex items-center gap-2 rounded bg-zinc-50 px-2 py-1 text-xs font-bold text-zinc-600">
            <FlagIcon teamId={picks[match.id]} className="h-4 w-6 shrink-0" />
            <span className="min-w-0 truncate">{getTeamName(picks[match.id], "Open")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type MatchCardProps = {
  match: Match;
  selectedTeamId: string;
  score: ScorePick;
  onPick: (matchId: string, teamId: string) => void;
  onScoreChange: (matchId: string, field: keyof ScorePick, value: number | null) => void;
};

function MatchCard({ match, selectedTeamId, score, onPick, onScoreChange }: MatchCardProps) {
  const options = [match.teamA, match.teamB].filter(Boolean) as string[];

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-wide text-zinc-500">{match.label}</p>
        {selectedTeamId ? <span className="text-xs font-black text-emerald-700">Picked</span> : null}
      </div>
      <div className="mt-3 space-y-2">
        {options.length ? (
          options.map((teamId) => (
            <button
              key={teamId}
              type="button"
              onClick={() => onPick(match.id, teamId)}
              className={`grid h-[76px] w-full grid-cols-[40px_minmax(0,1fr)_44px] items-center gap-3 rounded-md border px-3 py-2 text-left transition ${
                selectedTeamId === teamId
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:border-zinc-400"
              }`}
            >
              <FlagIcon teamId={teamId} className="size-10" />
              <span className="min-w-0">
                <span className="line-clamp-2 block overflow-hidden text-sm font-black leading-5">{getTeamName(teamId)}</span>
                <span className="mt-0.5 block text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</span>
              </span>
              {selectedTeamId === teamId ? (
                <span className="rounded bg-emerald-600 px-2 py-1 text-center text-xs font-black text-white">Pick</span>
              ) : (
                <span aria-hidden="true" />
              )}
            </button>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 px-3 py-3 text-sm font-semibold text-zinc-500">
            Waiting on earlier picks
          </p>
        )}
      </div>
      {options.length === 2 ? (
        <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Exact score bonus</p>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <ScoreInput
              label={getTeamCode(options[0])}
              value={score.teamAScore}
              onChange={(value) => onScoreChange(match.id, "teamAScore", value)}
            />
            <span className="pb-2 text-sm font-black text-zinc-400">-</span>
            <ScoreInput
              label={getTeamCode(options[1])}
              value={score.teamBScore}
              onChange={(value) => onScoreChange(match.id, "teamBScore", value)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScoreInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="text-xs font-black text-zinc-600">
      {label}
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="20"
        value={value ?? ""}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue === "" ? null : Number(nextValue));
        }}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-center text-sm font-black text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

type ReviewStepProps = {
  playerName: string;
  playerEmail: string;
  groupPicks: Record<string, GroupPick>;
  completedGroups: number;
  completedThirdPlaceAdvancers: number;
  completedKnockoutPicks: number;
  completedScorePicks: number;
  championName: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  onSubmit: () => void;
  onClear: () => void;
};

function ReviewStep({
  playerName,
  playerEmail,
  groupPicks,
  completedGroups,
  completedThirdPlaceAdvancers,
  completedKnockoutPicks,
  completedScorePicks,
  championName,
  canSubmit,
  isSubmitting,
  isSubmitted,
  onSubmit,
  onClear,
}: ReviewStepProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-zinc-200 bg-[#fbfaf3] p-4">
        <h3 className="text-lg font-black text-zinc-950">Group picks</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {groups.map((group) => {
            const pick = groupPicks[group.id] ?? emptyGroupPick;

            return (
              <div key={group.id} className="rounded-md border border-zinc-200 bg-white p-3">
                <p className="font-black text-zinc-950">{group.name}</p>
                <p className="mt-2 text-sm text-zinc-600">1st: <span className="font-bold text-zinc-950">{getTeamName(pick.winnerId, "Missing")}</span></p>
                <p className="text-sm text-zinc-600">2nd: <span className="font-bold text-zinc-950">{getTeamName(pick.runnerUpId, "Missing")}</span></p>
                <p className="text-sm text-zinc-600">3rd: <span className="font-bold text-zinc-950">{getTeamName(pick.thirdPlaceId, "Missing")}</span></p>
              </div>
            );
          })}
        </div>
      </div>

      <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-black text-zinc-950">Entry summary</h3>
        <div className="mt-4 space-y-3 text-sm text-zinc-700">
          <SummaryLine label="Player" value={playerName || "Name needed"} />
          <SummaryLine label="Email" value={playerEmail || "Optional"} />
          <SummaryLine label="Groups" value={`${completedGroups} of ${groups.length}`} />
          <SummaryLine label="Third-place advancers" value={`${completedThirdPlaceAdvancers} of 8`} />
          <SummaryLine label="Knockout picks" value={`${completedKnockoutPicks} of 31`} />
          <SummaryLine label="Exact scores" value={`${completedScorePicks} optional`} />
          <SummaryLine label="Champion" value={championName} />
        </div>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isSubmitted}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            {isSubmitted ? "Submitted" : isSubmitting ? "Submitting..." : "Submit Bracket"}
          </button>
          {!isSubmitted ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-emerald-600 hover:text-emerald-700"
            >
              Start Over
            </button>
          ) : null}
        </div>
        {!canSubmit ? (
          <p className="mt-3 text-sm leading-6 text-zinc-600">Complete your name, all groups, 8 third-place advancers, and champion pick before submitting.</p>
        ) : null}
      </aside>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
      <span className="font-bold text-zinc-500">{label}</span>
      <span className="text-right font-black text-zinc-950">{value}</span>
    </div>
  );
}

type StepFooterProps = {
  activeStep: StepId;
  canContinue: boolean;
  onBack: () => void;
  onNext: () => void;
};

function StepFooter({ activeStep, canContinue, onBack, onNext }: StepFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <button
        type="button"
        onClick={onBack}
        disabled={activeStep === "entry"}
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Back
      </button>
      {activeStep !== "review" ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canContinue}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Continue
        </button>
      ) : null}
    </div>
  );
}
