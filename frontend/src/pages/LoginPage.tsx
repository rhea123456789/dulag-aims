import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { Banner } from '../components/ui'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-scene" aria-hidden="true" />
      <div className="login-shell">
        <section className="login-intro">
          <img
            className="login-seal"
            src="/dulag-login-seal.png"
            width={108}
            height={108}
            alt="Official seal of the Municipality of Dulag, Leyte"
          />
          <h1>Dulag FAIMS</h1>
          <p className="login-office">Municipal Agriculture Office</p>
          <p className="login-lead">Access Dulag FAIMS to manage and monitor farmer information, farm and production records, and assistance-related information.</p>
        </section>
        <form className="login-panel" onSubmit={onSubmit}>
          <Banner error={error} />
          <div className="login-fields">
            <label>
              Email Address
              <span className="login-input">
                <MailIcon />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoComplete="username"
                />
              </span>
            </label>
            <label>
              Password
              <span className="login-input">
                <LockIcon />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  className="login-eye"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </span>
            </label>
            <button className="login-submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
              <Arrow />
            </button>
          </div>
          <div className="login-or"><span>OR</span></div>
          <Link className="login-create" to="/register">
            <UserIcon />
            Create an Account
          </Link>
          <Link className="login-home" to="/">
            <ArrowBack />
            Back to Home
          </Link>
        </form>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

function ArrowBack() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13 8H3M7 4 3 8l4 4" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12S6.5 6.5 12 6.5 21.5 12 21.5 12 17.5 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 4.5 20 19" />
      <path d="M9.5 9.8A3 3 0 0 0 12 15a3 3 0 0 0 2.2-.9M6.2 7.4C4.2 8.8 2.8 11 2.5 12c0 0 4 5.5 9.5 5.5 1.3 0 2.5-.3 3.6-.8M10 6.7A9 9 0 0 1 12 6.5c5.5 0 9.5 5.5 9.5 5.5a16 16 0 0 1-2.2 2.7" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 18.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}
