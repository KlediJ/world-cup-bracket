import { MatchPredictor } from "@/components/MatchPredictor";
import { homeAssets } from "@/data/homeAssets";

export default function PredictPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/20 bg-emerald-900 px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(90deg,rgba(255,255,255,.65)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:88px_88px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/45" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">Match predictor</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Build the path to the trophy</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-emerald-50">
              Pick every group match, let the tables decide the Round of 32, then push your winners through to the final.
            </p>
          </div>
          <div
            className="relative mx-auto size-36 rounded-[2rem] border border-amber-200/70 bg-amber-300 bg-contain bg-center bg-no-repeat shadow-xl shadow-emerald-950/30 lg:mx-0 lg:justify-self-end"
            style={{ backgroundImage: `url(${homeAssets.trophyGraphic})` }}
            aria-label="Generic trophy graphic"
            role="img"
          >
            <div className="absolute inset-3 rounded-[1.5rem] border border-white/45" />
            <span className="sr-only">Trophy</span>
          </div>
        </div>
      </section>
      <MatchPredictor />
    </div>
  );
}
