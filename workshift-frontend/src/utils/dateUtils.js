/**
 * YYYY-MM-DD theo lịch local của trình duyệt (không dùng UTC như Date#toISOString).
 * Tránh trường hợp "Hôm nay" / ô lịch lệch 1 ngày so với ngày thực tế ở múi giờ người dùng.
 */
export function formatLocalISODate(d) {
  const x = d instanceof Date ? d : new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** `YYYY-MM-DD` (local) → "Thứ 2" … "Chủ nhật" */
export function weekdayLabelViFromIsoDate(isoDateStr) {
  const parts = String(isoDateStr || '').split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ''
  const [y, mo, d] = parts
  const dt = new Date(y, mo - 1, d)
  const labels = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  return labels[dt.getDay()] ?? ''
}
