"use client";

import { cn } from "@/lib/utils";

export type OfficeViewMode = "2d" | "3d";

interface ViewModeSwitchProps {
  viewMode: OfficeViewMode;
  onChange: (mode: OfficeViewMode) => void;
  webglAvailable?: boolean;
}

export function ViewModeSwitch({
  viewMode,
  onChange,
  webglAvailable = true,
}: ViewModeSwitchProps) {
  const modes: { key: OfficeViewMode; label: string }[] = [
    { key: "2d", label: "2D" },
    { key: "3d", label: "3D" },
  ];

  return (
    <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/80 p-0.5">
      {modes.map(({ key, label }) => {
        const disabled = key === "3d" && !webglAvailable;
        const isActive = viewMode === key;

        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            title={disabled ? "3D rendering not supported in this browser" : `Switch to ${label}`}
            onClick={() => !disabled && onChange(key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200",
              disabled && "cursor-not-allowed opacity-40"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
