import { useState, FormEvent } from 'react'

interface Props {
  onLogin: (personNumber: string) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) {
      setError('Please enter your Person Number.')
      return
    }
    setError('')
    onLogin(trimmed)
  }

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ background: '#F3F3F0' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-xl p-8"
        style={{ background: '#ffffff' }}
      >
        {/* Logo / header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#1a2744' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight" style={{ color: '#1a2744' }}>Goal Assistant</p>
            <p className="text-xs" style={{ color: '#8a92a0' }}>Oracle HCM</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-1" style={{ color: '#1a2744' }}>
          Sign in
        </h1>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
          Enter your Oracle Person Number to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="person-number"
              className="block text-xs font-medium mb-1.5"
              style={{ color: '#374151' }}
            >
              Person Number
            </label>
            <input
              id="person-number"
              type="text"
              value={value}
              onChange={e => { setValue(e.target.value); setError('') }}
              placeholder="e.g. 12345"
              autoFocus
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                borderColor: error ? '#b8443a' : '#d1d5db',
                background: '#f9fafb',
                color: '#111827',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#1a2744' }}
              onBlur={e => { e.currentTarget.style.borderColor = error ? '#b8443a' : '#d1d5db' }}
            />
            {error && (
              <p className="mt-1.5 text-xs" style={{ color: '#b8443a' }}>{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: '#1a2744' }}
          >
            Get Started
          </button>
        </form>
      </div>
    </div>
  )
}
