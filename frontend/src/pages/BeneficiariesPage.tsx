import { useEffect, useState, type FormEvent } from 'react'
import { api, day, personName } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager, Pill } from '../components/ui'
import type { Assistance, Beneficiary, Page } from '../types'

const empty = {
  first_name: '', middle_name: '', last_name: '', contact_number: '', barangay: '',
  address: '', subsidy_status: 'none', notes: '',
}

export function BeneficiariesPage() {
  const { user } = useAuth()
  const office = hasRole(user, 'system_administrator', 'mao_personnel')
  const [page, setPage] = useState<Page<Beneficiary> | null>(null)
  const [own, setOwn] = useState<Beneficiary | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [assistFor, setAssistFor] = useState<Beneficiary | null>(null)
  const [assist, setAssist] = useState({ assistance_type: '', date_received: '', description: '', quantity_or_amount: '', unit: '' })
  const [error, setError] = useState<unknown>(null)
  const [pageNo, setPageNo] = useState(1)

  function load(next = pageNo) {
    if (!office) {
      api<Beneficiary>('/my/beneficiary').then(setOwn).catch(setError)
      return
    }
    const params = new URLSearchParams({ page: String(next) })
    if (search) params.set('search', search)
    api<Page<Beneficiary>>(`/beneficiaries?${params}`).then(setPage).catch(setError)
  }

  useEffect(() => { load(pageNo) }, [pageNo, office])

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''))
    try {
      await api('/beneficiaries', { method: 'POST', body: JSON.stringify(body) })
      setForm(null)
      load()
    } catch (err) { setError(err) }
  }

  async function saveAssist(event: FormEvent) {
    event.preventDefault()
    if (!assistFor) return
    const body: Record<string, string | number> = {
      assistance_type: assist.assistance_type,
      date_received: assist.date_received,
    }
    if (assist.description) body.description = assist.description
    if (assist.quantity_or_amount) body.quantity_or_amount = Number(assist.quantity_or_amount)
    if (assist.unit) body.unit = assist.unit
    try {
      await api(`/beneficiaries/${assistFor.id}/assistance`, { method: 'POST', body: JSON.stringify(body) })
      setAssistFor(null)
      load()
    } catch (err) { setError(err) }
  }

  const rows = office ? page?.data ?? [] : own ? [own] : []

  return (
    <section>
      <div className="page-head">
        <div><h1>Beneficiaries</h1><p>Profiles and assistance history.</p></div>
        {office && <button onClick={() => { setForm({ ...empty }); setError(null) }}>Add beneficiary</button>}
      </div>
      {office && (
        <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setPageNo(1); load(1) }}>
          <input placeholder="Search name or barangay" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="ghost" type="submit">Search</button>
        </form>
      )}
      <Banner error={error} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Name</th><th>Barangay</th><th>Contact</th><th>Subsidy status</th><th>Assistance</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{personName(row)}</td>
                <td>{row.barangay}</td>
                <td>{row.contact_number || '—'}</td>
                <td><Pill value={row.subsidy_status} /></td>
                <td>{(row.assistance ?? []).map((item: Assistance) => `${item.assistance_type} (${day(item.date_received)})`).join(', ') || '—'}</td>
                <td>{office && <button className="ghost" onClick={() => setAssistFor(row)}>Record assistance</button>}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="empty">No beneficiary profile yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {office && <Pager page={page} onPage={setPageNo} />}
      {form && (
        <form className="sheet" onSubmit={save}>
          <h2>New beneficiary</h2>
          <div className="form-grid">
            <Field label="First name" name="first_name" error={error}><input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} /></Field>
            <Field label="Middle name" name="middle_name" error={error}><input value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} /></Field>
            <Field label="Last name" name="last_name" error={error}><input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></Field>
            <Field label="Contact" name="contact_number" error={error}><input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></Field>
            <Field label="Barangay" name="barangay" error={error}><input required value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} /></Field>
            <Field label="Address" name="address" error={error}><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Subsidy status" name="subsidy_status" error={error}>
              <select value={form.subsidy_status} onChange={(e) => setForm({ ...form, subsidy_status: e.target.value })}>
                <option value="none">None</option><option value="pending">Pending</option><option value="active">Active</option><option value="completed">Completed</option>
              </select>
            </Field>
            <label className="span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {assistFor && (
        <form className="sheet" onSubmit={saveAssist}>
          <h2>Assistance for {personName(assistFor)}</h2>
          <div className="form-grid">
            <Field label="Type" name="assistance_type" error={error}><input required value={assist.assistance_type} onChange={(e) => setAssist({ ...assist, assistance_type: e.target.value })} /></Field>
            <Field label="Date received" name="date_received" error={error}><input required type="date" value={assist.date_received} onChange={(e) => setAssist({ ...assist, date_received: e.target.value })} /></Field>
            <Field label="Quantity or amount" name="quantity_or_amount" error={error}><input type="number" min="0" step="0.01" value={assist.quantity_or_amount} onChange={(e) => setAssist({ ...assist, quantity_or_amount: e.target.value })} /></Field>
            <Field label="Unit" name="unit" error={error}><input value={assist.unit} onChange={(e) => setAssist({ ...assist, unit: e.target.value })} /></Field>
            <label className="span-2">Description<textarea value={assist.description} onChange={(e) => setAssist({ ...assist, description: e.target.value })} /></label>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setAssistFor(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
