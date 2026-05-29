import { GamePredictor } from "@/components/GamePredictor";

export default function PlayPredictorPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-emerald-900/20 bg-zinc-950 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <p className="text-xs font-black uppercase tracking-wide text-amber-200">Quick game mode</p>
        <h1 className="mt-3 text-4xl font-black leading-none tracking-tight sm:text-5xl">Swipe your way to a champion</h1>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-zinc-200">
          Pick each group match as a fast card. Swipe right for the left team, left for the right team, and down for a draw.
        </p>
      </section>
      <GamePredictor />
    </div>
  );
}
