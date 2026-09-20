"use client";

import {
  AVATAR_STYLE_LABELS,
  type AvatarStyle,
  ENVIRONMENT_STYLE_LABELS,
  type EnvironmentStyle,
} from "@/lib/office/visual-styles";
import { cn } from "@/lib/utils";

function OptionGroup<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="flex rounded-lg border border-zinc-700 bg-zinc-900/80 p-0.5">
        {options.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            title={labels[key]}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors sm:px-2.5",
              value === key
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <span className="font-bold">{key}</span>
            <span className="hidden sm:inline text-[9px] opacity-70"> · {labels[key].split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface StyleSwitcherProps {
  environmentStyle: EnvironmentStyle;
  avatarStyle: AvatarStyle;
  onEnvironmentChange: (style: EnvironmentStyle) => void;
  onAvatarChange: (style: AvatarStyle) => void;
  showAvatar?: boolean;
}

export function StyleSwitcher({
  environmentStyle,
  avatarStyle,
  onEnvironmentChange,
  onAvatarChange,
  showAvatar = true,
}: StyleSwitcherProps) {
  return (
    <div className="flex flex-wrap items-end gap-2 sm:gap-3">
      <OptionGroup
        label="Environment"
        value={environmentStyle}
        options={["A", "B", "C"]}
        labels={ENVIRONMENT_STYLE_LABELS}
        onChange={onEnvironmentChange}
      />
      {showAvatar && (
        <OptionGroup
          label="Agents"
          value={avatarStyle}
          options={["A", "B", "C"]}
          labels={AVATAR_STYLE_LABELS}
          onChange={onAvatarChange}
        />
      )}
    </div>
  );
}
