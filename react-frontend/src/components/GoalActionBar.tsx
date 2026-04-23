import { useState } from 'react'
import { motion } from 'framer-motion'
import { PenLine, Rocket, Loader2, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { resumeGraph, updateGoal } from '../api/client'
import type { GoalData, Message } from '../types'

interface GoalActionBarProps {
  interrupt: GoalData
  threadId: string
  showActions?: boolean
  onEdit: (statusCode: string) => void
  onComplete: (messages: Message[], newInterrupt: GoalData | null) => void
}

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS',  label: 'In Progress' },
  { value: 'COMPLETED',    label: 'Completed' },
  { value: 'CANCEL',       label: 'Cancelled' },
]

export default function GoalActionBar({
  interrupt,
  threadId,
  showActions = true,
  onEdit,
  onComplete,
}: GoalActionBarProps) {
  const [loading, setLoading] = useState<'submit' | 'update' | null>(null)
  const [statusCode, setStatusCode] = useState(interrupt.StatusCode || 'NOT_STARTED')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading('submit')
    setError(null)
    try {
      const resp = await resumeGraph(threadId, 'save', { ...interrupt, StatusCode: statusCode })
      toast.success('Goal submitted to Oracle HCM!')
      onComplete(resp.messages, resp.interrupt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit goal to Oracle HCM.')
    } finally {
      setLoading(null)
    }
  }

  async function handleUpdate() {
    setLoading('update')
    setError(null)
    try {
      const resp = await updateGoal(threadId, { ...interrupt, StatusCode: statusCode })
      toast.success('Goal updated in Oracle HCM!')
      onComplete(resp.messages, resp.interrupt)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update goal in Oracle HCM.')
    } finally {
      setLoading(null)
    }
  }

  const busy = !!loading
  const isUpdate = interrupt.type === 'update'

  // Only 4 description bullets (Specific/Measurable/Achievable/Relevant).
  // Time-bound is always rendered separately from the date field — never from the description.
  const SMART_LABELS = ['Specific', 'Measurable', 'Achievable', 'Relevant']

  // Parse description bullets (lines starting with "- ") — display only, not passed to submission
  const rawBullets = interrupt.Description
    ? interrupt.Description.split('\n').map(l => l.trim()).filter(l => l.startsWith('- ')).map(l => l.slice(2))
    : []
  // For updates, also show plain text paragraphs if no bullets found
  const bullets = rawBullets.length > 0 ? rawBullets : (
    isUpdate && interrupt.Description
      ? interrupt.Description.split('\n').map(l => l.trim()).filter(Boolean)
      : []
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className="flex items-end gap-2.5 mt-2"
    >
      {/* Align with AI messages */}
      <div className="w-7 h-7 shrink-0" />

      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm px-4 py-4 max-w-[78%] w-full" style={{ border: '1px solid #eae6dd' }}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
          {isUpdate ? 'Current goal details:' : "I've refined your goal using SMART criteria:"}
        </p>

        {/* Goal name */}
        <p className="text-sm font-bold text-navy mb-3" title={interrupt.GoalName}>
          {interrupt.GoalName}
        </p>

        {/* Description bullets */}
        {bullets.length > 0 && (
          <ul className="mb-3 space-y-1.5">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                {!isUpdate && (
                  <span className="font-bold text-navy shrink-0 min-w-[72px]">
                    {SMART_LABELS[i] ?? '–'}
                  </span>
                )}
                {isUpdate && <span className="text-navy shrink-0">-</span>}
                <span>{b}</span>
              </li>
            ))}
            {/* Time-bound row — only for create flow */}
            {!isUpdate && (
              <li className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                <span className="font-bold text-navy shrink-0 min-w-[72px]">Time-bound</span>
                <span>By {interrupt.TargetCompletionDate}</span>
              </li>
            )}
          </ul>
        )}

        {/* Dates */}
        <div className="flex gap-4 text-xs pt-2" style={{ borderTop: '1px solid #eae6dd', color: '#8b91a4' }}>
          <span><span className="font-semibold" style={{ color: '#5d6478' }}>Start:</span> {interrupt.StartDate}</span>
          <span><span className="font-semibold" style={{ color: '#5d6478' }}>Due:</span> {interrupt.TargetCompletionDate}</span>
        </div>

        {/* Status dropdown */}
        <div className="mt-3 mb-4">
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#5d6478' }}>
            Status
          </label>
          <select
            value={statusCode}
            onChange={e => setStatusCode(e.target.value)}
            disabled={!showActions}
            className="w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition"
            style={{
              border: '1px solid #ece6d9',
              color: '#2a2f3d',
              background: showActions ? '#fff' : '#fafaf9',
              cursor: showActions ? 'pointer' : 'default',
            }}
            onFocus={e => { if (showActions) { e.target.style.borderColor = '#b8443a'; e.target.style.boxShadow = '0 0 0 2px rgba(184,68,58,.08)' } }}
            onBlur={e => { e.target.style.borderColor = '#ece6d9'; e.target.style.boxShadow = 'none' }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-3 text-xs" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 flex-wrap">
            {isUpdate ? (
              /* Update mode: Save (quick) + Edit Manually */
              <>
                <button
                  onClick={handleUpdate}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading === 'update' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
                <button
                  onClick={() => onEdit(statusCode)}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy border-2 border-navy hover:bg-navy hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PenLine size={12} />
                  Edit Manually
                </button>
              </>
            ) : (
              <>
                {/* Edit — opens GoalForm */}
                <button
                  onClick={() => onEdit(statusCode)}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-navy border-2 border-navy hover:bg-navy hover:text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PenLine size={12} />
                  Edit
                </button>

                {/* Submit — directly posts to Oracle */}
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading === 'submit' ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Rocket size={12} />
                  )}
                  Submit
                </button>


              </>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
