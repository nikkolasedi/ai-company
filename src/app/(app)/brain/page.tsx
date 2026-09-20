"use client";

import { useState } from "react";
import { BrainGraph } from "@/components/knowledge/brain-graph";
import { KnowledgeIngestPanel } from "@/components/knowledge/knowledge-ingest-panel";
import { ConnectorPanel } from "@/components/connectors/connector-panel";

export default function BrainPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Company Brain</h1>
        <p className="text-zinc-400">
          Knowledge graph, ingestion, and tool connectivity
        </p>
      </div>

      <KnowledgeIngestPanel onIngested={() => setRefreshKey((k) => k + 1)} />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Knowledge Graph
        </h2>
        <BrainGraph height={400} refreshKey={refreshKey} />
        <p className="mt-2 text-xs text-zinc-500">
          Click a node to view content. Grows as agents complete tasks and you ingest docs.
        </p>
      </section>

      <section>
        <ConnectorPanel />
      </section>
    </div>
  );
}
