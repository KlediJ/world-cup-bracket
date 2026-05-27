import { MatchPredictor } from "@/components/MatchPredictor";
import { PageHeader } from "@/components/PageHeader";

export default function PredictPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Match predictor"
        title="Predict every match"
        description="Pick each group-stage result, watch the tables build, then move through the knockout rounds."
      />
      <MatchPredictor />
    </div>
  );
}
