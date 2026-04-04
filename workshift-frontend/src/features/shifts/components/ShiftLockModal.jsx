import { useState } from "react"
import { Modal } from "../../../components/Modal"
import { lockShift } from "../shiftLockApi"

function fmtTime(t) {
  if (!t) return "—"
  return String(t).substring(0, 5)
}

export function ShiftLockModal({ open, onClose, groupId, shift, onLocked }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleConfirm() {
    if (!shift) return
    setLoading(true)
    setError(null)
    try {
      await lockShift(groupId, shift.id)
      onLocked?.()
    } catch (e) {
      setError(e?.message || "Không thể khóa ca")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-md">
      <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">lock</span>
            Khóa ca làm việc
          </h3>
          {shift ? (
            <p className="text-xs text-on-surface-variant mt-1">
              {shift.date} · {fmtTime(shift.startTime)} - {fmtTime(shift.endTime)}
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

      <div className="p-6 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
          <span className="material-symbols-outlined text-base mt-0.5">warning</span>
          <span>
            Khóa ca sẽ chuyển từ <strong>OPEN</strong> sang <strong>LOCKED</strong> và giới hạn thao tác cập nhật theo rule backend.
          </span>
        </div>

        {error ? (
          <div className="bg-error-container/20 text-on-error-container rounded-xl p-3 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            {error}
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">lock</span>
            {loading ? "Đang khóa..." : "Xác nhận khóa"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

