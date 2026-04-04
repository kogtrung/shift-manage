import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { getTemplates } from '../../features/shifts/shiftTemplateApi'
import { getShifts, createShift, createShiftsBulk, deleteShift } from '../../features/shifts/shiftApi'
import { getPositions } from '../../features/positions/positionApi'
import { getRequirements, createRequirement, deleteRequirement } from '../../features/shifts/shiftRequirementApi'
import { registerShift, getPendingRegistrations, approveRegistration, rejectRegistration, assignShift } from '../../features/registrations/registrationApi'
import { getMyPositions } from '../../features/memberPosition/memberPositionApi'
import { getGroupMembers } from '../../features/groups/groupApi'
import { ShiftLockModal } from '../../features/shifts/components/ShiftLockModal'
import { ShiftRecommendationsModal } from '../../features/shifts/components/ShiftRecommendationsModal'
import { formatLocalISODate } from '../../utils/dateUtils'
import { unwrapApiArray, unwrapApiResponse } from '../../api/apiClient'
import { getMyCalendar } from '../../features/calendar/calendarApi'

/* ───── date helpers ───── */
function startOfWeek(d) {
  const dt = new Date(d)
  const day = dt.getDay()
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  dt.setHours(0, 0, 0, 0)
  return dt
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r }
function fmtISO(d) { return formatLocalISODate(d) }
function fmtTime(t) { return t ? String(t).substring(0, 5) : '—' }
function isToday(d) { return fmtISO(d) === fmtISO(new Date()) }

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN']
const MONTH_NAMES = ['Th01', 'Th02', 'Th03', 'Th04', 'Th05', 'Th06', 'Th07', 'Th08', 'Th09', 'Th10', 'Th11', 'Th12']

