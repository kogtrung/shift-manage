import { useEffect, useMemo, useState } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { getPendingMembers, reviewMember } from '../../features/groups/groupApi'

export function PendingMembersPage() {
  const { groupId } = useParams()
  const { groupInfo } = useOutletContext() || {}
  const numericGroupId = useMemo(() => Number(groupId), [groupId])

  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actingMemberId, setActingMemberId] = useState(null)

  async function load() {
    if (!Number.isFinite(numericGroupId) || numericGroupId <= 0) return
    setError('')
    setIsLoading(true)
    try {
      const payload = await getPendingMembers(numericGroupId)
      const data = unwrapApiResponse(payload)
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [numericGroupId])

  async function act(memberId, action) {
    if (!Number.isFinite(numericGroupId) || numericGroupId <= 0) return
    setActionError('')
    setActingMemberId(memberId)
    try {
      const payload = await reviewMember(numericGroupId, memberId, { action })
      unwrapApiResponse(payload)
      await load()
    } catch (err) {
      setActionError(err?.message || 'Thao tác thất bại')
    } finally {
      setActingMemberId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">
            {groupInfo?.groupName || 'Group'}
          </p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Thành viên chờ duyệt</h2>
          {groupInfo?.joinCode && (
            <p className="text-on-surface-variant font-medium">
              Mã group: <span className="font-bold text-primary">{groupInfo.joinCode}</span>
            </p>
          )}
        </div>
        <button
          className="px-5 py-2.5 bg-surface-container-lowest text-primary font-semibold rounded-xl border border-outline/10 hover:bg-surface-container-low transition-colors flex items-center gap-2"
          type="button"
          onClick={load}
          disabled={isLoading}
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Làm mới
        </button>
      </div>

      {error && (
        <div className="bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">{error}</div>
      )}
      {actionError && (
        <div className="bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">{actionError}</div>
      )}

      {/* Table */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Người yêu cầu</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant hidden md:table-cell">Email</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/5">
            {isLoading ? (
              <tr>
                <td className="px-6 py-8 text-on-surface-variant font-medium text-center" colSpan={4}>
                  <span className="animate-pulse">Đang tải...</span>
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center" colSpan={4}>
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-2 block">check_circle</span>
                  <p className="text-on-surface-variant font-medium">Không có yêu cầu chờ duyệt.</p>
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.memberId} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary text-sm font-bold">
                        {(m.fullName || m.username || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{m.fullName || m.username}</div>
                        <div className="text-xs text-on-surface-variant">@{m.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 hidden md:table-cell">
                    <span className="text-sm text-on-surface-variant">{m.email || '—'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 bg-tertiary-container text-on-tertiary-container text-xs font-semibold rounded-full">
                      Chờ duyệt
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        type="button"
                        onClick={() => act(m.memberId, 'APPROVE')}
                        disabled={actingMemberId === m.memberId}
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Duyệt
                      </button>
                      <button
                        className="px-4 py-2 bg-error text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        type="button"
                        onClick={() => act(m.memberId, 'REJECT')}
                        disabled={actingMemberId === m.memberId}
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
