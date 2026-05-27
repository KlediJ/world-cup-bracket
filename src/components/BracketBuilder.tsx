"use client";

import { useEffect, useMemo, useState } from "react";
import { groups } from "@/data/groups";
import { teamsById } from "@/data/teams";
import type { BracketSubmission, GroupPick } from "@/types/bracket";

const STORAGE_KEY = "world-cup-bracket-submission";

const emptyGroupPick: GroupPick = {
  winnerId: "",
  runnerUpId: "",
};

type Match = {
  id: string;
  label: string;
  teamA?: string;
  teamB?: string;
};

type KnockoutRoundConfig = {
  title: string;
  matches: Match[];
};

const downstreamMatches: Record<string, string[]> = {
  "r16-1": ["qf-1", "sf-1", "champion"],
  "r16-2": ["qf-1", "sf-1", "champion"],
  "r16-3": ["qf-2", "sf-1", "champion"],
  "r16-4": ["qf-2", "sf-1", "champion"],
  "r16-5": ["qf-3", "sf-2", "champion"],
  "r16-6": ["qf-3", "sf-2", "champion"],
  "r16-7": ["qf-4", "sf-2", "champion"],
  "r16-8": ["qf-4", "sf-2", "champion"],
  "qf-1": ["sf-1", "champion"],
  "qf-2": ["sf-1", "champion"],
  "qf-3": ["sf-2", "champion"],
  "qf-4": ["sf-2", "champion"],
  "sf-1": ["champion"],
  "sf-2": ["champion"],
};

function getTeamName(teamId: string | undefined, fallback = "TBD") {
  return teamId ? teamsById.get(teamId)?.name ?? fallback : fallback;
}

function getGroupPick(groupPicks: Record<string, GroupPick>, groupId: string, slot: keyof GroupPick) {
  return groupPicks[groupId]?.[slot] ?? "";
}

function removePicks(current: Record<string, string>, matchIds: string[]) {
  const next = { ...current };

  for (const matchId of matchIds) {
    delete next[matchId];
  }

  return next;
}

function countCompletedPicks(picks: Record<string, string>) {
  return Object.values(picks).filter(Boolean).length;
}

function readSavedBracket() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as BracketSubmission) : null;
  } catch {
    return null;
  }
}

