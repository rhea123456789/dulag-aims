import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { ModuleIcon } from '../components/ModuleIcon'
import { RegisterVisual } from '../components/SiteHeader'
import { Banner, Field } from '../components/ui'

type Kind = 'farmer' | 'beneficiary'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function RegisterFormPage() {
  const { kind } = useParams()
  const type: Kind | null = kind === 'farmer' || kind === 'beneficiary' ? kind : null
  const [fullName, setFullName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [address, setAddress] = useState('')
  const [barangay, setBarangay] = useState('')
  const [rsbsa, setRsbsa] = useState('')
  const [farmInformation, setFarmInformation] = useState('')
  const [beneficiaryDetails, setBeneficiaryDetails] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [localError, setLocalError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState('')

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
      const result = await api<{ message: string }>('/register', {
        method: 'POST',
        body: JSON.stringify({
          type,
          full_name: fullName.trim(),
          contact_number: contactNumber.trim(),
          email: email.trim(),
          password,
          password_confirmation: passwordConfirmation,
          address: address.trim(),
          barangay: barangay.trim(),
          rsbsa_reference_number: type === 'farmer' ? rsbsa.trim() : undefined,
          farm_information: type === 'farmer' ? farmInformation.trim() : undefined,
          beneficiary_details: type === 'beneficiary' ? beneficiaryDetails.trim() : undefined,
        }),
      })
      setSuccess(result.message)
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
        <div className="register-switch">
          <Link className={type === 'farmer' ? 'active' : ''} to="/register/farmer"><ModuleIcon name="farmer" />Farmer</Link>
          <Link className={type === 'beneficiary' ? 'active' : ''} to="/register/beneficiary"><ModuleIcon name="users" />Beneficiary</Link>
        </div>
        {success ? (
          <div className="success-box">
            <p>{success}</p>
            <Link className="site-btn" to="/login">Go to login</Link>
          </div>
        ) : (
          <form className="register-form" onSubmit={onSubmit}>
            <Banner error={localError ? new Error(localError) : error} />
            <fieldset>
              <legend>Personal Information</legend>
              <div className="register-grid">
                <Field label="Full Name" name="full_name" error={error}>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                </Field>
                <Field label="Contact Number" name="contact_number" error={error}>
                  <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required autoComplete="tel" />
                </Field>
                <div className="span-2">
                  <Field label="Address" name="address" error={error}>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} required autoComplete="street-address" />
                  </Field>
                </div>
                <div className="span-2">
                  <Field label="Barangay" name="barangay" error={error}>
                    <input value={barangay} onChange={(e) => setBarangay(e.target.value)} required />
                  </Field>
                </div>
              </div>
            </fieldset>
            {type === 'farmer' ? (
              <fieldset>
                <legend>Agricultural Information</legend>
                <div className="register-grid">
                  <div className="span-2">
                    <Field label="RSBSA Reference Number" name="rsbsa_reference_number" error={error}>
                      <input value={rsbsa} onChange={(e) => setRsbsa(e.target.value)} required />
                    </Field>
                  </div>
                  <div className="span-2">
                    <Field label="Farm Information" name="farm_information" error={error}>
                      <textarea value={farmInformation} onChange={(e) => setFarmInformation(e.target.value)} required />
                    </Field>
                  </div>
                </div>
              </fieldset>
            ) : (
              <fieldset>
                <legend>Beneficiary Information</legend>
                <Field label="Beneficiary Information" name="beneficiary_details" error={error}>
                  <textarea value={beneficiaryDetails} onChange={(e) => setBeneficiaryDetails(e.target.value)} required />
                </Field>
              </fieldset>
            )}
            <fieldset>
              <legend>Account Information</legend>
              <div className="register-grid">
                <div className="span-2">
                  <Field label="Email Address" name="email" error={error}>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
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
        )}
        </div>
      </section>
    </div>
  )
}
