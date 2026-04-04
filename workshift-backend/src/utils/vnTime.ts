/** Biên ngày theo múi Asia/Ho_Chi_Minh (+07), tương thích logic Java `atStartOfDay(ZoneId)`. */
export function vnStartOfCalendarDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00+07:00`);
}

export function vnMonthRange(year: number, month: number): { start: Date; end: Date } {
  const firstStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const start = vnStartOfCalendarDay(firstStr);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nextFirstStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  const end = vnStartOfCalendarDay(nextFirstStr);
  return { start, end };
}

/** Ngày hiện tại theo lịch Asia/Ho_Chi_Minh, dạng YYYY-MM-DD */
export function vnTodayIsoDate(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/** ISO weekday: Thứ 2 = 1 … Chủ nhật = 7 */
function isoDowMon1(y: number, month: number, day: number): number {
  const dt = new Date(Date.UTC(y, month - 1, day, 12, 0, 0));
  const js = dt.getUTCDay();
  return js === 0 ? 7 : js;
}

export function addCalendarDaysIso(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + deltaDays * 86400000;
  const nd = new Date(t);
  return `${nd.getUTCFullYear()}-${String(nd.getUTCMonth() + 1).padStart(2, '0')}-${String(nd.getUTCDate()).padStart(2, '0')}`;
}

/** Thứ 2 → Chủ nhật của tuần chứa ngày `iso` */
export function vnMondayToSundayRangeContaining(iso: string): { from: string; to: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = isoDowMon1(y, m, d);
  const monday = addCalendarDaysIso(iso, -(dow - 1));
  const sunday = addCalendarDaysIso(monday, 6);
  return { from: monday, to: sunday };
}

/** Ngày đầu / cuối tháng dương lịch của ngày `iso` (YYYY-MM-DD) */
export function vnMonthIsoRangeContaining(iso: string): { from: string; to: string } {
  const [y, m] = iso.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}