export function BracketBuilder() {
  const [playerName, setPlayerName] = useState("");
  const [groupPicks, setGroupPicks] = useState<Record<string, GroupPick>>({});
  const [knockoutPicks, setKnockoutPicks] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const saved = readSavedBracket();

    if (!saved) {
      return;
    }

    setPlayerName(saved.playerName);
    setGroupPicks(saved.groupPicks);
    setKnockoutPicks(saved.knockoutPicks);
    setStatusMessage("Loaded saved picks from this browser.");
  }, []);

  const knockoutRounds = useMemo<KnockoutRoundConfig[]>(() => {
    const roundOf16Matches = [
      { id: "r16-1", label: "A1 vs B2", teamA: getGroupPick(groupPicks, "a", "winnerId"), teamB: getGroupPick(groupPicks, "b", "runnerUpId") },
      { id: "r16-2", label: "C1 vs D2", teamA: getGroupPick(groupPicks, "c", "winnerId"), teamB: getGroupPick(groupPicks, "d", "runnerUpId") },
      { id: "r16-3", label: "E1 vs F2", teamA: getGroupPick(groupPicks, "e", "winnerId"), teamB: getGroupPick(groupPicks, "f", "runnerUpId") },
      { id: "r16-4", label: "G1 vs H2", teamA: getGroupPick(groupPicks, "g", "winnerId"), teamB: getGroupPick(groupPicks, "h", "runnerUpId") },
      { id: "r16-5", label: "B1 vs A2", teamA: getGroupPick(groupPicks, "b", "winnerId"), teamB: getGroupPick(groupPicks, "a", "runnerUpId") },
      { id: "r16-6", label: "D1 vs C2", teamA: getGroupPick(groupPicks, "d", "winnerId"), teamB: getGroupPick(groupPicks, "c", "runnerUpId") },
      { id: "r16-7", label: "F1 vs E2", teamA: getGroupPick(groupPicks, "f", "winnerId"), teamB: getGroupPick(groupPicks, "e", "runnerUpId") },
      { id: "r16-8", label: "H1 vs G2", teamA: getGroupPick(groupPicks, "h", "winnerId"), teamB: getGroupPick(groupPicks, "g", "runnerUpId") },
    ];

    const quarterfinalMatches = [
      { id: "qf-1", label: "Quarterfinal 1", teamA: knockoutPicks["r16-1"], teamB: knockoutPicks["r16-2"] },
      { id: "qf-2", label: "Quarterfinal 2", teamA: knockoutPicks["r16-3"], teamB: knockoutPicks["r16-4"] },
      { id: "qf-3", label: "Quarterfinal 3", teamA: knockoutPicks["r16-5"], teamB: knockoutPicks["r16-6"] },
      { id: "qf-4", label: "Quarterfinal 4", teamA: knockoutPicks["r16-7"], teamB: knockoutPicks["r16-8"] },
    ];

    const semifinalMatches = [
      { id: "sf-1", label: "Semifinal 1", teamA: knockoutPicks["qf-1"], teamB: knockoutPicks["qf-2"] },
      { id: "sf-2", label: "Semifinal 2", teamA: knockoutPicks["qf-3"], teamB: knockoutPicks["qf-4"] },
    ];

    return [
      { title: "Round of 16", matches: roundOf16Matches },
      { title: "Quarterfinals", matches: quarterfinalMatches },
      { title: "Semifinals", matches: semifinalMatches },
      { title: "Champion", matches: [{ id: "champion", label: "Final winner", teamA: knockoutPicks["sf-1"], teamB: knockoutPicks["sf-2"] }] },
    ];
  }, [groupPicks, knockoutPicks]);

  const completedGroups = groups.filter((group) => groupPicks[group.id]?.winnerId && groupPicks[group.id]?.runnerUpId).length;
  const completedKnockoutPicks = countCompletedPicks(knockoutPicks);
  const championName = getTeamName(knockoutPicks.champion, "No champion picked yet");
  const canSave = playerName.trim().length > 0 && completedGroups === groups.length && Boolean(knockoutPicks.champion);

  function updatePlayerName(name: string) {
    setPlayerName(name);
    setStatusMessage("");
  }

  function updateGroupPick(groupId: string, field: keyof GroupPick, teamId: string) {
    setGroupPicks((current) => ({
      ...current,
      [groupId]: {
        ...(current[groupId] ?? emptyGroupPick),
        [field]: teamId,
      },
    }));
    setKnockoutPicks({});
    setStatusMessage("Knockout picks were cleared because a group-stage pick changed.");
  }

  function updateKnockoutPick(matchId: string, teamId: string) {
    setKnockoutPicks((current) => {
      const next = removePicks(current, downstreamMatches[matchId] ?? []);

      if (teamId) {
        next[matchId] = teamId;
      } else {
        delete next[matchId];
      }

      return next;
    });
    setStatusMessage("");
  }

  function saveBracket() {
    const submission: BracketSubmission = {
      playerName: playerName.trim(),
      groupPicks,
      knockoutPicks,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(submission));
    setStatusMessage("Bracket saved in this browser.");
  }

  function clearBracket() {
    localStorage.removeItem(STORAGE_KEY);
    setPlayerName("");
    setGroupPicks({});
    setKnockoutPicks({});
    setStatusMessage("Bracket cleared.");
  }

  return (
    <div className="space-y-8">
      {statusMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
          {statusMessage}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="playerName" className="text-sm font-bold text-slate-900">
          Your name
        </label>
        <input
          id="playerName"
          value={playerName}
          onChange={(event) => updatePlayerName(event.target.value)}
          placeholder="Enter your name"
          className="mt-2 w-full rounded-md border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
        />
      </section>

      <GroupStageSection groupPicks={groupPicks} completedGroups={completedGroups} onPick={updateGroupPick} />

      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Knockout Stage</h2>
          <p className="text-sm text-slate-600">Winners flow into the next round as you make picks.</p>
        </div>
        {knockoutRounds.map((round) => (
          <KnockoutRound key={round.title} round={round} picks={knockoutPicks} onPick={updateKnockoutPick} />
        ))}
      </section>

      <ReviewPanel
        playerName={playerName}
        completedGroups={completedGroups}
        completedKnockoutPicks={completedKnockoutPicks}
        championName={championName}
        canSave={canSave}
        onSave={saveBracket}
        onClear={clearBracket}
      />
    </div>
  );
}

