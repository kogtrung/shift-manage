import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { unwrapApiResponse } from '../../api/apiClient'
import { createGroup } from '../../features/groups/groupApi'
import { addRecentGroup } from '../../features/groups/groupStorage'

export function CreateGroupPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const canSubmit = useMemo(() => name.trim().length > 0 && !isSubmitting, [name, isSubmitting])

  async function onSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setIsSubmitting(true)
    try {
      const payload = await createGroup({ name: name.trim(), description: description.trim() || null })
      const data = unwrapApiResponse(payload)
      const group = { id: data.id, name: data.name, joinCode: data.joinCode, status: data.status }
      addRecentGroup(group)
      setCreated(group)
    } catch (err) {
      setError(err?.message || 'Tạo group thất bại')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline/10 shadow-[0_24px_48px_rgba(0,52,94,0.06)]">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Group</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Tạo group mới</h2>
        </div>

        {error ? (
          <div className="mb-6 bg-error-container/20 text-on-error-container rounded-xl px-4 py-3 text-sm font-medium">
            {error}
          </div>
        ) : null}

        {created ? (
          <div className="mb-6 bg-primary-container/50 text-on-primary-container rounded-2xl px-5 py-4">
            <div className="font-bold text-on-surface">Tạo thành công</div>
            <div className="text-sm mt-1">
              <span className="font-semibold">Join code:</span> {created.joinCode}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-dim transition-colors"
                type="button"
                onClick={() => navigate(`/groups/${created.id}`)}
              >
                Vào group
              </button>
              <button
                className="px-5 py-2.5 bg-surface-container-low text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-high transition-colors"
                type="button"
                onClick={() => setCreated(null)}
              >
                Tạo group khác
              </button>
            </div>
          </div>
        ) : null}

        {!created ? (
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-0.5">
                Tên group
              </label>
              <div className="soft-inset bg-surface-container-low flex items-center px-1 rounded-xl">
                <span className="material-symbols-outlined text-on-surface-variant/60 px-2 text-xl">store</span>
                <input
                  className="w-full bg-transparent border-none focus:ring-0 py-3 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                  placeholder="Main Street Coffee"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant ml-0.5">
                Mô tả (tuỳ chọn)
              </label>
              <div className="bg-surface-container-low rounded-xl px-4 py-3">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/40 font-medium resize-none"
                  placeholder="Mô tả ngắn..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo group'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
