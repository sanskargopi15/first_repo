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

export interface WorkerInfo {
  name: string
  designation: string
}

export async function getWorker(personNumber: string): Promise<WorkerInfo> {
  const r = await fetch(`${BASE}/api/worker?person_number=${encodeURIComponent(personNumber)}`)
  await checkOk(r)
  const data = await r.json()
  return { name: data.name || '', designation: data.designation || '' }
}

export async function getMessages(threadId: string): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/messages/${threadId}`)
  await checkOk(r)
  return r.json()
}

export async function sendMessage(threadId: string, personNumber: string, message: string): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, person_number: personNumber, message }),
  })
  await checkOk(r)
  return r.json()
}

export async function resumeGraph(
  threadId: string,
  personNumber: string,
  action: string,
  goalData?: GoalData
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, person_number: personNumber, action, goal_data: goalData }),
  })
  await checkOk(r)
  return r.json()
}

export async function getGoalProgress(goalId: number | string): Promise<number> {
  const r = await fetch(`${BASE}/api/goal-progress/${goalId}`)
  await checkOk(r)
  const data = await r.json()
  return data.PercentCompletion ?? 0
}

export async function updateGoal(
  threadId: string,
  personNumber: string,
  goalData: GoalData
): Promise<ChatResponse> {
  const r = await fetch(`${BASE}/api/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId, person_number: personNumber, action: 'update', goal_data: goalData }),
  })
  await checkOk(r)
  return r.json()
}
