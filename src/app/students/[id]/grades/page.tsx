import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentGradesPage } from "@/app/_components/student-grades-page";

interface PageProps {
  params: { id: string };
}

export default async function StudentGrades({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <StudentGradesPage studentId={params.id} />;
}