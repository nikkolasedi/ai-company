"use client";

import { useEffect, useState } from "react";
import type { ColonyRuntime } from "@/lib/bot-crossing/runtime";

type Mode = "translate" | "rotate" | "scale";

const MODES: { id: Mode; label: string; key: string }[] = [
  { id: "translate", label: "Move", key: "W" },
  { id: "rotate", label: "Rotate", key: "E" },
  { id: "scale", label: "Scale", key: "R" },
];

export function SceneEditorToolbar({ runtime }: { runtime: ColonyRuntime | null }) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<Mode>("translate");
  const [snap, setSnap] = useState(true);
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!runtime) return;
    return runtime.editor.onChange((state) => {
      setEnabled(state.enabled);
      setMode(state.mode);
      setSnap(state.snap);
      setLabel(state.selectedLabel);
    });
  }, [runtime]);

  if (!runtime) return null;

  const editor = runtime.editor;

  return (
    <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:bottom-3 sm:left-3 sm:items-start">
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-950/85 p-1.5 text-xs text-zinc-200 shadow-lg backdrop-blur">
        <button
          type="button"
          onClick={() => editor.setEnabled(!enabled)}
          className={`rounded-lg px-3 py-1.5 font-medium ${
            enabled ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
          }`}
        >
          {enabled ? "Done editing" : "Edit 3D"}
        </button>
        {enabled && (
          <>
            {MODES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => editor.setMode(item.id)}
                className={`rounded-lg px-2.5 py-1.5 ${
                  mode === item.id ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {item.label}
                <span className="ml-1 hidden text-[10px] opacity-60 sm:inline">{item.key}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => editor.setSnap(!snap)}
              className={`rounded-lg px-2.5 py-1.5 ${
                snap ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              Snap
            </button>
            <button
              type="button"
              disabled={!label}
              onClick={() => editor.resetSelected()}
              className="rounded-lg bg-zinc-800 px-2.5 py-1.5 hover:bg-zinc-700 disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => editor.resetAll()}
              className="rounded-lg bg-zinc-800 px-2.5 py-1.5 hover:bg-zinc-700"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={() => {
                const json = JSON.stringify(editor.exportJSON(), null, 2);
                navigator.clipboard?.writeText(json);
                const blob = new Blob([json], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "office-layout.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
              className="rounded-lg bg-zinc-800 px-2.5 py-1.5 hover:bg-zinc-700"
            >
              Save JSON
            </button>
          </>
        )}
      </div>
      {enabled && (
        <p className="rounded-lg bg-zinc-950/70 px-2.5 py-1.5 text-[11px] leading-snug text-zinc-300">
          {label ? (
            <>
              Selected <span className="font-medium text-white">{label}</span>. Drag the gizmo.
              Right-drag still looks around.
            </>
          ) : (
            <>Click a desk, landmark, tree, building, car, or the shuttle. W move · E rotate · R scale.</>
          )}
        </p>
      )}
    </div>
  );
}
