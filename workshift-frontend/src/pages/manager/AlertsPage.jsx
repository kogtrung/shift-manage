import { useEffect, useMemo, useState } from 'react'
import { useParams, useOutletContext, Link } from 'react-router-dom'
import { getUnderstaffedAlerts } from '../../features/alerts/alertApi'
import { unwrapApiArray } from '../../api/apiClient'

function fmtTime(t) { return t ? String(t).substring(0, 5) : '—' }
function parseDateOnly(d) {
  // Backend LocalDate -> "YYYY-MM-DD"
  if (!d) return null
  if (d instanceof Date) return d
  const parts = String(d).split('-').map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null
  const [y, m, day] = parts
  return new Date(y, m - 1, day)
}

function parseTimeToMinutes(t) {
  // "HH:mm:ss" | "HH:mm"
  const s = t ? String(t) : ''
  const [hh, mm] = s.split(':')
  const H = Number(hh)
  const M = Number(mm)
  if (Number.isNaN(H) || Number.isNaN(M)) return 0
  return H * 60 + M
}

function fmtNumber(val) {
  const n = Number(val)
  return Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—'
}

function severityColor(shortage) {
  if (shortage >= 3) return 'text-error bg-error/10 border border-error/20'
  if (shortage >= 1) return 'text-amber-700 bg-amber-50 border border-amber-200'
  return 'text-emerald-700 bg-emerald-50 border border-emerald-200'
}

