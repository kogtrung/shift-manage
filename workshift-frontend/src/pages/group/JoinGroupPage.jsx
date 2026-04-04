import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { unwrapApiArray, unwrapApiResponse } from '../../api/apiClient'
import { getMyGroups, joinGroupByCode } from '../../features/groups/groupApi'
import { addRecentGroup } from '../../features/groups/groupStorage'

export function JoinGroupPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [joinCode, setJoinCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const raw = searchParams.get('prefill') || searchParams.get('code') || ''
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    if (normalized) setJoinCode(normalized)
  }, [searchParams])

  const canSubmit = useMemo(() => joinCode.trim().length > 0 && !isSubmitting, [joinCode, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setIsSubmitting(true)
    try {
      const payload = await joinGroupByCode({ joinCode: joinCode.trim() })
      const data = unwrapApiResponse(payload)

      let name = `Group #${data.groupId}`
      try {
        const list = unwrapApiArray(await getMyGroups())
        const found = list.find((g) => String(g.groupId) === String(data.groupId))
        if (found?.groupName) name = found.groupName
      } catch {
        /* ignore */
      }

      addRecentGroup({
        id: data.groupId,
        name,
        joinCode: joinCode.trim(),
        status: data.status,
      })
      navigate(`/groups/${data.groupId}`, { replace: true })
    } catch (err) {
      setError(err?.message || 'Tham gia nhóm thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-5xl">
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dim p-6 text-on-primary shadow-[0_20px_50px_rgba(0,86,210,0.25)] lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <span className="material-symbols-outlined text-2xl">login</span>
          </div>
          <div>
            <p className="text-lg font-extrabold">Tham gia nhóm</p>
            <p className="text-xs font-medium text-white/75">Nhập mã 6 ký tự từ quản lý.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 lg:items-stretch">
        <div className="relative hidden overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-primary-dim p-10 text-on-primary shadow-[0_24px_60px_rgba(0,86,210,0.3)] lg:col-span-5 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl">login</span>
            </div>
            <h2 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight">Tham gia nhóm</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-white/75">
              Nhập mã 6 ký tự do quản lý cấp. Sau khi gửi, bạn có thể ở trạng thái chờ duyệt tùy cài đặt nhóm.
            </p>
          </div>
          <div className="relative mt-10 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-lg bg-white/15 px-3 py-1.5">Bảo mật JWT</span>
            <span className="rounded-lg bg-white/15 px-3 py-1.5">Mã không phân biệt hoa thường</span>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-outline/10 bg-white p-8 shadow-[0_20px_60px_rgba(25,27,35,0.06)] md:p-10">
            <div className="mb-8 space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#737785]">Group</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#191b23]">Join bằng mã</h1>
              <p className="text-sm font-medium text-[#64748b]">Mã gồm 6 ký tự (chữ và số), không chứa I, O, 0, 1 để tránh nhầm lẫn.</p>
            </div>

            {error ? (
              <div className="mb-6 rounded-xl border border-error/20 bg-error-container/15 px-4 py-3 text-sm font-medium text-on-error-container">
                {error}
              </div>
            ) : null}

            <form className="space-y-8" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="ml-0.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#737785]">Mã tham gia</label>
                <div className="soft-inset flex items-center rounded-xl bg-[#f2f3fe] px-2">
                  <span className="material-symbols-outlined px-2 text-2xl text-primary/70">vpn_key</span>
                  <input
                    className="w-full border-none bg-transparent py-4 text-lg font-bold uppercase tracking-[0.35em] text-[#191b23] placeholder:text-[#94a3b8] focus:ring-0"
                    placeholder="••••••"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <button
                className="w-full rounded-xl bg-[#0056d2] py-4 text-sm font-bold text-white shadow-[0_16px_40px_rgba(0,86,210,0.25)] transition hover:bg-primary-dim active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
                type="submit"
                disabled={!canSubmit}
              >
                {isSubmitting ? 'Đang gửi yêu cầu…' : 'Gửi yêu cầu tham gia'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
