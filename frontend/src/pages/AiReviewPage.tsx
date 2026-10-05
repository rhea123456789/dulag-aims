import { useEffect, useState } from 'react'
import { api, label } from '../api'
import { Banner, Pill } from '../components/ui'
import type { AiReview, Page } from '../types'

export function AiReviewPage() {
  const [page, setPage] = useState<Page<AiReview> | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [notice, setNotice] = useState('Suggestions are advisory. Staff decide. Records are not merged, deleted, approved, or rejected.')
  const [busy, setBusy] = useState('')

  function load() {
    api<Page<AiReview>>('/ai/reviews').then(setPage).catch(setError)
  }

  useEffect(() => { load() }, [])

  async function scan() {
    setBusy('scan')
    setError(null)
    try {
      const result = await api<{ message: string }>('/ai/reviews/scan', { method: 'POST', body: '{}' })
      setNotice(result.message)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy('')
    }
  }

  async function assist(id: number) {
    setBusy(`assist-${id}`)
    setError(null)
    try {
      const result = await api<{ notice: string }>(`/ai/reviews/${id}/assist`, { method: 'POST', body: '{}' })
      setNotice(result.notice)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy('')
    }
  }

  async function decide(id: number, action: 'keep_both' | 'mark_for_correction' | 'dismiss') {
    setBusy(`decide-${id}`)
    setError(null)
    try {
      await api(`/ai/reviews/${id}/decide`, { method: 'POST', body: JSON.stringify({ action }) })
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy('')
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>AI Duplicate Review</h1>
          <p>Municipal Agriculture Office staff review possible duplicate, incomplete, inconsistent, or overlapping records.</p>
        </div>
        <button disabled={busy === 'scan'} onClick={scan}>{busy === 'scan' ? 'Checking…' : 'Scan for possible duplicates'}</button>
      </div>
      <Banner error={error} />
      <p className="muted">{notice}</p>
      {(page?.data ?? []).map((row) => {
        const original = row.records[0]
        const matches = row.records.slice(1)
        const open = row.status === 'pending' || row.status === 'reviewed'
        return (
          <article className="card" key={row.id}>
            <h2>{label(row.record_type)} · {label(row.ai_result?.finding || 'possible duplicate')}</h2>
            <p>Similarity {row.confidence ?? 'not scored'} · <Pill value={row.status} /></p>
            {original && <p><strong>Original record:</strong> {original.label} — {original.detail}</p>}
            {matches.map((match) => (
              <p key={match.id}><strong>Possible duplicate:</strong> {match.label} — {match.detail}</p>
            ))}
            {row.records.length < 2 && original && <p>Single record flagged for {label(row.ai_result?.finding || 'review')}.</p>}
            <p><strong>Rule-based findings:</strong> {(row.ai_result?.rule_hits ?? []).map(label).join(', ') || 'None recorded'}</p>
            <p><strong>Gemini explanation:</strong> {row.ai_result?.explanation || 'Not requested yet.'}</p>
            {row.reviewed_by && <p className="muted">Reviewed by {row.reviewed_by}</p>}
            <div className="btn-row">
              <button className="ghost" disabled={busy === `assist-${row.id}` || row.status !== 'pending'} onClick={() => assist(row.id)}>Ask Gemini for a suggestion</button>
              {open && (
                <>
                  <button disabled={busy === `decide-${row.id}`} onClick={() => decide(row.id, 'keep_both')}>Keep Both Records</button>
                  <button className="ghost" disabled={busy === `decide-${row.id}`} onClick={() => decide(row.id, 'mark_for_correction')}>Mark for Correction</button>
                  <button className="ghost" disabled={busy === `decide-${row.id}`} onClick={() => decide(row.id, 'dismiss')}>Dismiss Suggestion</button>
                </>
              )}
            </div>
          </article>
        )
      })}
      {page && page.data.length === 0 && <p className="muted">No flagged records. A scan only creates review items for staff to decide.</p>}
    </section>
  )
}
