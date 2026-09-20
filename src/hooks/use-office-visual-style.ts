"use client";

import { useEffect, useState } from "react";
import {
  type AvatarStyle,
  type EnvironmentStyle,
  DEFAULT_AVATAR_STYLE,
  DEFAULT_ENVIRONMENT_STYLE,
} from "@/lib/office/visual-styles";

const STORAGE_KEY = "ai-company-office-visual-style";

interface VisualStyleState {
  environmentStyle: EnvironmentStyle;
  avatarStyle: AvatarStyle;
}

function loadStyles(): VisualStyleState {
  if (typeof window === "undefined") {
    return {
      environmentStyle: DEFAULT_ENVIRONMENT_STYLE,
      avatarStyle: DEFAULT_AVATAR_STYLE,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        environmentStyle: DEFAULT_ENVIRONMENT_STYLE,
        avatarStyle: DEFAULT_AVATAR_STYLE,
      };
    }
    const parsed = JSON.parse(raw) as Partial<VisualStyleState>;
    return {
      environmentStyle:
        parsed.environmentStyle === "A" ||
        parsed.environmentStyle === "B" ||
        parsed.environmentStyle === "C"
          ? parsed.environmentStyle
          : DEFAULT_ENVIRONMENT_STYLE,
      avatarStyle:
        parsed.avatarStyle === "A" ||
        parsed.avatarStyle === "B" ||
        parsed.avatarStyle === "D"
          ? parsed.avatarStyle
          : parsed.avatarStyle === "C"
            ? "D"
            : DEFAULT_AVATAR_STYLE,
    };
  } catch {
    return {
      environmentStyle: DEFAULT_ENVIRONMENT_STYLE,
      avatarStyle: DEFAULT_AVATAR_STYLE,
    };
  }
}

export function useOfficeVisualStyle() {
  const [styles, setStyles] = useState<VisualStyleState>(loadStyles);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
  }, [styles]);

  return {
    environmentStyle: styles.environmentStyle,
    avatarStyle: styles.avatarStyle,
    setEnvironmentStyle: (environmentStyle: EnvironmentStyle) =>
      setStyles((prev) => ({ ...prev, environmentStyle })),
    setAvatarStyle: (avatarStyle: AvatarStyle) =>
      setStyles((prev) => ({ ...prev, avatarStyle })),
  };
}
