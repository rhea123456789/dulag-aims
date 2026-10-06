import { useEffect, useState } from 'react'
import { api } from '../api'
import { hasRole, useAuth } from '../auth'
import { Seal } from '../components/Seal'
import type { Beneficiary, DashboardData, Farmer, Page, Subsidy } from '../types'
import { OfficeDashboard } from './OfficeDashboard'
import { TechnicianDashboard } from './TechnicianDashboard'

export function DashboardPage() {
  const { user } = useAuth()
  const office = hasRole(user, 'system_administrator', 'mao_personnel')
  const technician = hasRole(user, 'agricultural_technician')
  const [data, setData] = useState<DashboardData | null>(null)
  const [own, setOwn] = useState<{ farmers: number; subsidies: number; beneficiary: string | null }>({ farmers: 0, subsidies: 0, beneficiary: null })
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (office) {
      api<DashboardData>('/dashboard').then(setData).catch(setError)
      return
    }
    if (technician) return
    const load = async () => {
      const next = { farmers: 0, subsidies: 0, beneficiary: null as string | null }
      if (hasRole(user, 'farmer', 'rsbsa_focal_person', 'agricultural_technician', 'system_administrator', 'mao_personnel')) {
        const farmers = await api<Page<Farmer>>('/farmers?page=1')
        next.farmers = farmers.total
      }
      if (!hasRole(user, 'rsbsa_focal_person')) {
        try {
          const subsidies = await api<Page<Subsidy>>('/subsidies?page=1')
          next.subsidies = subsidies.total
        } catch { /* role cannot list subsidies */ }
      }
      if (hasRole(user, 'beneficiary')) {
        const profile = await api<Beneficiary>('/my/beneficiary')
        next.beneficiary = [profile.first_name, profile.last_name].join(' ')
      }
      setOwn(next)
    }
    load().catch(setError)
  }, [office, technician, user])

  if (technician) return <TechnicianDashboard />

  if (error) return <p className="alert">The dashboard could not be loaded.</p>

  if (!office) {
    return (
      <section>
        <Welcome name={user?.name} />
        <div className="grid stats">
          <Stat icon="farmer" label="Farmer profiles" value={own.farmers} />
          <Stat icon="subsidy" label="Subsidy records" value={own.subsidies} />
          <Stat icon="beneficiary" label="Beneficiary profile" value={own.beneficiary ?? '—'} />
        </div>
      </section>
    )
  }

  if (!data) return <p className="muted">Loading dashboard…</p>

  return <OfficeDashboard data={data} />
}

function Welcome({ name }: { name?: string }) {
  return (
    <header className="welcome">
      <Seal size={72} />
      <div>
        <p className="eyebrow">Municipal Agriculture Office of Dulag, Leyte</p>
        <h1>Welcome{name ? `, ${name}` : ''}</h1>
        <p>Dulag FAIMS — Farm and Agriculture Information Management System</p>
      </div>
    </header>
  )
}

function Stat({ icon, label, value }: { icon: 'farmer' | 'farm' | 'beneficiary' | 'subsidy'; label: string; value: number | string }) {
  return (
    <article className="card stat">
      <span className={`stat-icon ${icon}`} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
