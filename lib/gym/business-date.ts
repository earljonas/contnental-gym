export const gymTimeZone = "Asia/Manila";

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: gymTimeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function gymDate(date = new Date()) {
  const parts = dateFormatter.formatToParts(date);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}

export function addGymDays(date: string, days: number) {
  const midnight = new Date(`${date}T00:00:00Z`);
  midnight.setUTCDate(midnight.getUTCDate() + days);
  return midnight.toISOString().slice(0, 10);
}

export function gymDayStart(date: string) {
  return new Date(`${date}T00:00:00+08:00`).toISOString();
}

export function isGymDate(value?: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
