/** Chuẩn hoá "HH:mm", "HH:mm:ss" → "HH:mm:ss" để so sánh */
export function normalizeTimeString(raw: string): string {
  const t = raw.trim();
  const parts = t.split(':').map((p) => Number(p));
  if (parts.length < 2 || parts.some((n) => Number.isNaN(n))) {
    throw new Error('INVALID_TIME');
  }
  const h = parts[0]!;
  const m = parts[1]!;
  const s = parts[2] ?? 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function timeToSeconds(t: string): number {
  const norm = normalizeTimeString(t);
  const [h, m, s] = norm.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

/** Số giờ giữa hai mốc thời gian cùng ngày (end > start). */
export function shiftDurationHours(startTime: string, endTime: string): number {
  return (timeToSeconds(endTime) - timeToSeconds(startTime)) / 3600;
}

/** Trùng khung theo query Java: start1 < end2 && end1 > start2 */
export function timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToSeconds(start1);
  const e1 = timeToSeconds(end1);
  const s2 = timeToSeconds(start2);
  const e2 = timeToSeconds(end2);
  return s1 < e2 && e1 > s2;
}

/** ISO-8601 Monday=1 … Sunday=7 (giống Java DayOfWeek.getValue) */
export function isoDayOfWeekFromDateString(dateStr: string): number {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  const v = dt.getDay();
  return v === 0 ? 7 : v;
}
