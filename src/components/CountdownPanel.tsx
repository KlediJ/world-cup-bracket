"use client";

import { useEffect, useMemo, useState } from "react";

const kickoffDate = new Date("2026-06-11T15:00:00-04:00");

function getTimeParts(now: number) {
  const remaining = Math.max(0, kickoffDate.getTime() - now);
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);

  return [
    { label: "Days", value: days },
    { label: "Hours", value: hours },
    { label: "Minutes", value: minutes },
  ];
}

export function CountdownPanel() {
  const [now, setNow] = useState<number | null>(null);
  const parts = useMemo(() => (now === null ? null : getTimeParts(now)), [now]);

  useEffect(() => {
    const firstTick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.clearTimeout(firstTick);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {(parts ?? [
        { label: "Days", value: "--" },
        { label: "Hours", value: "--" },
        { label: "Minutes", value: "--" },
      ]).map((part) => (
        <div key={part.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur sm:p-4">
          <p className="text-3xl font-black text-white sm:text-5xl">{part.value}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-amber-200">{part.label}</p>
        </div>
      ))}
    </div>
  );
}
