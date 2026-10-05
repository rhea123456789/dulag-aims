import { useEffect, useState } from 'react'
import { api } from '../api'
import { hasRole, useAuth } from '../auth'
import { Seal } from '../components/Seal'
import { Bars } from '../components/ui'
import type { Beneficiary, DashboardData, Farmer, Page, Subsidy } from '../types'

export function DashboardPage() {
  const { user } = useAuth()
  const office = hasRole(user, 'system_administrator', 'mao_personnel')
  const [data, setData] = useState<DashboardData | null>(null)
  const [own, setOwn] = useState<{ farmers: number; subsidies: number; beneficiary: string | null }>({ farmers: 0, subsidies: 0, beneficiary: null })
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    if (office) {
      api<DashboardData>('/dashboard').then(setData).catch(setError)
      return
    }
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
  }, [office, user])

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

  return (
    <section>
      <Welcome name={user?.name} />
      <div className="grid stats">
        <Stat icon="farmer" label="Farmers" value={data.totals.farmers} />
        <Stat icon="farm" label="Farms" value={data.totals.farms} />
        <Stat icon="beneficiary" label="Beneficiaries" value={data.totals.beneficiaries} />
        <Stat icon="subsidy" label="Subsidies" value={data.totals.subsidies} />
      </div>
      <div className="grid cards-2" style={{ marginTop: 12 }}>
        <article className="card">
          <h2>Farmers by barangay</h2>
          <Bars rows={data.farmers_by_barangay.map((row) => ({ label: row.barangay, value: Number(row.total) }))} />
        </article>
        <article className="card">
          <h2>Subsidy status</h2>
          <Bars rows={Object.entries(data.subsidy_by_status).map(([key, value]) => ({ label: key.replaceAll('_', ' '), value: Number(value) }))} />
        </article>
        <article className="card">
          <h2>Production by crop</h2>
          <Bars rows={data.production_by_crop.map((row) => ({ label: row.crop_type, value: Number(row.total_quantity) }))} />
        </article>
        <article className="card">
          <h2>Recorded harvest quantity</h2>
          <Bars rows={data.production_trend.map((row) => ({ label: row.month, value: Number(row.total_quantity) }))} />
        </article>
      </div>
    </section>
  )
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
