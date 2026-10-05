import { useEffect, useState, type FormEvent } from 'react'
import { api, day, personName } from '../api'
import { hasRole, useAuth } from '../auth'
import { Banner, Field, Pager } from '../components/ui'
import type { Farm, Page, Production } from '../types'

const empty = {
  farm_id: '', crop_type: '', planting_date: '', harvest_date: '', quantity: '',
  unit: 'kg', yield_per_hectare: '', season: '', notes: '', expenses: '', income: '',
}

export function ProductionPage() {
  const { user } = useAuth()
  const canWrite = hasRole(user, 'system_administrator', 'mao_personnel', 'agricultural_technician')
  const [page, setPage] = useState<Page<Production> | null>(null)
  const [summaries, setSummaries] = useState<{ crop_type: string; records: number; total_quantity: string }[]>([])
  const [farms, setFarms] = useState<Farm[]>([])
  const [crop, setCrop] = useState('')
  const [season, setSeason] = useState('')
  const [form, setForm] = useState<Record<string, string> | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [pageNo, setPageNo] = useState(1)

  function load(next = pageNo) {
    const params = new URLSearchParams({ page: String(next) })
    if (crop) params.set('crop_type', crop)
    if (season) params.set('season', season)
    api<Page<Production>>(`/productions?${params}`).then(setPage).catch(setError)
    api<{ by_crop: { crop_type: string; records: number; total_quantity: string }[] }>('/productions/summaries')
      .then((data) => setSummaries(data.by_crop))
      .catch(() => undefined)
  }

  useEffect(() => { load(pageNo) }, [pageNo])

  async function openForm() {
    const list = await api<Page<Farm>>('/farms?page=1')
    setFarms(list.data)
    setForm({ ...empty })
    setError(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!form) return
    const body: Record<string, string | number> = { farm_id: Number(form.farm_id), crop_type: form.crop_type }
    for (const key of ['planting_date', 'harvest_date', 'unit', 'season', 'notes'] as const) {
      if (form[key]) body[key] = form[key]
    }
    for (const key of ['quantity', 'yield_per_hectare', 'expenses', 'income'] as const) {
      if (form[key] !== '') body[key] = Number(form[key])
    }
    try {
      await api('/productions', { method: 'POST', body: JSON.stringify(body) })
      setForm(null)
      load()
    } catch (err) { setError(err) }
  }

  return (
    <section>
      <div className="page-head">
        <div><h1>Production</h1><p>Planting, harvest, and profit tied to a farm.</p></div>
        {canWrite && <button onClick={openForm}>Record production</button>}
      </div>
      {summaries.length > 0 && (
        <div className="toolbar" style={{ marginBottom: 12 }}>
          {summaries.map((row) => <span className="pill" key={row.crop_type}>{row.crop_type}: {row.total_quantity}</span>)}
        </div>
      )}
      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); setPageNo(1); load(1) }}>
        <input placeholder="Crop type" value={crop} onChange={(e) => setCrop(e.target.value)} />
        <input placeholder="Season" value={season} onChange={(e) => setSeason(e.target.value)} />
        <button className="ghost" type="submit">Filter</button>
      </form>
      <Banner error={error} />
      <div className="table-wrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Crop</th><th>Farm</th><th>Farmer</th><th>Season</th><th>Quantity</th><th>Harvest</th><th>Profit</th></tr></thead>
          <tbody>
            {page?.data.map((row) => (
              <tr key={row.id}>
                <td>{row.crop_type}</td>
                <td>{row.farm?.parcel_name || row.farm?.location || '—'}</td>
                <td>{personName(row.farm?.farmer)}</td>
                <td>{row.season || '—'}</td>
                <td>{row.quantity ?? '—'} {row.unit || ''}</td>
                <td>{day(row.harvest_date)}</td>
                <td>{row.profit ? row.profit.profit : '—'}</td>
              </tr>
            ))}
            {page?.data.length === 0 && <tr><td colSpan={7} className="empty">No production records in your scope.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager page={page} onPage={setPageNo} />
      {form && (
        <form className="sheet" onSubmit={save}>
          <h2>New production record</h2>
          <div className="form-grid">
            <Field label="Farm" name="farm_id" error={error}>
              <select required value={form.farm_id} onChange={(e) => setForm({ ...form, farm_id: e.target.value })}>
                <option value="">Select farm</option>
                {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.parcel_name || farm.location} — {personName(farm.farmer)}</option>)}
              </select>
            </Field>
            <Field label="Crop" name="crop_type" error={error}><input required value={form.crop_type} onChange={(e) => setForm({ ...form, crop_type: e.target.value })} /></Field>
            <Field label="Planting date" name="planting_date" error={error}><input type="date" value={form.planting_date} onChange={(e) => setForm({ ...form, planting_date: e.target.value })} /></Field>
            <Field label="Harvest date" name="harvest_date" error={error}><input type="date" value={form.harvest_date} onChange={(e) => setForm({ ...form, harvest_date: e.target.value })} /></Field>
            <Field label="Quantity" name="quantity" error={error}><input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
            <Field label="Unit" name="unit" error={error}><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></Field>
            <Field label="Season" name="season" error={error}><input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} /></Field>
            <Field label="Yield per hectare" name="yield_per_hectare" error={error}><input type="number" min="0" step="0.01" value={form.yield_per_hectare} onChange={(e) => setForm({ ...form, yield_per_hectare: e.target.value })} /></Field>
            <Field label="Expenses" name="expenses" error={error}><input type="number" min="0" step="0.01" value={form.expenses} onChange={(e) => setForm({ ...form, expenses: e.target.value })} /></Field>
            <Field label="Income" name="income" error={error}><input type="number" min="0" step="0.01" value={form.income} onChange={(e) => setForm({ ...form, income: e.target.value })} /></Field>
            <label className="span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
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
