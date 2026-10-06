import { useEffect, useState } from 'react'
import { api } from '../api'
import { Banner } from '../components/ui'
import { summaryBlocks } from '../summaryText'
import type { AiSummary, Page } from '../types'

const TYPES = [
  ['farmer', 'Farmer Records', '/farmers'],
  ['farm', 'Farm Information', '/farms'],
  ['production', 'Production Records', '/productions'],
  ['subsidy', 'Subsidy Records', '/subsidies'],
  ['beneficiary', 'Beneficiary Records', '/beneficiaries'],
  ['findings', 'Flagged Findings', '/ai/reviews'],
] as const

type Choice = { id: number; label: string }

export function AiSummaryPage() {
  const [recordType, setRecordType] = useState<(typeof TYPES)[number][0]>('farmer')
  const [choices, setChoices] = useState<Choice[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [rows, setRows] = useState<AiSummary[]>([])
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function loadSummaries() {
    api<Page<AiSummary>>('/ai/summaries').then((page) => setRows(page.data)).catch(setError)
  }

  function loadChoices(type = recordType) {
    const path = TYPES.find((item) => item[0] === type)?.[2] ?? '/farmers'
    setSelected([])
    api<Page<Record<string, unknown>>>(path).then((page) => {
      setChoices(page.data.map((row) => ({
        id: Number(row.id),
        label: choiceLabel(type, row),
      })))
    }).catch(setError)
  }

  useEffect(() => { loadSummaries() }, [])
  useEffect(() => { loadChoices(recordType) }, [recordType])

  function toggle(id: number) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      await api('/ai/summaries', {
        method: 'POST',
        body: JSON.stringify({ record_type: recordType, record_ids: selected }),
      })
      setSelected([])
      loadSummaries()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function remove(row: AiSummary) {
    const kind = summaryTitle(row.source_records.record_type)
    const confirmed = window.confirm(
      `Delete this ${kind}? Farmer, farm, production, subsidy, and beneficiary records will not be changed.`,
    )
    if (!confirmed) return
    setDeletingId(row.id)
    setError(null)
    try {
      await api(`/ai/summaries/${row.id}`, { method: 'DELETE' })
      loadSummaries()
    } catch (err) {
      setError(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="summary-page">
      <div className="page-head">
        <div>
          <h1>AI Summary Generator</h1>
          <p>Generate concise summaries from selected agriculture records for staff review.</p>
        </div>
      </div>
      <Banner error={error} />
      <article className="card tone-green summary-picker">
        <h2>Select Records</h2>
        <label>
          Record Type
          <select value={recordType} onChange={(event) => setRecordType(event.target.value as (typeof TYPES)[number][0])}>
            {TYPES.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
          </select>
        </label>
        <div className="choice-list">
          {choices.map((choice) => (
            <label className="choice-row" key={choice.id}>
              <input type="checkbox" checked={selected.includes(choice.id)} onChange={() => toggle(choice.id)} />
              <span>{choice.label}</span>
            </label>
          ))}
          {choices.length === 0 && <p className="muted">No records of this type are available.</p>}
        </div>
        <button disabled={busy || selected.length === 0} onClick={generate}>{busy ? 'Generating…' : 'Generate Summary'}</button>
      </article>
      {rows.length > 0 && (
        <div className="summary-list">
          <h2>Generated Summaries</h2>
          {rows.map((row) => (
            <SummaryCard key={row.id} row={row} deleting={deletingId === row.id} onDelete={() => remove(row)} />
          ))}
        </div>
      )}
      {rows.length === 0 && <p className="muted">No summaries have been generated.</p>}
    </section>
  )
}

function SummaryCard({ row, deleting, onDelete }: { row: AiSummary; deleting: boolean; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const blocks = summaryBlocks(row.generated_summary)
  const preview = blocks.find((block) => block.kind === 'paragraph')?.text
  const count = Array.isArray(row.source_records.record_ids) ? row.source_records.record_ids.length : null

  return (
    <article className={open ? 'card summary-report is-open' : 'card summary-report'}>
      <div className="summary-card-head">
        <div>
          <h2>{summaryTitle(row.source_records.record_type)}</h2>
          <p>Municipal Agriculture Office of Dulag, Leyte</p>
          <span className="review-flag">Requires Human Review</span>
        </div>
      </div>
      {!open && preview && <p className="summary-preview">{preview}</p>}
      {count !== null && <p className="summary-meta">Generated from {count} selected {count === 1 ? 'record' : 'records'}.</p>}
      <div className="summary-actions">
        <button type="button" className="ghost" onClick={() => setOpen((current) => !current)}>{open ? 'Hide Summary' : 'View Summary'}</button>
        <button className="quiet-danger" type="button" disabled={deleting} onClick={onDelete}>{deleting ? 'Deleting…' : 'Delete'}</button>
      </div>
      <div className={open ? 'summary-body is-open' : 'summary-body'}>
        <div>
          <h3>Summary of Selected Agricultural Records</h3>
          {row.source_records.source === 'fallback' && (
            <p className="muted">{row.source_records.notice || 'Gemini is temporarily unavailable. A fallback summary was generated.'}</p>
          )}
          <div className="summary-copy">
            {blocks.map((block, index) => (
              block.kind === 'heading'
                ? <h3 key={index}>{block.text}</h3>
                : <p key={index}>{block.text}</p>
            ))}
          </div>
          <p className="summary-meta">Generated {new Date(row.created_at).toLocaleString()} by {row.author?.name || 'Staff'}. Source: {sourceLabel(row.source_records.source)}.</p>
          <p className="summary-meta">A staff member must make the final decision.</p>
        </div>
      </div>
    </article>
  )
}

function summaryTitle(type?: string) {
  const titles: Record<string, string> = {
    farmer: 'Farmer Summary',
    farm: 'Farm Summary',
    production: 'Production Summary',
    subsidy: 'Subsidy Summary',
    beneficiary: 'Beneficiary Summary',
    findings: 'Findings Summary',
  }
  return (type && titles[type]) || 'Record Summary'
}

function sourceLabel(source?: string) {
  if (source === 'gemini') return 'Gemini'
  if (source === 'fallback') return 'Fallback summary'
  return 'Office records'
}

function choiceLabel(type: string, row: Record<string, unknown>) {
  if (type === 'findings') {
    const result = row.ai_result as { finding?: string } | null
    return `${row.record_type} ${row.id} · ${result?.finding || 'finding'}`
  }
  if (typeof row.first_name === 'string') return `${row.first_name} ${row.last_name ?? ''}`.trim()
  if (typeof row.location === 'string') return row.location
  if (typeof row.crop_type === 'string') return row.crop_type
  if (typeof row.subsidy_type === 'string') return row.subsidy_type
  return `Record ${row.id}`
}
