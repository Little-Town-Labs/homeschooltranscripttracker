import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { CoursesPage } from "@/app/_components/courses-page";

export default async function Courses() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <CoursesPage />;
}