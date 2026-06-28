"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { buildOfficialKnockoutRounds, getCalculatedTablesFromPayload, isOfficialBracketReady } from "@/data/officialKnockout";
import { teamsById } from "@/data/teams";
import type { OfficialKnockoutMatch, OfficialKnockoutRound } from "@/data/officialKnockout";
import type { SubmissionDetail } from "@/db/queries";
import { submitOfficialKnockoutPicks } from "@/app/submission/[id]/official-knockout/actions";

function getTeamName(teamId: string | undefined, fallback = "TBD") {
  return teamId ? teamsById.get(teamId)?.name ?? fallback : fallback;
}

function getTeamCode(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.code ?? "TBD" : "TBD";
}

function getTeamFlag(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flag ?? "🏳️" : "🏳️";
}

function getTeamFlagUrl(teamId: string | undefined) {
  return teamId ? teamsById.get(teamId)?.flagUrl : undefined;
}

function TeamFlag({ teamId }: { teamId?: string }) {
  const flagUrl = getTeamFlagUrl(teamId);

  if (flagUrl) {
    return <span className="block h-7 w-10 rounded-sm bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${flagUrl})` }} />;
  }

  return <span className="text-2xl leading-none">{getTeamFlag(teamId)}</span>;
}

function MatchPickCard({ match, selectedTeamId, locked, onPick }: { match: OfficialKnockoutMatch; selectedTeamId?: string; locked: boolean; onPick: (matchId: string, teamId: string) => void }) {
  const teams = [match.homeTeamId, match.awayTeamId].filter(Boolean) as string[];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-zinc-950">{match.label}</p>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-black text-zinc-500">{match.matchNumber ? `#${match.matchNumber}` : "Pick"}</span>
      </div>
      <div className="space-y-2">
        {teams.length === 2 ? (
          teams.map((teamId) => (
            <button
              key={`${match.id}-${teamId}`}
              type="button"
              disabled={locked}
              onClick={() => onPick(match.id, teamId)}
              className={`grid min-h-14 w-full grid-cols-[40px_1fr_auto] items-center gap-3 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed ${
                selectedTeamId === teamId ? "border-emerald-600 bg-emerald-50" : "border-zinc-200 bg-zinc-50 hover:border-zinc-400"
              }`}
            >
              <TeamFlag teamId={teamId} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-black text-zinc-950">{getTeamName(teamId)}</span>
                <span className="text-xs font-bold text-zinc-500">{getTeamCode(teamId)}</span>
              </span>
              {selectedTeamId === teamId ? <span className="rounded bg-emerald-700 px-2 py-1 text-xs font-black text-white">Pick</span> : null}
            </button>
          ))
        ) : (
          <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm font-black text-amber-800">Waiting for official teams.</p>
        )}
      </div>
    </div>
  );
}

function countCompletePicks(rounds: OfficialKnockoutRound[], picks: Record<string, string>) {
  return rounds.reduce((total, round) => total + round.matches.filter((match) => Boolean(picks[match.id])).length, 0);
}

export function OfficialKnockoutPicker({ submission }: { submission: SubmissionDetail }) {
  const [picks, setPicks] = useState<Record<string, string>>(submission.officialKnockoutPicks ?? {});
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const locked = Boolean(submission.officialKnockoutSubmittedAt);
  const calculatedTables = useMemo(() => getCalculatedTablesFromPayload(submission.predictionPayload), [submission.predictionPayload]);
  const bracketReady = isOfficialBracketReady(calculatedTables);
  const rounds = useMemo(() => buildOfficialKnockoutRounds(calculatedTables, picks), [calculatedTables, picks]);
  const completed = countCompletePicks(rounds, picks);
  const total = rounds.reduce((sum, round) => sum + round.matches.length, 0);
  const champion = picks["official-champion"];

  function pickWinner(matchId: string, teamId: string) {
    if (locked) {
      return;
    }

    const roundIndex = rounds.findIndex((round) => round.matches.some((match) => match.id === matchId));
    const downstreamIds = rounds.slice(roundIndex + 1).flatMap((round) => round.matches.map((match) => match.id));

    setPicks((current) => {
      const next = { ...current, [matchId]: teamId };

      for (const downstreamId of downstreamIds) {
        delete next[downstreamId];
      }

      return next;
    });
    setMessage("");
  }

  function submitPicks() {
    startTransition(async () => {
      const result = await submitOfficialKnockoutPicks(submission.id, picks);
      setMessage(result.message);

      if (result.ok) {
        window.location.href = `/submission/${submission.id}`;
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Official knockout picks</p>
        <h1 className="mt-2 text-4xl font-black text-zinc-950">{submission.playerName}</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">
          This corrected path uses this player&apos;s original predicted group rankings.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-md bg-zinc-100 px-3 py-2 text-xs font-black uppercase tracking-wide text-zinc-700">{completed}/{total} picks</span>
          <span className={`rounded-md px-3 py-2 text-xs font-black uppercase tracking-wide ${locked ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
            {locked ? "Locked" : "Open"}
          </span>
          {champion ? <span className="rounded-md bg-emerald-950 px-3 py-2 text-xs font-black uppercase tracking-wide text-white">Champion: {getTeamName(champion)}</span> : null}
        </div>
      </section>

      {!bracketReady ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-lg font-black text-amber-950">This bracket could not be built.</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-900">The original submission is missing enough group-table data to populate the official path.</p>
        </section>
      ) : null}

      {rounds.map((round) => (
        <section key={round.shortTitle} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-emerald-700">{round.shortTitle}</p>
              <h2 className="text-2xl font-black text-zinc-950">{round.title}</h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {round.matches.map((match) => (
              <MatchPickCard key={match.id} match={match} selectedTeamId={picks[match.id]} locked={locked || !bracketReady || isPending} onPick={pickWinner} />
            ))}
          </div>
        </section>
      ))}

      {message ? <p className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-800">{message}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {!locked ? (
          <button
            type="button"
            disabled={!bracketReady || completed !== total || isPending}
            onClick={submitPicks}
            className="min-h-11 rounded-md bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Lock Official Picks
          </button>
        ) : null}
        <Link href={`/submission/${submission.id}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 transition hover:border-emerald-600 hover:text-emerald-700">
          Back to Submission
        </Link>
      </div>
    </div>
  );
}
