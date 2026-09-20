import { auth } from "@/lib/auth";
import { BrainGraph } from "@/components/knowledge/brain-graph";
import { ConnectorPanel } from "@/components/connectors/connector-panel";
import { redirect } from "next/navigation";

export default async function BrainPage() {
  const session = await auth();
  if (!session?.user?.organizationId) redirect("/login");

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Company Brain</h1>
        <p className="text-zinc-400">
          Knowledge graph and tool connectivity for {session.user.organizationName}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Knowledge Graph
        </h2>
        <BrainGraph height={400} />
        <p className="mt-2 text-xs text-zinc-500">
          Grows automatically as agents complete tasks and write deliverables
        </p>
      </section>

      <section>
        <ConnectorPanel />
      </section>
    </div>
  );
}
