import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { OnboardingFlow } from "@/app/_components/onboarding-flow";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  // If user already has tenant setup, redirect to dashboard
  if (session.user.tenantId) {
    redirect("/");
  }

  return <OnboardingFlow />;
}