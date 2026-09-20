export interface ScheduleWhen {
  kind: "daily" | "weekdays" | "weekly" | "hourly" | "minutes";
  at?: string;
  days?: number[];
  every?: number;
  from?: string;
  to?: string;
  weekdaysOnly?: boolean;
  start?: string;
}

const WORD_TIMES: Record<string, string> = {
  noon: "12:00",
  morning: "08:00",
  afternoon: "14:00",
  evening: "17:00",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function clock(h: number, m = 0, ap?: string | null): string | null {
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

function findTime(s: string): { at: string; span: [number, number] } | null {
  const m = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i.exec(s);
  if (m) {
    const at = clock(+m[1], +(m[2] || 0), m[3]?.toLowerCase());
    if (at) return { at, span: [m.index, m.index + m[0].length] };
  }
  const w = /\b(morning|afternoon|evening|noon)\b/i.exec(s);
  if (w) {
    const at = WORD_TIMES[w[1].toLowerCase()];
    return { at, span: [w.index, w.index + w[0].length] };
  }
  return null;
}

function tidy(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function parseWhen(input: string): {
  when: ScheduleWhen;
  text: string;
} | null {
  let s = input;

  if (/\bevery\s+(\d+)\s*minutes?\b/i.test(s)) {
    const m = /\bevery\s+(\d+)\s*minutes?\b/i.exec(s)!;
    return {
      when: { kind: "minutes", every: Math.max(1, +m[1]) },
      text: tidy(s.replace(m[0], "")),
    };
  }

  if (/\b(?:weekdays?|working days?|mon(?:day)?\s*-\s*fri(?:day)?)\b/i.test(s)) {
    const m = /\b(?:every\s+)?(?:weekdays?|working days?|mon(?:day)?\s*-\s*fri(?:day)?)\b/i.exec(s)!;
    s = tidy(s.replace(m[0], ""));
    const t = findTime(s);
    if (t) s = tidy(s.slice(0, t.span[0]) + s.slice(t.span[1]));
    return {
      when: { kind: "weekdays", at: t?.at ?? "08:00" },
      text: s,
    };
  }

  if (/\b(?:daily|every day|each day)\b/i.test(s)) {
    const m = /\b(?:daily|every day|each day)\b/i.exec(s)!;
    s = tidy(s.replace(m[0], ""));
    const t = findTime(s);
    if (t) s = tidy(s.slice(0, t.span[0]) + s.slice(t.span[1]));
    return {
      when: { kind: "daily", at: t?.at ?? "08:00" },
      text: s,
    };
  }

  const dayMatch = /\b(?:every|each|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\b/i.exec(s);
  if (dayMatch) {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const idx = days.indexOf(dayMatch[1].toLowerCase());
    s = tidy(s.replace(dayMatch[0], ""));
    const t = findTime(s);
    if (t) s = tidy(s.slice(0, t.span[0]) + s.slice(t.span[1]));
    return {
      when: { kind: "weekly", days: [idx], at: t?.at ?? "08:00" },
      text: s,
    };
  }

  return null;
}

export function valid(when: ScheduleWhen): boolean {
  if (!when?.kind) return false;
  const t = (s?: string) => /^\d{2}:\d{2}$/.test(s || "");
  if (when.kind === "minutes") return (when.every ?? 0) >= 1;
  if (when.kind === "hourly") return (when.every ?? 1) >= 1;
  if (when.kind === "daily" || when.kind === "weekdays") return t(when.at);
  if (when.kind === "weekly") return t(when.at) && (when.days?.length ?? 0) > 0;
  return false;
}

export function describe(when: ScheduleWhen): string {
  const at = when.at ? ` at ${when.at}` : "";
  switch (when.kind) {
    case "minutes":
      return `every ${when.every} minutes`;
    case "hourly":
      return `every ${when.every ?? 1} hour(s)`;
    case "daily":
      return `every day${at}`;
    case "weekdays":
      return `every weekday${at}`;
    case "weekly": {
      const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const d = (when.days ?? []).map((i) => names[i]).join(", ");
      return `${d}${at}`;
    }
    default:
      return "";
  }
}

export function nextRun(when: ScheduleWhen, from = Date.now()): number | null {
  if (!valid(when)) return null;

  if (when.kind === "minutes") {
    const step = (when.every ?? 1) * 60000;
    return Math.floor(from / step) * step + step;
  }

  const [hh, mi] = (when.at ?? "08:00").split(":").map(Number);
  const allowed =
    when.kind === "daily"
      ? [0, 1, 2, 3, 4, 5, 6]
      : when.kind === "weekdays"
        ? [1, 2, 3, 4, 5]
        : when.days ?? [];

  const d = new Date(from);
  d.setHours(hh, mi, 0, 0);

  for (let i = 0; i < 14; i++, d.setDate(d.getDate() + 1)) {
    if (d.getTime() <= from) continue;
    if (allowed.includes(d.getDay())) return d.getTime();
  }
  return null;
}

export function occurrences(
  when: ScheduleWhen,
  from: number,
  to: number,
  limit = 50
): number[] {
  const out: number[] = [];
  let t = nextRun(when, from);
  while (t && t <= to && out.length < limit) {
    out.push(t);
    t = nextRun(when, t);
  }
  return out;
}
