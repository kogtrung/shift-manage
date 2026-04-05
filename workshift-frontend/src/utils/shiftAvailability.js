/** ISO-8601 Thứ 2=1 … Chủ nhật=7 — khớp backend `isoDayOfWeekFromDateString` */
export function isoDayOfWeekFromDateString(dateStr) {
  const parts = String(dateStr).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null
  const [y, mo, d] = parts
  const dt = new Date(y, mo - 1, d)
  const v = dt.getDay()
  return v === 0 ? 7 : v
}

function timeToSeconds(t) {
  const p = String(t || '').trim().split(':').map(Number)
  const h = p[0] ?? 0
  const m = p[1] ?? 0
  const s = p[2] ?? 0
  if (p.some((n) => Number.isNaN(n))) return 0
  return h * 3600 + m * 60 + s
}

/** Khớp `shiftMatchesMemberAvailability` backend: có ít nhất một khung rảnh trong ngày phủ trọn giờ ca */
export function shiftFitsMemberAvailabilitySlots(shift, slots) {
  if (!shift?.date || !slots?.length) return false
  const dow = isoDayOfWeekFromDateString(shift.date)
  if (dow == null) return false
  return slots.some((avail) => {
    if (Number(avail.dayOfWeek) !== dow) return false
    const as = timeToSeconds(avail.startTime)
    const ae = timeToSeconds(avail.endTime)
    const ss = timeToSeconds(shift.startTime)
    const se = timeToSeconds(shift.endTime)
    return as <= ss && ae >= se
  })
}

export function shiftHasRequirementForPosition(shift, positionId) {
  const reqs = shift?.requirements || []
  const pid = Number(positionId)
  return reqs.some((r) => Number(r.positionId) === pid)
}
