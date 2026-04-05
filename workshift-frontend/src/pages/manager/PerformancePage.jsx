import { useEffect, useMemo, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getPerformance } from '../../features/performance/performanceApi'

function fmtNumber(val) {
  const n = Number(val)
  return Number.isFinite(n) ? n.toLocaleString('vi-VN') : '—'
}

function fmtHours(val) {
  const n = Number(val)
  return Number.isFinite(n) ? `${n.toFixed(1)}h` : '—'
}

function toDateInputValue(d) {
  if (!d || !(d instanceof Date)) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function getWeekRange(base = new Date()) {
  // Monday -> Sunday
  const d = new Date(base)
  const day = d.getDay() // 0(Sun) .. 6(Sat)
  const diffToMonday = day === 0 ? -6 : (1 - day)
  const start = new Date(d)
  start.setDate(d.getDate() + diffToMonday)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start, end }
}

function getMonthRange(base = new Date()) {
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0)
  return { start, end }
}

function normalizePerformanceResponse(res) {
  const raw = res?.data ?? res

  const entriesCandidate =
    raw?.entries ??
    raw?.results ??
    raw?.members ??
    raw?.data ??
    raw

  if (Array.isArray(entriesCandidate)) return { entries: entriesCandidate }

  if (Array.isArray(raw?.members)) return { entries: raw.members }
  if (Array.isArray(raw?.entries)) return { entries: raw.entries }

  return { entries: [] }
}

