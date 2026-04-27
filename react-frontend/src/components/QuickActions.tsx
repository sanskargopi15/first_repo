interface QuickActionsProps {
  onAction: (prompt: string) => void
}

const VIEW_ACTIONS = [
  { label: 'Show last 5 goals', prompt: 'Show my last 5 goals' },
  { label: 'Overdue goals', prompt: 'Any overdue goals?' },
  { label: 'Goals not yet started', prompt: 'Which of my goals have not been started yet?' },
]

const MANAGE_ACTIONS = [
  { label: 'Set a new goal', prompt: 'Set a new goal' },
  { label: 'Prioritize goals', prompt: 'Which goal should I prioritize?' },
  { label: 'Suggest a goal', prompt: 'Suggest a goal for my role' },
]

function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 rounded-full bg-white text-xs font-medium transition-all duration-150 whitespace-nowrap"
      style={{ border: '1px solid #ece6d9', color: '#5d6478' }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = '#2b3e2b'
        el.style.color = '#fff'
        el.style.borderColor = '#2b3e2b'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.background = '#fff'
        el.style.color = '#5d6478'
        el.style.borderColor = '#ece6d9'
      }}
    >
      {label}
    </button>
  )
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="space-y-3 mb-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8b91a4' }}>View</p>
        <div className="flex flex-wrap gap-2">
          {VIEW_ACTIONS.map(a => (
            <ActionButton key={a.prompt} label={a.label} onClick={() => onAction(a.prompt)} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#8b91a4' }}>Manage</p>
        <div className="flex flex-wrap gap-2">
          {MANAGE_ACTIONS.map(a => (
            <ActionButton key={a.prompt} label={a.label} onClick={() => onAction(a.prompt)} />
          ))}
        </div>
      </div>
    </div>
  )
}
