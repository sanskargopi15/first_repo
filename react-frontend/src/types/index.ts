export interface Message {
  role: 'user' | 'assistant'
  content: string
  id?: string
  timestamp?: string
}

export interface GoalData {
  GoalName: string
  Description: string
  StartDate: string
  TargetCompletionDate: string
  StatusCode?: string
  PercentComplete?: number
  created_at?: string
  type?: 'create' | 'update'
  SelfHref?: string
  GoalId?: number | string
}

export interface ChatState {
  messages: Message[]
  interrupt: GoalData | null
  loading: boolean
}