type GroupStageSectionProps = {
  groupPicks: Record<string, GroupPick>;
  completedGroups: number;
  onPick: (groupId: string, field: keyof GroupPick, teamId: string) => void;
};

function GroupStageSection({ groupPicks, completedGroups, onPick }: GroupStageSectionProps) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Group Stage</h2>
          <p className="text-sm text-slate-600">Pick a winner and runner-up from each group.</p>
        </div>
        <p className="text-sm font-bold text-emerald-800">
          {completedGroups} of {groups.length} groups complete
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => {
          const pick = groupPicks[group.id] ?? emptyGroupPick;

          return (
            <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black text-slate-950">{group.name}</h3>
              <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-600">
                {group.teamIds.map((teamId) => (
                  <li key={teamId} className="rounded-md bg-slate-50 px-3 py-2 font-semibold">
                    {getTeamName(teamId)}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TeamSelect
                  label="Winner"
                  value={pick.winnerId}
                  disabledTeamId={pick.runnerUpId}
                  teamIds={group.teamIds}
                  onChange={(teamId) => onPick(group.id, "winnerId", teamId)}
                />
                <TeamSelect
                  label="Runner-up"
                  value={pick.runnerUpId}
                  disabledTeamId={pick.winnerId}
                  teamIds={group.teamIds}
                  onChange={(teamId) => onPick(group.id, "runnerUpId", teamId)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type TeamSelectProps = {
  label: string;
  value: string;
  disabledTeamId?: string;
  teamIds: string[];
  onChange: (teamId: string) => void;
};

function TeamSelect({ label, value, disabledTeamId, teamIds, onChange }: TeamSelectProps) {
  return (
    <label className="text-sm font-bold text-slate-800">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950"
      >
        <option value="">Select team</option>
        {teamIds.map((teamId) => (
          <option key={teamId} value={teamId} disabled={teamId === disabledTeamId}>
            {getTeamName(teamId)}
          </option>
        ))}
      </select>
    </label>
  );
}

type KnockoutRoundProps = {
  round: KnockoutRoundConfig;
  picks: Record<string, string>;
  onPick: (matchId: string, teamId: string) => void;
};

function KnockoutRound({ round, picks, onPick }: KnockoutRoundProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-950">{round.title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {round.matches.map((match) => {
          const options = [match.teamA, match.teamB].filter(Boolean) as string[];

          return (
            <label key={match.id} className="text-sm font-bold text-slate-800">
              {match.label}
              <select
                value={picks[match.id] ?? ""}
                onChange={(event) => onPick(match.id, event.target.value)}
                disabled={options.length < 2}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">{options.length < 2 ? "Waiting on earlier picks" : "Select winner"}</option>
                {options.map((teamId) => (
                  <option key={teamId} value={teamId}>
                    {getTeamName(teamId)}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}

type ReviewPanelProps = {
  playerName: string;
  completedGroups: number;
  completedKnockoutPicks: number;
  championName: string;
  canSave: boolean;
  onSave: () => void;
  onClear: () => void;
};

function ReviewPanel({
  playerName,
  completedGroups,
  completedKnockoutPicks,
  championName,
  canSave,
  onSave,
  onClear,
}: ReviewPanelProps) {
  return (
    <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="text-2xl font-black text-slate-950">Review</h2>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-4">
        <p>
          <span className="block font-bold text-slate-950">Player</span>
          {playerName || "Name needed"}
        </p>
        <p>
          <span className="block font-bold text-slate-950">Groups complete</span>
          {completedGroups} of {groups.length}
        </p>
        <p>
          <span className="block font-bold text-slate-950">Knockout picks</span>
          {completedKnockoutPicks} of 15
        </p>
        <p>
          <span className="block font-bold text-slate-950">Champion pick</span>
          {championName}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Save Picks Locally
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-800"
        >
          Clear Bracket
        </button>
      </div>
      {!canSave ? (
        <p className="mt-3 text-sm text-slate-600">Complete your name, all groups, and champion pick before saving.</p>
      ) : null}
    </section>
  );
}
