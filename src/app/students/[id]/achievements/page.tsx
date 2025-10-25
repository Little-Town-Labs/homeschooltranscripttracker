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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <StudentExternalAchievements studentId={id} />
      </div>
    </div>
  );
}
