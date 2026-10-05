import { Link } from 'react-router-dom'
import { RegisterVisual } from '../components/SiteHeader'

function FarmerIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M7 20h26" />
      <path d="M12 20c.8-6.2 4-10 10-10s9.2 3.8 10 10" />
      <circle cx="22" cy="24" r="4.2" />
      <path d="M10 40c1.5-8.2 5-12.2 12-12.2S32.5 31.8 34 40" />
      <path d="M35 29V18" />
      <path d="M35 22c2.4-1.6 4.6-.6 5.2 1.6" />
      <path d="M35 24.5c-2.2-1.5-4.4-.5-5 1.6" />
    </svg>
  )
}

function BeneficiaryIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="16" cy="16" r="4.6" />
      <circle cx="28" cy="18.2" r="3.6" />
      <path d="M6 38c1.1-8 4.4-12 10-12s8.9 4 10 12" />
      <path d="M24 38c.8-5.4 3-8.2 6.4-8.2 3.3 0 5.4 2.5 6.2 8.2" />
      <path d="M36.2 12.2c.7-.8 1.9-.8 2.6 0 .7-.8 1.9-.8 2.6 0 .8.9.7 2.1 0 3L38.8 18l-2.6-2.8c-.7-.9-.8-2.1 0-3z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" />
      <path d="M4.6 8.2 7 10.4 11.4 5.6" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

const farmerPoints = [
  'Create farmer profile',
  'Add farm and land information',
  'Connect agricultural records',
]

const beneficiaryPoints = [
  'Create beneficiary profile',
  'Access assistance programs',
  'Track application status',
]

export function RegisterPage() {
  return (
    <div className="register-screen">
      <RegisterVisual />
      <section className="register-panel">
        <div className="register-card choice-card">
          <div className="choice-leaf" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 21C12 12 17 7 22 6c-1 9-6 15-10 15z" />
              <path d="M12 21C12 12 7 7 2 6c1 9 6 15 10 15z" />
              <path d="M12 21V9" />
            </svg>
          </div>
          <h1>Create Your Account</h1>
          <p className="register-intro">Select your account type to continue.</p>
          <div className="register-choices">
            <article>
              <span className="choice-icon"><FarmerIcon /></span>
              <h2>Register as a Farmer</h2>
              <p>Manage your farm information and agricultural records.</p>
              <ul>
                {farmerPoints.map((item) => (
                  <li key={item}><CheckIcon />{item}</li>
                ))}
              </ul>
              <Link className="site-btn choice-continue" to="/register/farmer">Continue <ArrowIcon /></Link>
            </article>
            <article>
              <span className="choice-icon"><BeneficiaryIcon /></span>
              <h2>Register as a Beneficiary</h2>
              <p>View agricultural assistance and program information.</p>
              <ul>
                {beneficiaryPoints.map((item) => (
                  <li key={item}><CheckIcon />{item}</li>
                ))}
              </ul>
              <Link className="site-btn choice-continue" to="/register/beneficiary">Continue <ArrowIcon /></Link>
            </article>
          </div>
          <p className="register-note">Already registered? <Link to="/login">Login here</Link></p>
        </div>
      </section>
    </div>
  )
}
