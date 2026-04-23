import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import { newThread, getWorker, getMessages } from './api/client'
import type { Message, GoalData } from './types'

const THREAD_KEY = 'goal_assistant_thread_id'

export default function App() {
  const [threadId, setThreadId]     = useState<string>('')
  const [workerName, setWorkerName] = useState<string>('')
  const [messages, setMessages]     = useState<Message[]>([])
  const [interrupt, setInterrupt]   = useState<GoalData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ─── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        let tid = localStorage.getItem(THREAD_KEY)
        let resp = { messages: [] as Message[], interrupt: null as GoalData | null }
        if (tid) {
          resp = await getMessages(tid)
          // Backend lost state (server restart) → stale thread, start fresh
          if (resp.messages.length === 0) {
            tid = null
          }
        }
        if (!tid) {
          tid = await newThread()
          localStorage.setItem(THREAD_KEY, tid)
          resp = { messages: [], interrupt: null }
        }
        setThreadId(tid)

        const name = await getWorker()
        setWorkerName(name)

        setMessages(resp.messages)
        setInterrupt(resp.interrupt)
      } catch {
        toast.error('Could not connect to the backend. Make sure the API server is running.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleMessagesUpdate = useCallback(
    (newMessages: Message[], newInterrupt: GoalData | null) => {
      setMessages(newMessages)
      setInterrupt(newInterrupt)
    },
    []
  )

  const handleNewChat = useCallback(async () => {
    try {
      const tid = await newThread()
      localStorage.setItem(THREAD_KEY, tid)
      setThreadId(tid)
      setMessages([])
      setInterrupt(null)
      setSidebarOpen(false)
      toast.success('Started a new chat!')
    } catch {
      toast.error('Failed to create new chat.')
    }
  }, [])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fbf8f1' }}>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '13px', fontFamily: 'Inter, sans-serif' },
          success: { style: { background: '#1a2744', color: '#fff' } },
          error:   { style: { background: '#b8443a', color: '#fff' } },
        }}
      />

      <Sidebar
        workerName={workerName}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-warm-border bg-warm-surface shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-warm-border transition-colors"
            style={{ color: '#5d6478' }}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold text-sm text-warm-ink">Goal Assistant</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-navy flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Connecting to Oracle HCM...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            {threadId && (
              <ChatArea
                workerName={workerName}
                messages={messages}
                interrupt={interrupt}
                threadId={threadId}
                loading={false}
                onMessagesUpdate={handleMessagesUpdate}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
