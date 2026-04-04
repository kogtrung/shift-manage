import { Link, useOutletContext } from 'react-router-dom'

export function GroupsPage() {
  const { groups } = useOutletContext() || { groups: [] }

  const managerGroups = groups.filter((g) => g.myRole === 'MANAGER' && g.myMemberStatus === 'APPROVED')
  const memberGroups = groups.filter((g) => g.myRole === 'MEMBER' && g.myMemberStatus === 'APPROVED')
  const pendingGroups = groups.filter((g) => g.myMemberStatus === 'PENDING')
  const totalActive = managerGroups.length + memberGroups.length

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Workspace</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Nhóm của tôi</h2>
        <p className="text-on-surface-variant font-medium">Chọn group ở sidebar bên trái để bắt đầu điều hướng.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
          <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Đang quản lý</div>
          <div className="text-4xl font-black text-on-surface tracking-tighter">{managerGroups.length}</div>
          <div className="text-xs text-primary font-medium mt-1">Vai trò quản lý</div>
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
          <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Đang tham gia</div>
          <div className="text-4xl font-black text-on-surface tracking-tighter">{memberGroups.length}</div>
          <div className="text-xs text-tertiary font-medium mt-1">Vai trò nhân viên</div>
        </div>
        <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
          <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Chờ duyệt</div>
          <div className="text-4xl font-black text-on-surface tracking-tighter">{pendingGroups.length}</div>
          <div className="text-xs text-amber-600 font-medium mt-1">Chờ duyệt</div>
        </div>
      </div>

      {/* Groups Grid */}
      {totalActive > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4">Nhóm đang hoạt động ({totalActive})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...managerGroups, ...memberGroups].map((g) => (
              <Link
                key={g.groupId}
                to={`/groups/${g.groupId}`}
                className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 hover:bg-surface-container-low hover:shadow-lg transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black flex-shrink-0 ${
                      g.myRole === 'MANAGER'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>
                      {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-lg font-bold text-on-surface tracking-tight truncate">{g.groupName}</h4>
                      {g.description && (
                        <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{g.description}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex-shrink-0 ${
                    g.myRole === 'MANAGER'
                      ? 'bg-primary-container text-on-primary-container'
                      : 'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {g.myRole === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold">Vào group</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pending Groups */}
      {pendingGroups.length > 0 && (
        <div>
          <h3 className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-4">Đang chờ duyệt ({pendingGroups.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingGroups.map((g) => (
              <div
                key={g.groupId}
                className="bg-surface-container-lowest rounded-2xl p-6 border border-outline/10 border-dashed opacity-70"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container text-lg font-black flex-shrink-0">
                    {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold text-on-surface tracking-tight truncate">{g.groupName}</h4>
                    <p className="text-xs text-amber-600 font-medium mt-1">Đang chờ manager phê duyệt</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">group_add</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có group nào</h3>
          <p className="text-on-surface-variant font-medium">Sử dụng nút "Tạo nhóm" hoặc "Tham gia nhóm" ở sidebar bên trái để bắt đầu.</p>
        </div>
      )}
    </div>
  )
}
