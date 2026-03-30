import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/d/workspace',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    // ========== 医生端 Layout 路由 ==========
    {
      path: '/d',
      component: () => import('@/views/doctor/DoctorLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/d/workspace',
        },
        {
          path: 'workspace',
          name: 'DoctorWorkspace',
          component: () => import('@/views/doctor/DoctorWorkspace.vue'),
        },
        {
          path: 'messages',
          name: 'DoctorMessages',
          component: () => import('@/views/doctor/DoctorMessages.vue'),
        },
        {
          path: 'patients',
          name: 'Patients',
          component: () => import('@/views/Patients.vue'),
        },
        {
          path: 'me',
          name: 'DoctorMe',
          component: () => import('@/views/doctor/DoctorMe.vue'),
        },
      ],
    },
    // ========== 医生端独立页面（无 tabbar） ==========
    {
      path: '/d/review/:id',
      name: 'DoctorReviewDetail',
      component: () => import('@/views/doctor/DoctorReviewDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/alert/:id',
      name: 'DoctorAlertProcess',
      component: () => import('@/views/doctor/DoctorAlertProcess.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/chat/:patientId',
      name: 'DoctorChatDetail',
      component: () => import('@/views/doctor/DoctorChatDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/settings',
      name: 'DoctorSettings',
      component: () => import('@/views/doctor/DoctorSettings.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/profile',
      name: 'DoctorProfile',
      component: () => import('@/views/doctor/DoctorProfile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/notification',
      name: 'DoctorNotification',
      component: () => import('@/views/doctor/DoctorNotification.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/d/income',
      name: 'DoctorIncome',
      component: () => import('@/views/doctor/DoctorIncome.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/risk-detail/:type',
      name: 'RiskDetail',
      component: () => import('@/views/RiskDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/patient/:id',
      name: 'PatientDetail',
      component: () => import('@/views/PatientDetail.vue'),
      meta: { requiresAuth: true },
    },
    // 旧路由兼容重定向
    { path: '/card', redirect: '/d/workspace' },
    { path: '/patients', redirect: '/d/patients' },
    // ========== 患者端路由 ==========
    {
      path: '/p/login',
      name: 'PatientLogin',
      component: () => import('@/views/patient/PatientLogin.vue'),
      meta: { requiresAuth: false, role: 'patient' },
    },
    {
      path: '/p',
      component: () => import('@/views/patient/PatientLayout.vue'),
      meta: { requiresAuth: true, role: 'patient' },
      children: [
        {
          path: '',
          redirect: '/p/home',
        },
        {
          path: 'home',
          name: 'PatientHome',
          component: () => import('@/views/patient/PatientHome.vue'),
        },
        {
          path: 'consult',
          name: 'PatientConsult',
          component: () => import('@/views/patient/PatientConsult.vue'),
        },
        {
          path: 'settings',
          name: 'PatientSettings',
          component: () => import('@/views/patient/PatientMy.vue'),
        },
        {
          path: 'life-asset',
          name: 'PatientLifeAsset',
          component: () => import('@/views/patient/PatientLifeAsset.vue'),
        },
        {
          path: 'recovery-plan',
          name: 'PatientRecoveryPlan',
          component: () => import('@/views/patient/PatientRecoveryPlan.vue'),
        },
        {
          path: 'member/:id',
          name: 'PatientMemberDetail',
          component: () => import('@/views/patient/PatientMemberDetail.vue'),
        },
        {
          path: 'health-rank',
          name: 'PatientHealthRank',
          component: () => import('@/views/patient/PatientHealthRank.vue'),
        },
        {
          path: 'recovery-report',
          name: 'PatientRecoveryReport',
          component: () => import('@/views/patient/PatientRecoveryReport.vue'),
        },
        {
          path: 'alert-history',
          name: 'PatientAlertHistory',
          component: () => import('@/views/patient/PatientAlertHistory.vue'),
        },
        {
          path: 'health-monitor',
          name: 'PatientHealthMonitor',
          component: () => import('@/views/patient/PatientHealthMonitor.vue'),
        },
        {
          path: 'doctor-messages',
          name: 'PatientDoctorMessages',
          component: () => import('@/views/patient/PatientDoctorMessages.vue'),
        },
        {
          path: 'account-settings',
          name: 'PatientAccountSettings',
          component: () => import('@/views/patient/PatientAccountSettings.vue'),
        },
        {
          path: 'help-center',
          name: 'PatientHelpCenter',
          component: () => import('@/views/patient/PatientHelpCenter.vue'),
        },
        {
          path: 'training',
          name: 'PatientTraining',
          component: () => import('@/views/patient/PatientTraining.vue'),
        },
        {
          path: 'my-doctor',
          name: 'PatientMyDoctor',
          component: () => import('@/views/patient/PatientMyDoctor.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const isPatientRoute = to.path.startsWith('/p/') || to.path === '/p'
  const tokenKey = isPatientRoute ? 'p_token' : 'token'
  const loginPath = isPatientRoute ? '/p/login' : '/login'
  const homePath = isPatientRoute ? '/p/home' : '/d/workspace'
  const token = localStorage.getItem(tokenKey)

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  document.title = isPatientRoute ? '患者端' : '呦呦医生端'

  if (requiresAuth && !token) {
    next(loginPath)
  } else if (to.path === loginPath && token) {
    next(homePath)
  } else {
    next()
  }
})

export default router
