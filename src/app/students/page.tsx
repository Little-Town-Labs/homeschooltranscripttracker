import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { StudentsPage } from "@/app/_components/students-page";

export default async function Students() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <StudentsPage />;
}