import request from './request'

export interface Doctor {
  id: number
  name: string
  title: string
  hospital: string
  department: string
  avatar: string
  phone: string
  bindCode: string
}

export interface LatestAlert {
  alertType: 'glucose' | 'bp' | 'hr'
  value: string
  unit: string
  level: 'warning' | 'danger'
  alertTime: string
}

export interface TodayAlert {
  alertType?: 'glucose' | 'bp' | 'hr'
  value: string
  unit: string
  level: 'warning' | 'danger'
  alertTime: string
}

export type PatientStatus = 'urgent' | 'attention' | 'stable' | 'offline'

export interface Patient {
  id: number
  name: string
  gender: 'male' | 'female' | 'unknown'
  age: number
  phone: string
  createdAt: string
  lastMeasureTime?: string
  stableDays?: number
  // Risk related fields
  hasAlert?: boolean
  alertCount?: number
  alertTypes?: ('glucose' | 'bp' | 'hr')[]
  todayAlerts?: TodayAlert[]
  weekAlertDays?: boolean[]
  latestAlert?: LatestAlert | null
  status?: PatientStatus
  statusText?: string
}

export interface Activity {
  id: number
  name: string
  linkTemplate: string
  isActive: boolean
}

export interface RiskDashboard {
  glucose: { todayCount: number; weekCount: number }
  bp: { todayCount: number; weekCount: number }
  hr: { todayCount: number; weekCount: number }
}

export interface RiskPatient {
  id: number
  name: string
  age: number
  phone: string
  gender: 'male' | 'female' | 'unknown'
  totalAlertCount: number
  weekAlertCount: number
  todayAlerts: TodayAlert[]
  weekAlertDays: boolean[]
  latestValue: string
  latestUnit: string
  latestLevel: 'warning' | 'danger'
  latestAlertTime: string
  description: string
}

// 认证相关
export const sendCode = (phone: string) => request.post('/auth/send-code', { phone })

export const login = (phone: string, code: string) => request.post<{ token: string; doctor: Doctor }>('/auth/login', { phone, code })

// 医生相关
export const getProfile = () => request.get<Doctor>('/doctor/profile')

export const getPatients = (keyword?: string) => request.get<Patient[]>('/doctor/patients', { params: { keyword } })

export const getBindQrCode = () => request.get<{ qrCode: string; bindUrl: string }>('/doctor/bind-qr')

export const getActivityQrCode = (activityId?: number) => request.get<{ qrCode: string; activityUrl: string; activity: Activity }>('/doctor/activity-qr', { params: { activityId } })

export const getActivities = () => request.get<Activity[]>('/doctor/activities')

// 风险预警相关
export const getRiskDashboard = () => request.get<RiskDashboard>('/doctor/risk-dashboard')

export const getRiskPatients = (type: 'glucose' | 'bp' | 'hr') => request.get<RiskPatient[]>('/doctor/risk-patients', { params: { type } })
