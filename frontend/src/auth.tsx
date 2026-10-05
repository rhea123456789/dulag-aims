import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, setToken } from './api'
import type { AuthUser, RoleSlug } from './types'

type AuthState = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const data = await api<{ user: AuthUser }>('/me')
    setUser(data.user)
  }

  useEffect(() => {
    const token = localStorage.getItem('aims_token')
    if (!token) {
      setLoading(false)
      return
    }
    refresh()
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    refresh,
    async login(email, password) {
      const data = await api<{ token: string; user: AuthUser }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(data.token)
      setUser(data.user)
    },
    async logout() {
      try {
        await api('/logout', { method: 'POST' })
      } finally {
        setToken(null)
        setUser(null)
      }
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider is missing')
  return ctx
}

export function hasRole(user: AuthUser | null, ...slugs: RoleSlug[]) {
  const slug = user?.role.slug
  return !!slug && slugs.includes(slug)
}
