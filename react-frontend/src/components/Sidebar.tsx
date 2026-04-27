import { X, LogOut } from 'lucide-react'

interface SidebarProps {
  workerName: string
  workerDesignation?: string
  onNewChat: () => void
  onSignOut: () => void
  isOpen?: boolean
  onClose?: () => void
}

function getInitials(name: string): string {
  if (!name || name === 'there') return 'U'
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export default function Sidebar({
  workerName,
  workerDesignation = '',
  onNewChat,
  onSignOut,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const displayName = workerName && workerName !== 'there' ? workerName : 'Employee'
  const initials = getInitials(displayName)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'flex flex-col bg-warm-surface shrink-0 border-r border-warm-border',
          'md:relative md:translate-x-0 md:w-[260px] md:min-h-screen md:z-auto',
          'fixed inset-y-0 left-0 z-40 w-[260px] transition-transform duration-300 md:transition-none',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        ].join(' ')}
      >
        {/* Header with SITA logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-warm-border">
          <img
            src="/sita-logo.svg"
            alt="SITA"
            style={{ height: 26, display: 'block', objectFit: 'contain', flexShrink: 0 }}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight text-warm-ink">Goal Assistant</p>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-warm-ink3">Oracle HCM</p>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-warm-border transition-colors"
            style={{ color: '#5d6478' }}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Worker profile */}
        <div className="px-5 py-4 border-b border-warm-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
              style={{ background: '#fff', color: '#2b3e2b', border: '2px solid #2b3e2b' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-warm-ink truncate">{displayName}</p>
              <p className="text-xs text-warm-ink3 truncate">{workerDesignation || 'Employee'}</p>
            </div>
          </div>
        </div>

        {/* New Chat button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all duration-150 hover:brightness-110"
            style={{ background: '#2b3e2b', boxShadow: '0 4px 10px -3px rgba(43,62,43,.35)' }}
          >
            + New Chat
          </button>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-warm-border" />

        {/* Capabilities */}
        <div className="px-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-warm-ink3">What I can do</p>
          <ul className="space-y-2">
            {[
              'Set SMART goals',
              'Check existing goals',
              'Update existing goals',
              'Role-based suggestions',
              'Track due dates',
            ].map(text => (
              <li key={text} className="flex items-center gap-2 text-xs text-warm-ink2">
                <span style={{ color: '#2b3e2b', fontSize: 14, lineHeight: 1 }}>→</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Sign out */}
        <div className="px-4 pb-5 pt-3 border-t border-warm-border mt-auto">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2 text-xs font-semibold py-2 px-3 rounded-xl transition-colors hover:bg-warm-border"
            style={{ color: '#5d6478' }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
