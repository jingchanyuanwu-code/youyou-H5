import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/card',
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/card',
      name: 'Card',
      component: () => import('@/views/Card.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/patients',
      name: 'Patients',
      component: () => import('@/views/Patients.vue'),
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
  ],
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/card')
  } else {
    next()
  }
})

export default router
