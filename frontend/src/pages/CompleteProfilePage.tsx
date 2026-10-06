import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { Banner } from '../components/ui'

const barangays = [
  'Alegre', 'Arado', 'Barbo', 'Batug', 'Bolongtohan', 'Bulod', 'Buntay', 'Cabacungan', 'Cabarasan', 'Cabato-an',
  'Calipayan', 'Calubian', 'Cambula District', 'Camitoc', 'Camote', 'Candao', 'Catmonan', 'Combis', 'Dacay', 'Del Carmen',
  'Del Pilar', 'Fatima', 'General Roxas', 'Highway', 'Luan', 'Magsaysay', 'Maricum', 'Market Site', 'Rawis', 'Rizal',
  'Romualdez', 'Sabang Daguitan', 'Salvacion', 'San Agustin', 'San Antonio', 'San Isidro', 'San Jose', 'San Miguel',
  'San Rafael', 'San Vicente', 'Serrano', 'Sungi', 'Tabu', 'Tigbao', 'Victory',
]

const education = [
  'No formal education', 'Elementary level', 'Elementary graduate', 'High school level', 'High school graduate',
  'Senior high school graduate', 'Vocational', 'College level', 'College graduate', 'Post-graduate',
]

const livelihoods = [
  ['farmer', 'Farmer', 'Grows crops or raises livestock'],
  ['farm_worker', 'Farm Worker', 'Works on another person\'s farm'],
  ['fisher', 'Fisher', 'Fishes as a main livelihood'],
  ['agri_youth', 'Agri-Youth', 'A young person in agriculture'],
] as const

const crops = ['Rice', 'Corn', 'Coconut', 'Banana', 'Vegetables', 'Root crops', 'Abaca', 'Other']

type RoleKind = 'farmer' | 'beneficiary'
type Stage = 'welcome' | 1 | 2 | 'done'

type FormState = {
  first_name: string
  middle_name: string
  last_name: string
  suffix: string
  sex: string
  birthdate: string
  place_of_birth: string
  civil_status: string
  street: string
  sitio: string
  barangay: string
  municipality: string
  province: string
  region: string
  education_level: string
  livelihood_type: string
  association_name: string
  assistance: string
  rsbsa_reference_number: string
  farm_location: string
  farm_barangay: string
  total_area: string
  area_unit: string
  tenure: string
  land_owner_name: string
  crop_type: string
  area_used: string
  cropping_notes: string
}

const empty: FormState = {
  first_name: '', middle_name: '', last_name: '', suffix: '', sex: '', birthdate: '', place_of_birth: '',
  civil_status: '', street: '', sitio: '', barangay: '', municipality: 'Dulag', province: 'Leyte',
  region: 'Region VIII (Eastern Visayas)', education_level: '', livelihood_type: '', association_name: '',
  assistance: '', rsbsa_reference_number: '', farm_location: '', farm_barangay: '', total_area: '',
  area_unit: 'hectare', tenure: '', land_owner_name: '', crop_type: '', area_used: '', cropping_notes: '',
}

