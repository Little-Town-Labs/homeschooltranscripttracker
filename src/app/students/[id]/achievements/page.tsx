import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentExternalAchievements } from "@/app/_components/student-external-achievements";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentAchievements({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  return <StudentExternalAchievements studentId={id} />;
}
