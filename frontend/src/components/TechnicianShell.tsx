import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Seal } from './Seal'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/farmers': 'Assigned Farmers',
  '/farms': 'Farms',
  '/production': 'Production',
  '/submissions': 'Submission Status',
  '/settings': 'My Account',
}

export function TechnicianShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const title = titles[location.pathname] ?? 'Dulag FAIMS'
  const initials = (user?.name || 'T').split(' ').slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

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
            <span>Agricultural Technician</span>
          </div>
        </div>
        <nav>
          <p>Overview</p>
          <NavLink to="/dashboard" end onClick={close}><Mark d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />Dashboard</NavLink>
          <p>Field Records</p>
          <NavLink to="/farmers" onClick={close}><Mark d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm-7 8a7 7 0 0 1 14 0" />Assigned Farmers</NavLink>
          <NavLink to="/farms" onClick={close}><Mark d="M4 18c3-6 6-6 8 0s5 6 8 0M4 13c3-6 6-6 8 0s5 6 8 0" />Farms</NavLink>
          <NavLink to="/production" onClick={close}><Mark d="M12 20V8M8 12c0-4 8-4 8 0M7 20h10" />Production</NavLink>
          <p>Monitoring</p>
          <NavLink to="/submissions" onClick={close}><Mark d="M12 7v5l3 2M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9z" />Submission Status</NavLink>
          <p>Account</p>
          <NavLink to="/settings" onClick={close}><Mark d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM5 19a7 7 0 0 1 14 0" />My Account</NavLink>
          <button type="button" onClick={async () => { await logout(); navigate('/login') }}><Mark d="M10 7V5H5v14h5v-2M10 12h9M16 9l3 3-3 3" />Log Out</button>
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

function Mark({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
