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

// ========== 医生工作台相关类型 ==========

export interface ReviewTask {
  id: number
  taskType: 'high_risk_alert' | 'plan_adjustment' | 'initial_plan' | 'monthly_report'
  title: string
  description: string
  priority: number
  deadline: string
  createdAt: string
  patientId?: number
  patientName: string
  patientAge: number
  patientGender?: string
  patientPhone?: string
  status?: string
  reviewedAt?: string
  diseaseTags?: string[]
  surgeryTags?: string[]
  dischargeTime?: string
  // 高危预警关联字段
  alertId?: number
  alertType?: 'glucose' | 'bp' | 'hr'
  alertValue?: string
  alertUnit?: string
  alertLevel?: 'warning' | 'danger'
  alertTime?: string
  alertBasis?: string
  alertReference?: string
  // 近15条监测记录趋势数据（客户端填充）
  trendData?: TrendPoint[]
}

export interface ReviewDetail extends ReviewTask {
  status: string
  context: Record<string, any>
  patient: { id: number; name: string; age: number; gender: string; phone: string }
  recentAlerts: { alertType: string; value: string; unit: string; level: string; description: string; alertTime: string }[]
  alertDetail?: { id: number; alertType: string; value: string; unit: string; level: string; description: string; alertTime: string }
  aiSuggestion?: string
  recoverySummary?: string
  nextCyclePlan?: string
}

export interface EmergencyAlert {
  id: number
  alertType: 'glucose' | 'bp' | 'hr'
  value: string
  unit: string
  level: string
  description: string
  alertTime: string
  patientId: number
  patientName: string
  patientAge: number
  patientGender: string
  patientPhone: string
}

export interface AlertDetail {
  id: number
  alertType: string
  value: string
  unit: string
  level: string
  description: string
  alertTime: string
  patient: { id: number; name: string; age: number; gender: string; phone: string }
  recentVitals: { alertType: string; value: string; unit: string; level: string; alertTime: string }[]
  aiSuggestion: string
}

export interface Conversation {
  patientId: number
  patientName: string
  patientAge: number
  patientGender: string
  lastMessage: string
  lastTime: string
  unreadCount: number
}

export interface DoctorMessageItem {
  id: number
  direction: 'patient_to_doctor' | 'doctor_to_patient'
  content: string
  messageType: string
  isRead: boolean
  createdAt: string
}

// ========== 医生工作台接口 ==========

export const getPendingReviews = () => request.get<{ count: number; list: ReviewTask[] }>('/doctor/pending-reviews')

export const getCompletedReviews = () => request.get<{ count: number; list: ReviewTask[] }>('/doctor/completed-reviews')

export const getReviewDetail = (id: number) => request.get<ReviewDetail>('/doctor/review/' + id)

export const submitReview = (id: number, data: { action: string; comment: string }) => request.post('/doctor/review/' + id, data)

export const submitReviewIntervention = (id: number, data: { suggestion: string; pushToPatient: boolean; pushToFamily: boolean; comment?: string }) => request.post('/doctor/review/' + id + '/intervene', data)

export const getEmergencyAlerts = () => request.get<EmergencyAlert[]>('/doctor/emergency-alerts')

export const getAlertDetail = (id: number) => request.get<AlertDetail>('/doctor/alert/' + id + '/detail')

export const submitIntervention = (id: number, data: { suggestion: string; pushToPatient: boolean; pushToFamily: boolean }) => request.post('/doctor/alert/' + id + '/intervene', data)

export const getConversations = () => request.get<Conversation[]>('/doctor/conversations')

export const getDoctorMessages = (patientId: number) => request.get<{ patient: any; messages: DoctorMessageItem[] }>('/doctor/messages/' + patientId)

export const sendDoctorMessage = (patientId: number, content: string) => request.post('/doctor/messages/' + patientId + '/send', { content, type: 'text' })

// ========== 留言相关类型 ==========

export interface LeaveMessage {
  id: number
  patientId: number
  patientName: string
  patientAge: number
  patientGender: string
  senderType: 'patient' | 'family'
  senderName: string
  content: string
  createdAt: string
  isProcessed: boolean
  aiSuggestion?: string
  doctorReply?: string
  doctorReplyTime?: string
  additionalReplies?: { content: string; createdAt: string }[]
}

// ========== 留言相关接口 ==========

export const getLeaveMessages = () => request.get<LeaveMessage[]>('/doctor/leave-messages')

export const replyLeaveMessage = (id: number, data: { reply: string; aiSuggestion?: string }) => request.post('/doctor/leave-messages/' + id + '/reply', data)

export const appendReply = (id: number, data: { content: string }) => request.post('/doctor/leave-messages/' + id + '/append', data)

// ========== 我的页面类型 ==========

export interface PracticeStats {
  guardDays: number
  patientCount: number
  recoveryRate: number
  alertInterventionCount: number
}

export interface IncomeOverview {
  monthlyIncome: number
  monthlyChange: number
  totalIncome: number
}

export interface IncomeCategoryItem {
  category: string
  label: string
  amount: number
  percentage: number
}

export interface IncomeBreakdown {
  month: string
  categories: IncomeCategoryItem[]
  total: number
}

export interface IncomeDetail {
  id: number
  date: string
  category: string
  categoryLabel: string
  description: string
  patientName: string
  amount: number
  settlementStatus: 'settled' | 'pending' | 'processing'
}

export interface IncomeDetailsResponse {
  list: IncomeDetail[]
  hasMore: boolean
}

export interface TrendPoint {
  date: string
  value: number
  isAbnormal?: boolean
}

// ========== 我的页面接口 ==========

export const getPracticeStats = () =>
  request.get<PracticeStats>('/doctor/practice-stats')

export const getIncomeOverview = () =>
  request.get<IncomeOverview>('/doctor/income-overview')

export const getIncomeBreakdown = (month?: string) =>
  request.get<IncomeBreakdown>('/doctor/income-breakdown', { params: { month } })

export const getIncomeDetails = (page?: number, month?: string) =>
  request.get<IncomeDetailsResponse>('/doctor/income-details', { params: { page, month } })

// ========== 工作台增强接口 ==========

export const getAlertTrend = (patientId: number, type: string) =>
  request.get<TrendPoint[]>('/doctor/alert-trend/' + patientId, { params: { type } })