export function CompleteProfilePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState<Stage>('welcome')
  const [role, setRole] = useState<RoleKind | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState<unknown>(null)
  const [localError, setLocalError] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user) return
    if (user.role.slug !== 'farmer' && user.role.slug !== 'beneficiary') {
      navigate('/dashboard', { replace: true })
      return
    }
    api<{ role: RoleKind; completed: boolean; profile: Record<string, string | null> }>('/profile/completion')
      .then((data) => {
        setRole(data.role)
        if (data.completed) {
          navigate('/dashboard', { replace: true })
          return
        }
        setForm((current) => ({
          ...current,
          first_name: data.profile.first_name || current.first_name,
          middle_name: data.profile.middle_name || '',
          last_name: data.profile.last_name || '',
          suffix: data.profile.suffix || '',
          barangay: data.profile.barangay && data.profile.barangay !== 'Pending' ? data.profile.barangay : '',
          street: data.profile.street || data.profile.address || '',
          rsbsa_reference_number: data.profile.rsbsa_reference_number || '',
        }))
        setReady(true)
      })
      .catch((err) => {
        setError(err)
        setReady(true)
      })
  }, [user, navigate])

  if (loading) return <p className="setup-loading">Loading your account…</p>
  if (!user) return <Navigate to="/login" replace />
  if (user.role.slug !== 'farmer' && user.role.slug !== 'beneficiary') return <Navigate to="/dashboard" replace />

  const kind = role || (user.role.slug as RoleKind)
  const needsFarm = kind === 'farmer' && form.livelihood_type === 'farmer'
  const stepTwoLabel = kind === 'beneficiary' ? 'Additional information' : 'Farm & Additional'

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function saveStep(step: 1 | 2) {
    const body: Record<string, string | number> = { step }
    if (step === 1) {
      ;(['first_name', 'middle_name', 'last_name', 'suffix', 'sex', 'birthdate', 'place_of_birth', 'civil_status', 'street', 'sitio', 'barangay', 'municipality', 'province', 'region', 'education_level', 'livelihood_type'] as const)
        .forEach((key) => { body[key] = form[key] })
    } else {
      body.association_name = form.association_name
      body.assistance = form.assistance
      if (kind === 'farmer') body.rsbsa_reference_number = form.rsbsa_reference_number
      if (needsFarm) {
        body.farm_location = form.farm_location
        body.farm_barangay = form.farm_barangay
        body.total_area = form.total_area
        body.area_unit = form.area_unit
        body.tenure = form.tenure
        body.land_owner_name = form.land_owner_name
        body.crop_type = form.crop_type
        body.area_used = form.area_used
        body.cropping_notes = form.cropping_notes
      }
    }
    await api('/profile/completion', { method: 'PUT', body: JSON.stringify(body) })
  }

  async function onContinue(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    setError(null)
    const missing = !form.first_name || !form.last_name || !form.sex || !form.birthdate || !form.place_of_birth
      || !form.civil_status || !form.street || !form.barangay || !form.education_level || !form.livelihood_type
    if (missing) {
      setLocalError('Complete the required personal, address, education, and livelihood fields.')
      return
    }
    setBusy(true)
    try {
      await saveStep(1)
      setStage(2)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  async function onComplete(event: FormEvent) {
    event.preventDefault()
    setLocalError('')
    setError(null)
    if (needsFarm && (!form.farm_location || !form.farm_barangay || !form.total_area || !form.tenure || !form.crop_type || (form.tenure !== 'registered_owner' && !form.land_owner_name))) {
      setLocalError('Add the farm location, area, tenure, and main crop.')
      return
    }
    setBusy(true)
    try {
      await saveStep(2)
      setStage('done')
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="setup-screen">
      <div className="setup-wrap">
        {stage === 'welcome' && (
          <section className="setup-card setup-welcome">
            <p className="setup-check">Account created successfully</p>
            <h1>Let's Complete Your Information</h1>
            <p>Your account is ready. Let's add a few more details to complete your agricultural profile.</p>
            <button type="button" disabled={!ready} onClick={() => setStage(1)}>Continue</button>
          </section>
        )}

        {stage === 'done' && (
          <section className="setup-card setup-welcome">
            <p className="setup-check">Profile completed</p>
            <h1>You're all set</h1>
            <p>Your information has been saved successfully. You're ready to use Dulag FAIMS.</p>
            <Link className="setup-go" to="/dashboard">Go to Dashboard</Link>
          </section>
        )}

        {(stage === 1 || stage === 2) && (
          <>
            <header className="setup-head">
              <div>
                <p className="setup-brand">Dulag FAIMS</p>
                <h1>Let's Complete Your Information</h1>
                <p>Tell us a little more about you and your agricultural activities.</p>
              </div>
              <p className="setup-count">Step {stage} of 2</p>
            </header>
            <ol className="setup-progress">
              <li className={stage === 1 ? 'is-current' : 'is-done'}>
                <span>{stage === 1 ? '01' : '✓'}</span>
                Personal & Livelihood
              </li>
              <li className={stage === 2 ? 'is-current' : ''}>
                <span>02</span>
                {stepTwoLabel}
              </li>
            </ol>
            <form className="setup-card" onSubmit={stage === 1 ? onContinue : onComplete}>
              <Banner error={localError ? new Error(localError) : error} />
              {stage === 1 ? (
                <>
                  <Section title="Personal Information" text="Tell us a little about yourself.">
                    <div className="setup-grid">
                      <Field label="First Name"><input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Enter your first name" required /></Field>
                      <Field label="Middle Name"><input value={form.middle_name} onChange={(e) => set('middle_name', e.target.value)} placeholder="Optional" /></Field>
                      <Field label="Last Name"><input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="Enter your last name" required /></Field>
                      <Field label="Extension Name"><input value={form.suffix} onChange={(e) => set('suffix', e.target.value)} placeholder="Jr., Sr., III, if applicable" /></Field>
                      <Field label="Sex">
                        <select value={form.sex} onChange={(e) => set('sex', e.target.value)} required>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </Field>
                      <Field label="Date of Birth"><input type="date" value={form.birthdate} onChange={(e) => set('birthdate', e.target.value)} required /></Field>
                      <Field label="Place of Birth"><input value={form.place_of_birth} onChange={(e) => set('place_of_birth', e.target.value)} placeholder="City or municipality" required /></Field>
                      <Field label="Civil Status">
                        <select value={form.civil_status} onChange={(e) => set('civil_status', e.target.value)} required>
                          <option value="">Select</option>
                          {['Single', 'Married', 'Widowed', 'Separated', 'Annulled'].map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                    </div>
                  </Section>
                  <Section title="Address" text="This system keeps records for Dulag, Leyte.">
                    <div className="setup-grid">
                      <Field label="House / Lot / Purok"><input value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="House number or purok" required /></Field>
                      <Field label="Street / Sitio"><input value={form.sitio} onChange={(e) => set('sitio', e.target.value)} placeholder="Optional" /></Field>
                      <Field label="Barangay">
                        <select value={form.barangay} onChange={(e) => set('barangay', e.target.value)} required>
                          <option value="">Select barangay</option>
                          {barangays.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                      <Field label="Municipality">
                        <select value={form.municipality} onChange={(e) => set('municipality', e.target.value)}><option>Dulag</option></select>
                      </Field>
                      <Field label="Province">
                        <select value={form.province} onChange={(e) => set('province', e.target.value)}><option>Leyte</option></select>
                      </Field>
                      <Field label="Region">
                        <select value={form.region} onChange={(e) => set('region', e.target.value)}><option>Region VIII (Eastern Visayas)</option></select>
                      </Field>
                    </div>
                  </Section>
                  <Section title="Education" text="Highest level you have reached.">
                    <div className="setup-grid">
                      <Field label="Highest Educational Attainment">
                        <select value={form.education_level} onChange={(e) => set('education_level', e.target.value)} required>
                          <option value="">Select</option>
                          {education.map((item) => <option key={item}>{item}</option>)}
                        </select>
                      </Field>
                    </div>
                  </Section>
                  <Section title="Livelihood" text="How do you earn your livelihood?">
                    <div className="setup-choices">
                      {livelihoods.map(([value, label, hint]) => (
                        <button
                          key={value}
                          type="button"
                          className={form.livelihood_type === value ? 'is-selected' : ''}
                          onClick={() => set('livelihood_type', value)}
                        >
                          <strong>{label}</strong>
                          <span>{hint}</span>
                        </button>
                      ))}
                    </div>
                  </Section>
                </>
              ) : (
                <>
                  {needsFarm && (
                    <>
                      <Section title="Farm Information" text="Tell us about the farm parcel you work.">
                        <div className="setup-grid">
                          <Field label="Farm Location"><input value={form.farm_location} onChange={(e) => set('farm_location', e.target.value)} placeholder="Sitio or landmark" required /></Field>
                          <Field label="Barangay">
                            <select value={form.farm_barangay} onChange={(e) => set('farm_barangay', e.target.value)} required>
                              <option value="">Select barangay</option>
                              {barangays.map((item) => <option key={item}>{item}</option>)}
                            </select>
                          </Field>
                          <Field label="Municipality"><input value="Dulag" readOnly /></Field>
                          <Field label="Province"><input value="Leyte" readOnly /></Field>
                          <Field label="Total Farm Area"><input type="number" min="0" step="0.01" value={form.total_area} onChange={(e) => set('total_area', e.target.value)} placeholder="0.00" required /></Field>
                          <Field label="Unit">
                            <select value={form.area_unit} onChange={(e) => set('area_unit', e.target.value)}>
                              <option value="hectare">Hectare</option>
                              <option value="square_meter">Square meter</option>
                            </select>
                          </Field>
                          <Field label="Ownership / Tenure">
                            <select value={form.tenure} onChange={(e) => set('tenure', e.target.value)} required>
                              <option value="">Select</option>
                              <option value="registered_owner">Registered owner</option>
                              <option value="lessee">Lessee</option>
                              <option value="tenant">Tenant</option>
                              <option value="steward">Steward</option>
                            </select>
                          </Field>
                          {form.tenure && form.tenure !== 'registered_owner' && (
                            <Field label="Land Owner Name"><input value={form.land_owner_name} onChange={(e) => set('land_owner_name', e.target.value)} placeholder="Name of the land owner" required /></Field>
                          )}
                          <Field label="RSBSA Number"><input value={form.rsbsa_reference_number} onChange={(e) => set('rsbsa_reference_number', e.target.value)} placeholder="If you already have one" /></Field>
                        </div>
                      </Section>
                      <Section title="Production" text="Your main crop is enough for now. You can add more records later.">
                        <div className="setup-grid">
                          <Field label="Main Crop / Commodity">
                            <select value={form.crop_type} onChange={(e) => set('crop_type', e.target.value)} required>
                              <option value="">Select</option>
                              {crops.map((item) => <option key={item}>{item}</option>)}
                            </select>
                          </Field>
                          <Field label="Farm Area Used"><input type="number" min="0" step="0.01" value={form.area_used} onChange={(e) => set('area_used', e.target.value)} placeholder="Optional" /></Field>
                          <div className="setup-span">
                            <Field label="Cropping notes"><textarea value={form.cropping_notes} onChange={(e) => set('cropping_notes', e.target.value)} placeholder="Season or how the crop is grown, if you want to add it" rows={3} /></Field>
                          </div>
                        </div>
                      </Section>
                    </>
                  )}
                  {!needsFarm && kind === 'farmer' && (
                    <Section title="Reference" text="Farm parcel details are collected when your livelihood is Farmer.">
                      <Field label="RSBSA Number"><input value={form.rsbsa_reference_number} onChange={(e) => set('rsbsa_reference_number', e.target.value)} placeholder="Optional" /></Field>
                    </Section>
                  )}
                  <Section title="Additional Information" text="Only what the office needs to keep your record useful.">
                    <div className="setup-grid">
                      <Field label="Association or Cooperative"><input value={form.association_name} onChange={(e) => set('association_name', e.target.value)} placeholder="Optional" /></Field>
                      <div className="setup-span">
                        <Field label="Agricultural assistance or program"><textarea value={form.assistance} onChange={(e) => set('assistance', e.target.value)} placeholder="Optional" rows={3} /></Field>
                      </div>
                    </div>
                  </Section>
                </>
              )}
              <div className="setup-actions">
                {stage === 2 ? <button type="button" className="setup-back" onClick={() => setStage(1)}>Back</button> : <span />}
                <button type="submit" disabled={busy}>{busy ? 'Saving…' : stage === 1 ? 'Continue' : 'Complete Profile'}</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <section className="setup-section">
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="setup-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
