import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../auth'
import type { RoleSlug } from '../types'
import { OfficeShell } from './OfficeShell'
import { TechnicianShell } from './TechnicianShell'
import { Seal } from './Seal'

const links: { to: string; label: string; icon: ReactNode; roles: RoleSlug[] }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <Icon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />, roles: ['system_administrator', 'mao_personnel'] },
  { to: '/farmers', label: 'Farmers', icon: <Icon d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" />, roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
  { to: '/farms', label: 'Farms', icon: <Icon d="M4 18c3-6 6-6 8 0s5 6 8 0M4 13c3-6 6-6 8 0s5 6 8 0" />, roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
  { to: '/production', label: 'Production', icon: <Icon d="M12 20V8M8 12c0-4 8-4 8 0M7 20h10" />, roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer'] },
  { to: '/subsidies', label: 'Subsidies', icon: <Icon d="M5 8h14v10H5zM8 8V6a4 4 0 0 1 8 0v2" />, roles: ['system_administrator', 'mao_personnel', 'agricultural_technician', 'farmer', 'beneficiary'] },
  { to: '/beneficiaries', label: 'Beneficiaries', icon: <Icon d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8 0" />, roles: ['system_administrator', 'mao_personnel', 'beneficiary'] },
  { to: '/reports', label: 'Reports', icon: <Icon d="M7 3h7l5 5v13H7zM14 3v5h5M9 13h6M9 17h6" />, roles: ['system_administrator', 'mao_personnel'] },
  { to: '/ai-review', label: 'AI Duplicate Review', icon: <Icon d="M8 8h8M8 12h8M8 16h5M5 4h14v16H5z" />, roles: ['system_administrator', 'mao_personnel'] },
  { to: '/ai-summaries', label: 'AI Summary Generator', icon: <Icon d="M6 4h9l3 3v13H6zM9 11h6M9 15h4" />, roles: ['system_administrator', 'mao_personnel'] },
  { to: '/settings', label: 'Profile & users', icon: <Icon d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8-3a8 8 0 0 0-.2-1.6l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2.8-1.6L14 2h-4l-.6 2.9A8 8 0 0 0 6.6 6.5l-2.4-1-2 3.4 2 1.5A8 8 0 0 0 4 12a8 8 0 0 0 .2 1.6l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2.8 1.6L10 22h4l.6-2.9a8 8 0 0 0 2.8-1.6l2.4 1 2-3.4-2-1.5A8 8 0 0 0 20 12z" />, roles: ['system_administrator', 'mao_personnel', 'rsbsa_focal_person', 'agricultural_technician', 'farmer', 'beneficiary'] },
]

function Icon({ d }: { d: string }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  if (hasRole(user, 'system_administrator', 'mao_personnel')) return <OfficeShell />
  if (hasRole(user, 'agricultural_technician')) return <TechnicianShell />
  const visible = links.filter((link) => hasRole(user, ...link.roles))

  return (
    <div className="shell">
      {open && <button className="backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={open ? 'side open' : 'side'}>
        <div className="brand">
          <Seal size={58} />
          <div>
            <strong>Dulag FAIMS</strong>
            <p>Municipal Agriculture Office</p>
          </div>
        </div>
        <nav>
          {visible.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="side-foot">
          <div>
            <strong>{user?.name}</strong>
            <p>{user?.role.name}</p>
          </div>
          <button className="ghost" onClick={async () => { await logout(); navigate('/login') }}>Log out</button>
        </div>
      </aside>
      <main className="content">
        <div className="topbar">
          <button className="ghost menu-btn" onClick={() => setOpen(true)}>Menu</button>
          <div className="topbar-brand">
            <Seal size={36} />
            <strong>Dulag FAIMS</strong>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
