import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { hasRole, useAuth } from '../auth'
import type { AiReview, AuditLog, DashboardData, Page } from '../types'

export function OfficeDashboard({ data }: { data: DashboardData }) {
  const { user } = useAuth()
  const admin = hasRole(user, 'system_administrator')
  const [logs, setLogs] = useState<AuditLog[] | null>(null)
  const [logError, setLogError] = useState(false)
  const [pendingReviews, setPendingReviews] = useState<number | null>(null)

  useEffect(() => {
    if (!admin) return
    api<Page<AuditLog>>('/audit-logs?page=1')
      .then((page) => setLogs(page.data.slice(0, 6)))
      .catch(() => setLogError(true))
  }, [admin])

  useEffect(() => {
    api<Page<AiReview>>('/ai/reviews?status=pending&page=1')
      .then((page) => setPendingReviews(page.total))
      .catch(() => setPendingReviews(null))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const farmerStatuses = Object.entries(data.farmer_status)
  const subsidyStatuses = Object.entries(data.subsidy_by_status)

  return (
    <section className="office-dash">
      <div className="office-welcome tone-green">
        <div>
          <h1>{greeting}{user?.name ? `, ${user.name}` : ''}</h1>
          <p>Here's an overview of the records and activities managed through Dulag FAIMS.</p>
        </div>
        <Link to="/reports">Open reports</Link>
      </div>

      <div className="office-kpis">
        <Kpi label="Farmer Records" value={data.totals.farmers} note="Profiles that are not archived" />
        <Kpi label="Farms" value={data.totals.farms} note="Active farm records" />
        <Kpi label="Subsidy Records" value={data.totals.subsidies} note="Assistance records on file" />
        <Kpi label="Beneficiary Records" value={data.totals.beneficiaries} note="Beneficiary profiles" />
      </div>

      <div className="office-grid">
        <article className="office-panel tone-paper">
          <h2>Recorded harvest quantity</h2>
          <p>Monthly quantity from recorded production.</p>
          <Bars rows={data.production_trend.map((row) => ({ label: row.month, value: Number(row.total_quantity) }))} empty="Not enough production dates yet. More records will appear here as the system is used." />
        </article>
        <article className="office-panel tone-green">
          <h2>Farm production overview</h2>
          <p>Total recorded quantity by crop.</p>
          <Bars rows={data.production_by_crop.map((row) => ({ label: row.crop_type, value: Number(row.total_quantity) }))} empty="No production quantities have been recorded yet." />
        </article>
      </div>

      <div className="office-grid">
        <article className="office-panel tone-paper">
          <h2>Recent activity</h2>
          {!admin && <p className="office-empty">The activity log is available to the system administrator.</p>}
          {admin && logError && <p className="office-empty">The activity log could not be loaded.</p>}
          {admin && logs && logs.length === 0 && <p className="office-empty">No activity has been recorded yet.</p>}
          {admin && logs && logs.length > 0 && (
            <div className="office-table-wrap">
              <table className="office-table">
                <thead>
                  <tr><th>Activity</th><th>User</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.action}</td>
                      <td>{log.user?.name || '—'}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
        <article className="office-panel tone-green">
          <h2>Record status</h2>
          <p>Farmer profile and subsidy statuses currently on file.</p>
          <Status title="Farmer profiles" rows={farmerStatuses} />
          <Status title="Subsidy records" rows={subsidyStatuses} />
        </article>
      </div>

      <div className="office-grid">
        <article className="office-panel tone-ai">
          <h2>AI-assisted review</h2>
          <p>Suggestions stay pending until a person reviews them. The system does not approve or reject records on its own.</p>
          <strong className="office-ai-count">{pendingReviews ?? '—'}</strong>
          <span>Pending duplicate reviews</span>
          <Link to="/ai-review">Review records</Link>
        </article>
        <article className="office-panel tone-paper">
          <h2>Quick actions</h2>
          <div className="office-actions">
            <Link to="/farmers">View farmer records</Link>
            <Link to="/farms">View farms</Link>
            <Link to="/production">View production</Link>
            <Link to="/subsidies">View subsidy records</Link>
            <Link to="/reports">Generate a report</Link>
          </div>
        </article>
      </div>
    </section>
  )
}

function Kpi({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <article className="office-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function Bars({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  const usable = rows.filter((row) => row.label && Number.isFinite(row.value))
  const max = Math.max(...usable.map((row) => row.value), 0)
  if (!usable.length || max <= 0) return <p className="office-empty">{empty}</p>
  return (
    <div className="office-bars">
      {usable.map((row) => (
        <div key={row.label} title={`${row.label}: ${row.value}`}>
          <span>{row.label}</span>
          <i><b style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }} /></i>
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  )
}

function Status({ title, rows }: { title: string; rows: [string, number][] }) {
  if (!rows.length) return <p className="office-empty">No {title.toLowerCase()} yet.</p>
  return (
    <div className="office-status">
      <h3>{title}</h3>
      <ul>
        {rows.map(([status, total]) => (
          <li key={status}>
            <span>{status.replaceAll('_', ' ')}</span>
            <strong>{total}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
