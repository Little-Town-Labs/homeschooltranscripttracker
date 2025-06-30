import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { LandingPage } from "@/app/_components/landing-page";
import { EnhancedDashboard } from "@/app/_components/enhanced-dashboard";

export default async function Home() {
  const session = await auth();

  // If user is authenticated, show dashboard
  if (session?.user) {
    // Check if user has tenant setup completed
    if (!session.user.tenantId) {
      redirect("/onboarding");
    }
    return <EnhancedDashboard />;
  }

  // If not authenticated, show landing page
  return <LandingPage />;
}
