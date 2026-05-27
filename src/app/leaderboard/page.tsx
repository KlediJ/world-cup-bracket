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

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-xl font-black text-slate-950">Mock leaderboard</h2>
          <p className="mt-1 text-sm text-slate-600">Ranked by total points.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-500">
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
                <tr key={entry.playerName} className="text-slate-700">
                  <td className="px-5 py-4 font-black text-slate-950">#{entry.rank}</td>
                  <td className="px-5 py-4 font-bold text-slate-950">{entry.playerName}</td>
                  <td className="px-5 py-4 font-black text-emerald-800">{entry.points}</td>
                  <td className="px-5 py-4">{entry.championPick}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
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
