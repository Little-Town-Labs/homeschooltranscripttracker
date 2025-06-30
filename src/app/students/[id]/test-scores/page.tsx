import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentTestScoresPage } from "@/app/_components/student-test-scores-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentTestScores({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  return <StudentTestScoresPage studentId={id} />;
}