import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, addDays } from 'date-fns'
import { resumeGraph } from '../api/client'
import type { GoalData, Message } from '../types'

interface GoalFormProps {
  interrupt: GoalData
  threadId: string
  onComplete: (messages: Message[], newInterrupt: GoalData | null) => void
}

export default function GoalForm({ interrupt, threadId, onComplete }: GoalFormProps) {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const defaultEnd = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const [goalName, setGoalName] = useState(interrupt.GoalName || '')
  const [description, setDescription] = useState(interrupt.Description || '')
  const [startDate, setStartDate] = useState(interrupt.StartDate || todayStr)
  const [endDate, setEndDate] = useState(interrupt.TargetCompletionDate || defaultEnd)
  const [statusCode, setStatusCode] = useState(interrupt.StatusCode || 'NOT_STARTED')
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [confirmSubmit, setConfirmSubmit] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = goalName.trim() && description.trim() && startDate && endDate

  async function handleSubmit() {
    if (!isValid) { toast.error('Please fill in all required fields.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const resp = await resumeGraph(threadId, 'save', {
        GoalName: goalName,
        Description: description,
        StartDate: startDate,
        TargetCompletionDate: endDate,
        StatusCode: statusCode,
      })
      toast.success(`Goal saved to Oracle HCM!`)
      onComplete(resp.messages, resp.interrupt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal to Oracle HCM.')
      setConfirmSubmit(false)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const resp = await resumeGraph(threadId, 'cancel')
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
        {/* Form body */}
        <div className="p-5 space-y-4">
          {/* Header label */}
          <div className="flex items-center justify-between mb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#b8443a' }}>
              Edit Goal
            </p>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
              Goal Name <span style={{ color: '#b8443a' }}>*</span>
            </label>
            <input
              type="text"
              value={goalName}
              onChange={e => setGoalName(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
              style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
              onFocus={e => { e.target.style.borderColor = '#b8443a'; e.target.style.boxShadow = '0 0 0 2px rgba(184,68,58,.08)' }}
              onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
              placeholder="Enter a clear, specific goal name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
              Description <span style={{ color: '#b8443a' }}>*</span>
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
              onFocus={e => { e.target.style.borderColor = '#b8443a'; e.target.style.boxShadow = '0 0 0 2px rgba(184,68,58,.08)' }}
              onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
              placeholder="Describe the goal, success criteria, and approach"
            />
            <p className="text-right text-[10px] mt-1" style={{ color: '#8b91a4' }}>{description.length} chars</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
                Start Date <span style={{ color: '#b8443a' }}>*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
                onFocus={e => { e.target.style.borderColor = '#b8443a' }}
                onBlur={e => { e.target.style.borderColor = '#ece6d9' }}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
                Target Completion <span style={{ color: '#b8443a' }}>*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff' }}
                onFocus={e => { e.target.style.borderColor = '#b8443a' }}
                onBlur={e => { e.target.style.borderColor = '#ece6d9' }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
              Status <span style={{ color: '#b8443a' }}>*</span>
            </label>
            <select
              value={statusCode}
              onChange={e => setStatusCode(e.target.value)}
              className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition appearance-none"
              style={{ border: '1px solid #ece6d9', color: '#2a2f3d', background: '#fff', cursor: 'pointer' }}
              onFocus={e => { e.target.style.borderColor = '#b8443a'; e.target.style.boxShadow = '0 0 0 2px rgba(184,68,58,.08)' }}
              onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCEL">Cancelled</option>
            </select>
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
            {!confirmSubmit ? (
              <button
                onClick={() => { if (isValid) { setConfirmSubmit(true) } else { toast.error('Please fill in all required fields.') } }}
                disabled={submitting || cancelling || !isValid}
                className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                style={{ background: '#b8443a', boxShadow: '0 4px 10px -3px rgba(184,68,58,.35)' }}
              >
                <CheckCircle size={13} /> Submit
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>Submit to Oracle HCM?</span>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:brightness-110 transition disabled:opacity-50"
                  style={{ background: '#b8443a' }}
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                  Yes
                </button>
                <button
                  onClick={() => setConfirmSubmit(false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
                  style={{ background: '#fbf8f1', color: '#5d6478', border: '1px solid #ece6d9' }}
                >
                  No
                </button>
              </div>
            )}

            <button
              onClick={handleCancel}
              disabled={submitting || cancelling}
              className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#fbf8f1', color: '#5d6478', border: '1px solid #ece6d9' }}
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