export function AlertsPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0) // 0: tuần này, 1: tuần sau...
  const [expanded, setExpanded] = useState({}) // shiftId -> boolean

  const visibleAlerts = useMemo(() => {
    const list = Array.isArray(alerts) ? alerts : []
    const now = new Date()
    // Tính start-of-week (Thứ 2)
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const day = d.getDay() // 0..6 (Sun..Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day
    const startOfThisWeek = new Date(d)
    startOfThisWeek.setDate(d.getDate() + diffToMonday)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const start = new Date(startOfThisWeek)
    start.setDate(start.getDate() + weekOffset * 7)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    const sorted = list
      .slice()
      .sort((a, b) => {
        const da = parseDateOnly(a.date) || new Date(0)
        const db = parseDateOnly(b.date) || new Date(0)
        if (da.getTime() !== db.getTime()) return da - db
        return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      })

    return sorted.filter((a) => {
      const d = parseDateOnly(a.date)
      if (!d) return false
      return d >= start && d <= end
    })
  }, [alerts, weekOffset])

  async function loadAlerts() {
    setLoading(true); setError(null)
    try {
      const res = await getUnderstaffedAlerts(groupId)
      setAlerts(unwrapApiArray(res))
    } catch (err) {
      setError(err?.message || 'Không thể tải cảnh báo')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAlerts() }, [groupId])
  useEffect(() => { setExpanded({}) }, [weekOffset])

  const totals = useMemo(() => {
    const list = visibleAlerts || []
    const totalShortage = list.reduce((s, a) => s + Math.max(0, (a.totalRequired || 0) - (a.totalApproved || 0)), 0)
    const totalRequired = list.reduce((s, a) => s + (a.totalRequired || 0), 0)
    return { totalShortage, totalRequired }
  }, [visibleAlerts])

  if (!isManager) {
    return (
      <div className="w-full text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">lock</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Không có quyền truy cập</h3>
        <p className="text-on-surface-variant">Chỉ quản lý mới có thể xem cảnh báo.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Quản lý</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Cảnh báo thiếu người</h2>
          <p className="text-on-surface-variant font-medium">
            Các ca `OPEN` sắp đến nhưng chưa đủ nhân sự theo `ShiftRequirement`
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/10 rounded-xl px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tuần</span>
            <select
              value={weekOffset}
              onChange={(e) => setWeekOffset(Number(e.target.value))}
              className="bg-transparent border-none outline-none text-on-surface text-sm font-bold"
              disabled={loading}
            >
              <option value={0}>Tuần này</option>
              <option value={1}>Tuần sau</option>
              <option value={2}>Tuần kế</option>
              <option value={3}>Tuần +3</option>
            </select>
          </div>
          <button onClick={loadAlerts}
          className="px-5 py-2.5 bg-surface-container text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors flex items-center gap-2 self-start">
          <span className="material-symbols-outlined text-sm">refresh</span>
          Làm mới
          </button>
        </div>
      </div>

      {error && <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">{error}</div>}
      {loading && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant animate-pulse">Đang tải cảnh báo...</p>
        </div>
      )}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-error">{visibleAlerts.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Ca thiếu người</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{totals.totalShortage}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng thiếu hụt</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-on-surface">
              {fmtNumber(totals.totalRequired)}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng nhu cầu</p>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {!loading && visibleAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleAlerts.map((alert) => {
            const shortage = Math.max(0, (alert.totalRequired || 0) - (alert.totalApproved || 0))
            const pct = alert.totalRequired > 0 ? Math.round((alert.totalApproved / alert.totalRequired) * 100) : 0
            const isOpen = !!expanded[alert.shiftId]

            return (
              <div
                key={alert.shiftId}
                className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                {/* Shift header */}
                <div className="px-5 py-4 bg-error-container/10 border-b border-error/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-error">warning</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-on-surface truncate">{alert.shiftName || 'Ca'}</p>
                      <p className="text-xs text-on-surface-variant">
                        {alert.date} · {fmtTime(alert.startTime)} – {fmtTime(alert.endTime)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => ({ ...prev, [alert.shiftId]: !isOpen }))}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 text-error border border-error/10 text-xs font-bold flex-shrink-0 hover:bg-error/15 transition-colors"
                    title="Xem chi tiết thiếu theo vị trí"
                  >
                    <span className="material-symbols-outlined text-sm">{isOpen ? 'expand_less' : 'expand_more'}</span>
                    Thiếu {shortage}
                  </button>
                </div>

                {/* Progress overview */}
                <div className="px-5 py-3 border-b border-outline/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Nhân sự tổng</span>
                    <span className="text-xs font-bold text-on-surface">
                      {alert.totalApproved}/{alert.totalRequired} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 80 ? 'bg-amber-500' : pct >= 50 ? 'bg-orange-500' : 'bg-error'}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {isOpen && (
                  <>
                    {/* Position shortages */}
                    <div className="px-5 py-3 space-y-2">
                      {(alert.shortages || []).map((ps) => {
                        const posPct = ps.required > 0 ? Math.round((ps.approved / ps.required) * 100) : 0
                        return (
                          <div key={ps.positionId} className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant flex-shrink-0">
                              {(ps.positionName || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="text-xs font-bold text-on-surface truncate">{ps.positionName}</span>
                                <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">
                                  {ps.approved}/{ps.required}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${posPct >= 100 ? 'bg-emerald-500' : posPct >= 50 ? 'bg-amber-500' : 'bg-error'}`}
                                  style={{ width: `${Math.min(100, posPct)}%` }}
                                />
                              </div>
                            </div>
                            {ps.shortage > 0 && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${severityColor(ps.shortage)}`}>
                                -{ps.shortage}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Action */}
                    <div className="px-5 py-3 border-t border-outline/5">
                      <Link
                        to={`/groups/${groupId}/shifts`}
                        className="w-full py-2 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        Đi đến quản lý ca
                      </Link>
                    </div>
                  </>
                )}

                {!isOpen && (
                  <div className="px-5 py-3 border-t border-outline/5">
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [alert.shiftId]: true }))}
                      className="w-full py-2 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">search</span>
                      Xem chi tiết thiếu theo vị trí
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && visibleAlerts.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
          <span className="material-symbols-outlined text-5xl text-emerald-500 opacity-40 mb-4">verified</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Không có ca thiếu người trong khoảng hiển thị</h3>
          <p className="text-on-surface-variant font-medium">
            Thử đổi bộ lọc “Hiển thị” hoặc bấm “Làm mới”.
          </p>
        </div>
      )}
    </div>
  )
}
