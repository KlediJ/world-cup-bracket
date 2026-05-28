import { notFound } from "next/navigation";
import { SubmissionBracketView } from "@/components/SubmissionBracketView";
import { getSubmissionDetail } from "@/db/queries";

type SubmissionPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const { id } = await params;
  const submission = await getSubmissionDetail(id);

  if (!submission) {
    notFound();
  }

  return <SubmissionBracketView submission={submission} />;
}