export function PerformancePage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}

  const now = useMemo(() => new Date(), [])

  const [range, setRange] = useState('week') // 'week' | 'month'
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)

  useEffect(() => {
    const { start, end } = range === 'week' ? getWeekRange(now) : getMonthRange(now)
    setFrom(toDateInputValue(start))
    setTo(toDateInputValue(end))
  }, [range, now])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await getPerformance(groupId, { range, from, to })
      setReport(res)
    } catch (err) {
      setError(err?.message || 'Không thể tải báo cáo hiệu suất')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!groupId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, range, from, to])

  const { entries } = useMemo(() => normalizePerformanceResponse(report), [report])

  const totals = useMemo(() => {
    const totalShifts = entries.reduce((s, e) => s + Number(e.totalShifts ?? e.totalShiftCount ?? e.shifts ?? 0), 0)
    const totalHours = entries.reduce((s, e) => s + Number(e.totalHours ?? e.totalHoursWorked ?? e.hours ?? 0), 0)
    return { totalShifts, totalHours }
  }, [entries])

  const topByHours = useMemo(() => {
    const list = [...entries]
    list.sort((a, b) => Number(b.totalHours ?? b.totalHoursWorked ?? b.hours ?? 0) - Number(a.totalHours ?? a.totalHoursWorked ?? a.hours ?? 0))
    return list.slice(0, 5)
  }, [entries])

  const maxHours = useMemo(() => {
    const m = topByHours.reduce((mx, e) => Math.max(mx, Number(e.totalHours ?? e.totalHoursWorked ?? e.hours ?? 0)), 0)
    return m > 0 ? m : 0
  }, [topByHours])

  if (!isManager) {
    return (
      <div className="w-full text-center py-20">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">lock</span>
        <h3 className="text-xl font-bold text-on-surface mb-2">Không có quyền truy cập</h3>
        <p className="text-on-surface-variant">Chỉ quản lý mới có thể xem báo cáo hoạt động.</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Quản lý</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Báo cáo hoạt động</h2>
        <p className="text-on-surface-variant font-medium">So sánh số ca và tổng giờ làm theo giai đoạn</p>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 px-5 py-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRange('week')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors border ${
                range === 'week' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline/10 hover:bg-surface-container-high'
              }`}
            >
              Tuần
            </button>
            <button
              type="button"
              onClick={() => setRange('month')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors border ${
                range === 'month' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface-variant border-outline/10 hover:bg-surface-container-high'
              }`}
            >
              Tháng
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-on-surface-variant font-medium">Từ</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline/20 rounded-lg text-on-surface"
            />
            <span className="text-on-surface-variant font-medium">Đến</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 bg-surface-container-lowest border border-outline/20 rounded-lg text-on-surface"
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <span className="material-symbols-outlined text-sm">{loading ? 'hourglass_empty' : 'refresh'}</span>
            Lọc dữ liệu
          </button>
        </div>
      </div>

      {error && <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">{error}</div>}
      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}

      {!loading && !error && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-on-surface">{entries.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Nhân viên</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-primary">{fmtNumber(totals.totalShifts)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng ca</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center md:col-span-2">
              <p className="text-3xl font-black text-amber-600">{fmtHours(totals.totalHours)}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng giờ</p>
            </div>
          </div>

          {/* Simple bar chart (top 5 by total hours) */}
          {topByHours.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10">
                <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">trending_up</span>
                  Top nhân viên theo tổng giờ
                </h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  Biểu đồ hiển thị đơn giản (CSS) để không phụ thuộc thư viện chart.
                </p>
              </div>
              <div className="p-6 space-y-4">
                {topByHours.map((e) => {
                  const hours = Number(e.totalHours ?? e.totalHoursWorked ?? e.hours ?? 0)
                  const pct = maxHours > 0 ? Math.round((hours / maxHours) * 100) : 0
                  const name = e.fullName || e.userFullName || e.name || `NV #${e.userId ?? e.id ?? '—'}`
                  return (
                    <div key={e.userId ?? e.id ?? name} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container text-xs font-black">
                            {(name || 'U').charAt(0).toUpperCase()}
                          </span>
                          <span className="font-bold text-on-surface truncate">{name}</span>
                        </div>
                        <span className="text-sm font-bold text-on-surface-variant">{fmtHours(hours)}</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline/10 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-surface-container-low border-b border-outline/10 flex items-center justify-between gap-3">
              <h4 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">history</span>
                Chi tiết theo nhân viên
              </h4>
              <span className="text-xs text-on-surface-variant font-medium">
                range: <span className="font-mono">{range}</span>
              </span>
            </div>

            {!entries || entries.length === 0 ? (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">insights</span>
                <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có dữ liệu</h3>
                <p className="text-on-surface-variant font-medium">
                  Không có bản ghi hiệu suất trong khoảng bạn chọn.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-outline/10 bg-surface-container/30">
                      <th className="text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">#</th>
                      <th className="text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Nhân viên</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Số ca</th>
                      <th className="text-center px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Tổng giờ</th>
                      {entries.some((x) => x.positionName || x.position?.name) && (
                        <th className="text-left px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-on-surface-variant">Vị trí</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline/5">
                    {entries
                      .slice()
                      .sort((a, b) => Number(b.totalHours ?? b.totalHoursWorked ?? b.hours ?? 0) - Number(a.totalHours ?? a.totalHoursWorked ?? a.hours ?? 0))
                      .map((e, idx) => {
                        const name = e.fullName || e.userFullName || e.name || `NV #${e.userId ?? e.id ?? '—'}`
                        const hours = Number(e.totalHours ?? e.totalHoursWorked ?? e.hours ?? 0)
                        const shifts = Number(e.totalShifts ?? e.totalShiftCount ?? e.shifts ?? 0)
                        const positionName = e.positionName || e.position?.name || e.posName || ''
                        return (
                          <tr key={e.userId ?? e.id ?? name} className="hover:bg-surface-container/20 transition-colors">
                            <td className="px-6 py-4 text-on-surface-variant font-medium">{idx + 1}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-on-surface">{name}</span>
                            </td>
                            <td className="px-4 py-4 text-center font-bold text-on-surface">{fmtNumber(shifts)}</td>
                            <td className="px-4 py-4 text-center font-medium text-on-surface">{fmtHours(hours)}</td>
                            {entries.some((x) => x.positionName || x.position?.name) && (
                              <td className="px-4 py-4 text-on-surface-variant font-medium">
                                {positionName || '—'}
                              </td>
                            )}
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

