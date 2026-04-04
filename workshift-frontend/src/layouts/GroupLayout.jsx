import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { logout } from '../features/auth/authApi'
import { getMyGroups } from '../features/groups/groupApi'
import { unwrapApiArray } from '../api/apiClient'

const MANAGER_NAV = [
  { to: '', icon: 'dashboard', label: 'Tổng quan', end: true },
  { to: 'shifts', icon: 'calendar_month', label: 'Quản lý ca' },
  { to: 'alerts', icon: 'warning', label: 'Cảnh báo' },
  { to: 'members/pending', icon: 'person_add', label: 'Duyệt thành viên' },
  { to: 'shift-change-requests', icon: 'swap_horiz', label: 'Yêu cầu đổi ca' },
  { to: 'payroll', icon: 'receipt_long', label: 'Bảng lương' },
  { to: 'performance', icon: 'insights', label: 'Báo cáo hoạt động' },
  { to: 'members', icon: 'group', label: 'Thành viên' },
  { to: 'positions', icon: 'work', label: 'Vị trí' },
  { to: 'shift-templates', icon: 'schedule', label: 'Ca mẫu' },
  { to: 'salary-configs', icon: 'payments', label: 'Cấu hình lương' },
  { to: 'audit-logs', icon: 'history', label: 'Nhật ký quản trị' },
  { to: 'settings', icon: 'settings', label: 'Cài đặt' },
]

const STAFF_NAV = [
  { to: '', icon: 'dashboard', label: 'Tổng quan', end: true },
  { to: 'shifts', icon: 'calendar_month', label: 'Lịch ca' },
  { to: 'my-schedule', icon: 'date_range', label: 'Lịch của tôi' },
  { to: 'availability', icon: 'event_available', label: 'Lịch rảnh' },
  { to: 'profile', icon: 'person', label: 'Thông tin cá nhân' },
  { to: 'settings', icon: 'settings', label: 'Cài đặt' },
]

export function GroupLayout() {
  const { groupId } = useParams()
  const { user, clearTokens } = useAuth()
  const navigate = useNavigate()
  const [groupInfo, setGroupInfo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getMyGroups()
      .then((res) => {
        if (cancelled) return
        const list = unwrapApiArray(res)
        const found = list.find((g) => String(g.groupId) === String(groupId))
        setGroupInfo(found || null)
      })
      .catch((err) => {
        console.error('[GroupLayout] Failed to load groups:', err)
        if (!cancelled) setGroupInfo(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [groupId])

  const isManager = groupInfo?.myRole === 'MANAGER'
  const navItems = isManager ? MANAGER_NAV : STAFF_NAV
  const roleLabel = isManager ? 'Chế độ quản lý' : 'Chế độ nhân viên'

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    clearTokens()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex">
      <aside className="hidden md:flex flex-col p-4 gap-y-2 h-screen w-64 fixed left-0 top-0 z-40 bg-surface-container-low custom-scrollbar overflow-y-auto">
        <div className="px-2 py-6 mb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${isManager ? 'bg-primary text-on-primary' : 'bg-tertiary text-on-tertiary'}`}>
              {groupInfo?.groupName?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <span className="text-lg font-black text-on-surface tracking-tight truncate">
              {loading ? '...' : (groupInfo?.groupName || `Group #${groupId}`)}
            </span>
          </div>
          <p className="text-on-surface-variant text-xs opacity-70 mt-1">{roleLabel}</p>
          {groupInfo?.joinCode && (
            <div className="mt-3 bg-surface-container rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant opacity-60 mb-1">Mã tham gia</p>
              <p className="text-sm font-black text-primary tracking-widest">{groupInfo.joinCode}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={`/groups/${groupId}/${item.to}`} end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : 'text-on-surface-variant hover:bg-surface-container-highest/30'}`}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-2 border-t border-outline-variant/10">
          <Link to="/app/groups" className="sidebar-link text-on-surface-variant hover:bg-surface-container-highest/30">
            <span className="material-symbols-outlined">arrow_back</span>
            <span>Về danh sách nhóm</span>
          </Link>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="w-full sticky top-0 z-50 bg-surface flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/app/groups" className="text-xl font-bold tracking-tight text-on-surface">WorkShift</Link>
            <span className="text-outline-variant opacity-30 text-xl font-light">/</span>
            <span className="text-on-surface-variant font-medium truncate max-w-[200px]">
              {groupInfo?.groupName || `Group #${groupId}`}
            </span>
            {groupInfo && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isManager ? 'bg-primary-container text-on-primary-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                {isManager ? 'Quản lý' : 'Nhân viên'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pl-4 border-l border-outline-variant/20">
              {user && (
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-on-surface">{user.fullName || user.username || 'Người dùng'}</p>
                  <p className="text-xs text-on-surface-variant">{isManager ? 'Quản lý' : 'Nhân viên'}</p>
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
          <Outlet context={{ groupInfo, isManager }} />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-lowest flex justify-around items-center py-3 z-50 border-t border-outline/10">
        {navItems.map((item) => (
          <NavLink key={item.to} to={`/groups/${groupId}/${item.to}`} end={item.end}
            className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="text-[10px] font-bold">{item.label}</span>
          </NavLink>
        ))}
        <Link to="/app/groups" className="flex flex-col items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
          <span className="text-[10px] font-bold">Danh sách nhóm</span>
        </Link>
      </nav>
    </div>
  )
}
