import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { useAuth } from "../features/auth/AuthContext"
import { logout } from "../features/auth/authApi"
import { useMemo } from "react"

const ADMIN_NAV = [
  { to: "", label: "Bảng điều khiển", icon: "dashboard", end: true },
  { to: "users", label: "Người dùng", icon: "person", end: false },
  { to: "groups", label: "Nhóm", icon: "groups", end: false },
  { to: "audit-logs", label: "Nhật ký quản trị", icon: "history", end: false },
]

export function AdminLayout() {
  const { user, clearTokens } = useAuth()
  const navigate = useNavigate()

  const activeUserLabel = useMemo(() => {
    return user?.fullName || user?.username || "Quản trị viên"
  }, [user])

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // ignore
    }
    clearTokens()
    navigate("/auth/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      <aside className="hidden md:flex flex-col p-4 gap-y-2 h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low custom-scrollbar overflow-y-auto">
        <div className="px-2 py-6 mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
            </div>
            <span className="text-lg font-black text-on-surface tracking-tight">Quản trị viên</span>
          </div>
          <p className="text-on-surface-variant text-xs opacity-70 mt-1">Quản trị hệ thống</p>
        </div>

        <nav className="flex-1 space-y-2">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to ? `/admin/${item.to}` : "/admin"}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${
                  isActive ? "sidebar-link-active" : "text-on-surface-variant hover:bg-surface-container-highest/30"
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="w-full sticky top-0 z-50 bg-surface flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-on-surface">Quản trị WorkShift</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface">{activeUserLabel}</p>
                <p className="text-xs text-on-surface-variant">Quyền hệ thống: ADMIN</p>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 text-on-surface-variant hover:bg-error-container/20 hover:text-on-error-container transition-colors duration-200 rounded-full active:scale-95"
              >
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

