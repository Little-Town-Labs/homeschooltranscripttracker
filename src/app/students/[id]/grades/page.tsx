import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentGradesPage } from "@/app/_components/student-grades-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentGrades({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  return <StudentGradesPage studentId={id} />;
}