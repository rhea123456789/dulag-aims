import { useEffect, useState } from 'react'
import { api, day, personName } from '../api'
import { Pager, Pill } from '../components/ui'
import type { Farmer, Page, Subsidy } from '../types'

export function SubmissionStatusPage() {
  const [farmers, setFarmers] = useState<Page<Farmer> | null>(null)
  const [subsidies, setSubsidies] = useState<Page<Subsidy> | null>(null)
  const [farmerPage, setFarmerPage] = useState(1)
  const [subsidyPage, setSubsidyPage] = useState(1)
  const [error, setError] = useState(false)

  useEffect(() => {
    api<Page<Farmer>>(`/farmers?page=${farmerPage}`).then(setFarmers).catch(() => setError(true))
  }, [farmerPage])

  useEffect(() => {
    api<Page<Subsidy>>(`/subsidies?page=${subsidyPage}`).then(setSubsidies).catch(() => setError(true))
  }, [subsidyPage])

  return (
    <section className="office-dash">
      <div className="page-head">
        <div>
          <h1>Submission Status</h1>
          <p>Verification and assistance status for the farmers assigned to you.</p>
        </div>
      </div>
      {error && <p className="alert">Submission status could not be loaded.</p>}
      <article className="office-panel tone-paper">
        <h2>Farmer verification</h2>
        <div className="office-table-wrap">
          <table className="office-table">
            <thead><tr><th>Farmer</th><th>Barangay</th><th>Status</th></tr></thead>
            <tbody>
              {farmers?.data.map((farmer) => (
                <tr key={farmer.id}>
                  <td>{personName(farmer)}</td>
                  <td>{farmer.barangay}</td>
                  <td><Pill value={farmer.status} /></td>
                </tr>
              ))}
              {farmers?.data.length === 0 && <tr><td colSpan={3} className="empty">No assigned farmers.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={farmers} onPage={setFarmerPage} />
      </article>
      <article className="office-panel tone-green">
        <h2>Assistance records</h2>
        <div className="office-table-wrap">
          <table className="office-table">
            <thead><tr><th>Type</th><th>Farmer</th><th>Applied</th><th>Status</th></tr></thead>
            <tbody>
              {subsidies?.data.map((row) => (
                <tr key={row.id}>
                  <td>{row.subsidy_type}</td>
                  <td>{personName(row.farmer)}</td>
                  <td>{day(row.application_date)}</td>
                  <td><Pill value={row.status} /></td>
                </tr>
              ))}
              {subsidies?.data.length === 0 && <tr><td colSpan={4} className="empty">No assistance records for assigned farmers.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pager page={subsidies} onPage={setSubsidyPage} />
      </article>
    </section>
  )
}
