import { useEffect, useMemo, useState } from "react"
import { useParams, useOutletContext } from "react-router-dom"
import {
  approveShiftChangeRequest,
  listPendingShiftChangeRequests,
  rejectShiftChangeRequest,
} from "../../features/shiftChange/shiftChangeApi"
import { unwrapApiArray } from "../../api/apiClient"
import { weekdayLabelViFromIsoDate } from "../../utils/dateUtils"

function fmtTime(t) {
  return t ? String(t).substring(0, 5) : "—"
}

/** Hiển thị khối ca: thứ · ngày · tên ca · giờ (không dùng #id) */
function formatShiftCell(prefix, row) {
  const name = row[`${prefix}ShiftName`]
  const date = row[`${prefix}ShiftDate`]
  const st = row[`${prefix}ShiftStartTime`]
  const en = row[`${prefix}ShiftEndTime`]
  if (!date && !name) return <span className="text-on-surface-variant italic">—</span>
  const thu = weekdayLabelViFromIsoDate(date)
  const parts = [thu, date, name, st && en ? `${fmtTime(st)}–${fmtTime(en)}` : null].filter(Boolean)
  return <span className="font-medium text-on-surface">{parts.join(" · ")}</span>
}

export function ShiftChangeRequestsPage() {
  const { groupId } = useParams()
  const { isManager, groupInfo } = useOutletContext() || {}

  const numericGroupId = useMemo(() => Number(groupId), [groupId])

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actioningId, setActioningId] = useState(null)

  async function load() {
    if (!Number.isFinite(numericGroupId) || numericGroupId <= 0) return

    setLoading(true)
    setError("")
    try {
      const res = await listPendingShiftChangeRequests(numericGroupId)
      setItems(unwrapApiArray(res))
    } catch (e) {
      setError(e?.message || "Không thể tải yêu cầu đổi ca")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [numericGroupId])

  async function handleApprove(requestId) {
    setActioningId(requestId)
    try {
      await approveShiftChangeRequest(numericGroupId, requestId)
      await load()
    } catch (e) {
      alert(e?.message || "Không thể duyệt yêu cầu")
    } finally {
      setActioningId(null)
    }
  }

  async function handleReject(requestId) {
    const reason = prompt("Lý do từ chối (tùy chọn):")
    if (reason === null) return

    setActioningId(requestId)
    try {
      await rejectShiftChangeRequest(numericGroupId, requestId, reason || null)
      await load()
    } catch (e) {
      alert(e?.message || "Không thể từ chối yêu cầu")
    } finally {
      setActioningId(null)
    }
  }

  if (!isManager) {
    return (
      <div className="w-full text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">lock</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Không có quyền truy cập</h3>
        <p className="text-on-surface-variant">Chỉ quản lý mới có thể duyệt yêu cầu đổi ca.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">
            Quản lý
          </p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Yêu cầu đổi ca</h2>
          <p className="text-on-surface-variant font-medium">
            {groupInfo?.groupName || `Group #${groupId}`} · đang chờ duyệt
          </p>
        </div>
        <button
          className="px-5 py-2.5 bg-surface-container-lowest text-primary font-semibold rounded-xl border border-outline/10 hover:bg-surface-container-low transition-colors flex items-center gap-2"
          type="button"
          onClick={load}
          disabled={loading}
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-center py-12">
          <p className="text-on-surface-variant animate-pulse">Đang tải...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-14 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/20">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">check_circle</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Không có yêu cầu nào</h3>
          <p className="text-on-surface-variant font-medium">Hệ thống chưa nhận yêu cầu đổi ca nào đang chờ duyệt.</p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Người yêu cầu</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Từ ca</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tới ca</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Vị trí</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Lý do</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-on-surface">
                      {it.fullName || it.requesterFullName || it.username || it.requesterUsername || "—"}
                    </div>
                    <div className="text-xs text-on-surface-variant mt-1">
                      @{it.username || it.requesterUsername || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{formatShiftCell("from", it)}</td>
                  <td className="px-6 py-4 text-sm">
                    {it.toShiftId == null ? (
                      <span className="text-on-surface-variant italic">Chỉ xin bỏ ca (không đổi sang ca khác)</span>
                    ) : (
                      formatShiftCell("to", it)
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {it.fromPositionName || it.toPositionName || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant">
                    {it.reason || <span className="opacity-50 italic">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(it.id)}
                        disabled={actioningId === it.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Duyệt
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(it.id)}
                        disabled={actioningId === it.id}
                        className="px-3 py-2 bg-surface-container-highest text-error text-xs font-bold rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

