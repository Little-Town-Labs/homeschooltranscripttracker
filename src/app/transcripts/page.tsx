import { redirect } from "next/navigation";

import { auth } from "@/server/auth";
import { TranscriptsPage } from "@/app/_components/transcripts-page";

export default async function Transcripts() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  if (!session.user.tenantId) {
    redirect("/onboarding");
  }

  return <TranscriptsPage />;
}