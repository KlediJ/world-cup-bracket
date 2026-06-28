import { notFound } from "next/navigation";
import { OfficialKnockoutPicker } from "@/components/OfficialKnockoutPicker";
import { getSubmissionDetail } from "@/db/queries";

type OfficialKnockoutPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OfficialKnockoutPage({ params }: OfficialKnockoutPageProps) {
  const { id } = await params;
  const submission = await getSubmissionDetail(id);

  if (!submission) {
    notFound();
  }

  return <OfficialKnockoutPicker submission={submission} />;
}
