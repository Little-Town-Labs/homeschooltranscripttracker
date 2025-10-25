import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { SettingsPage } from "@/app/_components/settings-page";

export default async function Settings() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <SettingsPage />;
}
