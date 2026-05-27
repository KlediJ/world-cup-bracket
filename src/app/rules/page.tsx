import { PageHeader } from "@/components/PageHeader";
import { scoringRules } from "@/lib/scoring";

export default function RulesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Scoring rules"
        title="Simple points, clear winner"
        description="Players earn points for correct predictions. Highest total score wins the pool."
      />

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-zinc-950">How it works</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Make every pick before the tournament starts. As real results come in, correct picks earn points based on
            the round. Later rounds are worth more.
          </p>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            The app is for a casual private pool. It does not process payments or manage any offline pool.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-xl font-black text-zinc-950">Point values</h2>
          </div>
          <div className="divide-y divide-zinc-100">
            {scoringRules.map((rule) => (
              <div key={rule.label} className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="font-bold text-zinc-800">{rule.label}</span>
                <span className="rounded-md bg-amber-300 px-3 py-1 text-sm font-black text-zinc-950">
                  {rule.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
