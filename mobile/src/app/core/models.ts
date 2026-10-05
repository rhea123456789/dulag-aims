export type RoleSlug =
  | 'system_administrator'
  | 'mao_personnel'
  | 'rsbsa_focal_person'
  | 'agricultural_technician'
  | 'farmer'
  | 'beneficiary';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: { id: number; name: string | null; slug: RoleSlug | null };
  permissions: string[];
}

export interface Page<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}

export interface Farmer {
  id: number;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  email: string | null;
  street: string | null;
  barangay: string;
  municipality: string | null;
  province: string | null;
  rsbsa_reference_number: string | null;
  status: string;
  notes: string | null;
  farms?: Farm[];
  subsidies?: Subsidy[];
}

export interface Farm {
  id: number;
  farmer_profile_id: number;
  parcel_name: string | null;
  location: string;
  barangay: string;
  area_hectares: string | number;
  ownership_arrangement: string | null;
  status: string;
  farmer?: Farmer;
}

export interface Production {
  id: number;
  farm_id: number;
  crop_type: string;
  planting_date: string | null;
  harvest_date: string | null;
  quantity: string | number | null;
  unit: string | null;
  season: string | null;
  notes: string | null;
  farm?: Farm;
}

export interface Subsidy {
  id: number;
  farmer_profile_id: number | null;
  beneficiary_id: number | null;
  subsidy_type: string;
  application_date: string;
  status: string;
  amount: string | number | null;
  remarks: string | null;
  farmer?: Farmer | null;
  beneficiary?: Beneficiary | null;
}

export interface Assistance {
  assistance_type: string;
  date_received: string;
  description: string | null;
  quantity_or_amount: string | number | null;
}

export interface Beneficiary {
  id: number;
  first_name: string;
  last_name: string;
  contact_number: string | null;
  barangay: string;
  address: string | null;
  subsidy_status: string | null;
  notes: string | null;
  assistance?: Assistance[];
  subsidies?: Subsidy[];
}

export interface DashboardData {
  totals: { farmers: number; farms: number; beneficiaries: number; subsidies: number };
  subsidy_by_status: Record<string, number>;
  production_by_crop: { crop_type: string; total_quantity: string | number }[];
  production_trend: { month: string; total_quantity: string | number }[];
  farmers_by_barangay: { barangay: string; total: string | number }[];
}

export function rowsOf<T>(page: Page<T> | T[] | null | undefined): T[] {
  if (!page) return [];
  if (Array.isArray(page)) return page;
  return Array.isArray(page.data) ? page.data : [];
}

export function totalOf<T>(page: Page<T> | T[] | null | undefined): number {
  if (!page) return 0;
  if (Array.isArray(page)) return page.length;
  const total = Number(page.total);
  return Number.isFinite(total) ? total : rowsOf(page).length;
}

export interface AuditLog {
  id: number;
  action: string;
  module: string;
  created_at: string;
  user?: { name: string; email: string } | null;
}

export interface DuplicateReview {
  id: number;
  detection_method: string;
  confidence: string | number | null;
  gemini_summary: string | null;
  review_status: string;
  final_action: string | null;
  reviewer_notes: string | null;
}

export const OFFICE_ROLES: RoleSlug[] = ['system_administrator', 'mao_personnel'];
export const STAFF_ROLES: RoleSlug[] = [
  'system_administrator',
  'mao_personnel',
  'rsbsa_focal_person',
  'agricultural_technician',
];
