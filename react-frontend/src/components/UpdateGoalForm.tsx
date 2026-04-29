import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { updateGoal, getGoalProgress } from '../api/client'
import type { GoalData, Message } from '../types'

interface UpdateGoalFormProps {
  interrupt: GoalData
  threadId: string
  personNumber: string
  onComplete: (messages: Message[], newInterrupt: GoalData | null) => void
}

export default function UpdateGoalForm({ interrupt, threadId, personNumber, onComplete }: UpdateGoalFormProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const defaultEnd = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const [goalName, setGoalName] = useState(interrupt.GoalName || '')
  const [description, setDescription] = useState(interrupt.Description || '')
  const [startDate, setStartDate] = useState(interrupt.StartDate || todayStr)
  const [endDate, setEndDate] = useState(interrupt.TargetCompletionDate || defaultEnd)
  const [statusCode, setStatusCode] = useState(interrupt.StatusCode || 'NOT_STARTED')
  const [percentComplete, setPercentComplete] = useState<number>(
    interrupt.PercentComplete !== undefined ? interrupt.PercentComplete : 0
  )
  const [loadingPct, setLoadingPct] = useState(!!interrupt.GoalId)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!interrupt.GoalId) return
    setLoadingPct(true)
    getGoalProgress(interrupt.GoalId)
      .then(pct => setPercentComplete(pct))
      .catch(() => {/* keep existing value on error */})
      .finally(() => setLoadingPct(false))
  }, [interrupt.GoalId])
  const [cancelling, setCancelling] = useState(false)
  const [confirmUpdate, setConfirmUpdate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStatusChange(newStatus: string) {
    setStatusCode(newStatus)
    if (newStatus === 'NOT_STARTED') setPercentComplete(0)
    if (newStatus === 'COMPLETED') setPercentComplete(100)
  }

  function handleProgressChange(val: number) {
    setPercentComplete(val)
    if (val === 100) setStatusCode('COMPLETED')
    else if (val > 0) setStatusCode('IN_PROGRESS')
    else if (statusCode === 'COMPLETED') setStatusCode('IN_PROGRESS')
  }

  const inProgressOptions = [0, 25, 50, 75, 100]

  const isValid = goalName.trim() && description.trim() && startDate && endDate

  async function handleUpdate() {
    if (!isValid) { toast.error('Please fill in all required fields.'); return }
    setUpdating(true)
    setError(null)
    try {
      const resp = await updateGoal(threadId, personNumber, {
        ...interrupt,
        GoalName: goalName,
        Description: description,
        StartDate: startDate,
        TargetCompletionDate: endDate,
        StatusCode: statusCode,
        PercentComplete: percentComplete,
      })
      toast.success('Goal updated in Oracle HCM!')
      onComplete(resp.messages, resp.interrupt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal in Oracle HCM.')
      setConfirmUpdate(false)
    } finally {
      setUpdating(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const { resumeGraph } = await import('../api/client')
      const resp = await resumeGraph(threadId, personNumber, 'cancel')
      onComplete(resp.messages, resp.interrupt)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="mx-auto max-w-2xl mt-4 mb-6"
    >
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #eae6dd' }}>
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#2b3e2b' }}>
              Update Goal
            </p>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
              Goal Name <span style={{ color: '#2b3e2b' }}>*</span>
            </label>
            <input
              type="text"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
              style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
              onFocus={e => { e.target.style.borderColor = '#2b3e2b'; e.target.style.boxShadow = '0 0 0 2px rgba(43,62,43,.08)' }}
              onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
              placeholder="Enter goal name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
              Description <span style={{ color: '#2b3e2b' }}>*</span>
              <span style={{ color: '#8b91a4', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}> — one bullet per line starting with -</span>
            </label>
            <textarea
              value={description}
              onChange={e => {
                setDescription(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' } }}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition resize-none leading-relaxed"
              style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff', minHeight: '96px', overflow: 'hidden' }}
              onFocus={e => { e.target.style.borderColor = '#2b3e2b'; e.target.style.boxShadow = '0 0 0 2px rgba(43,62,43,.08)' }}
              onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
              placeholder="Describe the goal"
            />
            <p className="text-right text-[10px] mt-1" style={{ color: '#8b91a4' }}>{description.length} chars</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
                Start Date <span style={{ color: '#2b3e2b' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
                onFocus={e => { e.target.style.borderColor = '#2b3e2b' }}
                onBlur={e => { e.target.style.borderColor = '#ece6d9' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
                Target Completion <span style={{ color: '#2b3e2b' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
                onFocus={e => { e.target.style.borderColor = '#2b3e2b' }}
                onBlur={e => { e.target.style.borderColor = '#ece6d9' }}
              />
            </div>
          </div>

          {/* Status + Progress row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
                Status
              </label>
              <select
                value={statusCode}
                onChange={e => handleStatusChange(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition appearance-none"
                style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff', cursor: 'pointer' }}
                onFocus={e => { e.target.style.borderColor = '#2b3e2b'; e.target.style.boxShadow = '0 0 0 2px rgba(43,62,43,.08)' }}
                onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
              >
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCEL">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5d6478' }}>
                Progress{' '}
                {loadingPct
                  ? <Loader2 size={10} className="inline animate-spin" style={{ color: '#8b91a4' }} />
                  : <span className="normal-case font-semibold" style={{ color: '#2b3e2b' }}>{percentComplete}%</span>
                }
              </label>
              <div className="space-y-2">
                {/* Bar track */}
                <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#ece6d9' }}>
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
                    style={{ width: `${percentComplete}%`, background: percentComplete === 100 ? '#2b3e2b' : '#4a7c59' }}
                  />
                </div>
                {/* Step buttons */}
                <div className="flex justify-between gap-1">
                  {inProgressOptions.map(v => {
                    const active = percentComplete === v
                    const disabled = statusCode === 'CANCEL'
                    return (
                      <button
                        key={v}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleProgressChange(v)}
                        className="flex-1 text-[11px] font-semibold py-1 rounded-lg transition-all"
                        style={{
                          background: active ? '#2b3e2b' : '#f3f0eb',
                          color: active ? '#fff' : '#5d6478',
                          border: active ? '1px solid #2b3e2b' : '1px solid #ece6d9',
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                        }}
                      >
                        {v}%
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap pt-1">
            {!confirmUpdate ? (
              <button
                onClick={() => { if (isValid) { setConfirmUpdate(true) } else { toast.error('Please fill in all required fields.') } }}
                disabled={updating || cancelling || !isValid}
                className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: '#2b3e2b', boxShadow: '0 4px 10px -3px rgba(43,62,43,.35)' }}
              >
                <CheckCircle size={13} /> Update
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Update in Oracle HCM?</span>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition disabled:opacity-50"
                  style={{ background: '#2b3e2b' }}
                >
                  {updating ? <Loader2 size={12} className="animate-spin" /> : null}
                  Yes
                </button>
                <button
                  onClick={() => setConfirmUpdate(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  style={{ background: '#F3F3F0', color: '#5d6478', border: '1px solid #ece6d9' }}
                >
                  No
                </button>
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={updating || cancelling}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#F3F3F0', color: '#5d6478', border: '1px solid #ece6d9' }}
            >
              {cancelling ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
              Cancel
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
