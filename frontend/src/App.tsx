import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { hasRole, useAuth } from './auth'
import { Layout } from './components/Layout'
import { AiReviewPage } from './pages/AiReviewPage'
import { AiSummaryPage } from './pages/AiSummaryPage'
import { BeneficiariesPage } from './pages/BeneficiariesPage'
import { DashboardPage } from './pages/DashboardPage'
import { FarmersPage } from './pages/FarmersPage'
import { FarmsPage } from './pages/FarmsPage'
import { LandingPage } from './pages/LandingPage'
import { FeaturesPage } from './pages/FeaturesPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterFormPage } from './pages/RegisterFormPage'
import { RegisterPage } from './pages/RegisterPage'
import { ProductionPage } from './pages/ProductionPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SubsidiesPage } from './pages/SubsidiesPage'
import type { RoleSlug } from './types'

function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p className="muted" style={{ padding: 24 }}>Loading session…</p>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RoleGate({ roles, children }: { roles: RoleSlug[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!hasRole(user, ...roles)) return <Navigate to="/settings" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/register/:kind" element={<RegisterFormPage />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="farmers" element={<RoleGate roles={['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer']}><FarmersPage /></RoleGate>} />
        <Route path="farms" element={<RoleGate roles={['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer']}><FarmsPage /></RoleGate>} />
        <Route path="production" element={<RoleGate roles={['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer']}><ProductionPage /></RoleGate>} />
        <Route path="subsidies" element={<RoleGate roles={['system_administrator', 'mao_personnel', 'agricultural_technician', 'farmer', 'beneficiary']}><SubsidiesPage /></RoleGate>} />
        <Route path="beneficiaries" element={<RoleGate roles={['system_administrator', 'mao_personnel', 'beneficiary']}><BeneficiariesPage /></RoleGate>} />
        <Route path="reports" element={<RoleGate roles={['system_administrator', 'mao_personnel']}><ReportsPage /></RoleGate>} />
        <Route path="ai-review" element={<RoleGate roles={['system_administrator', 'mao_personnel']}><AiReviewPage /></RoleGate>} />
        <Route path="ai-summaries" element={<RoleGate roles={['system_administrator', 'mao_personnel']}><AiSummaryPage /></RoleGate>} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
