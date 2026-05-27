import { BracketBuilder } from "@/components/BracketBuilder";
import { PageHeader } from "@/components/PageHeader";

export default function BracketPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Create bracket"
        title="Build your tournament picks"
        description="Enter your name, choose group finishers, advance teams through the knockout rounds, and save your picks in this browser."
      />
      <BracketBuilder />
    </div>
  );
}
