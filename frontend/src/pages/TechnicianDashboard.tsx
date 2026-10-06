import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import type { Farmer, Farm, Page, Production } from '../types'

export function TechnicianDashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState<{ farmers: number; pending: number; farms: number; production: number } | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    Promise.all([
      api<Page<Farmer>>('/farmers?page=1'),
      api<Page<Farmer>>('/farmers?status=pending_verification&page=1'),
      api<Page<Farm>>('/farms?page=1'),
      api<Page<Production>>('/productions?page=1'),
    ]).then(([farmers, pending, farms, production]) => {
      setCounts({
        farmers: farmers.total,
        pending: pending.total,
        farms: farms.total,
        production: production.total,
      })
    }).catch(() => setError(true))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <section className="office-dash">
      <div className="office-welcome tone-green">
        <div>
          <h1>{greeting}{user?.name ? `, ${user.name}` : ''}</h1>
          <p>Field records assigned to you for validation and monitoring.</p>
        </div>
      </div>
      {error && <p className="alert">The dashboard could not be loaded.</p>}
      {counts && (
        <div className="office-kpis">
          <article className="office-kpi">
            <span>Assigned farmers</span>
            <strong>{counts.farmers}</strong>
            <small>Profiles linked to your account</small>
          </article>
          <article className="office-kpi">
            <span>Pending verification</span>
            <strong>{counts.pending}</strong>
            <small>Assigned profiles awaiting verification</small>
          </article>
          <article className="office-kpi">
            <span>Farms</span>
            <strong>{counts.farms}</strong>
            <small>Parcels of assigned farmers</small>
          </article>
          <article className="office-kpi">
            <span>Production</span>
            <strong>{counts.production}</strong>
            <small>Recorded production entries</small>
          </article>
        </div>
      )}
      <article className="office-panel tone-paper">
        <h2>Field work</h2>
        <div className="office-actions">
          <Link to="/farmers">Assigned farmers</Link>
          <Link to="/farms">Farms</Link>
          <Link to="/production">Production</Link>
          <Link to="/submissions">Submission status</Link>
        </div>
      </article>
    </section>
  )
}
