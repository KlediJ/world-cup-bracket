import { PageHeader } from "@/components/PageHeader";
import { mockLeaderboard } from "@/data/mockLeaderboard";

export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Leaderboard"
        title="Pool standings"
        description="Sample standings show how the friend pool will feel once real picks and scores are added."
      />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Mock leaderboard</h2>
            <p className="mt-1 text-sm text-zinc-600">Ranked by total points.</p>
          </div>
          <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
            Sample data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Points</th>
                <th className="px-5 py-3">Champion pick</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockLeaderboard.map((entry) => (
                <tr key={entry.playerName} className="text-zinc-700">
                  <td className="px-5 py-4 font-black text-zinc-950">#{entry.rank}</td>
                  <td className="px-5 py-4 font-bold text-zinc-950">{entry.playerName}</td>
                  <td className="px-5 py-4 font-black text-emerald-800">{entry.points}</td>
                  <td className="px-5 py-4">{entry.championPick}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
