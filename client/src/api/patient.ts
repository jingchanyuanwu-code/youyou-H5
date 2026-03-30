import patientRequest from './patient-request'

// Auth
export const patientSendCode = (phone: string) =>
  patientRequest.post('/patient-auth/send-code', { phone })

export const patientLogin = (phone: string, code: string) =>
  patientRequest.post('/patient-auth/login', { phone, code })

// Profile & Identity
export const getPatientProfile = () =>
  patientRequest.get('/patient-app/profile')

export const getPatientIdentity = () =>
  patientRequest.get('/patient-app/identity')

export const switchPatientIdentity = (identity: 'patient' | 'family') =>
  patientRequest.post('/patient-app/identity', { identity })

// Home
export const getPatientHome = () =>
  patientRequest.get('/patient-app/home')

// Family
export const getFamilyMembers = () =>
  patientRequest.get('/patient-app/family-members')

export const getMemberDetail = (patientId: number) =>
  patientRequest.get(`/patient-app/member/${patientId}/detail`)

// Tasks
export const getPatientTasks = (patientId?: number) =>
  patientRequest.get('/patient-app/tasks', { params: patientId ? { patientId } : {} })

export const checkInTask = (taskId: number) =>
  patientRequest.post(`/patient-app/tasks/${taskId}/check-in`)

// Alerts
export const getPatientAlerts = (patientId: number) =>
  patientRequest.get(`/patient-app/alerts/${patientId}`)

// Recovery Plan
export const getRecoveryPlan = (patientId: number) =>
  patientRequest.get(`/patient-app/recovery-plan/${patientId}`)

// Consultation
export const sendConsultation = (data: { patientId: number; message: string; type: 'ai' | 'doctor' }) =>
  patientRequest.post('/patient-app/consultation/send', data)

export const getConsultationHistory = () =>
  patientRequest.get('/patient-app/consultation/history')

// Life Asset
export const getLifeAsset = () =>
  patientRequest.get('/patient-app/life-asset')

// Notifications
export const getNotifications = () =>
  patientRequest.get('/patient-app/notifications')

// Health Rank
export const getHealthRank = () =>
  patientRequest.get('/patient-app/health-rank')

// Vital History
export const getVitalHistory = (type: string) =>
  patientRequest.get(`/patient-app/vital-history/${type}`)

// Recovery Plan Detail
export const getRecoveryPlanDetail = () =>
  patientRequest.get('/patient-app/recovery-plan-detail')

export const getRecoveryCalendar = (month: string) =>
  patientRequest.get('/patient-app/recovery-calendar', { params: { month } })

export const getDayDetail = (date: string) =>
  patientRequest.get('/patient-app/day-detail', { params: { date } })

export const getRecoveryReport = (type: string, date: string) =>
  patientRequest.get('/patient-app/recovery-report', { params: { type, date } })

// Plan Review
export const triggerPlanReview = () =>
  patientRequest.post('/patient-app/plan-review/trigger')

export const approvePlanReview = () =>
  patientRequest.post('/patient-app/plan-review/approve')

export const acceptPlanChanges = () =>
  patientRequest.post('/patient-app/plan-review/accept')

// Alert History (all members)
export const getAllAlertHistory = () =>
  patientRequest.get('/patient-app/alert-history')