const STATUS_CFG = {
  OPEN: { label: 'Mở', cls: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
  LOCKED: { label: 'Khóa', cls: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
  COMPLETED: { label: 'Xong', cls: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-600' },
}

export function ShiftsPage() {
  const { groupId } = useParams()
  const { isManager } = useOutletContext() || {}

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [shifts, setShifts] = useState([])
  const [templates, setTemplates] = useState([])
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Manager: pending count per shift (B14 - Chờ duyệt)
  const [pendingCountsByShiftId, setPendingCountsByShiftId] = useState({})

  // create form
  const [showCreate, setShowCreate] = useState(false)
  const [createDate, setCreateDate] = useState('')
  const [formName, setFormName] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formTpl, setFormTpl] = useState('')
  const [formNote, setFormNote] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState(null)

  // requirement panel
  const [selShift, setSelShift] = useState(null)
  const [reqs, setReqs] = useState([])
  const [loadingReqs, setLoadingReqs] = useState(false)
  const [reqPos, setReqPos] = useState('')
  const [reqQty, setReqQty] = useState(1)
  const [addingReq, setAddingReq] = useState(false)
  const [reqErr, setReqErr] = useState(null)

  // B14/B15: pending registrations
  const [pendingRegs, setPendingRegs] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [actioningId, setActioningId] = useState(null)

  // B16: assign shift
  const [members, setMembers] = useState([])
  const [assignUserId, setAssignUserId] = useState('')
  const [assignPosId, setAssignPosId] = useState('')
  const [assignNote, setAssignNote] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignErr, setAssignErr] = useState(null)

  // Panel Tabs
  const [activeTab, setActiveTab] = useState('requirements') // 'requirements', 'pending', 'assign'

  // B20: Khóa ca (OPEN -> LOCKED)
  const [lockShiftModalShift, setLockShiftModalShift] = useState(null)

  // B18: Gợi ý nhân viên
  const [recommendModalState, setRecommendModalState] = useState(null)

  // registration modal
  const [regShift, setRegShift] = useState(null)
  const [regPosId, setRegPosId] = useState('')
  const [regNote, setRegNote] = useState('')
  const [registering, setRegistering] = useState(false)
  const [regErr, setRegErr] = useState(null)
  const [myPositions, setMyPositions] = useState([])
  const [loadingMyPos, setLoadingMyPos] = useState(false)
  const [regToast, setRegToast] = useState(null)
  /** shiftId → PENDING | APPROVED — đăng ký của user trong tuần (staff) */
  const [myRegStatusByShiftId, setMyRegStatusByShiftId] = useState({})

  function showRegToast(msg) { setRegToast(msg); setTimeout(() => setRegToast(null), 3500) }

  async function handleRegisterClick(e, shift) {
    e.stopPropagation()
    setRegShift(shift)
    setRegPosId(''); setRegNote(''); setRegErr(null)
    setLoadingMyPos(true)
    try {
      const res = await getMyPositions(groupId)
      setMyPositions(unwrapApiArray(res))
    } catch { setMyPositions([]) }
    finally { setLoadingMyPos(false) }
  }

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const refreshMyRegStatus = useCallback(async () => {
    if (isManager) {
      setMyRegStatusByShiftId({})
      return
    }
    const from = fmtISO(weekStart)
    const to = fmtISO(weekEnd)
    try {
      const res = await getMyCalendar({ from, to })
      const u = unwrapApiResponse(res)
      const raw = Array.isArray(u) ? u : (u?.items ?? [])
      const map = {}
      for (const it of raw || []) {
        const sid = it.shiftId
        if (sid == null) continue
        const st = it.registrationStatus ?? it.status
        if (st === 'PENDING' || st === 'APPROVED') map[sid] = st
      }
      setMyRegStatusByShiftId(map)
    } catch {
      setMyRegStatusByShiftId({})
    }
  }, [isManager, weekStart, weekEnd])

  async function handleRegisterSubmit(e) {
    e.preventDefault()
    if (!regPosId) { setRegErr('Chọn vị trí đăng ký'); return }
    setRegistering(true); setRegErr(null)
    try {
      await registerShift(regShift.id, Number(regPosId), regNote.trim() || null)
      showRegToast('Đăng ký ca thành công! Chờ quản lý duyệt.')
      setRegShift(null)
      await refreshMyRegStatus()
    } catch (err) {
      setRegErr(err?.message || 'Không thể đăng ký ca')
    } finally { setRegistering(false) }
  }

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const from = fmtISO(weekStart)
      const to = fmtISO(weekEnd)
      const [sRes, tRes, pRes] = await Promise.all([
        getShifts(groupId, from, to),
        getTemplates(groupId),
        getPositions(groupId),
      ])
      const shiftList = unwrapApiArray(sRes)
      setShifts(shiftList)
      setTemplates(unwrapApiArray(tRes))
      setPositions(unwrapApiArray(pRes))

      // B14: Load pending registration count per shift for manager cards
      if (isManager) {
        try {
          const counts = {}
          const openShifts = (shiftList || []).filter((s) => s && s.id && s.status === 'OPEN')
          await Promise.all(
            openShifts.map(async (s) => {
              try {
                const pending = await getPendingRegistrations(s.id)
                const list = unwrapApiArray(pending)
                counts[s.id] = list.length
              } catch {
                counts[s.id] = 0
              }
            })
          )
          setPendingCountsByShiftId(counts)
        } catch {
          setPendingCountsByShiftId({})
        }
      } else {
        setPendingCountsByShiftId({})
      }
    } catch (err) {
      setError(err?.message || 'Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [groupId, weekStart, isManager])

  useEffect(() => {
    refreshMyRegStatus()
  }, [refreshMyRegStatus])

  const shiftsByDate = useMemo(() => {
    const map = {}
    weekDays.forEach(d => { map[fmtISO(d)] = [] })
    shifts.forEach(s => {
      const key = s.date
      if (map[key]) map[key].push(s)
      else map[key] = [s]
    })
    return map
  }, [shifts, weekDays])

  function prevWeek() { setWeekStart(addDays(weekStart, -7)) }
  function nextWeek() { setWeekStart(addDays(weekStart, 7)) }
  function goToday() { setWeekStart(startOfWeek(new Date())) }

  /* ───── create shift ───── */
  function openCreateForDate(dateStr) {
    setCreateDate(dateStr || '')
    setSelectMultiDays(false)
    setSelectedDays([])
    setFormName(''); setFormStart(''); setFormEnd(''); setFormTpl(''); setFormNote('')
    setCreateErr(null)
    setShowCreate(true)
  }

  // bulk create state
  const [selectMultiDays, setSelectMultiDays] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])

  function toggleDaySelection(dayStr) {
    setSelectedDays(prev => prev.includes(dayStr) ? prev.filter(d => d !== dayStr) : [...prev, dayStr])
  }

  function handleTplChange(v) {
    setFormTpl(v)
    if (v) {
      const t = templates.find(t => String(t.id) === v)
      if (t) { setFormName(t.name || ''); setFormStart(fmtTime(t.startTime)); setFormEnd(fmtTime(t.endTime)) }
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!selectMultiDays && !createDate) { setCreateErr('Chọn ngày'); return }
    if (selectMultiDays && selectedDays.length === 0) { setCreateErr('Chọn ít nhất một ngày'); return }
    if (!formTpl && (!formStart || !formEnd)) { setCreateErr('Nhập giờ bắt đầu và kết thúc'); return }
    
    setCreating(true); setCreateErr(null)
    try {
      if (selectMultiDays) {
        // Bulk Create
        const requests = selectedDays.map(dateStr => {
          const payload = { date: dateStr, name: formName.trim() || null, note: formNote.trim() || null }
          if (formTpl) { payload.templateId = Number(formTpl) }
          else { payload.startTime = formStart + ':00'; payload.endTime = formEnd + ':00' }
          return payload
        })
        await createShiftsBulk(groupId, requests)
      } else {
        // Single Create
        const payload = { name: formName.trim() || null, date: createDate, note: formNote.trim() || null }
        if (formTpl) { payload.templateId = Number(formTpl) }
        else { payload.startTime = formStart + ':00'; payload.endTime = formEnd + ':00' }
        await createShift(groupId, payload)
      }
      setShowCreate(false)
      await loadData()
    } catch (err) { setCreateErr(err?.message || 'Không thể tạo ca') }
    finally { setCreating(false) }
  }

  async function handleDeleteShift(shiftId) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ca làm việc này? Các phân công và đăng ký liên quan cũng sẽ bị xóa.')) return
    try {
      await deleteShift(groupId, shiftId)
      setSelShift(null)
      loadData()
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa ca làm việc')
    }
  }

  /* ───── requirements ───── */
  async function openReqs(shift) {
    setSelShift(shift)
    setActiveTab('requirements')
    setLoadingReqs(true); setReqErr(null); setReqPos(''); setReqQty(1)
    setPendingRegs([]); setAssignUserId(''); setAssignPosId(''); setAssignNote(''); setAssignErr(null)
    try {
      const r = await getRequirements(shift.id)
      setReqs(unwrapApiArray(r))
    } catch { setReqs(shift.requirements || []) }
    finally { setLoadingReqs(false) }

    // Load pending registrations + members for manager
    if (isManager) {
      setLoadingPending(true)
      try {
        const [pRes, mRes] = await Promise.all([
          getPendingRegistrations(shift.id),
          getGroupMembers(groupId).catch(() => []),
        ])
        setPendingRegs(unwrapApiArray(pRes))
        setMembers(unwrapApiArray(mRes).filter((m) => m.status === 'APPROVED'))
      } catch { setPendingRegs([]); setMembers([]) }
      finally { setLoadingPending(false) }
    }
  }

  async function handleAddReq(e) {
    e.preventDefault()
    if (!reqPos) { setReqErr('Chọn vị trí'); return }
    setAddingReq(true); setReqErr(null)
    try {
      await createRequirement(selShift.id, { positionId: Number(reqPos), quantity: Number(reqQty) })
      const r = await getRequirements(selShift.id)
      setReqs(unwrapApiArray(r))
      setReqPos(''); setReqQty(1)
      await loadData() // refresh calendar
    } catch (err) { setReqErr(err?.message || 'Lỗi') }
    finally { setAddingReq(false) }
  }

  async function handleDelReq(id) {
    try {
      await deleteRequirement(selShift.id, id)
      setReqs(p => p.filter(r => r.id !== id))
      await loadData()
    } catch (err) { alert(err?.message || 'Lỗi') }
  }

  /* ───── B14: approve registration ───── */
  async function handleApprove(regId) {
    setActioningId(regId)
    try {
      await approveRegistration(regId, null)
      showRegToast('Đã duyệt đăng ký')
      setPendingRegs(prev => prev.filter(r => r.id !== regId))
      await loadData()
    } catch (err) { alert(err?.message || 'Không thể duyệt') }
    finally { setActioningId(null) }
  }

  /* ───── B15: reject registration ───── */
  async function handleReject(regId) {
    const reason = prompt('Lý do từ chối (tùy chọn):')
    if (reason === null) return // cancelled
    setActioningId(regId)
    try {
      await rejectRegistration(regId, reason || 'Không phù hợp')
      showRegToast('Đã từ chối đăng ký')
      setPendingRegs(prev => prev.filter(r => r.id !== regId))
    } catch (err) { alert(err?.message || 'Không thể từ chối') }
    finally { setActioningId(null) }
  }

  /* ───── B16: assign shift ───── */
  async function handleAssign(e) {
    e.preventDefault()
    if (!assignUserId || !assignPosId) { setAssignErr('Chọn nhân viên và vị trí'); return }
    setAssigning(true); setAssignErr(null)
    try {
      await assignShift(selShift.id, Number(assignUserId), Number(assignPosId), assignNote.trim() || null)
      showRegToast('Đã gán nhân viên vào ca')
      setAssignUserId(''); setAssignPosId(''); setAssignNote('')
      await loadData()
    } catch (err) { setAssignErr(err?.message || 'Không thể gán nhân viên') }
    finally { setAssigning(false) }
  }

  function getMemberName(userId) {
    const m = members.find(m => String(m.userId) === String(userId))
    return m?.fullName || m?.username || `NV #${userId}`
  }

  function getPositionName(posId) {
    const p = positions.find(p => String(p.id) === String(posId))
    return p?.name || `Vị trí #${posId}`
  }

  /* ───── render ───── */
  return (
    <div className="w-full space-y-6 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 md:mx-0 md:px-0 md:py-0 bg-[#f7f9fb] min-h-[60vh] rounded-none md:rounded-2xl pb-4">
      {/* Header — Figma Quản lý ca */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h2 className="text-[28px] sm:text-[30px] font-extrabold text-[#1e3a8a] tracking-[-0.02em] leading-9">
            Lịch ca làm việc
          </h2>
          <p className="text-sm text-[#64748b] leading-5 font-normal">
            {isManager ? 'Xem tổng quan ca và nhu cầu nhân sự theo tuần' : 'Xem lịch ca và đăng ký ca làm việc'}
          </p>
        </div>
        {isManager && (
          <button
            type="button"
            onClick={() => openCreateForDate(fmtISO(new Date()))}
            className="inline-flex items-center gap-2 self-start rounded-lg bg-[#00288e] px-6 py-2.5 text-sm font-bold text-white shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.12),0px_4px_6px_-4px_rgba(30,58,138,0.12)] hover:bg-[#002078] transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Tạo ca mới
          </button>
        )}
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <button type="button" onClick={prevWeek} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#00288e] hover:bg-blue-100 transition-colors"
          >
            Hôm nay
          </button>
          <span className="text-sm font-bold text-[#191c1e] sm:text-base">
            {MONTH_NAMES[weekStart.getMonth()]} {weekStart.getDate()} — {MONTH_NAMES[weekEnd.getMonth()]} {weekEnd.getDate()}, {weekEnd.getFullYear()}
          </span>
        </div>
        <button type="button" onClick={nextWeek} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>

      {loading && <div className="text-center py-12"><p className="text-[#64748b] animate-pulse text-sm">Đang tải...</p></div>}
      {error && <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm text-red-800">{error}</div>}

      {/* ═══ Week Calendar Grid ═══ */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
          {weekDays.map((day, idx) => {
            const key = fmtISO(day)
            const dayShifts = shiftsByDate[key] || []
            const today = isToday(day)
            return (
              <div
                key={key}
                className={`flex flex-col rounded-lg border transition-all ${
                  today
                    ? 'border-blue-200 bg-white shadow-md ring-1 ring-blue-100'
                    : 'border-slate-200 bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
                }`}
              >
                {/* Day header */}
                <div className={`flex items-center justify-between border-b px-3 py-3 ${today ? 'border-blue-100' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                        today ? 'bg-[#00288e] text-white' : 'text-[#191c1e]'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {DAY_LABELS[idx]}
                    </span>
                  </div>
                  {isManager && (
                    <button
                      type="button"
                      onClick={() => openCreateForDate(key)}
                      title="Thêm ca"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-blue-50 hover:text-[#00288e]"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                    </button>
                  )}
                </div>

                {/* Shifts in this day */}
                <div className="min-h-[120px] flex-1 space-y-2 p-2">
                  {dayShifts.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[10px] text-on-surface-variant opacity-30">Trống</p>
                    </div>
                  )}
                  {dayShifts.map(shift => {
                    const st = STATUS_CFG[shift.status] || STATUS_CFG.OPEN
                    const isActive = selShift?.id === shift.id
                    const shiftReqs = shift.requirements || []
                    const totalReq = shift.totalRequired || 0
                    const assignedMembers = shift.assignedMembers || []
                    const assignedMax = 2
                    const assignedShown = assignedMembers.slice(0, assignedMax)
                    const assignedRest = Math.max(0, assignedMembers.length - assignedShown.length)
                    const pendingCount = pendingCountsByShiftId[shift.id] || 0
                    return (
                      <div
                        key={shift.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => openReqs(shift)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openReqs(shift) } }}
                        className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                          isActive
                            ? 'border-[#00288e] bg-blue-50/80 ring-1 ring-blue-200 shadow-sm'
                            : `${st.cls} border-slate-200/80 hover:shadow-sm`
                        }`}
                      >
                        {/* Shift name + time */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                            <span className="text-xs font-bold text-on-surface truncate">{shift.name || 'Ca'}</span>
                          </div>
                          {isManager && pendingCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                              <span className="material-symbols-outlined text-[12px]">pending_actions</span>
                              Chờ {pendingCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-on-surface-variant font-medium mb-2 pl-3">
                          {fmtTime(shift.startTime)} – {fmtTime(shift.endTime)}
                        </p>

                        {/* ─── Requirements inline ─── */}
                        {shiftReqs.length > 0 && (
                          <div className="space-y-1 mb-1.5">
                            {shiftReqs.map(req => (
                              <div key={req.id} className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                                  style={{ backgroundColor: req.positionColorCode || '#6366f1' }}>
                                  {(req.positionName || '?').charAt(0)}
                                </div>
                                <span className="text-[10px] text-on-surface truncate flex-1">{req.positionName}</span>
                                <span className="text-[10px] font-bold text-on-surface-variant">{req.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ─── Assigned Members Inline ─── */}
                        {assignedMembers.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[9px] font-bold uppercase text-on-surface-variant tracking-wider border-b border-outline/10 pb-0.5 mb-1">Đã phân công</p>
                            <div className="flex flex-wrap gap-1">
                              {assignedShown.map(am => (
                                <div key={am.userId} className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded text-[9px] font-medium text-on-surface border border-outline/10">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: am.colorCode || '#ccc' }}></div>
                                  <span className="truncate max-w-[60px]">{am.fullName}</span>
                                </div>
                              ))}
                              {assignedRest > 0 && (
                                <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded text-[9px] font-medium text-on-surface border border-outline/10">
                                  <span className="material-symbols-outlined text-[14px]">add</span>
                                  <span>+{assignedRest}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Total summary */}
                        {totalReq > 0 && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-outline/10">
                            <span className="text-[9px] font-bold uppercase text-on-surface-variant tracking-wider">Cần</span>
                            <div className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-primary">groups</span>
                              <span className="text-[10px] font-black text-primary">{totalReq}</span>
                            </div>
                          </div>
                        )}

                        {/* Empty reqs hint */}
                        {shiftReqs.length === 0 && totalReq === 0 && (
                          <div className="pt-1 border-t border-outline/10">
                            <p className="text-[9px] text-on-surface-variant opacity-50 italic">Chưa cấu hình nhu cầu</p>
                          </div>
                        )}

                        {/* Staff register button */}
                        {(!isManager && shift.status === 'OPEN' && myRegStatusByShiftId[shift.id] === 'PENDING') && (
                          <div className="w-full mt-1.5 py-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg text-center">
                            Đã đăng ký — chờ duyệt
                          </div>
                        )}
                        {(!isManager && shift.status === 'OPEN' && myRegStatusByShiftId[shift.id] === 'APPROVED') && (
                          <div className="w-full mt-1.5 py-1.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
                            Đã được duyệt ca này
                          </div>
                        )}
                        {(!isManager && shift.status === 'OPEN' && !myRegStatusByShiftId[shift.id]) && (
                          <button onClick={(e) => handleRegisterClick(e, shift)}
                            className="w-full mt-1.5 py-1.5 text-[10px] font-bold text-primary bg-primary-container/20 hover:bg-primary-container/40 rounded-lg transition-colors flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">how_to_reg</span>
                            Đăng ký
                          </button>
                        )}

                        {/* Note */}
                        {shift.note && (
                          <p className="text-[9px] text-on-surface-variant truncate mt-1 italic opacity-60">📝 {shift.note}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Registration success toast */}
      {regToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeIn_0.2s_ease-out] max-w-md">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium text-sm">{regToast}</span>
          <button onClick={() => setRegToast(null)} className="ml-auto p-1 hover:bg-emerald-100 rounded-lg">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* Registration Modal */}
      {regShift && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay" onClick={() => setRegShift(null)}>
          <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-outline/10 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">how_to_reg</span>
                Đăng ký ca làm việc
              </h3>
              <button onClick={() => setRegShift(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
              {/* Shift info */}
              <div className="bg-primary-container/10 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">calendar_month</span>
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface">{regShift.name || 'Ca'}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {regShift.date} · {fmtTime(regShift.startTime)} – {fmtTime(regShift.endTime)}
                  </p>
                </div>
              </div>

              {regErr && <div className="bg-error-container/20 text-on-error-container rounded-lg p-3 text-sm">{regErr}</div>}

              {/* Position select — filtered by my positions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                  Vị trí đăng ký <span className="text-error">*</span>
                </label>
                {loadingMyPos ? (
                  <p className="text-on-surface-variant animate-pulse py-3">Đang tải vị trí...</p>
                ) : (() => {
                  const shiftReqs = regShift.requirements || []
                  /** API my-positions trả { id, name, colorCode } — không có positionId */
                  const myPosIds = new Set(
                    myPositions
                      .map((p) => Number(p.id ?? p.positionId))
                      .filter((n) => Number.isFinite(n))
                  )
                  const availablePositions = shiftReqs.filter((r) => myPosIds.has(Number(r.positionId)))


                  if (myPositions.length === 0) {
                    return (
                      <div className="bg-amber-50 text-amber-800 rounded-xl p-4 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined">warning</span>
                        <span>Bạn chưa khai báo vị trí nào. Vui lòng vào <strong>Thông tin cá nhân</strong> để cập nhật vị trí trước.</span>
                      </div>
                    )
                  }

                  if (shiftReqs.length === 0) {
                    return (
                      <div className="bg-amber-50 text-amber-800 rounded-xl p-4 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined">info</span>
                        <span>Ca này chưa cấu hình nhu cầu nhân sự.</span>
                      </div>
                    )
                  }

                  if (availablePositions.length === 0) {
                    return (
                      <div className="bg-amber-50 text-amber-800 rounded-xl p-4 text-sm flex items-center gap-3">
                        <span className="material-symbols-outlined">block</span>
                        <span>Ca này không có vị trí nào phù hợp với vị trí bạn đã khai báo.</span>
                      </div>
                    )
                  }

                  return (
                    <select value={regPosId} onChange={e => setRegPosId(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all">
                      <option value="">— Chọn vị trí —</option>
                      {availablePositions.map(r => (
                        <option key={r.positionId} value={r.positionId}>
                          {r.positionName} (cần {r.quantity} người)
                        </option>
                      ))}
                    </select>
                  )
                })()}
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ghi chú</label>
                <textarea value={regNote} onChange={e => setRegNote(e.target.value)} placeholder="Ghi chú cho manager..." rows={2}
                  className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRegShift(null)}
                  className="px-5 py-2.5 text-on-surface-variant font-semibold rounded-lg hover:bg-surface-container-high transition-colors">Hủy</button>
                <button type="submit" disabled={registering || !regPosId}
                  className="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50">
                  {registering ? 'Đang đăng ký...' : 'Đăng ký ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats row */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-3xl font-black text-[#191c1e]">{shifts.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tổng ca</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-3xl font-black text-emerald-600">{shifts.filter(s => s.status === 'OPEN').length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Đang mở</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-3xl font-black text-amber-600">{shifts.filter(s => s.status === 'LOCKED').length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Đã khóa</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <p className="text-3xl font-black text-[#191c1e]">
              {shifts.reduce((s, sh) => s + (sh.totalRequired || 0), 0)}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Tổng nhu cầu</p>
          </div>
        </div>
      )}

      {/* ═══ Details Panel ═══ */}
      {selShift && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0px_4px_24px_rgba(0,52,94,0.08)] animate-[fadeIn_0.2s_ease-out]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-6 py-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold text-[#191c1e]">
                  Ca làm việc: {selShift.name || 'Ca chưa đặt tên'}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selShift.date} · {fmtTime(selShift.startTime)} – {fmtTime(selShift.endTime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isManager && (
                  selShift?.status === 'OPEN' ? (
                    <button
                      onClick={() => setLockShiftModalShift(selShift)}
                      className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors"
                      title="Khóa ca làm việc (OPEN -> LOCKED)"
                    >
                      <span className="material-symbols-outlined">lock</span>
                    </button>
                  ) : null
                )}
                {isManager && (
                  <button onClick={() => handleDeleteShift(selShift.id)} className="p-1.5 text-error hover:bg-error-container/20 rounded-lg transition-colors" title="Xóa ca làm việc này">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
                <button onClick={() => setSelShift(null)} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="-mb-px flex flex-wrap items-center gap-1 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('requirements')}
                className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'requirements' ? 'border-[#00288e] text-[#00288e]' : 'border-transparent text-slate-500 hover:rounded-t-lg hover:bg-white/80 hover:text-slate-800'}`}
              >
                <span className="material-symbols-outlined text-[18px]">list_alt</span>
                Nhu cầu
              </button>
              {isManager && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'pending' ? 'border-[#00288e] text-[#00288e]' : 'border-transparent text-slate-500 hover:rounded-t-lg hover:bg-white/80 hover:text-slate-800'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                    Chờ duyệt
                    {pendingRegs.length > 0 && (
                      <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{pendingRegs.length}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('assign')}
                    className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === 'assign' ? 'border-[#00288e] text-[#00288e]' : 'border-transparent text-slate-500 hover:rounded-t-lg hover:bg-white/80 hover:text-slate-800'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Phân công thủ công
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* ═══ TAB: Requirements ═══ */}
            {activeTab === 'requirements' && (
              <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                {loadingReqs ? (
                  <p className="text-on-surface-variant animate-pulse text-center py-4">Đang tải...</p>
                ) : reqs.length > 0 ? (
                  <div className="space-y-2">
                    {reqs.map(req => (
                      <div key={req.id} className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3 group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm"
                            style={{ backgroundColor: req.positionColorCode || '#6366f1' }}>
                            {(req.positionName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold text-on-surface">{req.positionName || `#${req.positionId}`}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-on-surface bg-surface-container-lowest px-3 py-1 rounded-lg border border-outline/10">{req.quantity} người</span>
                          {isManager && selShift?.status === 'OPEN' && (
                            <button
                              onClick={() =>
                                setRecommendModalState({
                                  shift: selShift,
                                  position: { positionId: req.positionId, positionName: req.positionName || `#${req.positionId}` },
                                })
                              }
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary-container/30 rounded-lg transition-all"
                              title="Gợi ý nhân viên theo vị trí"
                            >
                              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                            </button>
                          )}
                          {isManager && (
                            <button
                              onClick={() => handleDelReq(req.id)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Xóa nhu cầu"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary-container/20 border border-primary/10 mt-4">
                      <span className="text-xs font-black uppercase tracking-widest text-primary">Tổng cộng</span>
                      <span className="text-base font-black text-primary">{reqs.reduce((s, r) => s + (r.quantity || 0), 0)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/20">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-3">group_off</span>
                    <p className="text-sm text-on-surface-variant font-medium">Chưa cấu hình nhu cầu nhân sự cho ca này</p>
                  </div>
                )}

                {isManager && positions.length > 0 && (
                  <form onSubmit={handleAddReq} className="flex items-end gap-3 flex-wrap bg-surface-container-low p-4 rounded-xl border border-outline/10 mt-6">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Thêm vị trí</label>
                      <select value={reqPos} onChange={e => setReqPos(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-surface-container-lowest rounded-lg border border-outline/20 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                        <option value="">— Chọn vị trí cần tuyển —</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1.5">Số lượng</label>
                      <input type="number" min={1} value={reqQty} onChange={e => setReqQty(e.target.value)}
                        className="w-full px-3 py-2 text-sm text-center bg-surface-container-lowest rounded-lg border border-outline/20 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                    </div>
                    <button type="submit" disabled={addingReq || !reqPos}
                      className="px-4 py-2 bg-primary text-on-primary text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 h-[38px]">
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      {addingReq ? 'Đang...' : 'Thêm'}
                    </button>
                  </form>
                )}
                {reqErr && <div className="bg-error-container/20 text-on-error-container rounded-lg p-3 text-sm">{reqErr}</div>}
              </div>
            )}

            {/* ═══ TAB: Pending ═══ */}
            {activeTab === 'pending' && isManager && (
              <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                {loadingPending ? (
                  <p className="text-on-surface-variant animate-pulse text-center py-4">Đang tải...</p>
                ) : pendingRegs.length > 0 ? (
                  <div className="space-y-3">
                    {pendingRegs.map(reg => (
                      <div key={reg.id} className="flex items-center justify-between bg-surface-container rounded-xl p-4 border border-outline/5 hover:border-outline/20 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container text-sm font-black shadow-inner">
                            {getMemberName(reg.userId).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{getMemberName(reg.userId)}</p>
                            <p className="text-xs text-on-surface-variant mt-0.5">Vị trí: <span className="font-semibold text-on-surface">{getPositionName(reg.positionId)}</span></p>
                            {reg.note && <p className="text-[11px] text-on-surface-variant italic mt-1 bg-surface-container-lowest px-2 py-1 rounded">📝 {reg.note}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleApprove(reg.id)} disabled={actioningId === reg.id}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">check</span>
                            Duyệt
                          </button>
                          <button onClick={() => handleReject(reg.id)} disabled={actioningId === reg.id}
                            className="px-3 py-2 bg-surface-container-highest text-error text-sm font-bold rounded-lg hover:bg-error/10 transition-colors disabled:opacity-50">
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-surface-container-lowest rounded-2xl border border-dashed border-outline/20">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 mb-3">check_circle</span>
                    <p className="text-sm text-on-surface-variant font-medium">Không có đăng ký nào cần duyệt!</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══ TAB: Assign ═══ */}
            {activeTab === 'assign' && isManager && (
              <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                <div className="bg-primary-container/10 p-4 rounded-xl border border-primary/20 flex gap-3">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Sử dụng tính năng này để điều động nhân sự vào ca làm việc kể cả khi họ chưa đăng ký. Bỏ qua bước chờ duyệt.
                  </p>
                </div>
                
                {assignErr && <div className="bg-error-container/20 text-on-error-container rounded-lg p-3 text-sm">{assignErr}</div>}

                <form onSubmit={handleAssign} className="bg-surface-container p-5 rounded-2xl space-y-4 border border-outline/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Nhân viên <span className="text-error">*</span></label>
                      <select value={assignUserId} onChange={e => setAssignUserId(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                        <option value="">— Chọn Nhân Viên —</option>
                        {members.map(m => <option key={m.userId} value={m.userId}>{m.fullName || m.username}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Vị trí <span className="text-error">*</span></label>
                      <select value={assignPosId} onChange={e => setAssignPosId(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                        <option value="">— Gán vào Vị Trí —</option>
                        {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Ghi chú điều động</label>
                    <input type="text" value={assignNote} onChange={e => setAssignNote(e.target.value)} placeholder="Nhập ghi chú (tùy chọn)"
                      className="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline/20 text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button type="submit" disabled={assigning || !assignUserId || !assignPosId}
                      className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">person_add</span>
                      {assigning ? 'Đang phân công...' : 'Phân Công Ngay'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Shift Modal — Figma Tạo ca */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center modal-overlay px-4" onClick={() => setShowCreate(false)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-8 shadow-[0px_20px_50px_0px_rgba(25,27,35,0.08)] animate-[fadeIn_0.2s_ease-out]"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-2xl font-extrabold text-[#191b23] leading-8">
                  <span className="material-symbols-outlined text-[#00288e]">event_available</span>
                  Tạo ca làm việc mới
                </h3>
                <p className="text-sm leading-5 text-[#434654]">
                  Chọn ngày, ca mẫu hoặc nhập giờ thủ công để tạo ca trên lịch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              {createErr && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{createErr}</div>}

              {templates.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">Ca mẫu (tùy chọn)</label>
                  <select
                    value={formTpl}
                    onChange={e => handleTplChange(e.target.value)}
                    className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  >
                    <option value="">— Nhập thủ công —</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({fmtTime(t.startTime)} – {fmtTime(t.endTime)})</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">Tên ca</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="VD: Ca Sáng"
                    className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] placeholder:text-[rgba(67,70,84,0.4)] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  />
                </div>
                <div className="col-span-2 space-y-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">Chế độ tạo</label>
                  <div className="flex overflow-hidden rounded-lg border border-[rgba(195,198,214,0.35)] divide-x divide-slate-200">
                    <label className={`flex flex-1 cursor-pointer items-center justify-center py-3 text-center text-sm font-semibold transition-colors ${!selectMultiDays ? 'bg-[#00288e] text-white' : 'bg-[#f3f3fd] text-slate-600 hover:bg-slate-100'}`}>
                      <input type="radio" className="hidden" checked={!selectMultiDays} onChange={() => setSelectMultiDays(false)} />
                      Một ngày
                    </label>
                    <label className={`flex flex-1 cursor-pointer items-center justify-center py-3 text-center text-sm font-semibold transition-colors ${selectMultiDays ? 'bg-[#00288e] text-white' : 'bg-[#f3f3fd] text-slate-600 hover:bg-slate-100'}`}>
                      <input type="radio" className="hidden" checked={selectMultiDays} onChange={() => setSelectMultiDays(true)} />
                      Nhiều ngày
                    </label>
                  </div>
                </div>
              </div>

              {!selectMultiDays ? (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                    Ngày <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={createDate}
                    onChange={e => setCreateDate(e.target.value)}
                    min={fmtISO(new Date())}
                    className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                    Chọn ngày trong tuần này <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((d, i) => {
                      const dStr = fmtISO(d)
                      const isPast = d < new Date(new Date().setHours(0, 0, 0, 0))
                      const isSel = selectedDays.includes(dStr)
                      return (
                        <button
                          key={dStr}
                          type="button"
                          disabled={isPast}
                          onClick={() => toggleDaySelection(dStr)}
                          className={`flex flex-col items-center justify-center rounded-lg border py-2 transition-all ${
                            isPast
                              ? 'cursor-not-allowed bg-slate-100 opacity-30'
                              : isSel
                                ? 'border-[#00288e] bg-blue-50 font-bold text-[#00288e] ring-1 ring-[#00288e]/30'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300'
                          }`}
                        >
                          <span className="text-[10px] uppercase">{DAY_LABELS[i]}</span>
                          <span className="text-sm">{d.getDate()}</span>
                        </button>
                      )
                    })}
                  </div>
                  {selectedDays.length > 0 && (
                    <p className="text-[10px] font-semibold text-[#00288e]">Đã chọn {selectedDays.length} ngày</p>
                  )}
                </div>
              )}

              {!formTpl && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                      Bắt đầu <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="time"
                      value={formStart}
                      onChange={e => setFormStart(e.target.value)}
                      className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">
                      Kết thúc <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="time"
                      value={formEnd}
                      onChange={e => setFormEnd(e.target.value)}
                      className="w-full rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                    />
                  </div>
                </div>
              )}

              {formTpl && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/80 p-3 text-sm text-slate-600">
                  <span className="material-symbols-outlined text-[#00288e] text-lg">info</span>
                  Giờ từ ca mẫu: <strong className="text-[#191c1e]">{formStart} – {formEnd}</strong>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.055em] text-[#191b23]">Ghi chú</label>
                <textarea
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="Ghi chú cho nhân viên..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-[rgba(195,198,214,0.35)] bg-[#f3f3fd] px-[17px] py-[14px] text-[#191b23] placeholder:text-[rgba(67,70,84,0.4)] focus:border-[#003d9b] focus:outline-none focus:ring-2 focus:ring-[#003d9b]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg px-6 py-2.5 text-sm font-semibold text-[#586579] hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg px-8 py-2.5 text-sm font-semibold text-white shadow-[0px_4px_6px_-1px_rgba(0,61,155,0.2),0px_2px_4px_-2px_rgba(0,61,155,0.2)] transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(161deg, #003d9b 0%, #0052cc 100%)' }}
                >
                  {creating ? 'Đang tạo...' : 'Tạo ca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ShiftLockModal
        open={!!lockShiftModalShift}
        onClose={() => setLockShiftModalShift(null)}
        groupId={groupId}
        shift={lockShiftModalShift}
        onLocked={async () => {
          setLockShiftModalShift(null)
          setSelShift(null)
          await loadData()
          showRegToast('Đã khóa ca làm việc')
        }}
      />

      <ShiftRecommendationsModal
        open={!!recommendModalState}
        onClose={() => setRecommendModalState(null)}
        groupId={groupId}
        shift={recommendModalState?.shift}
        position={recommendModalState?.position}
        onAssigned={async () => {
          setRecommendModalState(null)
          setSelShift(null)
          await loadData()
          showRegToast('Đã gán nhân viên vào ca')
        }}
      />
    </div>
  )
}
