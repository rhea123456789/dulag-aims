const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const TOKEN_KEY = 'aims_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (response.status === 401 && !path.endsWith('/login')) {
    setToken(null)
    if (!window.location.pathname.startsWith('/login')) {
      window.location.assign('/login')
    }
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null
  if (!response.ok) {
    throw new ApiError(data?.message || 'Request failed.', response.status, data?.errors ?? {})
  }
  return data as T
}

export async function downloadReport(type: string, format: 'pdf' | 'xlsx') {
  const headers = new Headers({ Accept: '*/*' })
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_URL}/reports/${type}?format=${format}`, { headers })
  if (!response.ok) {
    const text = await response.text()
    let message = 'Could not download the report.'
    try {
      message = JSON.parse(text).message || message
    } catch {
      /* binary or empty */
    }
    throw new ApiError(message, response.status)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
  link.click()
  URL.revokeObjectURL(url)
}

export function personName(person?: {
  first_name?: string
  middle_name?: string | null
  last_name?: string
  suffix?: string | null
} | null) {
  if (!person) return '—'
  return [person.first_name, person.middle_name, person.last_name, person.suffix].filter(Boolean).join(' ')
}

export function day(value?: string | null) {
  if (!value) return '—'
  return value.slice(0, 10)
}

export function label(value?: string | null) {
  if (!value) return '—'
  return value.replaceAll('_', ' ')
}

export function fieldErrors(error: unknown, field: string) {
  if (error instanceof ApiError) return error.errors[field]?.[0]
  return undefined
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong.'
}
