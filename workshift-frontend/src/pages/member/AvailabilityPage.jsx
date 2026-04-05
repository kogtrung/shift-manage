import { useEffect, useState } from 'react'
import { unwrapApiArray } from '../../api/apiClient'
import { getMyAvailability, updateMyAvailability } from '../../features/availability/availabilityApi'

/** ISO-8601 giống backend: 1 = Thứ 2 … 7 = Chủ nhật */
const DAYS = [
  { num: 1, label: 'Thứ 2', short: 'T2' },
  { num: 2, label: 'Thứ 3', short: 'T3' },
  { num: 3, label: 'Thứ 4', short: 'T4' },
  { num: 4, label: 'Thứ 5', short: 'T5' },
  { num: 5, label: 'Thứ 6', short: 'T6' },
  { num: 6, label: 'Thứ 7', short: 'T7' },
  { num: 7, label: 'Chủ nhật', short: 'CN' },
]

function fmtTime(t) { return t ? String(t).substring(0, 5) : '' }

function emptySlots() {
  return DAYS.map((d) => ({ dayOfWeek: d.num, slots: [] }))
}

export function AvailabilityPage() {
  const [availability, setAvailability] = useState(() => emptySlots())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function loadData() {
    setLoading(true); setError(null)
    try {
      const res = await getMyAvailability()
      const list = unwrapApiArray(res)
      const grouped = emptySlots()
      list.forEach(item => {
        const dayEntry = grouped.find(g => g.dayOfWeek === item.dayOfWeek)
        if (dayEntry) {
          dayEntry.slots.push({
            id: item.id,
            startTime: fmtTime(item.startTime),
            endTime: fmtTime(item.endTime),
          })
        }
      })
      setAvailability(grouped)
    } catch (err) {
      setError(err?.message || 'Không thể tải lịch rảnh')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function addSlot(dayIdx) {
    setAvailability(prev => {
      const next = prev.map((d, i) => i === dayIdx
        ? { ...d, slots: [...d.slots, { startTime: '08:00', endTime: '17:00' }] }
        : d
      )
      return next
    })
    setSuccess(null)
  }

  function removeSlot(dayIdx, slotIdx) {
    setAvailability(prev => {
      const next = prev.map((d, i) => i === dayIdx
        ? { ...d, slots: d.slots.filter((_, si) => si !== slotIdx) }
        : d
      )
      return next
    })
    setSuccess(null)
  }

  function updateSlot(dayIdx, slotIdx, field, value) {
    setAvailability(prev => {
      const next = prev.map((d, i) => i === dayIdx
        ? {
          ...d, slots: d.slots.map((s, si) => si === slotIdx
            ? { ...s, [field]: value }
            : s
          )
        }
        : d
      )
      return next
    })
    setSuccess(null)
  }

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(null)
    try {
      const slots = []
      availability.forEach((day) => {
        day.slots.forEach((slot) => {
          if (slot.startTime && slot.endTime) {
            slots.push({
              dayOfWeek: Number(day.dayOfWeek),
              startTime: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
              endTime: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
            })
          }
        })
      })
      await updateMyAvailability(slots)
      setSuccess('Cập nhật lịch rảnh thành công!')
      await loadData()
    } catch (err) {
      setError(err?.message || 'Không thể lưu lịch rảnh')
    } finally {
      setSaving(false)
    }
  }

  const totalSlots = availability.reduce((s, d) => s + d.slots.length, 0)

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold tracking-[0.05em] uppercase text-on-surface-variant opacity-70">Cá nhân</p>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Lịch rảnh của tôi</h2>
          <p className="text-on-surface-variant font-medium">Khai báo khung giờ rảnh hàng tuần để hệ thống gợi ý ca phù hợp</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 self-start shadow-md disabled:opacity-50">
          <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : 'save'}</span>
          <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 text-sm flex items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">{success}</span>
          <button onClick={() => setSuccess(null)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
      {error && (
        <div className="bg-error-container/20 text-on-error-container rounded-xl p-4 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {loading && <div className="text-center py-12"><p className="text-on-surface-variant animate-pulse">Đang tải...</p></div>}

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-primary">{totalSlots}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Khung giờ</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{availability.filter(d => d.slots.length > 0).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Ngày có lịch</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{availability.filter(d => d.slots.length === 0).length}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Ngày nghỉ</p>
          </div>
          <div className="bg-surface-container-lowest rounded-xl border border-outline/10 p-4 text-center">
            <p className="text-3xl font-black text-on-surface">
              {(() => {
                let total = 0
                availability.forEach(d => d.slots.forEach(s => {
                  if (s.startTime && s.endTime) {
                    const [sh, sm] = s.startTime.split(':').map(Number)
                    const [eh, em] = s.endTime.split(':').map(Number)
                    total += (eh * 60 + em - sh * 60 - sm) / 60
                  }
                }))
                return total.toFixed(1)
              })()}h
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">Tổng giờ/tuần</p>
          </div>
        </div>
      )}

      {/* Weekly Grid */}
      {!loading && (
        <div className="space-y-3">
          {availability.map((day, dayIdx) => {
            const dayInfo = DAYS[dayIdx]
            const hasSlots = day.slots.length > 0
            return (
              <div key={String(day.dayOfWeek)}
                className={`bg-surface-container-lowest rounded-2xl border transition-all ${hasSlots ? 'border-primary/15 shadow-md' : 'border-outline/10 shadow-sm'}`}>
                {/* Day Header */}
                <div className={`px-5 py-4 flex items-center justify-between border-b ${hasSlots ? 'border-primary/10 bg-primary/[0.02]' : 'border-outline/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${hasSlots ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                      {dayInfo.short}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-on-surface">{dayInfo.label}</h3>
                      <p className="text-xs text-on-surface-variant">
                        {day.slots.length > 0 ? `${day.slots.length} khung giờ` : 'Chưa khai báo'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => addSlot(dayIdx)}
                    className="px-3 py-1.5 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-lg transition-colors flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm giờ
                  </button>
                </div>

                {/* Slots */}
                {day.slots.length > 0 && (
                  <div className="p-4 space-y-2">
                    {day.slots.map((slot, slotIdx) => (
                      <div key={slotIdx} className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3 group">
                        <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                        <input type="time" value={slot.startTime}
                          onChange={e => updateSlot(dayIdx, slotIdx, 'startTime', e.target.value)}
                          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline/20 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        <span className="text-on-surface-variant text-sm font-medium">đến</span>
                        <input type="time" value={slot.endTime}
                          onChange={e => updateSlot(dayIdx, slotIdx, 'endTime', e.target.value)}
                          className="px-3 py-2 bg-surface-container-lowest rounded-lg border border-outline/20 text-on-surface text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                        <button onClick={() => removeSlot(dayIdx, slotIdx)}
                          className="ml-auto p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Xóa khung giờ">
                          <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty hint */}
                {day.slots.length === 0 && (
                  <div className="px-5 py-6 text-center">
                    <p className="text-xs text-on-surface-variant opacity-40 italic">Nhấn "Thêm giờ" để khai báo khung giờ rảnh</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
