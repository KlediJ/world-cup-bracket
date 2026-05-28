"use client";

import { useEffect, useState } from "react";
import {
  bracketImpacts,
  didYouKnowFacts,
  hostCitySpotlights,
  teamSpotlights,
  tournamentCountdownTargets,
  tournamentNumbers,
  worldCupHistory,
} from "@/data/tournamentWidget";
import { teamsById } from "@/data/teams";

function getDaysUntil(date: string) {
  const target = new Date(date).getTime();
  const now = Date.now();
  const difference = target - now;

  if (difference <= 0) {
    return 0;
  }

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getTeam(teamId: string) {
  return teamsById.get(teamId);
}

function TeamFlag({ teamId }: { teamId: string }) {
  const team = getTeam(teamId);

  if (team?.flagUrl) {
    return (
      <span
        aria-label={`${team.name} flag`}
        role="img"
        className="block h-9 w-12 rounded bg-cover bg-center shadow-sm"
        style={{ backgroundImage: `url(${team.flagUrl})` }}
      />
    );
  }

  return <span className="text-3xl">{team?.flag}</span>;
}

export function TournamentWidget() {
  const [activeFactIndex, setActiveFactIndex] = useState(0);
  const [activeCityIndex, setActiveCityIndex] = useState(0);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [activeHistoryIndex, setActiveHistoryIndex] = useState(0);
  const [, setCountdownTick] = useState(0);

  useEffect(() => {
    const factTimer = window.setInterval(() => {
      setActiveFactIndex((current) => (current + 1) % didYouKnowFacts.length);
    }, 5500);

    return () => window.clearInterval(factTimer);
  }, []);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setCountdownTick((current) => current + 1);
    }, 60000);

    return () => window.clearInterval(countdownTimer);
  }, []);

  const activeFact = didYouKnowFacts[activeFactIndex];
  const activeCity = hostCitySpotlights[activeCityIndex];
  const activeTeam = teamSpotlights[activeTeamIndex];
  const activeTeamData = getTeam(activeTeam.teamId);
  const activeHistory = worldCupHistory[activeHistoryIndex];
  const countdowns = tournamentCountdownTargets.map((target) => ({
    ...target,
    days: getDaysUntil(target.date),
  }));

  return (
    <section className="overflow-hidden rounded-3xl border border-emerald-900/20 bg-white shadow-sm">
      <div className="relative overflow-hidden bg-emerald-900 px-5 py-6 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:76px_76px]" />
        <div className="pointer-events-none absolute right-10 top-1/2 h-36 w-36 -translate-y-1/2 rounded-full border-2 border-white/35" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Tournament widget</p>
            <h2 className="mt-2 text-4xl font-black tracking-tight">World Cup pulse</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-emerald-50">
              Facts, dates, host cities, team spotlights, and bracket context in one clean matchday panel.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tournamentNumbers.map((item) => (
              <div key={item.label} className="min-w-24 rounded-xl border border-white/10 bg-white/10 p-3">
                <p className="text-3xl font-black">{item.value}</p>
                <p className="mt-1 text-xs font-bold text-emerald-50">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Did you know?</p>
                <h3 className="mt-3 text-2xl font-black text-zinc-950">{activeFact.title}</h3>
              </div>
              <span className="grid size-12 place-items-center rounded-xl bg-amber-300 text-2xl" aria-hidden="true">
                🏆
              </span>
            </div>
            <p className="mt-4 text-base font-semibold leading-7 text-zinc-700">{activeFact.body}</p>
            <div className="mt-5 flex gap-2">
              {didYouKnowFacts.map((fact, index) => (
                <button
                  key={fact.title}
                  type="button"
                  aria-label={`Show fact ${index + 1}`}
                  onClick={() => setActiveFactIndex(index)}
                  className={`h-2.5 rounded-full transition ${index === activeFactIndex ? "w-8 bg-emerald-700" : "w-2.5 bg-zinc-300 hover:bg-zinc-400"}`}
                />
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Countdown</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {countdowns.map((target) => (
                <div key={target.label} className="rounded-xl border border-white/10 bg-white/10 p-4">
                  <p className="text-5xl font-black">{target.days}</p>
                  <p className="mt-2 text-sm font-black text-white">{target.label}</p>
                  <p className="mt-1 text-xs font-semibold text-zinc-300">{target.days === 0 ? "Tournament time" : "days away"}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Today in history</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-950">{activeHistory.year}</h3>
              </div>
              <div className="flex gap-1">
                {worldCupHistory.map((item, index) => (
                  <button
                    key={item.year}
                    type="button"
                    onClick={() => setActiveHistoryIndex(index)}
                    className={`grid size-8 place-items-center rounded-lg text-xs font-black ${
                      index === activeHistoryIndex ? "bg-emerald-700 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
            <h4 className="mt-4 text-xl font-black text-zinc-950">{activeHistory.title}</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{activeHistory.body}</p>
          </article>

          <article className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Team spotlight</p>
                <h3 className="mt-2 text-2xl font-black text-zinc-950">{activeTeamData?.name}</h3>
              </div>
              <TeamFlag teamId={activeTeam.teamId} />
            </div>
            <p className="mt-4 text-sm font-black text-emerald-700">{activeTeam.headline}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-zinc-600">{activeTeam.detail}</p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {teamSpotlights.map((team, index) => (
                <button
                  key={team.teamId}
                  type="button"
                  onClick={() => setActiveTeamIndex(index)}
                  className={`rounded-lg border px-2 py-2 text-xs font-black transition ${
                    index === activeTeamIndex ? "border-emerald-700 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:border-zinc-400"
                  }`}
                >
                  {getTeam(team.teamId)?.code}
                </button>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-4">
          <article className="rounded-2xl border border-zinc-200 bg-[#fbfaf3] p-5">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Host city spotlight</p>
            <h3 className="mt-3 text-2xl font-black text-zinc-950">{activeCity.city}</h3>
            <p className="mt-1 text-sm font-black text-emerald-700">{activeCity.country} · {activeCity.note}</p>
            <p className="mt-4 text-sm font-semibold leading-6 text-zinc-600">{activeCity.detail}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {hostCitySpotlights.map((city, index) => (
                <button
                  key={city.city}
                  type="button"
                  onClick={() => setActiveCityIndex(index)}
                  className={`rounded-lg px-3 py-2 text-left text-xs font-black transition ${
                    index === activeCityIndex ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {city.city}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Bracket impact</p>
            <div className="mt-4 space-y-3">
              {bracketImpacts.map((impact) => (
                <div key={impact.title} className="rounded-xl border border-emerald-200 bg-white p-4">
                  <h3 className="text-base font-black text-emerald-950">{impact.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-emerald-800">{impact.body}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
