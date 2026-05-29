import { ButtonLink } from "@/components/ButtonLink";
import { CountdownPanel } from "@/components/CountdownPanel";
import { homeAssets } from "@/data/homeAssets";

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="home-hero relative min-h-[calc(100vh-150px)] overflow-hidden rounded-3xl border border-emerald-900/20 bg-emerald-950 text-white shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35 mix-blend-screen"
          style={{ backgroundImage: `url(${homeAssets.heroGraphic})` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-emerald-950/45" />

        <div className="relative flex min-h-[calc(100vh-150px)] flex-col justify-between gap-8 p-5 sm:p-8 lg:p-10">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-wide text-amber-200">World Cup pool</p>
            <h1 className="mt-4 text-5xl font-black leading-none tracking-tight sm:text-7xl">
              Pick the road to the trophy.
            </h1>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div className="max-w-2xl">
              <CountdownPanel />
              <p className="mt-4 text-sm font-black uppercase tracking-wide text-emerald-50">
                Opening match countdown
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
              <ButtonLink href="/predict/play">Start Your Picks</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
