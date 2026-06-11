import Link from "next/link";
import { deleteSubmission, isAdminAuthenticated, loginAdmin, logoutAdmin } from "@/app/admin/actions";
import { getAdminSubmissions } from "@/db/queries";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
    error?: string;
  }>;
};

function displayEmail(email: string) {
  return email.endsWith("@local.invalid") ? "Optional" : email;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { q = "", error } = await searchParams;
  const isAuthed = await isAdminAuthenticated();

  if (!isAuthed) {
    return (
      <div className="mx-auto max-w-md">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Admin</p>
          <h1 className="mt-2 text-3xl font-black text-zinc-950">Pool control</h1>
          <form action={loginAdmin} className="mt-6 space-y-4">
            <label className="block text-sm font-black text-zinc-800">
              Password
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded-lg border border-zinc-300 px-4 py-3 text-lg font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            {error === "config" ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-700">Admin password is not configured.</p>
            ) : null}
            {error && error !== "config" ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-black text-red-700">Wrong password.</p> : null}
            <button type="submit" className="min-h-11 w-full rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white">
              Enter Admin
            </button>
          </form>
        </section>
      </div>
    );
  }

  const submissions = await getAdminSubmissions(q);
  const totalEntries = submissions.length;
  const predictorEntries = submissions.filter((entry) => entry.submissionType === "predictor").length;
  const classicEntries = submissions.filter((entry) => entry.submissionType === "classic").length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Admin</p>
            <h1 className="mt-2 text-4xl font-black text-zinc-950">Submission manager</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-zinc-600">
              Review entries, open locked brackets, and remove test submissions.
            </p>
          </div>
          <form action={logoutAdmin}>
            <button type="submit" className="min-h-11 rounded-md border border-zinc-300 bg-white px-5 py-3 text-sm font-black text-zinc-800 hover:border-zinc-500">
              Log Out
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Total</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{totalEntries}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Predictor</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{predictorEntries}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-zinc-500">Classic</p>
          <p className="mt-2 text-3xl font-black text-zinc-950">{classicEntries}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-zinc-950">Entries</h2>
            <p className="mt-1 text-sm font-semibold text-zinc-600">Search by name, email, type, or champion pick.</p>
          </div>
          <form className="flex flex-col gap-2 sm:flex-row" action="/admin">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search submissions"
              className="min-h-11 rounded-md border border-zinc-300 px-3 text-sm font-bold text-zinc-950 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />
            <button type="submit" className="min-h-11 rounded-md bg-zinc-950 px-5 py-3 text-sm font-black text-white">
              Search
            </button>
            {q ? (
              <Link href="/admin" className="inline-flex min-h-11 items-center justify-center rounded-md border border-zinc-300 px-5 py-3 text-sm font-black text-zinc-800">
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs font-black uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-5 py-3">Player</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Champion</th>
                <th className="px-5 py-3">Points</th>
                <th className="px-5 py-3">Submitted</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {submissions.map((entry) => (
                <tr key={entry.id} className="text-zinc-700">
                  <td className="px-5 py-4 font-black text-zinc-950">{entry.playerName}</td>
                  <td className="px-5 py-4 font-bold text-zinc-600">{displayEmail(entry.playerEmail)}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-bold capitalize text-zinc-700">
                      {entry.submissionType}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-zinc-950">{entry.championPick}</td>
                  <td className="px-5 py-4 font-black text-emerald-800">{entry.points}</td>
                  <td className="px-5 py-4 font-semibold text-zinc-600">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(entry.submittedAt)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/submission/${entry.id}`} className="font-black text-emerald-700 hover:text-emerald-900">
                        View
                      </Link>
                      <form action={deleteSubmission}>
                        <input type="hidden" name="playerId" value={entry.playerId} />
                        <button type="submit" className="font-black text-red-700 hover:text-red-900">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {submissions.length === 0 ? (
          <div className="border-t border-zinc-200 px-5 py-10 text-center">
            <p className="text-lg font-black text-zinc-950">No submissions found.</p>
            <p className="mt-2 text-sm text-zinc-600">Try clearing the search field.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
