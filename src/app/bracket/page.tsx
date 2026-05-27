import { BracketBuilder } from "@/components/BracketBuilder";
import { PageHeader } from "@/components/PageHeader";

export default function BracketPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Create bracket"
        title="Build your tournament picks"
        description="Pick the groups, move through the bracket, and submit one clean entry."
      />
      <BracketBuilder />
    </div>
  );
}
