import { useEffect, useState, type FormEvent } from 'react'
import { api, personName } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager, Pill } from '../components/ui'
import type { Farmer, Page } from '../types'

function toForm(farmer: Farmer): Record<string, string> {
  return {
    ...empty,
    first_name: farmer.first_name,
    middle_name: farmer.middle_name ?? '',
    last_name: farmer.last_name,
    suffix: farmer.suffix ?? '',
    birthdate: farmer.birthdate?.slice(0, 10) ?? '',
    sex: farmer.sex ?? '',
    civil_status: farmer.civil_status ?? '',
    contact_number: farmer.contact_number ?? '',
    email: farmer.email ?? '',
    street: farmer.street ?? '',
    barangay: farmer.barangay,
    municipality: farmer.municipality ?? '',
    province: farmer.province ?? '',
    ownership_information: farmer.ownership_information ?? '',
    rsbsa_reference_number: farmer.rsbsa_reference_number ?? '',
    status: farmer.status,
    notes: farmer.notes ?? '',
  }
}

const empty = {
  first_name: '', middle_name: '', last_name: '', suffix: '', birthdate: '', sex: '',
  civil_status: '', contact_number: '', email: '', street: '', barangay: '',
  municipality: 'Dulag', province: 'Leyte', ownership_information: '',
  rsbsa_reference_number: '', status: 'pending_verification', notes: '',
}

export function FarmersPage() {
  const { user } = useAuth()
  const canWrite = hasRole(user, 'system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician')
  const canVerify = hasRole(user, 'system_administrator', 'mao_personnel', 'rsbsa_focal_person')
  const [page, setPage] = useState<Page<Farmer> | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [pageNo, setPageNo] = useState(1)

  function load(next = pageNo) {
    const params = new URLSearchParams({ page: String(next) })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    api<Page<Farmer>>(`/farmers?${params}`).then(setPage).catch(setError)
  }

  useEffect(() => { load(pageNo) }, [pageNo])

  function set(name: string, value: string) {
    setForm((current) => ({ ...(current ?? empty), [name]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    setError(null)
    const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''))
    try {
      if (editing) await api(`/farmers/${editing}`, { method: 'PUT', body: JSON.stringify(body) })
      else await api('/farmers', { method: 'POST', body: JSON.stringify(body) })
      setForm(null)
      setEditing(null)
      load()
    } catch (err) { setError(err) }
  }

  async function act(id: number, action: 'archive' | 'verify') {
    setError(null)
    try {
      await api(`/farmers/${id}/${action}`, { method: 'POST' })
      load()
    } catch (err) { setError(err) }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Farmers</h1><p>Profiles, RSBSA reference numbers, and verification status.</p></div>
        {canWrite && <button onClick={() => { setEditing(null); setForm({ ...empty }); setError(null) }}>Add farmer</button>}
      </div>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setPageNo(1); load(1) }}>
        <input placeholder="Search name, contact, barangay, RSBSA" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="pending_verification">Pending verification</option>
          <option value="verified">Verified</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button className="ghost" type="submit">Filter</button>
      </form>
      <Banner error={error} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Name</th><th>Barangay</th><th>Contact</th><th>RSBSA ref.</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {page?.data.map((farmer) => (
              <tr key={farmer.id}>
                <td>{personName(farmer)}</td>
                <td>{farmer.barangay}</td>
                <td>{farmer.contact_number || '—'}</td>
                <td>{farmer.rsbsa_reference_number || '—'}</td>
                <td><Pill value={farmer.status} /></td>
                <td className="row-actions">
                  {canWrite && <button className="ghost" onClick={() => { setEditing(farmer.id); setForm(toForm(farmer)); setError(null) }}>Edit</button>}
                  {canVerify && farmer.status !== 'verified' && <button className="ghost" onClick={() => act(farmer.id, 'verify')}>Verify</button>}
                  {canWrite && farmer.status !== 'archived' && <button className="warn" onClick={() => act(farmer.id, 'archive')}>Archive</button>}
                </td>
              </tr>
            ))}
            {page?.data.length === 0 && <tr><td colSpan={6} className="empty">No farmer profiles in your scope.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} onPage={setPageNo} />
      {form && (
        <form className="sheet" onSubmit={save}>
          <h2>{editing ? 'Edit farmer' : 'New farmer'}</h2>
          <div className="form-grid">
            {(['first_name', 'middle_name', 'last_name', 'suffix', 'birthdate', 'contact_number', 'email', 'street', 'barangay', 'municipality', 'province', 'civil_status', 'ownership_information', 'rsbsa_reference_number'] as const).map((name) => (
              <Field key={name} label={name.replaceAll('_', ' ')} name={name} error={error}>
                <input type={name === 'birthdate' ? 'date' : name === 'email' ? 'email' : 'text'} value={form[name] ?? ''} onChange={(e) => set(name, e.target.value)} required={name === 'first_name' || name === 'last_name' || name === 'barangay'} />
              </Field>
            ))}
            <Field label="sex" name="sex" error={error}>
              <select value={form.sex ?? ''} onChange={(e) => set('sex', e.target.value)}>
                <option value="">—</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </Field>
            <Field label="status" name="status" error={error}>
              <select value={form.status ?? ''} onChange={(e) => set('status', e.target.value)}>
                <option value="pending_verification">Pending verification</option>
                <option value="verified">Verified</option>
                <option value="active">Active</option>
              </select>
            </Field>
            <Field label="notes" name="notes" error={error}><textarea className="span-2" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} /></Field>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="submit">Save</button>
            <button type="button" className="ghost" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
