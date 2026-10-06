import { useState } from 'react'
import { downloadReport, errorMessage } from '../api'

const REPORTS = [
  ['farmers', 'Farmers'],
  ['farms', 'Farms'],
  ['production', 'Production'],
  ['subsidies', 'Subsidies'],
  ['beneficiaries', 'Beneficiaries'],
  ['duplicates', 'Duplicate reviews'],
] as const

export function ReportsPage() {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function download(type: string, format: 'pdf' | 'xlsx') {
    setBusy(`${type}-${format}`)
    setError('')
    try {
      await downloadReport(type, format)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy('')
    }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Reports</h1><p>Excel and PDF exports from the recorded registers. Available to MAO personnel and administrators.</p></div>
      </div>
      {error && <p className="alert">{error}</p>}
      <div className="grid">
        {REPORTS.map(([type, title]) => (
          <article className="card tone-green" key={type}>
            <h2>{title}</h2>
            <div className="btn-row">
              <button disabled={busy === `${type}-xlsx`} onClick={() => download(type, 'xlsx')}>Download Excel</button>
              <button className="ghost" disabled={busy === `${type}-pdf`} onClick={() => download(type, 'pdf')}>Download PDF</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
