import { useEffect, useMemo, useState } from "react"
import { Modal } from "../../../components/Modal"
import { createShiftChangeRequest } from "../shiftChangeApi"
import {
  shiftFitsMemberAvailabilitySlots,
  shiftHasRequirementForPosition,
} from "../../../utils/shiftAvailability"
import { weekdayLabelViFromIsoDate } from "../../../utils/dateUtils"

function fmtTime(t) {
  if (!t) return "—"
  return String(t).substring(0, 5)
}

const DAY_SHORT = [, "T2", "T3", "T4", "T5", "T6", "T7", "CN"]

function normalizeDateTimeKey(shiftLike) {
  // Dùng (date + startTime + endTime) để tránh trùng ca hiện tại.
  const date = shiftLike?.date ? String(shiftLike.date) : null
  const start = shiftLike?.startTime ? fmtTime(shiftLike.startTime) : null
  const end = shiftLike?.endTime ? fmtTime(shiftLike.endTime) : null
  return date && start && end ? `${date}|${start}|${end}` : null
}

export function ShiftChangeRequestModal({
  open,
  onClose,
  groupId,
  fromItem,
  availableShifts,
  /** Lịch rảnh từ GET /availability — chỉ hiện ca đích nằm trong khung đã khai báo */
  availabilitySlots = [],
  /** Vị trí đã khai báo trong nhóm — chỉ để hiển thị xác nhận (API đổi ca giữ nguyên positionId đăng ký) */
  myPositions = [],
  onCreated,
}) {
  const [toShiftId, setToShiftId] = useState("")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fromPositionId =
    fromItem?.positionId != null ? Number(fromItem.positionId) : NaN
  const fromPosOk = Number.isFinite(fromPositionId)

  const myPosIds = useMemo(() => {
    return new Set(
      (Array.isArray(myPositions) ? myPositions : [])
        .map((p) => Number(p.id ?? p.positionId))
        .filter((n) => Number.isFinite(n))
    )
  }, [myPositions])

  const eligibleToShifts = useMemo(() => {
    if (!Array.isArray(availableShifts) || !fromItem || !fromPosOk) return []
    const currentKey = normalizeDateTimeKey(fromItem)
    return availableShifts
      .filter((s) => s?.status === "OPEN")
      .filter((s) => normalizeDateTimeKey(s) !== currentKey)
      .filter((s) => shiftHasRequirementForPosition(s, fromPositionId))
      .filter((s) => shiftFitsMemberAvailabilitySlots(s, availabilitySlots))
  }, [availableShifts, fromItem, fromPosOk, fromPositionId, availabilitySlots])

  useEffect(() => {
    if (!open) return

    setError(null)
    setReason("")

    const first = eligibleToShifts[0]
    setToShiftId(first ? String(first.id) : "")
  }, [open, eligibleToShifts])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fromItem?.registrationId || fromItem?.shiftId == null) {
      setError("Không tìm thấy ca đăng ký gốc")
      return
    }
    if (!toShiftId) {
      setError("Chọn ca đích")
      return
    }
    if (myPosIds.size > 0 && fromPosOk && !myPosIds.has(fromPositionId)) {
      setError("Vị trí ca này không nằm trong danh sách vị trí bạn đã khai báo trong nhóm")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createShiftChangeRequest(groupId, {
        fromShiftId: Number(fromItem.shiftId),
        toShiftId: Number(toShiftId),
        reason: reason.trim() || null,
      })
      onCreated?.()
    } catch (e) {
      setError(e?.message || "Không thể tạo yêu cầu đổi ca")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">swap_horiz</span>
            Yêu cầu đổi ca
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Từ: {fromItem?.date} · {fmtTime(fromItem?.startTime)} - {fmtTime(fromItem?.endTime)}
          </p>
          {fromItem?.positionName ? (
            <p className="text-xs font-semibold text-on-surface mt-2">
              Vị trí đăng ký: {fromItem.positionName}
              {myPosIds.size > 0 && fromPosOk && myPosIds.has(fromPositionId) ? (
                <span className="font-normal text-on-surface-variant"> (đã khai báo trong nhóm)</span>
              ) : null}
            </p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg"
          type="button"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form className="p-6 space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <div className="bg-error-container/20 text-on-error-container rounded-xl p-3 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            {error}
          </div>
        ) : null}

        {!availabilitySlots?.length ? (
          <div className="rounded-xl bg-amber-50 text-amber-900 text-sm px-4 py-3 flex gap-2 items-start">
            <span className="material-symbols-outlined text-amber-700">event_busy</span>
            <span>Bạn chưa khai báo lịch rảnh — không thể chọn ca đích phù hợp. Vào mục <strong>Lịch rảnh</strong> để thêm khung giờ.</span>
          </div>
        ) : (
          <div className="rounded-xl bg-surface-container-low border border-outline/10 px-4 py-3 text-xs">
            <p className="font-bold text-on-surface mb-2">Khung giờ rảnh bạn đã khai báo (áp dụng lọc ca đích)</p>
            <ul className="text-on-surface-variant space-y-1 max-h-28 overflow-y-auto">
              {[...availabilitySlots]
                .sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek))
                .map((s) => (
                  <li key={`${s.id ?? s.dayOfWeek}-${s.startTime}-${s.endTime}`}>
                    <span className="font-semibold text-on-surface">{DAY_SHORT[Number(s.dayOfWeek)] || s.dayOfWeek}</span>
                    {" · "}
                    {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
                  </li>
                ))}
            </ul>
          </div>
        )}

        {Array.isArray(myPositions) && myPositions.length > 0 ? (
          <div className="rounded-xl bg-surface-container-low border border-outline/10 px-4 py-3 text-xs">
            <p className="font-bold text-on-surface mb-2">Vị trí bạn đã khai báo trong nhóm</p>
            <ul className="flex flex-wrap gap-2">
              {myPositions.map((p) => (
                <li
                  key={p.id ?? p.positionId}
                  className="px-2 py-1 rounded-lg bg-primary-container/20 text-on-surface font-medium"
                >
                  {p.name || `#${p.id ?? p.positionId}`}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {myPosIds.size > 0 && fromPosOk && !myPosIds.has(fromPositionId) ? (
          <div className="rounded-xl bg-amber-50 text-amber-900 text-sm px-4 py-3 flex gap-2 items-start">
            <span className="material-symbols-outlined text-amber-700">work_off</span>
            <span>Vị trí ca này không trùng với vị trí bạn đã khai báo. Cập nhật vị trí tại <strong>Thông tin cá nhân</strong>.</span>
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Ca đích <span className="text-error">*</span>
          </label>
          <p className="text-[11px] text-on-surface-variant mb-2">
            Chỉ hiện các ca đang mở, có nhu cầu <strong>cùng vị trí</strong> với ca hiện tại, và nằm trong <strong>khung giờ rảnh</strong> bạn đã khai báo (phủ trọn giờ làm).
          </p>
          <select
            value={toShiftId}
            onChange={(e) => setToShiftId(e.target.value)}
            className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          >
            {eligibleToShifts.length === 0 ? (
              <option value="">
                {!availabilitySlots?.length
                  ? 'Khai báo lịch rảnh trước'
                  : 'Không có ca OPEN phù hợp vị trí & lịch rảnh'}
              </option>
            ) : null}
            {eligibleToShifts.map((s) => {
              const dow = weekdayLabelViFromIsoDate(s.date)
              return (
                <option key={s.id} value={s.id}>
                  {dow ? `${dow} · ` : ""}
                  {s.date} · {s.name || "Ca"} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}
                </option>
              )
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Lý do (tùy chọn)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do đổi ca..."
            rows={3}
            className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors"
            disabled={saving}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={
              saving ||
              !toShiftId ||
              !availabilitySlots?.length ||
              (myPosIds.size > 0 && fromPosOk && !myPosIds.has(fromPositionId))
            }
            className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">send</span>
            {saving ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
        </div>
      </form>
    </Modal>
  )
}

