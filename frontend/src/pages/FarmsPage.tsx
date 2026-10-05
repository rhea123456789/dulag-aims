import { useEffect, useState, type FormEvent } from 'react'
import { api, personName } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager, Pill } from '../components/ui'
import type { Farm, Farmer, Page } from '../types'

const empty = {
  farmer_profile_id: '', parcel_name: '', location: '', barangay: '', area_hectares: '',
  land_classification: '', ownership_arrangement: '', cultivation_details: '', status: 'active',
}

export function FarmsPage() {
  const { user } = useAuth()
  const canWrite = hasRole(user, 'system_administrator', 'mao_personnel', 'agricultural_technician')
  const [page, setPage] = useState<Page<Farm> | null>(null)
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [editing, setEditing] = useState<number | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [pageNo, setPageNo] = useState(1)

  function load(next = pageNo) {
    const params = new URLSearchParams({ page: String(next) })
    if (search) params.set('search', search)
    api<Page<Farm>>(`/farms?${params}`).then(setPage).catch(setError)
  }

  useEffect(() => { load(pageNo) }, [pageNo])

  async function openForm(farm?: Farm) {
    setError(null)
    const list = await api<Page<Farmer>>('/farmers?page=1')
    setFarmers(list.data)
    setEditing(farm?.id ?? null)
    setForm(farm ? {
      ...empty,
      farmer_profile_id: String(farm.farmer_profile_id),
      parcel_name: farm.parcel_name ?? '',
      location: farm.location,
      barangay: farm.barangay,
      area_hectares: String(farm.area_hectares),
      land_classification: farm.land_classification ?? '',
      ownership_arrangement: farm.ownership_arrangement ?? '',
      cultivation_details: farm.cultivation_details ?? '',
      status: farm.status,
    } : { ...empty })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    const body = {
      ...form,
      farmer_profile_id: Number(form.farmer_profile_id),
      area_hectares: Number(form.area_hectares),
    }
    try {
      if (editing) await api(`/farms/${editing}`, { method: 'PUT', body: JSON.stringify(body) })
      else await api('/farms', { method: 'POST', body: JSON.stringify(body) })
      setForm(null)
      load()
    } catch (err) { setError(err) }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Farms</h1><p>Landholdings linked to a farmer profile.</p></div>
        {canWrite && <button onClick={() => openForm()}>Add farm</button>}
      </div>
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setPageNo(1); load(1) }}>
        <input placeholder="Search location, barangay, parcel" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="ghost" type="submit">Search</button>
      </form>
      <Banner error={error} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Parcel</th><th>Farmer</th><th>Barangay</th><th>Location</th><th>Area (ha)</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {page?.data.map((farm) => (
              <tr key={farm.id}>
                <td>{farm.parcel_name || '—'}</td>
                <td>{personName(farm.farmer)}</td>
                <td>{farm.barangay}</td>
                <td>{farm.location}</td>
                <td>{farm.area_hectares}</td>
                <td><Pill value={farm.status} /></td>
                <td>{canWrite && <button className="ghost" onClick={() => openForm(farm)}>Edit</button>}</td>
              </tr>
            ))}
            {page?.data.length === 0 && <tr><td colSpan={7} className="empty">No farms in your scope.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} onPage={setPageNo} />
      {form && (
        <form className="sheet" onSubmit={save}>
          <h2>{editing ? 'Edit farm' : 'New farm'}</h2>
          <div className="form-grid">
            <Field label="Farmer" name="farmer_profile_id" error={error}>
              <select required value={form.farmer_profile_id} onChange={(e) => setForm({ ...form, farmer_profile_id: e.target.value })}>
                <option value="">Select farmer</option>
                {farmers.map((farmer) => <option key={farmer.id} value={farmer.id}>{personName(farmer)}</option>)}
              </select>
            </Field>
            <Field label="Parcel name" name="parcel_name" error={error}><input value={form.parcel_name} onChange={(e) => setForm({ ...form, parcel_name: e.target.value })} /></Field>
            <Field label="Location" name="location" error={error}><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Barangay" name="barangay" error={error}><input required value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} /></Field>
            <Field label="Area (hectares)" name="area_hectares" error={error}><input required type="number" min="0" step="0.0001" value={form.area_hectares} onChange={(e) => setForm({ ...form, area_hectares: e.target.value })} /></Field>
            <Field label="Land classification" name="land_classification" error={error}><input value={form.land_classification} onChange={(e) => setForm({ ...form, land_classification: e.target.value })} /></Field>
            <Field label="Ownership arrangement" name="ownership_arrangement" error={error}><input value={form.ownership_arrangement} onChange={(e) => setForm({ ...form, ownership_arrangement: e.target.value })} /></Field>
            <Field label="Status" name="status" error={error}>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option>
              </select>
            </Field>
            <label className="span-2">Cultivation details<textarea value={form.cultivation_details} onChange={(e) => setForm({ ...form, cultivation_details: e.target.value })} /></label>
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
