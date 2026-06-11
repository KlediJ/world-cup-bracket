"use client";

import { useState } from "react";

export type SubmissionViewMode = "groups" | "third-place" | "list" | "bracket";

type SubmissionViewSwitcherProps = {
  groupsView: React.ReactNode;
  thirdPlaceView: React.ReactNode;
  listView: React.ReactNode;
  bracketView: React.ReactNode;
};

const viewOptions: Array<{ id: SubmissionViewMode; label: string }> = [
  { id: "groups", label: "Groups" },
  { id: "third-place", label: "8 of 12" },
  { id: "list", label: "Round List" },
  { id: "bracket", label: "Road" },
];

export function SubmissionViewSwitcher({ groupsView, thirdPlaceView, listView, bracketView }: SubmissionViewSwitcherProps) {
  const [activeView, setActiveView] = useState<SubmissionViewMode>("groups");

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Submission view</p>
          <h2 className="mt-2 text-2xl font-black text-zinc-950">Full locked picks</h2>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-zinc-100 p-1 sm:flex">
          {viewOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveView(option.id)}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-black transition ${
                activeView === option.id ? "bg-zinc-950 text-white shadow-sm" : "text-zinc-600 hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {activeView === "groups" ? groupsView : null}
        {activeView === "third-place" ? thirdPlaceView : null}
        {activeView === "list" ? listView : null}
        {activeView === "bracket" ? bracketView : null}
      </div>
    </section>
  );
}
