export type ReportType = 'spending' | 'networth' | 'savings' | 'investing'
export type RiskAppetite = 'conservative' | 'balanced' | 'aggressive'

export interface ReportSection {
  key: string
  title: string
  body: string
  bullets: string[]
}

export interface Report {
  id: number
  created_at: string
  report_type: ReportType
  period: string
  model: string
  sections: ReportSection[]
  disclaimer: string
}

export interface Profile {
  risk_appetite: RiskAppetite | null
  monthly_savings_target: number | null
  time_horizon_years: number | null
  dependents: number | null
  goals: string[] | null
  ai_consent: boolean
}

export interface ProfileInput {
  risk_appetite?: RiskAppetite | null
  monthly_savings_target?: number | null
  time_horizon_years?: number | null
  dependents?: number | null
  goals?: string[]
}

export const RISK_OPTIONS: { value: RiskAppetite; label: string }[] = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'aggressive', label: 'Aggressive' },
]

export function profileComplete(p: Profile | null): boolean {
  return !!p && !!p.risk_appetite
}
