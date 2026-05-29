import { GamePredictor } from "@/components/GamePredictor";
import { getChampionPickCounts } from "@/db/queries";

export const dynamic = "force-dynamic";

export default async function PredictPage() {
  const championPickCounts = await getChampionPickCounts();

  return (
    <div className="-mt-4 sm:mt-0">
      <GamePredictor championPickCounts={championPickCounts} />
    </div>
  );
}
