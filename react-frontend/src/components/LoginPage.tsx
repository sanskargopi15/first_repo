import { useState, FormEvent } from 'react'

interface Props {
  onLogin: (personNumber: string) => void
}

export default function LoginPage({ onLogin }: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

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
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif' }}>

      {/* Left panel */}
      <div style={{
        flex: '0 0 52%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(155deg, #1e2e1e 0%, #2b3e2b 60%, #344d34 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: '52px 60px',
      }}>
        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08, pointerEvents: 'none' }}>
          <defs>
            <pattern id="ldots" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ldots)" />
        </svg>

        {/* Concentric circles decoration */}
        <svg style={{ position: 'absolute', right: -140, bottom: -140, width: 560, height: 560, opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 560 560" fill="none">
          <circle cx="280" cy="280" r="260" stroke="white" strokeWidth="1.2" />
          <circle cx="280" cy="280" r="190" stroke="white" strokeWidth="1" />
          <circle cx="280" cy="280" r="120" stroke="white" strokeWidth="1" />
          <circle cx="280" cy="280" r="55" stroke="white" strokeWidth="1" />
        </svg>

        {/* SITA logo — white */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/sita-logo.svg" alt="SITA" style={{ height: 34, filter: 'brightness(0) invert(1)', display: 'block' }} />
        </div>

        {/* Centre text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 999, padding: '5px 14px', marginBottom: 32, width: 'fit-content',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a8d5a2', display: 'block' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.8)', letterSpacing: '.07em', textTransform: 'uppercase' }}>Oracle HCM Integration</span>
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.12, marginBottom: 20, letterSpacing: '-.03em' }}>
            Goal<br />Assistant
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, maxWidth: 300 }}>
            Set, track and manage your Oracle HCM performance goals with AI-powered guidance tailored to your role.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 48 }}>
            {['AI-crafted SMART goals', 'Direct Oracle HCM sync', 'Role-based suggestions'].map(text => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F3F0',
        padding: '52px 48px',
        position: 'relative',
      }}>
        {/* Subtle dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.5, pointerEvents: 'none' }}>
          <defs>
            <pattern id="rdots" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" fill="#2b3e2b" opacity=".1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rdots)" />
        </svg>

        <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>

          {/* App badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13, background: '#2b3e2b', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(43,62,43,.28)',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1a2028', lineHeight: 1.1 }}>Goal Assistant</p>
              <p style={{ fontSize: 12, color: '#8b91a4', marginTop: 2, fontWeight: 500 }}>Powered by SITA</p>
            </div>
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#1a2028', letterSpacing: '-.03em', marginBottom: 8 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 36, lineHeight: 1.7 }}>
            Enter your Oracle Person Number to access and manage your performance goals.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Person Number
              </label>
              <input
                type="text"
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="e.g. 12345"
                autoFocus
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: `1.5px solid ${error ? '#b8443a' : focused ? '#2b3e2b' : '#dedad3'}`,
                  padding: '14px 16px',
                  fontSize: 14,
                  outline: 'none',
                  background: focused ? '#fff' : '#faf9f7',
                  color: '#1a2028',
                  boxShadow: focused ? '0 0 0 3px rgba(43,62,43,.09)' : '0 1px 2px rgba(0,0,0,.04)',
                  transition: 'all .2s',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              {error && (
                <p style={{ fontSize: 12, color: '#b8443a', marginTop: 6, fontWeight: 500 }}>⚠ {error}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '15px 0',
                borderRadius: 12,
                background: '#2b3e2b',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(43,62,43,.3)',
                transition: 'all .18s',
                letterSpacing: '.01em',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = '#1e2e1e'
                el.style.transform = 'translateY(-1px)'
                el.style.boxShadow = '0 8px 24px rgba(43,62,43,.38)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = '#2b3e2b'
                el.style.transform = ''
                el.style.boxShadow = '0 4px 18px rgba(43,62,43,.3)'
              }}
            >
              Get Started →
            </button>
          </form>

          <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 24, textAlign: 'center', lineHeight: 1.7 }}>
            By signing in you agree to SITA's terms of use.<br />
            Need help? Contact your HR administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
