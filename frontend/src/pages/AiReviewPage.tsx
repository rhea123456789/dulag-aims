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
          <article className="review-card" key={row.id}>
            <header className="review-head">
              <div>
                <p>{label(row.record_type)}</p>
                <h2>{label(row.ai_result?.finding || 'possible duplicate')}</h2>
              </div>
              <div>
                <span>Similarity {row.confidence ?? 'not scored'}</span>
                <Pill value={row.status} />
              </div>
            </header>
            <div className="review-pair">
              {original && (
                <div className="review-pane tone-green">
                  <p>Original record</p>
                  <strong>{original.label}</strong>
                  <span>{original.detail}</span>
                </div>
              )}
              {matches.map((match) => (
                <div className="review-pane tone-amber" key={match.id}>
                  <p>Possible duplicate</p>
                  <strong>{match.label}</strong>
                  <span>{match.detail}</span>
                </div>
              ))}
            </div>
            {row.records.length < 2 && original && <p>Single record flagged for {label(row.ai_result?.finding || 'review')}.</p>}
            <div className="review-pane">
              <p>Why it was flagged</p>
              <span>{(row.ai_result?.rule_hits ?? []).map(label).join(', ') || 'None recorded'}</span>
            </div>
            <div className="review-pane tone-ai">
              <p>AI explanation</p>
              <span>{row.ai_result?.explanation || 'Not requested yet.'}</span>
            </div>
            {row.reviewed_by && <p className="muted">Reviewed by {row.reviewed_by}</p>}
            <div className="btn-row">
              <button className="ghost" disabled={busy === `assist-${row.id}` || row.status !== 'pending'} onClick={() => assist(row.id)}>Request AI Review</button>
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
