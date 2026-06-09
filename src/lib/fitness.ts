export const MIN_KM = 3;

export function xpFromKm(km: number): number {
  if (!Number.isFinite(km) || km < MIN_KM) return 0;
  return Math.round(km * 10);
}

export function levelFromXp(xp: number): { level: number; xpInLevel: number; xpForNext: number } {
  // Each level requires 100 * level XP cumulative (level 1: 100, level 2: 300...)
  // Use: level = floor((-1 + sqrt(1 + 8*xp/100))/2) + 1 — simpler: linear 200 per level
  const perLevel = 200;
  const level = Math.floor(xp / perLevel) + 1;
  const xpInLevel = xp % perLevel;
  return { level, xpInLevel, xpForNext: perLevel };
}

export function weekStart(d: Date | string): Date {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : new Date(d);
  const day = date.getDay(); // 0 sun
  const diff = (day + 6) % 7; // monday=0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatBR(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + "T00:00:00") : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
