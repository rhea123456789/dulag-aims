import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SiteFooter, SiteHeader, scrollToSection } from '../components/SiteHeader'

export const modules = [
  ['/farmer-records.jpg', 'center 42%', 'Farmer Records', 'Maintain farmer profiles, contact details, and RSBSA reference information.'],
  ['/farm-production.png', '32% center', 'Farm and Production Information', 'Record landholdings and the production reported from those farms.'],
  ['/subsidy-records.png', 'center 42%', 'Subsidy Records', 'Monitor agricultural assistance records and their status.'],
  ['/farm-community.png', 'center 40%', 'Beneficiary Records', 'Keep profiles of identified beneficiaries and the assistance linked to them.'],
] as const

export const features = modules

const capabilities = [
  ['Reports', 'Summaries and exportable reports for office monitoring.'],
  ['Activity Log', 'Trace system activity so office actions stay accountable.'],
  ['Status Monitoring', 'Follow the status of records and requests.'],
  ['AI-Assisted Review', 'Helps identify possible duplicate records. It does not change them.'],
] as const

const users = [
  ['/mao-personnel.png', '22% 30%', 'MAO Personnel', 'Enroll, manage, and monitor agricultural records and requests in the office.'],
  ['/farmer-planting.png', 'center 38%', 'Farmers', 'Provide and update their farm and production information as needed.'],
  ['/beneficiary-farmer.jpg', 'center 18%', 'Beneficiaries', 'View their records and the status of agricultural assistance.'],
] as const

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}

function AccessIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.4-3 3.8-4.5 7-4.5S17.6 16 19 19" />
    </svg>
  )
}

function StatusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4h10v16H7z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  )
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8l3 3v13H8z" />
      <path d="M10 12l2 2 4-4" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 19h16M7 16V10M12 16V6M17 16v-4" />
    </svg>
  )
}

function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h9v16H8z" />
      <path d="M11 9h4M11 13h4M11 17h3" />
    </svg>
  )
}

function PulseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </svg>
  )
}

const capabilityIcons = [ChartIcon, LogIcon, PulseIcon, SearchIcon]

export function LandingPage() {
  useEffect(() => {
    const id = window.location.hash.replace('#', '')
    if (!id) return
    const frame = window.requestAnimationFrame(() => scrollToSection(id))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="site home">
      <SiteHeader />
      <main>
        <section className="home-hero" id="about">
          <div className="home-hero-copy">
            <p className="home-kicker">Municipal Agriculture Office of Dulag, Leyte</p>
            <h1>Farm and Agriculture Information Management System</h1>
            <p className="home-subtitle">Organized Farm Information for Dulag, Leyte</p>
            <p className="home-lead">A role-based system that keeps authorized farmer, farm, production, and assistance records together for the daily work of the Municipal Agriculture Office.</p>
            <div className="home-actions">
              <Link className="home-btn" to="/register">Get Started <Arrow /></Link>
              <button className="home-btn home-btn-line" type="button" onClick={() => scrollToSection('modules')}>Learn More</button>
            </div>
          </div>
          <div className="home-hero-visual">
            <img
              className="home-hero-photo"
              src="/farmer-harvest.png"
              alt="Farmers carrying harvested rice across a field under a bright sky"
            />
            <div className="home-floats">
              <article className="home-float">
                <span className="home-float-icon"><AccessIcon /></span>
                <div>
                  <strong>Role-Based Access</strong>
                  <span>For authorized staff and registered users.</span>
                </div>
              </article>
              <article className="home-float">
                <span className="home-float-icon"><StatusIcon /></span>
                <div>
                  <strong>Status Tracking</strong>
                  <span>Of records and requests.</span>
                </div>
              </article>
              <article className="home-float">
                <span className="home-float-icon"><ReviewIcon /></span>
                <div>
                  <strong>Reviewable Record Checks</strong>
                  <span>With AI-assisted duplicate review.</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="home-block" id="modules">
          <div className="home-block-head home-block-head-center">
            <div>
              <p className="home-kicker mark">System modules</p>
              <h2>What the System Manages</h2>
              <p className="home-section-lead">Key information and records maintained by Dulag FAIMS.</p>
            </div>
          </div>
          <div className="home-feature-row">
            {modules.map(([src, position, title, text]) => (
              <article className="home-feature" key={title}>
                <img src={src} alt="" style={{ objectPosition: position }} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="home-capabilities" id="features">
            {capabilities.map(([title, text], index) => {
              const Icon = capabilityIcons[index]
              return (
                <article key={title}>
                  <span className="home-cap-icon"><Icon /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="home-users" id="users">
          <div className="home-users-copy">
            <p className="home-kicker mark">Intended users</p>
            <h2>Built for Its Intended Users</h2>
            <p>Designed to support the daily tasks of the Municipal Agriculture Office of Dulag and its stakeholders.</p>
            <aside className="home-note">
              <span aria-hidden="true">i</span>
              <p>This system complements the RSBSA and does not replace it.</p>
            </aside>
          </div>
          <div className="home-user-list">
            {users.map(([src, position, title, text]) => (
              <article className="home-user-card" key={title}>
                <img src={src} alt="" style={{ objectPosition: position }} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
          <svg className="home-leaves" viewBox="0 0 220 180" aria-hidden="true">
            <path d="M40 170c20-70 70-110 150-140-40 30-70 70-80 140" />
            <path d="M70 168c10-40 36-68 78-92" />
          </svg>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
