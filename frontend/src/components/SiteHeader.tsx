import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Seal } from './Seal'

export function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const links = [
  ['About', '/#about'],
  ['Features', '/#modules'],
  ['Users', '/#users'],
] as const

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-header">
      <Link className="site-brand" to="/" onClick={() => setOpen(false)}>
        <img className="seal" src="/dulag-official-seal.png" width={46} height={46} alt="Official seal of the Municipality of Dulag, Leyte" />
        <span className="site-brand-text">
          <strong>Dulag FAIMS</strong>
          <small>Municipal Agriculture Office</small>
        </span>
      </Link>
      <nav className={open ? 'site-nav open' : 'site-nav'}>
        {links.map(([label, href]) => (
          <Link
            key={label}
            to={href}
            onClick={(event) => {
              setOpen(false)
              if (!href.startsWith('/#')) return
              const id = href.slice(2)
              if (window.location.pathname === '/' && document.getElementById(id)) {
                event.preventDefault()
                scrollToSection(id)
              }
            }}
          >
            {label}
          </Link>
        ))}
        <Link className="site-nav-login site-nav-mobile" to="/login" onClick={() => setOpen(false)}>Login</Link>
        <Link className="site-nav-register site-nav-mobile" to="/register" onClick={() => setOpen(false)}>Register</Link>
      </nav>
      <div className="site-auth">
        <Link className="site-nav-login" to="/login">Login</Link>
        <Link className="site-nav-register" to="/register">Register</Link>
        <button className="site-menu" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="home-foot" id="contact">
      <div className="home-foot-brand">
        <img className="seal" src="/dulag-official-seal.png" width={52} height={52} alt="" />
        <div>
          <strong>Dulag FAIMS</strong>
          <span>Farm and Agriculture Information Management System</span>
          <small>Municipal Agriculture Office of Dulag, Leyte</small>
        </div>
      </div>
      <p className="home-foot-place">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
          <circle cx="12" cy="10" r="2.2" />
        </svg>
        <span>Municipal Agriculture Office,<br />Dulag, Leyte</span>
      </p>
    </footer>
  )
}

export function RegisterVisual() {
  return (
    <aside className="register-visual">
      <img src="/farm-rice.png" alt="" />
      <div className="register-visual-copy">
        <Seal size={64} />
        <h1>Dulag FAIMS</h1>
        <p>Digital platform for organized agricultural records.</p>
      </div>
    </aside>
  )
}
