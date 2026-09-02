import axios, { type AxiosRequestConfig } from 'axios'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

export const http = axios.create({
  baseURL: '/api/gsa/v1',
  timeout: 30000
})

const TOKEN_KEY = 'gsa.accessToken'

export function setAccessToken(token: string | null) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

http.interceptors.request.use((config) => {
  const portal = import.meta.env.VITE_PORTAL_TOKEN
  const token = portal || getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function unwrap<T>(payload: ApiEnvelope<T>): T {
  if (payload == null || typeof payload.code !== 'number') {
    throw new Error('后端响应格式无效')
  }
  if (payload.code !== 0) {
    throw new Error(payload.message || '接口调用失败')
  }
  return payload.data
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await http.get<ApiEnvelope<T>>(url, { params })
  return unwrap(data)
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<ApiEnvelope<T>>(url, body ?? {}, config)
  return unwrap(data)
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.put<ApiEnvelope<T>>(url, body ?? {})
  return unwrap(data)
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.patch<ApiEnvelope<T>>(url, body ?? {})
  return unwrap(data)
}

export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await http.delete<ApiEnvelope<T>>(url)
  return unwrap(data)
}
