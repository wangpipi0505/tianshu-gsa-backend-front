import { apiGet } from '@/api/http'

export interface DemoToken {
  token: string
  tokenType: string
  expiresIn: number
  subject: string
  issuer: string
}

export function fetchDemoToken(subject?: string) {
  return apiGet<DemoToken>('/auth/demo-token', subject ? { subject } : undefined)
}
