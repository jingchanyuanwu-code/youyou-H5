import axios from 'axios'
import { showToast } from 'vant'

const patientRequest = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

patientRequest.interceptors.request.use((config) => {
  const token = localStorage.getItem('p_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

patientRequest.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || '请求失败'
    showToast(message)
    if (error.response?.status === 401) {
      localStorage.removeItem('p_token')
      window.location.href = '/p/login'
    }
    return Promise.reject(error)
  }
)

export default patientRequest
