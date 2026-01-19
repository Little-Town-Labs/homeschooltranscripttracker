import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentActivities } from "@/app/_components/student-activities";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentActivitiesPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  return <StudentActivities studentId={id} />;
}
