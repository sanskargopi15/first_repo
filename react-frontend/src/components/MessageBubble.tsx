import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../types'

function formatTime(ts?: string): string {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({
  message,
  onClickItem,
}: {
  message: Message
  onClickItem?: (text: string) => void
}) {
  const isUser = message.role === 'user'
  const timeStr = formatTime(message.timestamp)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow mb-1">
          AI
        </div>
      )}

      {/* Bubble + timestamp */}
      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-accent text-white rounded-tr-sm'
              : 'bg-white rounded-tl-sm'
          }`}
          style={!isUser ? { color: '#2a2f3d', border: '1px solid #eae6dd' } : undefined}
        >
          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p style={{ margin: '3px 0' }}>{children}</p>
                ),
                ul: ({ children }) => (
                  <ul style={{ margin: '4px 0', paddingLeft: 0, listStyle: 'none' }}>{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ margin: '4px 0', paddingLeft: 16 }}>{children}</ol>
                ),
                li: ({ node, children }: { node?: any; children?: React.ReactNode }) => {
                  const hasContent = (node as any)?.children?.some(
                    (c: any) =>
                      (c.type === 'text' && c.value?.trim()) ||
                      (c.type === 'element' && c.tagName !== 'ul' && c.tagName !== 'ol')
                  )
                  if (!hasContent) return <>{children}</>
                  const clickable = !!onClickItem
                  const extractText = (n: any): string => {
                    if (!n) return ''
                    if (n.type === 'text') return n.value ?? ''
                    if (n.children) return n.children.map(extractText).join('')
                    return ''
                  }
                  const handleClick = clickable
                    ? () => {
                        const text = extractText(node).trim()
                        if (text) onClickItem(text)
                      }
                    : undefined
                  return (
                    <li
                      onClick={handleClick}
                      style={{
                        display: 'flex',
                        gap: 8,
                        margin: '3px 0',
                        cursor: clickable ? 'pointer' : 'default',
                        borderRadius: 6,
                        padding: clickable ? '2px 4px' : undefined,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={clickable ? e => { (e.currentTarget as HTMLLIElement).style.background = '#e8ede8' } : undefined}
                      onMouseLeave={clickable ? e => { (e.currentTarget as HTMLLIElement).style.background = '' } : undefined}
                    >
                      <span style={{ color: '#2b3e2b', flexShrink: 0, marginTop: 1 }}>•</span>
                      <span>{children}</span>
                    </li>
                  )
                },
                table: ({ children }) => (
                  <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 12, minWidth: '100%' }}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{ border: '1px solid #eae6dd', padding: '4px 8px', background: '#e8ede8', color: '#2a2f3d', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ border: '1px solid #eae6dd', padding: '4px 8px', color: '#2a2f3d' }}>
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 600 }}>{children}</strong>
                ),
                code: ({ children }) => (
                  <code style={{ background: '#f1ebdd', borderRadius: 4, padding: '1px 4px', fontSize: 11, fontFamily: 'monospace' }}>
                    {children}
                  </code>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
        {timeStr && (
          <span style={{ fontSize: 10, color: '#8b91a4', fontWeight: 500, paddingBottom: 2 }}>
            {timeStr}
          </span>
        )}
      </div>
    </motion.div>
  )
}
