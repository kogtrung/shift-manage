import { useEffect, useMemo, useState } from "react"
import { getAdminAuditLogs } from "../../features/admin/adminApi"

function formatInstant(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString()
}

export function AdminAuditLogsPage() {
  const [items, setItems] = useState(null)
  const [page, setPage] = useState(0)
  const [size] = useState(20)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await getAdminAuditLogs({ page, size })
      const data = res?.data ?? res
      setItems(data)
    } catch (e) {
      setError(e?.message || "Không thể tải nhật ký quản trị")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const list = items?.content || items?.items || []
  const totalPages = items?.totalPages ?? 0

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Nhật ký quản trị</h2>
        <p className="text-on-surface-variant font-medium">Lịch sử thao tác quản trị hệ thống</p>
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
      ) : (
        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-outline/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Quản trị viên</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Hành động</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Đối tượng</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {list.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-on-surface-variant" colSpan={6}>
                    Không có dữ liệu.
                  </td>
                </tr>
              ) : (
                list.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{formatInstant(row.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">#{row.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-on-surface">{row.adminUsername}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{row.action}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{row.target}</td>
                    <td className="px-6 py-4 text-sm text-on-surface">{row.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-6 py-4 border-t border-outline/10">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page <= 0 || loading}
              className="px-4 py-2 rounded-lg border border-outline/10 hover:bg-surface-container-high disabled:opacity-50"
            >
              Trước
            </button>
            <div className="text-sm text-on-surface-variant">
              Trang {page + 1} / {totalPages || 1}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="px-4 py-2 rounded-lg border border-outline/10 hover:bg-surface-container-high disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

