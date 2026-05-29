import Link from "next/link";

const parkedNotes = `# Classic Bracket

Status: parked for now.

Reason:
- The swipe predictor is the main public flow.
- Fewer choices means less drop-off.
- Keep this route available in case the classic bracket returns later.

Restore path:
- Re-import BracketBuilder.
- Restore the PageHeader.
- Link this route from navigation/home only when it is actually needed.
`;

export default function BracketPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-black uppercase tracking-wide text-emerald-700">Parked</p>
        <h1 className="mt-2 text-3xl font-black text-zinc-950">Classic bracket is hidden for now</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-zinc-600">
          The main entry flow is the swipe predictor.
        </p>
        <Link href="/predict" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-emerald-700 px-5 py-3 text-sm font-black text-white">
          Start Picks
        </Link>
      </section>

      <pre className="overflow-x-auto rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-xs font-semibold leading-6 text-zinc-100">
        {parkedNotes}
      </pre>
    </div>
  );
}
