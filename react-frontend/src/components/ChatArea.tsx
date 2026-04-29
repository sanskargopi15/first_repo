import React, { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import MessageBubble from './MessageBubble'
import QuickActions from './QuickActions'
import GoalForm from './GoalForm'
import GoalActionBar from './GoalActionBar'
import UpdateGoalForm from './UpdateGoalForm'
import { sendMessage } from '../api/client'
import type { Message, GoalData } from '../types'

interface ChatAreaProps {
  workerName: string
  messages: Message[]
  interrupt: GoalData | null
  threadId: string
  personNumber: string
  loading: boolean
  onMessagesUpdate: (messages: Message[], interrupt: GoalData | null) => void
}

export default function ChatArea({
  workerName,
  messages,
  interrupt,
  threadId,
  personNumber,
  loading,
  onMessagesUpdate,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [optimisticMsg, setOptimisticMsg] = useState<string | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editStatusCode, setEditStatusCode] = useState<string | null>(null)
  const [lockedInterrupt, setLockedInterrupt] = useState<GoalData | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [lockedMessageCount, setLockedMessageCount] = useState(0)
  // Track resolved interrupt cards so they stay visible in history during multi-goal flows
  const [resolvedInterrupts, setResolvedInterrupts] = useState<Array<{ goal: GoalData; afterIndex: number }>>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const displayName = workerName && workerName !== 'there' ? workerName : 'there'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, interrupt, optimisticMsg])

  // Auto-resize textarea as user types
  useEffect(() => {
    const ta = inputRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
  }, [input])

  // Reset ALL local interrupt state when the thread changes (new chat or restored chat)
  useEffect(() => {
    setLockedInterrupt(null)
    setResolvedInterrupts([])
    setShowActions(false)
    setShowEditForm(false)
    setLockedMessageCount(0)
    setInput('')
    setOptimisticMsg(null)
  }, [threadId])

  // Reset edit form whenever interrupt changes (new goal or interrupt clears)
  useEffect(() => {
    setShowEditForm(false)
    setEditStatusCode(null)
  }, [interrupt])

  // Lock interrupt snapshot and capture message position when a new interrupt arrives;
  // hide buttons when interrupt clears (e.g. user sent a new message).
  // When a second interrupt arrives while the first was resolved (showActions=false),
  // archive the first into resolvedInterrupts so it persists in chat history.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (interrupt) {
      if (lockedInterrupt && !showActions) {
        // Previous goal was resolved — archive it so it stays visible in history
        setResolvedInterrupts(prev => [...prev, { goal: lockedInterrupt, afterIndex: lockedMessageCount }])
      }
      setLockedInterrupt(interrupt)
      setShowActions(true)
      setLockedMessageCount(messages.length)
    } else {
      setShowActions(false)
    }
  }, [interrupt])

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim()
    if (!msg || sending || loading) return
    setInput('')
    setOptimisticMsg(msg)
    setSending(true)
    inputRef.current?.focus()
    try {
      const resp = await sendMessage(threadId, personNumber, msg)
      setOptimisticMsg(null)
      onMessagesUpdate(resp.messages, resp.interrupt)
    } catch (err) {
      setOptimisticMsg(null)
      const detail = err instanceof Error ? err.message : String(err)
      const isConnErr = detail.toLowerCase().includes('failed to fetch') || detail.toLowerCase().includes('networkerror')
      toast.error(isConnErr ? 'Cannot reach the server — is the backend running?' : 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isInputDisabled = sending || loading

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-navy">
            Hi {displayName} <span className="wave">👋</span>
          </h2>
          <p className="text-gray-500 text-sm mt-1">What would you like to do today?</p>
        </div>

        {/* Quick actions — only when no messages */}
        {messages.length === 0 && !loading && (
          <QuickActions onAction={(prompt) => handleSend(prompt)} />
        )}

        {/* Messages */}
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {(() => {
              // Build a combined render list: message segments interleaved with interrupt cards.
              // resolvedInterrupts are past goals; lockedInterrupt is the current (active or just-resolved) one.
              const allInterrupts = [
                ...resolvedInterrupts,
                ...(lockedInterrupt ? [{ goal: lockedInterrupt, afterIndex: lockedMessageCount }] : []),
              ]

              const handleListItemClick = (text: string) => {
                handleSend(text)
              }

              if (allInterrupts.length === 0) {
                // No interrupts at all — render all messages + optimistic
                return (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble
                        key={msg.id ?? i}
                        message={msg}
                        onClickItem={msg.role === 'assistant' ? handleListItemClick : undefined}
                      />
                    ))}
                    {optimisticMsg && (
                      <MessageBubble key="optimistic" message={{ id: 'optimistic', role: 'user', content: optimisticMsg }} />
                    )}
                  </>
                )
              }

              // Render message segments with interrupt cards interleaved
              const segments: React.ReactNode[] = []
              let cursor = 0

              allInterrupts.forEach(({ goal, afterIndex }, idx) => {
                const isLast = idx === allInterrupts.length - 1
                const isCurrentInterrupt = isLast && !!lockedInterrupt

                // Messages before this interrupt
                messages.slice(cursor, afterIndex).forEach((msg, i) => {
                  segments.push(
                    <MessageBubble
                      key={msg.id ?? (cursor + i)}
                      message={msg}
                      onClickItem={msg.role === 'assistant' ? handleListItemClick : undefined}
                    />
                  )
                })
                cursor = afterIndex

                // The interrupt card itself
                if (isCurrentInterrupt && !showEditForm) {
                  segments.push(
                    <GoalActionBar
                      key={`interrupt-${idx}`}
                      interrupt={goal}
                      threadId={threadId}
                      personNumber={personNumber}
                      showActions={showActions}
                      onEdit={(sc) => { setEditStatusCode(sc); setShowEditForm(true); setShowActions(false) }}
                      onComplete={(msgs, newInterrupt) => { setShowActions(false); onMessagesUpdate(msgs, newInterrupt) }}
                    />
                  )
                } else if (isCurrentInterrupt && showEditForm && goal.type === 'update') {
                  segments.push(
                    <UpdateGoalForm
                      key={`update-form-${idx}`}
                      interrupt={editStatusCode ? { ...goal, StatusCode: editStatusCode } : goal}
                      threadId={threadId}
                      personNumber={personNumber}
                      onComplete={(msgs, newInterrupt) => onMessagesUpdate(msgs, newInterrupt)}
                    />
                  )
                } else if (isCurrentInterrupt && showEditForm) {
                  segments.push(
                    <GoalForm
                      key={`form-${idx}`}
                      interrupt={editStatusCode ? { ...goal, StatusCode: editStatusCode } : goal}
                      threadId={threadId}
                      personNumber={personNumber}
                      onComplete={(msgs, newInterrupt) => onMessagesUpdate(msgs, newInterrupt)}
                    />
                  )
                } else {
                  // Resolved past interrupt — show card without action buttons
                  segments.push(
                    <GoalActionBar
                      key={`interrupt-${idx}`}
                      interrupt={goal}
                      threadId={threadId}
                      personNumber={personNumber}
                      showActions={false}
                      onEdit={(_sc) => {}}
                      onComplete={() => {}}
                    />
                  )
                }
              })

              // Remaining messages after the last interrupt card
              messages.slice(cursor).forEach((msg, i) => {
                segments.push(
                  <MessageBubble
                    key={msg.id ?? (cursor + i)}
                    message={msg}
                    onClickItem={msg.role === 'assistant' ? handleListItemClick : undefined}
                  />
                )
              })

              // Optimistic message
              if (optimisticMsg) {
                segments.push(
                  <MessageBubble key="optimistic" message={{ id: 'optimistic', role: 'user', content: optimisticMsg }} />
                )
              }

              return <>{segments}</>
            })()}
          </AnimatePresence>

          {/* Loading indicator */}
          {(sending || loading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                AI
              </div>
              <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm" style={{ border: '1px solid #eae6dd' }}>
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Fixed chat input */}
      <div className="shrink-0 px-6 pb-5 pt-3" style={{ borderTop: '1px solid #ece6d9', background: '#F3F3F0' }}>
        <div className={`flex items-end gap-3 bg-white rounded-2xl border shadow-sm transition-all ${
          isInputDisabled ? 'border-gray-100 opacity-70' : 'border-gray-200 focus-within:border-navy/30 focus-within:ring-2 focus-within:ring-navy/10'
        }`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isInputDisabled}
            rows={1}
            placeholder="Ask about your goals or set a new one..."
            className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none leading-relaxed"
            style={{ overflowY: 'auto', maxHeight: '8rem' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={isInputDisabled || !input.trim()}
            className="m-2 w-9 h-9 rounded-xl bg-navy hover:bg-navy-dark text-white flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
