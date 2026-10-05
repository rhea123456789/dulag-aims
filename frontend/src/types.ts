export type RoleSlug =
  | 'system_administrator'
  | 'mao_personnel'
  | 'rsbsa_focal_person'
  | 'agricultural_technician'
  | 'farmer'
  | 'beneficiary'

export type AuthUser = {
  id: number
  name: string
  email: string
  status: string
  role: { id: number; name: string | null; slug: RoleSlug | null }
  permissions: string[]
}

export type Page<T> = {
  data: T[]
  current_page: number
  last_page: number
  total: number
}

export type Role = { id: number; name: string; slug: RoleSlug; description: string | null }

export type UserRow = {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  role_id: number
  role?: Role
}

export type Farmer = {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string
  suffix: string | null
  birthdate: string | null
  sex: string | null
  civil_status: string | null
  contact_number: string | null
  email: string | null
  street: string | null
  barangay: string
  municipality: string | null
  province: string | null
  ownership_information: string | null
  rsbsa_reference_number: string | null
  status: string
  notes: string | null
  farms?: Farm[]
  subsidies?: Subsidy[]
}

export type Farm = {
  id: number
  farmer_profile_id: number
  parcel_name: string | null
  location: string
  barangay: string
  area_hectares: string | number
  land_classification: string | null
  ownership_arrangement: string | null
  cultivation_details: string | null
  status: string
  farmer?: Farmer
  productions?: Production[]
}

export type Profit = {
  expenses: string | number
  income: string | number
  profit: string | number
}

export type Production = {
  id: number
  farm_id: number
  crop_type: string
  planting_date: string | null
  harvest_date: string | null
  quantity: string | number | null
  unit: string | null
  yield_per_hectare: string | number | null
  season: string | null
  notes: string | null
  farm?: Farm
  profit?: Profit | null
}

export type Subsidy = {
  id: number
  farmer_profile_id: number | null
  beneficiary_id: number | null
  subsidy_type: string
  application_date: string
  status: string
  amount: string | number | null
  distribution_information: string | null
  remarks: string | null
  farmer?: Farmer | null
  beneficiary?: Beneficiary | null
}

export type Assistance = {
  id: number
  assistance_type: string
  date_received: string
  description: string | null
  quantity_or_amount: string | number | null
  unit: string | null
}

export type Beneficiary = {
  id: number
  first_name: string
  middle_name: string | null
  last_name: string
  contact_number: string | null
  barangay: string
  address: string | null
  subsidy_status: string | null
  notes: string | null
  farmer_profile_id: number | null
  assistance?: Assistance[]
  subsidies?: Subsidy[]
}

export type DashboardData = {
  totals: { farmers: number; farms: number; beneficiaries: number; subsidies: number }
  subsidy_by_status: Record<string, number>
  production_by_crop: { crop_type: string; total_quantity: string | number }[]
  production_trend: { month: string; total_quantity: string | number }[]
  farmers_by_barangay: { barangay: string; total: number }[]
  farmer_status: Record<string, number>
}

export type Setting = { id: number; key: string; value: string | null }

export type AuditLog = {
  id: number
  action: string
  module: string
  created_at: string
  user?: { id: number; name: string; email: string } | null
}

export type AiReview = {
  id: number
  record_type: string
  record_ids: number[]
  ai_result: {
    finding?: string
    rule_hits?: string[]
    explanation?: string | null
    source?: string
  } | null
  confidence: string | number | null
  status: string
  reviewed_by: string | null
  records: { id: number; label: string; detail: string }[]
}

export type AiSummary = {
  id: number
  generated_summary: string
  source_records: { record_type?: string; record_ids?: number[]; source?: string; notice?: string | null }
  created_at: string
  author?: { id: number; name: string } | null
}
