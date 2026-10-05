import { useEffect, useState, type FormEvent } from 'react'
import { api, day, personName } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager, Pill } from '../components/ui'
import type { Beneficiary, Farmer, Page, Subsidy } from '../types'

const STATUSES = ['pending', 'under_review', 'approved', 'released', 'completed', 'rejected']

export function SubsidiesPage() {
  const { user } = useAuth()
  const canManage = hasRole(user, 'system_administrator', 'mao_personnel')
  const [page, setPage] = useState<Page<Subsidy> | null>(null)
  const [status, setStatus] = useState('')
  const [form, setForm] = useState(false)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([])
  const [draft, setDraft] = useState({ farmer_profile_id: '', beneficiary_id: '', subsidy_type: '', application_date: '', amount: '', distribution_information: '', remarks: '' })
  const [error, setError] = useState<unknown>(null)
  const [pageNo, setPageNo] = useState(1)
  const [statusFor, setStatusFor] = useState<Subsidy | null>(null)
  const [nextStatus, setNextStatus] = useState('under_review')

  function load(next = pageNo) {
    const params = new URLSearchParams({ page: String(next) })
    if (status) params.set('status', status)
    api<Page<Subsidy>>(`/subsidies?${params}`).then(setPage).catch(setError)
  }

  useEffect(() => { load(pageNo) }, [pageNo])

  async function openForm() {
    const [farmerPage, beneficiaryPage] = await Promise.all([
      api<Page<Farmer>>('/farmers?page=1'),
      api<Page<Beneficiary>>('/beneficiaries?page=1'),
    ])
    setFarmers(farmerPage.data)
    setBeneficiaries(beneficiaryPage.data)
    setForm(true)
    setError(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const body: Record<string, string | number> = {
      subsidy_type: draft.subsidy_type,
      application_date: draft.application_date,
    }
    if (draft.farmer_profile_id) body.farmer_profile_id = Number(draft.farmer_profile_id)
    if (draft.beneficiary_id) body.beneficiary_id = Number(draft.beneficiary_id)
    if (draft.amount) body.amount = Number(draft.amount)
    if (draft.distribution_information) body.distribution_information = draft.distribution_information
    if (draft.remarks) body.remarks = draft.remarks
    try {
      await api('/subsidies', { method: 'POST', body: JSON.stringify(body) })
      setForm(false)
      load()
    } catch (err) { setError(err) }
  }

  async function updateStatus(event: FormEvent) {
    event.preventDefault()
    if (!statusFor) return
    try {
      await api(`/subsidies/${statusFor.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) })
      setStatusFor(null)
      load()
    } catch (err) { setError(err) }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Subsidies</h1><p>Applications move from pending through release. Staff update the status.</p></div>
        {canManage && <button onClick={openForm}>New application</button>}
      </div>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setPageNo(1); load(1) }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
        </select>
        <button className="ghost" type="submit">Filter</button>
      </form>
      <Banner error={error} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Type</th><th>Farmer</th><th>Beneficiary</th><th>Applied</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {page?.data.map((row) => (
              <tr key={row.id}>
                <td>{row.subsidy_type}</td>
                <td>{personName(row.farmer)}</td>
                <td>{personName(row.beneficiary)}</td>
                <td>{day(row.application_date)}</td>
                <td>{row.amount ?? '—'}</td>
                <td><Pill value={row.status} /></td>
                <td>{canManage && <button className="ghost" onClick={() => { setStatusFor(row); setNextStatus(row.status) }}>Update status</button>}</td>
              </tr>
            ))}
            {page?.data.length === 0 && <tr><td colSpan={7} className="empty">No subsidy records in your scope.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} onPage={setPageNo} />
      {form && (
        <form className="sheet" onSubmit={save}>
          <h2>New subsidy application</h2>
          <div className="form-grid">
            <Field label="Type" name="subsidy_type" error={error}><input required value={draft.subsidy_type} onChange={(e) => setDraft({ ...draft, subsidy_type: e.target.value })} /></Field>
            <Field label="Application date" name="application_date" error={error}><input required type="date" value={draft.application_date} onChange={(e) => setDraft({ ...draft, application_date: e.target.value })} /></Field>
            <Field label="Farmer" name="farmer_profile_id" error={error}>
              <select value={draft.farmer_profile_id} onChange={(e) => setDraft({ ...draft, farmer_profile_id: e.target.value })}>
                <option value="">None</option>
                {farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{personName(farmer)}</option>)}
              </select>
            </Field>
            <Field label="Beneficiary" name="beneficiary_id" error={error}>
              <select value={draft.beneficiary_id} onChange={(e) => setDraft({ ...draft, beneficiary_id: e.target.value })}>
                <option value="">None</option>
                {beneficiaries.map((person) => <option key={person.id} value={person.id}>{personName(person)}</option>)}
              </select>
            </Field>
            <Field label="Amount" name="amount" error={error}><input type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} /></Field>
            <label className="span-2">Distribution information<textarea value={draft.distribution_information} onChange={(e) => setDraft({ ...draft, distribution_information: e.target.value })} /></label>
            <label className="span-2">Remarks<textarea value={draft.remarks} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} /></label>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setForm(false)}>Cancel</button>
          </div>
        </form>
      )}
      {statusFor && (
        <form className="sheet" onSubmit={updateStatus}>
          <h2>Update status — {statusFor.subsidy_type}</h2>
          <Field label="Status" name="status" error={error}>
            <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
              {STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}
            </select>
          </Field>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="submit">Save status</button>
            <button type="button" className="ghost" onClick={() => setStatusFor(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
