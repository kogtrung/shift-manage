import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { getAuditLogs, getDailySummary, getMonthlySummary } from '../../features/audit/auditApi'
import { formatLocalISODate } from '../../utils/dateUtils'

const ACTION_TYPE_LABELS = {
  GROUP_CREATED: 'Tạo nhóm',
  GROUP_MEMBER_JOIN_REQUESTED: 'Yêu cầu tham gia',
  GROUP_MEMBER_APPROVED: 'Duyệt thành viên',
  GROUP_MEMBER_REJECTED: 'Từ chối thành viên',
}

const ENTITY_TYPE_LABELS = {
  GROUP: 'Nhóm',
  GROUP_MEMBER: 'Thành viên',
}

const ACTOR_ROLE_LABELS = {
  MANAGER: 'Quản lý',
  MEMBER: 'Thành viên',
  SYSTEM: 'Hệ thống',
}

function friendlyActionType(raw) {
  return ACTION_TYPE_LABELS[raw] || raw
}

function friendlyEntityType(raw) {
  return ENTITY_TYPE_LABELS[raw] || raw
}

function friendlyActorRole(raw) {
  return ACTOR_ROLE_LABELS[raw] || raw
}

export function AuditLogsPage() {
  const { groupId } = useParams()
  const numericGroupId = useMemo(() => Number(groupId), [groupId])

  const today = useMemo(() => new Date(), [])
  const yyyy = today.getFullYear()
  const mm = today.getMonth() + 1
  const isoDate = formatLocalISODate(today)

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [actionType, setActionType] = useState('')
  const [actorUserId, setActorUserId] = useState('')
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const [logs, setLogs] = useState(null)
  const [daily, setDaily] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [dailyDate, setDailyDate] = useState(isoDate)
  const [monthlyMonth, setMonthlyMonth] = useState(mm)
  const [monthlyYear, setMonthlyYear] = useState(yyyy)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    if (!Number.isFinite(numericGroupId) || numericGroupId <= 0) return
    setError('')
    setIsLoading(true)
    try {
      const payload = await getAuditLogs(numericGroupId, {
        from: from || null,
        to: to || null,
        actionType: actionType || null,
        actorUserId: actorUserId || null,
        entityType: entityType || null,
        entityId: entityId || null,
        page,
        size,
      })
      const data = unwrapApiResponse(payload)
      setLogs(data)
    } catch (err) {
      setError(err?.message || 'Không thể tải audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadSummaries() {
    if (!Number.isFinite(numericGroupId) || numericGroupId <= 0) return
    try {
      const [dailyPayload, monthlyPayload] = await Promise.all([
        getDailySummary(numericGroupId, { date: dailyDate }),
        getMonthlySummary(numericGroupId, { month: monthlyMonth, year: monthlyYear }),
      ])
      setDaily(unwrapApiResponse(dailyPayload))
      setMonthly(unwrapApiResponse(monthlyPayload))
    } catch {
      setDaily(null)
      setMonthly(null)
    }
  }

  useEffect(() => {
    load()
  }, [numericGroupId, page, size])

  useEffect(() => {
    loadSummaries()
  }, [numericGroupId, dailyDate, monthlyMonth, monthlyYear])

  function formatInstant(value) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleString()
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Nhóm</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Lịch sử hoạt động</h2>
          <p className="text-on-surface-variant font-medium">Theo dõi các thay đổi trong nhóm</p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-5 py-2.5 bg-surface-container-lowest text-primary font-semibold rounded-xl border border-outline/10 hover:bg-surface-container-low transition-colors"
            type="button"
            onClick={load}
            disabled={isLoading}
          >
            Làm mới
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/10">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tổng hợp ngày</div>
          <div className="mt-4 flex gap-3 items-center">
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-on-surface">{daily?.totalEvents ?? '—'}</div>
            <div className="text-sm text-on-surface-variant font-medium mt-1">Tổng sự kiện</div>
          </div>
          <div className="mt-4 space-y-2">
            {(daily?.byAction || []).map((x) => (
              <div key={x.actionType} className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-2">
                <div className="text-xs font-bold text-on-surface-variant">{friendlyActionType(x.actionType)}</div>
                <div className="text-xs font-bold text-on-surface">{x.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/10">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tổng hợp tháng</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
              type="number"
              min={1}
              max={12}
              value={monthlyMonth}
              onChange={(e) => setMonthlyMonth(Number(e.target.value))}
            />
            <input
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
              type="number"
              min={2000}
              max={2100}
              value={monthlyYear}
              onChange={(e) => setMonthlyYear(Number(e.target.value))}
            />
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-on-surface">{monthly?.totalEvents ?? '—'}</div>
            <div className="text-sm text-on-surface-variant font-medium mt-1">Tổng sự kiện</div>
          </div>
          <div className="mt-4 space-y-2">
            {(monthly?.byAction || []).map((x) => (
              <div key={x.actionType} className="flex items-center justify-between bg-surface-container-low rounded-xl px-4 py-2">
                <div className="text-xs font-bold text-on-surface-variant">{friendlyActionType(x.actionType)}</div>
                <div className="text-xs font-bold text-on-surface">{x.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/10">
          <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Bộ lọc</div>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                placeholder="from (YYYY-MM-DD)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                placeholder="to (YYYY-MM-DD)"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <select
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option value="">Tất cả hành động</option>
              {Object.entries(ACTION_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                placeholder="ID người thực hiện"
                type="number"
                value={actorUserId}
                onChange={(e) => setActorUserId(e.target.value)}
              />
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                placeholder="ID đối tượng"
                type="number"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
              />
            </div>
            <select
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">Tất cả đối tượng</option>
              {Object.entries(ENTITY_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                type="number"
                min={0}
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
              />
              <input
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary text-sm font-medium"
                type="number"
                min={1}
                max={200}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </div>
            <button
              className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary py-3 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
              type="button"
              onClick={() => {
                setPage(0)
                load()
              }}
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Thời gian</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hành động</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Người thực hiện</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Đối tượng</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Mô tả</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/5">
            {isLoading ? (
              <tr>
                <td className="px-6 py-6 text-on-surface-variant font-medium" colSpan={5}>
                  Đang tải...
                </td>
              </tr>
            ) : !logs?.items?.length ? (
              <tr>
                <td className="px-6 py-6 text-on-surface-variant font-medium" colSpan={5}>
                  Không có dữ liệu.
                </td>
              </tr>
            ) : (
              logs.items.map((row) => (
                <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-5 text-sm font-medium text-on-surface">{formatInstant(row.occurredAt)}</td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-primary-container text-on-primary-container text-xs font-semibold rounded-full">
                      {friendlyActionType(row.actionType)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface">
                    <div className="font-bold">{row.actorFullName || row.actorUsername}</div>
                    <div className="text-xs text-on-surface-variant font-medium">{friendlyActorRole(row.actorRole)}</div>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface">
                    <div className="font-bold">{friendlyEntityType(row.entityType)}</div>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface">{row.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
