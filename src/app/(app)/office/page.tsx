import { auth } from "@/lib/auth";
import { getDepartmentsWithAgents, getAgents } from "@/lib/data/queries";
import { IsometricOffice } from "@/components/office/isometric-office";
import { redirect } from "next/navigation";

export default async function OfficePage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const [departments, agents] = await Promise.all([
    getDepartmentsWithAgents(session.user.organizationId),
    getAgents(session.user.organizationId),
  ]);

  return (
    <div className="min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100vh-3rem)]">
      <IsometricOffice departments={departments} initialAgents={agents} />
    </div>
  );
}
