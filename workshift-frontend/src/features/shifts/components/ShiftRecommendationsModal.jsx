import { useEffect, useMemo, useState } from "react"
import { Modal } from "../../../components/Modal"
import { getShiftRecommendations } from "../../recommendations/recommendationApi"
import { assignShift } from "../../registrations/registrationApi"
import { unwrapApiArray } from "../../../api/apiClient"

function fmtTime(t) {
  if (!t) return "—"
  return String(t).substring(0, 5)
}

export function ShiftRecommendationsModal({
  open,
  onClose,
  groupId,
  shift,
  position,
  onAssigned,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [assigningUserId, setAssigningUserId] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [reloadTick, setReloadTick] = useState(0)

  const positionId = position?.positionId
  const positionName = position?.positionName

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!open) return
      if (!shift?.id || !groupId || !positionId) return

      setLoading(true)
      setError(null)
      setCandidates([])

      try {
        const res = await getShiftRecommendations(groupId, shift.id, positionId)
        if (!cancelled) setCandidates(unwrapApiArray(res))
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không thể tải gợi ý")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, groupId, shift?.id, positionId, reloadTick])

  const emptyStateText = useMemo(() => {
    if (!loading && !error && candidates.length === 0) {
      return "Không có nhân viên phù hợp cho vị trí này."
    }
    return null
  }, [loading, error, candidates.length])

  async function handleAssign(userId) {
    if (!shift?.id || !positionId) return

    setAssigningUserId(userId)
    setError(null)
    try {
      await assignShift(shift.id, userId, positionId, null)
      onAssigned?.()
    } catch (e) {
      setError(e?.message || "Không thể gán nhân viên")
    } finally {
      setAssigningUserId(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-2xl">
      <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            Gợi ý nhân viên
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {shift?.date} · {fmtTime(shift?.startTime)} - {fmtTime(shift?.endTime)}
          </p>
          {positionName ? (
            <p className="text-xs text-on-surface-variant mt-1">
              Vị trí: <strong className="text-on-surface">{positionName}</strong>
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
        {error ? (
          <div className="bg-error-container/20 text-on-error-container rounded-xl p-3 text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-error">error</span>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="text-on-surface-variant animate-pulse text-sm py-6 text-center">
            Đang tải...
          </div>
        ) : emptyStateText ? (
          <div className="bg-surface-container-lowest rounded-xl border border-dashed border-outline/20 p-4 text-sm space-y-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-on-surface-variant opacity-60 mt-0.5">
                info
              </span>
              <div className="space-y-1">
                <div className="font-semibold text-on-surface">{emptyStateText}</div>
                <div className="text-xs text-on-surface-variant">
                  Liên hệ riêng các nhân viên để trao đổi.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReloadTick((v) => v + 1)}
                className="px-4 py-2 bg-surface-container-highest text-on-surface-variant font-semibold rounded-lg hover:opacity-90 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidates.map((c) => (
              <div key={c.userId} className="bg-surface-container-lowest rounded-2xl border border-outline/10 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm flex-shrink-0">
                      {(c.fullName || c.username || "U").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface truncate">{c.fullName || c.username}</p>
                      <p className="text-xs text-on-surface-variant truncate">@{c.username}</p>
                    </div>
                  </div>
                  <div className="text-xs text-on-surface-variant flex-shrink-0">#{c.userId}</div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleAssign(c.userId)}
                    disabled={assigningUserId === c.userId}
                    className="px-4 py-2 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    {assigningUserId === c.userId ? "Đang gán..." : "Gán vào ca"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  )
}

