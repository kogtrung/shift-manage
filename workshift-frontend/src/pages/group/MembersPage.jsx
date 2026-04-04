import { useEffect, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getGroupMembers } from '../../features/groups/groupApi'
import { unwrapApiArray } from '../../api/apiClient'

export function MembersPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getGroupMembers(groupId)
      .then((res) => {
        if (!cancelled) {
          setMembers(unwrapApiArray(res))
        }
      })
      .catch((err) => { if (!cancelled) setError(err?.message || 'Không thể tải danh sách thành viên') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [groupId])

  const managers = members.filter((m) => m.role === 'MANAGER')
  const staff = members.filter((m) => m.role === 'MEMBER')

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Nội bộ</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Thành viên</h2>
        </div>
        <div className="text-sm text-on-surface-variant font-medium">
          {members.length} thành viên
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-on-surface-variant animate-pulse">Đang tải...</p>
        </div>
      )}

      {error && (
        <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-center">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Tên</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant hidden lg:table-cell">Ngày tham gia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/5">
              {[...managers, ...staff].map((member) => (
                <tr key={member.memberId} className="hover:bg-surface-container-lowest transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        member.role === 'MANAGER' 
                          ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}>
                        {(member.fullName || member.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{member.fullName || member.username}</div>
                        <div className="text-xs text-on-surface-variant">@{member.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      member.role === 'MANAGER'
                        ? 'bg-primary-container text-on-primary-container'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}>
                      {member.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="text-sm text-on-surface-variant">{member.email || '—'}</span>
                  </td>
                  <td className="px-6 py-5 hidden lg:table-cell">
                    <span className="text-sm text-on-surface-variant">
                      {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && members.length === 0 && (
        <div className="text-center py-16 bg-surface-container-lowest rounded-2xl border border-outline/10 border-dashed">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant opacity-20 mb-4">group</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">Chưa có thành viên</h3>
          <p className="text-on-surface-variant font-medium">Chia sẻ mã tham gia để mời thành viên mới.</p>
        </div>
      )}

      {/* Stats */}
      {!loading && members.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
            <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Tổng thành viên</div>
            <div className="text-4xl font-black text-on-surface tracking-tighter">{members.length}</div>
          </div>
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
            <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Quản lý</div>
            <div className="text-4xl font-black text-on-surface tracking-tighter">{managers.length}</div>
          </div>
          <div className="p-6 bg-surface-container-lowest rounded-xl shadow-[0_24px_48px_rgba(0,52,94,0.06)] border border-outline/5">
            <div className="text-xs font-bold tracking-widest text-on-surface-variant uppercase mb-2">Nhân viên</div>
            <div className="text-4xl font-black text-on-surface tracking-tighter">{staff.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
