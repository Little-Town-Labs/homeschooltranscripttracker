import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { BillingPage } from "@/app/_components/billing-page";

export default async function Billing() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <BillingPage />;
}