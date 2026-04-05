import { useEffect, useState } from "react"
import { getAdminMetrics } from "../../features/admin/adminApi"

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function load() {
    setLoading(true)
    setError("")
    try {
      const res = await getAdminMetrics()
      const data = Array.isArray(res) ? res : (res?.data ?? res)
      setMetrics(data)
    } catch (e) {
      setError(e?.message || "Không thể tải metrics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="w-full space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">
          Quản trị
        </p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Dashboard hệ thống</h2>
        <p className="text-on-surface-variant font-medium">Theo dõi tình trạng vận hành hiện tại</p>
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
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-on-surface">{metrics.totalUsers ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng người dùng</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{metrics.activeUsers ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Người dùng hoạt động</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-error">{metrics.bannedUsers ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Người dùng bị khóa</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-primary">{metrics.failedLogins ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Lần đăng nhập thất bại</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-on-surface">{metrics.totalGroups ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng nhóm</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-emerald-600">{metrics.activeGroups ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Nhóm đang hoạt động</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-amber-600">{metrics.inactiveGroups ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Nhóm không hoạt động</p>
            </div>
            <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
              <p className="text-3xl font-black text-error">{metrics.activeWarnings ?? "—"}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Cảnh báo đang hoạt động</p>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

