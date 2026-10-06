import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { hasRole, useAuth } from '../auth'
import { Seal } from './Seal'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/farmers': 'Farmer Records',
  '/farms': 'Farms',
  '/production': 'Production',
  '/subsidies': 'Subsidy Records',
  '/beneficiaries': 'Beneficiary Records',
  '/reports': 'Reports',
  '/ai-review': 'AI Duplicate Review',
  '/ai-summaries': 'AI Summary Generator',
  '/settings': 'My Account',
}

function Mark({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function OfficeShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const admin = hasRole(user, 'system_administrator')
  const title = titles[location.pathname] ?? 'Dulag FAIMS'
  const initials = (user?.name || 'A').split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

  function close() {
    setOpen(false)
  }

  return (
    <div className="office-app">
      {open && <button className="office-backdrop" aria-label="Close menu" onClick={close} />}
      <aside className={open ? 'office-side is-open' : 'office-side'}>
        <div className="office-brand">
          <Seal size={42} />
          <div>
            <strong>Dulag FAIMS</strong>
            <span>Municipal Agriculture Office</span>
          </div>
        </div>
        <nav>
          <p>Overview</p>
          <NavLink to="/dashboard" onClick={close}><Mark d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />Dashboard</NavLink>
          <p>Records</p>
          <NavLink to="/farmers" onClick={close}><Mark d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" />Farmer Records</NavLink>
          <NavLink to="/farms" onClick={close}><Mark d="M4 18c3-6 6-6 8 0s5 6 8 0M4 13c3-6 6-6 8 0s5 6 8 0" />Farms</NavLink>
          <NavLink to="/production" onClick={close}><Mark d="M12 20V8M8 12c0-4 8-4 8 0M7 20h10" />Production</NavLink>
          <NavLink to="/subsidies" onClick={close}><Mark d="M7 3h7l5 5v13H7zM14 3v5h5" />Subsidy Records</NavLink>
          <NavLink to="/beneficiaries" onClick={close}><Mark d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 1a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8 0" />Beneficiary Records</NavLink>
          <p>Monitoring</p>
          <NavLink to="/ai-review" onClick={close}><Mark d="M11 18a7 7 0 1 0-7-7 7 7 0 0 0 7 7zM20 20l-3.5-3.5" />AI Duplicate Review</NavLink>
          <NavLink to="/ai-summaries" onClick={close}><Mark d="M12 3l1.2 3.2L16.5 7.5 13.2 8.7 12 12l-1.2-3.3L7.5 7.5l3.3-1.3zM6 14l.7 1.8L8.5 16.5 6.7 17.2 6 19l-.7-1.8L3.5 16.5l1.8-.7z" />AI Summary Generator</NavLink>
          {admin && <Link to="/settings#activity-log" onClick={close}><Mark d="M8 3h8v3H8zM6 6h12v15H6zM9 12h6M9 16h4" />Activity Log</Link>}
          <p>Reports</p>
          <NavLink to="/reports" onClick={close}><Mark d="M4 19h16M6 16l4-5 3 3 5-7" />Reports</NavLink>
          <p>Account</p>
          <NavLink to="/settings" onClick={close}><Mark d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM5 19a7 7 0 0 1 14 0" />My Account</NavLink>
          <button type="button" onClick={async () => { await logout(); navigate('/login') }}><Mark d="M10 7V5H5v14h5v-2M10 12h9M16 9l3 3-3 3" />Log out</button>
        </nav>
      </aside>
      <div className="office-main">
        <header className="office-top">
          <button type="button" className="office-menu" onClick={() => setOpen(true)} aria-label="Open menu">Menu</button>
          <strong>{title}</strong>
          <div className="office-user">
            <span aria-hidden="true">{initials}</span>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role.name}</small>
            </div>
          </div>
        </header>
        <div className="office-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
