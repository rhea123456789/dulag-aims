import type { ReactNode } from 'react'
import { errorMessage, fieldErrors, label } from '../api'
import type { Page } from '../types'

export function Banner({ error }: { error: unknown }) {
  if (!error) return null
  return <div className="alert">{errorMessage(error)}</div>
}

export function Field({
  label: text, name, error, children,
}: { label: string; name: string; error?: unknown; children: ReactNode }) {
  const message = fieldErrors(error, name)
  return (
    <label>
      {text}
      {children}
      {message && <span className="field-error">{message}</span>}
    </label>
  )
}

export function Pill({ value }: { value?: string | null }) {
  return <span className={`pill ${value ?? ''}`}>{label(value)}</span>
}

export function Pager({ page, onPage }: { page: Page<unknown> | null; onPage: (n: number) => void }) {
  if (!page || page.last_page <= 1) return null
  return (
    <div className="pager">
      <button className="ghost" disabled={page.current_page <= 1} onClick={() => onPage(page.current_page - 1)}>Previous</button>
      <span className="muted">Page {page.current_page} of {page.last_page}</span>
      <button className="ghost" disabled={page.current_page >= page.last_page} onClick={() => onPage(page.current_page + 1)}>Next</button>
    </div>
  )
}

export function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  if (rows.length === 0) return <p className="muted">No recorded data yet.</p>
  return (
    <div>
      {rows.map((row) => (
        <div className="bar" key={row.label}>
          <span>{row.label}</span>
          <i style={{ width: `${(row.value / max) * 100}%` }} />
          <strong>{row.value}</strong>
        </div>
      ))}
    </div>
  )
}
