import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { joinGroupByCode } from '../../features/groups/groupApi'
import { addRecentGroup } from '../../features/groups/groupStorage'

export function JoinGroupPage() {
  const navigate = useNavigate()

  const [joinCode, setJoinCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = useMemo(() => joinCode.trim().length > 0 && !isSubmitting, [joinCode, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setIsSubmitting(true)
    try {
      const payload = await joinGroupByCode({ joinCode: joinCode.trim() })
      const data = unwrapApiResponse(payload)
      addRecentGroup({ id: data.groupId, name: `Group #${data.groupId}`, joinCode: joinCode.trim(), status: data.status })
      navigate(`/groups/${data.groupId}`, { replace: true })
    } catch (err) {
      setError(err?.message || 'Join group thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline/10 shadow-[0_24px_48px_rgba(0,52,94,0.06)]">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Group</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Join group bằng mã</h2>
          <p className="text-on-surface-variant mt-2 text-sm font-medium">
            Nhập joinCode 6 ký tự do quản lý cung cấp.
          </p>
        </div>

        {error ? (
          <div className="mb-6 bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        ) : null}

        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-0.5">
              Join code
            </label>
            <div className="soft-inset bg-surface-container-low flex items-center px-1 rounded-xl">
              <span className="material-symbols-outlined text-on-surface-variant/60 px-2 text-xl">vpn_key</span>
              <input
                className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-on-surface-variant/40 font-medium uppercase tracking-widest"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
          </div>

          <button
            className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu tham gia'}
          </button>
        </form>
      </div>
    </div>
  )
}
