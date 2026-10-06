import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { ModuleIcon } from '../components/ModuleIcon'
import { RegisterVisual } from '../components/SiteHeader'
import { Banner, Field } from '../components/ui'

type Kind = 'farmer' | 'beneficiary'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterFormPage() {
  const { kind } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const type: Kind | null = kind === 'farmer' || kind === 'beneficiary' ? kind : null
  const [fullName, setFullName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [localError, setLocalError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!type) return <Navigate to="/register" replace />

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    setError(null)
    if (!fullName.trim().includes(' ')) {
      setLocalError('Enter your first and last name.')
      return
    }
    if (!emailPattern.test(email.trim())) {
      setLocalError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.')
      return
    }
    if (password !== passwordConfirmation) {
      setLocalError('Password confirmation does not match.')
      return
    }
    setBusy(true)
    try {
      await api<{ message: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({
          type,
          full_name: fullName.trim(),
          contact_number: contactNumber.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
        }),
      })
      await login(email.trim(), password)
      navigate('/complete-profile', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="register-screen">
      <RegisterVisual />
      <section className="register-panel">
        <div className="register-card">
        <p className="register-back"><Link to="/register">Back to registration options</Link></p>
        <h1>{type === 'farmer' ? 'Farmer Registration' : 'Beneficiary Registration'}</h1>
        <p className="register-intro">Create your account first. Agricultural details come in the next step.</p>
        <div className="register-switch">
          <Link className={type === 'farmer' ? 'active' : ''} to="/register/farmer"><ModuleIcon name="farmer" />Farmer</Link>
          <Link className={type === 'beneficiary' ? 'active' : ''} to="/register/beneficiary"><ModuleIcon name="users" />Beneficiary</Link>
        </div>
        <form className="register-form" onSubmit={onSubmit}>
            <Banner error={localError ? new Error(localError) : error} />
            <fieldset>
              <legend>Account Information</legend>
              <div className="register-grid">
                <Field label="Full Name" name="full_name" error={error}>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" placeholder="First and last name" />
                </Field>
                <Field label="Contact Number" name="contact_number" error={error}>
                  <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required autoComplete="tel" placeholder="09XXXXXXXXX" />
                </Field>
                <div className="span-2">
                  <Field label="Email Address" name="email" error={error}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="name@email.com" />
                  </Field>
                </div>
                <Field label="Password" name="password" error={error}>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" minLength={8} />
                </Field>
                <Field label="Confirm Password" name="password_confirmation" error={error}>
                  <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required autoComplete="new-password" />
                </Field>
              </div>
            </fieldset>
            <button className="register-submit" disabled={busy}>{busy ? 'Submitting…' : 'Create Account'}</button>
          </form>
        </div>
      </section>
    </div>
  )
}
