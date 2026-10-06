import { useEffect, useState } from 'react'
import { api, label } from '../api'
import { hasRole, useAuth } from '../auth'
import type { DashboardData } from '../types'

type Kind = 'farmers' | 'farms' | 'subsidies' | 'beneficiaries'

export function RecordSnapshot({ kind }: { kind: Kind }) {
  const { user } = useAuth()
  const office = hasRole(user, 'system_administrator', 'mao_personnel')
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (!office) return
    api<DashboardData>('/dashboard').then(setData).catch(() => setData(null))
  }, [office])

  if (!data) return null
  const cards = cardsFor(kind, data)
  if (cards.length === 0) return null

  return (
    <div className="module-kpis">
      {cards.map((card) => (
        <article key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          {card.note && <small>{card.note}</small>}
        </article>
      ))}
    </div>
  )
}

function cardsFor(kind: Kind, data: DashboardData): { label: string; value: number; note?: string }[] {
  if (kind === 'farmers') {
    return [
      { label: 'On file', value: Number(data.totals.farmers), note: 'Not archived' },
      ...counts(data.farmer_status),
    ]
  }
  if (kind === 'farms') {
    return [{ label: 'Active farms', value: Number(data.totals.farms), note: 'Status is active' }]
  }
  if (kind === 'subsidies') {
    return [
      { label: 'Subsidy records', value: Number(data.totals.subsidies) },
      ...counts(data.subsidy_by_status),
    ]
  }
  return [{ label: 'Beneficiaries', value: Number(data.totals.beneficiaries) }]
}

function counts(rows: Record<string, number>) {
  return Object.entries(rows).map(([status, total]) => ({
    label: label(status),
    value: Number(total),
  }))
}
