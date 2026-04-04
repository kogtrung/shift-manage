import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthContext'
import { logout } from '../features/auth/authApi'
import { getMyGroups } from '../features/groups/groupApi'
import { unwrapApiArray } from '../api/apiClient'

export function AppLayout() {
  const { user, clearTokens } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMyGroups()
      .then((res) => {
        if (!cancelled) setGroups(unwrapApiArray(res))
      })
      .catch((err) => {
        console.error('[AppLayout] Failed to load groups:', err)
        if (!cancelled) setGroups([])
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  function refreshGroups() {
    getMyGroups()
      .then((res) => {
        setGroups(unwrapApiArray(res))
      })
      .catch((err) => console.error('[AppLayout] Failed to refresh groups:', err))
  }

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    clearTokens()
    navigate('/auth/login', { replace: true })
  }

  const managerGroups = groups.filter((g) => g.myRole === 'MANAGER' && g.myMemberStatus === 'APPROVED')
  const memberGroups = groups.filter((g) => g.myRole === 'MEMBER' && g.myMemberStatus === 'APPROVED')
  const pendingGroups = groups.filter((g) => g.myMemberStatus === 'PENDING')

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col p-4 gap-y-2 h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low custom-scrollbar overflow-y-auto">
        <div className="px-2 py-6 mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center text-on-primary shadow-sm">
              <span className="material-symbols-outlined text-sm">schedule</span>
            </div>
            <span className="text-lg font-black text-on-surface tracking-tight">WorkShift</span>
          </div>
          <p className="text-on-surface-variant text-xs opacity-70 mt-1">Quản lý ca làm việc</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
          {managerGroups.length > 0 && (
            <div>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">Quản lý</p>
              <div className="space-y-1">
                {managerGroups.map((g) => (
                  <NavLink key={g.groupId} to={`/groups/${g.groupId}`}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'text-on-surface-variant hover:bg-surface-container-highest/30'}`}>
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                      {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{g.groupName}</span>
                      <span className="block text-[10px] text-primary font-medium">Quản lý</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {memberGroups.length > 0 && (
            <div>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">Nhân viên</p>
              <div className="space-y-1">
                {memberGroups.map((g) => (
                  <NavLink key={g.groupId} to={`/groups/${g.groupId}`}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'text-on-surface-variant hover:bg-surface-container-highest/30'}`}>
                    <div className="w-7 h-7 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary text-xs font-bold flex-shrink-0">
                      {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{g.groupName}</span>
                      <span className="block text-[10px] text-tertiary font-medium">Nhân viên</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            </div>
          )}

          {pendingGroups.length > 0 && (
            <div>
              <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-2">Đang chờ duyệt</p>
              <div className="space-y-1">
                {pendingGroups.map((g) => (
                  <div key={g.groupId} className="sidebar-link text-on-surface-variant opacity-60 cursor-not-allowed">
                    <div className="w-7 h-7 rounded-lg bg-secondary-container flex items-center justify-center text-on-secondary-container text-xs font-bold flex-shrink-0">
                      {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm">{g.groupName}</span>
                      <span className="block text-[10px] text-amber-600 font-medium">Chờ duyệt</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div className="px-4 py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-2">group_add</span>
              <p className="text-xs text-on-surface-variant opacity-50">Chưa tham gia group nào</p>
            </div>
          )}
          {loading && (
            <div className="px-4 py-8 text-center">
              <p className="text-xs text-on-surface-variant opacity-50 animate-pulse">Đang tải...</p>
            </div>
          )}
        </nav>

        <div className="mt-auto pt-4 space-y-2 border-t border-outline-variant/10">
          <Link to="/app/groups/create"
            className="w-full primary-gradient text-on-primary py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Tạo nhóm</span>
          </Link>
          <Link to="/app/groups/join"
            className="sidebar-link text-on-surface-variant hover:bg-surface-container-highest/30 justify-center">
            <span className="material-symbols-outlined text-sm">login</span>
            <span>Tham gia nhóm</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="w-full sticky top-0 z-50 bg-surface flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/app/groups" className="text-xl font-bold tracking-tight text-on-surface">WorkShift</Link>
            {user?.globalRole === 'ADMIN' && (
              <Link
                to="/admin"
                className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-outline/10 text-on-surface-variant font-semibold hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                Quản trị
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-on-surface">{user.fullName || user.username || 'Người dùng'}</p>
                  <p className="text-xs text-on-surface-variant">{user.globalRole === 'ADMIN' ? 'Quản trị' : 'Người dùng'}</p>
                </div>
              )}
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm border-2 border-white shadow-sm">
                {(user?.fullName || user?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <button onClick={handleLogout} title="Đăng xuất"
                className="p-2 text-on-surface-variant hover:bg-error-container/20 hover:text-on-error-container transition-colors duration-200 rounded-full active:scale-95">
                <span className="material-symbols-outlined">logout</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet context={{ groups, refreshGroups }} />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest flex justify-around items-center py-3 z-50 border-t border-outline/10">
        <NavLink to="/app/groups" end className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-bold">Trang chủ</span>
        </NavLink>
        <NavLink to="/app/groups/create" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">add_circle</span>
          <span className="text-[10px] font-bold">Tạo</span>
        </NavLink>
        <NavLink to="/app/groups/join" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          <span className="material-symbols-outlined">login</span>
          <span className="text-[10px] font-bold">Tham gia</span>
        </NavLink>
      </nav>
    </div>
  )
}
