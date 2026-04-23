import type { Message, GoalData } from '../types'

const BASE = ''  // proxied through vite

export interface ChatResponse {
  messages: Message[]
  interrupt: GoalData | null
}

async function checkOk(r: Response): Promise<Response> {
  if (!r.ok) {
    const detail = await r.text().catch(() => r.statusText)
    throw new Error(`API error ${r.status}: ${detail}`)
  }
  return r
}

export async function newThread(): Promise<string> {
  const r = await fetch(`${BASE}/api/thread/new`, { method: 'POST' })
  await checkOk(r)
  return (await r.json()).thread_id
}

export async function getWorker(): Promise<string> {
  const r = await fetch(`${BASE}/api/worker`)
  await checkOk(r)
  const data = await r.json()
  return data.name || ''
}

export async function getMessages(threadId: string): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/messages/${threadId}`)
  await checkOk(r)
  return r.json()
}

export async function sendMessage(threadId: string, message: string): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, message }),
  })
  await checkOk(r)
  return r.json()
}

export async function resumeGraph(
  threadId: string,
  action: string,
  goalData?: GoalData
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, action, goal_data: goalData }),
  })
  await checkOk(r)
  return r.json()
}

export async function updateGoal(
  threadId: string,
  goalData: GoalData
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, action: 'update', goal_data: goalData }),
  })
  await checkOk(r)
  return r.json()
}
