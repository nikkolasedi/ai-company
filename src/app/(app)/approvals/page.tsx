import { auth } from "@/lib/auth";
import { getApprovals } from "@/lib/data/queries";
import { ApprovalList } from "@/components/approvals/approval-list";
import { redirect } from "next/navigation";

export default async function ApprovalsPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  const approvals = await getApprovals(session.user.organizationId);

  return <ApprovalList approvals={approvals} />;
}
