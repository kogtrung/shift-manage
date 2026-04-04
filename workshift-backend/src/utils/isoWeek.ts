/** Tuần ISO 8601: Thứ 2 → Chủ nhật; tuần 1 chứa ngày 4/1. */

function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mondayOfWeekContainingUtc(d: Date): Date {
  const x = new Date(d.getTime());
  const dow = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() - (dow - 1));
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export function isoWeekDateRange(year: number, week: number): { from: string; to: string } {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayW1 = mondayOfWeekContainingUtc(jan4);
  const monday = new Date(mondayW1.getTime());
  monday.setUTCDate(mondayW1.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday.getTime());
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { from: formatYmdUtc(monday), to: formatYmdUtc(sunday) };
}
