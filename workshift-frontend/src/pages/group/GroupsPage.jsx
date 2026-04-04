import { Link, useOutletContext } from 'react-router-dom'

function StatCard({ label, value, hint, hintClass = 'text-primary' }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/50 p-6 shadow-[0_20px_60px_rgba(25,27,35,0.04)] backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#737785]">{label}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-[#191b23]">{value}</p>
      {hint ? <p className={`mt-1 text-xs font-semibold ${hintClass}`}>{hint}</p> : null}
    </div>
  )
}

export function GroupsPage() {
  const { groups } = useOutletContext() || { groups: [] }

  const managerGroups = groups.filter((g) => g.myRole === 'MANAGER' && g.myMemberStatus === 'APPROVED')
  const memberGroups = groups.filter((g) => g.myRole === 'MEMBER' && g.myMemberStatus === 'APPROVED')
  const pendingGroups = groups.filter((g) => g.myMemberStatus === 'PENDING')
  const totalActive = managerGroups.length + memberGroups.length

  return (
    <div className="w-full max-w-[1100px] space-y-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737785]">Workspace</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#191b23] md:text-[2.5rem] md:leading-tight">Nhóm của tôi</h1>
          <p className="text-sm font-medium leading-relaxed text-[#64748b]">
            Quản lý và tham gia các nhóm ca làm. Chọn một nhóm ở sidebar hoặc từ danh sách bên dưới để bắt đầu.
          </p>
        </div>
        <div className="hidden shrink-0 rounded-2xl bg-gradient-to-br from-primary to-primary-dim p-8 text-on-primary shadow-[0_20px_50px_rgba(0,86,210,0.25)] lg:flex lg:w-[280px] lg:flex-col lg:justify-between">
          <div>
            <span className="material-symbols-outlined text-4xl opacity-90">groups</span>
            <p className="mt-4 text-lg font-bold leading-snug">WorkShift</p>
            <p className="mt-1 text-sm font-medium text-white/75">Đồng bộ lịch và ca làm với cả nhóm.</p>
          </div>
          <div className="mt-6 flex gap-2 text-xs font-semibold text-white/80">
            <span className="rounded-md bg-white/15 px-2 py-1">Tạo nhóm</span>
            <span className="rounded-md bg-white/15 px-2 py-1">Mã tham gia</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Đang quản lý" value={managerGroups.length} hint="Vai trò quản lý" />
        <StatCard label="Đang tham gia" value={memberGroups.length} hint="Vai trò nhân viên" hintClass="text-tertiary" />
        <StatCard label="Chờ duyệt" value={pendingGroups.length} hint="Chờ duyệt" hintClass="text-amber-600" />
      </div>

      {totalActive > 0 && (
        <div>
          <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#737785]">
            Nhóm đang hoạt động ({totalActive})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[...managerGroups, ...memberGroups].map((g) => (
              <Link
                key={g.groupId}
                to={`/groups/${g.groupId}`}
                className="group flex flex-col rounded-xl border border-outline/10 bg-white p-6 shadow-[0_20px_60px_rgba(25,27,35,0.04)] transition hover:border-primary/25 hover:shadow-[0_24px_48px_rgba(0,86,210,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-black ${
                        g.myRole === 'MANAGER' ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-[#191b23]">{g.groupName}</h3>
                      {g.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-[#64748b]">{g.description}</p>
                      ) : (
                        <p className="mt-1 text-sm text-[#94a3b8]">Chưa có mô tả</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      g.myRole === 'MANAGER'
                        ? 'bg-[rgba(0,64,161,0.1)] text-[#0040a1]'
                        : 'bg-tertiary-container text-on-tertiary-container'
                    }`}
                  >
                    {g.myRole === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-2 text-xs font-bold text-primary opacity-0 transition group-hover:opacity-100">
                  Vào nhóm
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {pendingGroups.length > 0 && (
        <div>
          <h2 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#737785]">
            Đang chờ duyệt ({pendingGroups.length})
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {pendingGroups.map((g) => (
              <div
                key={g.groupId}
                className="rounded-xl border border-dashed border-outline/20 bg-white/60 p-6 opacity-90 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-lg font-black text-on-secondary-container">
                    {g.groupName?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-[#191b23]">{g.groupName}</h3>
                    <p className="mt-1 text-xs font-semibold text-amber-600">Đang chờ quản lý phê duyệt</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {groups.length === 0 && (
        <div className="rounded-2xl border border-dashed border-outline/15 bg-white/70 py-20 text-center shadow-inner">
          <span className="material-symbols-outlined text-5xl text-[#cbd5e1]">group_add</span>
          <h3 className="mt-4 text-xl font-bold text-[#191b23]">Chưa có nhóm nào</h3>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-[#64748b]">
            Dùng &quot;Tạo nhóm&quot; hoặc &quot;Tham gia nhóm&quot; ở sidebar để thêm nhóm đầu tiên.
          </p>
        </div>
      )}
    </div>
  )
}
