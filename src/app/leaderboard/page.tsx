import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getLeaderboard } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Leaderboard"
        title="Pool standings"
        description="Submitted brackets appear here as the pool fills in."
      />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Leaderboard</h2>
            <p className="mt-1 text-sm text-zinc-600">Submitted brackets ranked by total points.</p>
          </div>
          <span className="w-fit rounded-md bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
            Live data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Points</th>
                <th className="px-5 py-3">Champion</th>
                <th className="px-5 py-3">Original champ</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Bracket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {leaderboard.map((entry) => (
                <tr key={entry.id} className="text-zinc-700">
                  <td className="px-5 py-4 font-black text-zinc-950">#{entry.rank}</td>
                  <td className="px-5 py-4 font-bold text-zinc-950">{entry.playerName}</td>
                  <td className="px-5 py-4 font-black text-emerald-800">{entry.points}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${entry.officialChampionPick ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>
                      {entry.championPick}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{entry.originalChampionPick}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${entry.officialKnockoutSubmittedAt ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <Link href={`/submission/${entry.id}`} className="font-black text-emerald-700 hover:text-emerald-900">
                        View
                      </Link>
                      <Link href={`/submission/${entry.id}/official-knockout`} className="font-black text-zinc-700 hover:text-zinc-950">
                        Official
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {leaderboard.length === 0 ? (
          <div className="border-t border-zinc-200 px-5 py-10 text-center">
            <p className="text-lg font-black text-zinc-950">No submitted brackets yet.</p>
            <p className="mt-2 text-sm text-zinc-600">Submitted entries will appear here.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
