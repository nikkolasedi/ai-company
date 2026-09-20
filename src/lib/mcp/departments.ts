/** Default department wiring per connector provider (agents-office pattern). */
export const DEPT_SLUGS = [
  "marketing",
  "sales",
  "finance",
  "operations",
  "technology",
  "customer-communication",
] as const;

export const DEFAULT_DEPT_WIRING: Record<string, string[]> = {
  gmail: ["sales", "customer-communication", "operations", "finance"],
  slack: ["operations", "customer-communication", "technology"],
  notion: ["marketing", "operations", "technology", "sales"],
  hubspot: ["sales", "marketing"],
  stripe: ["finance"],
  github: ["technology", "operations"],
  linear: ["technology", "operations"],
  chrome: [...DEPT_SLUGS],
};

export function departmentsForProvider(provider: string): string[] {
  const key = provider.toLowerCase().replace(/[^a-z0-9]/g, "");
  return DEFAULT_DEPT_WIRING[key] ?? [...DEPT_SLUGS];
}
