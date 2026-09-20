"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";

export function KnowledgeIngestPanel({ onIngested }: { onIngested?: () => void }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function ingest(body: FormData | object) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/knowledge/ingest", {
        method: "POST",
        headers: body instanceof FormData ? undefined : { "Content-Type": "application/json" },
        body: body instanceof FormData ? body : JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ingest failed");
      setMessage(`Ingested: ${data.title}`);
      setUrl("");
      setText("");
      setTitle("");
      onIngested?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-indigo-400" />
          Ingest Knowledge
        </CardTitle>
        <CardDescription>Add text, files (.txt, .csv), or URLs to the company brain</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
          />
          <Button
            disabled={loading || !url.trim()}
            onClick={() => {
              const fd = new FormData();
              fd.set("url", url);
              if (title) fd.set("title", title);
              ingest(fd);
            }}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Fetch URL
          </Button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text content..."
          rows={4}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap gap-2">
          <Button
            disabled={loading || !text.trim()}
            onClick={() => ingest({ type: "TXT", title: title || "Pasted note", text })}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Text"}
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800">
              Upload file
            </span>
            <input
              type="file"
              accept=".txt,.csv,.md"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.set("file", file);
                if (title) fd.set("title", title);
                ingest(fd);
              }}
            />
          </label>
        </div>

        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </CardContent>
    </Card>
  );
}
